import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, getClientIp } from "../../../../lib/apiAuth";
import { checkRateLimit } from "../../../../lib/rateLimit";
import { hintSchema, firstIssueMessage } from "../../../../lib/validation";
import { serverError } from "../../../../lib/apiError";
import {
  getGeminiApiKey,
  generateWithFallback,
} from "../../../../lib/geminiEnv";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = hintSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: firstIssueMessage(parsed.error) },
        { status: 400 },
      );
    }

    const question = parsed.data.question;
    const existingHints = parsed.data.existing_hints ?? [];
    const hintNumber = existingHints.length + 1;

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const auth = await verifyAuth(req, parsed.data.idToken);
    if (auth.error === "invalid_token") {
      return NextResponse.json(
        { error: "Invalid auth token." },
        { status: 401 },
      );
    }
    const uid = auth.uid;
    const ip = getClientIp(req);

    const withinRate = await checkRateLimit({
      key: uid ? `hint:uid_${uid}` : `hint:ip_${ip}`,
      limit: 20,
      windowSeconds: 60,
    });
    if (!withinRate) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down and try again shortly." },
        { status: 429 },
      );
    }

    const prevHintsSection =
      existingHints.length > 0
        ? `\n\nHints already given (do NOT repeat these ideas):\n${existingHints.map((h, i) => `${i + 1}. ${h}`).join("\n")}`
        : "";

    const prompt = `Here is the exam question a student is working on:\n\n${question}${prevHintsSection}\n\nProvide Hint #${hintNumber}. It must be progressively more specific than the previous hints, but still must NOT reveal the answer or solution steps. Return only the hint text — no labels, no preamble.`;

    const { result } = await generateWithFallback({
      apiKey,
      contents: prompt,
      systemInstruction:
        "You are a Socratic tutor. Your job is to guide students with hints — never give away answers, solutions, formulas, or worked examples. Hints must be short (1-3 sentences max), thought-provoking questions or nudges that point the student in the right direction.",
    });
    const hint = result.response.text().trim();

    return NextResponse.json({ hint });
  } catch (err: unknown) {
    return serverError("/api/hint", err);
  }
}
