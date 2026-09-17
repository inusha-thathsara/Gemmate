import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, getClientIp } from "../../../../lib/apiAuth";
import { checkRateLimit } from "../../../../lib/rateLimit";
import { practiceSchema, firstIssueMessage } from "../../../../lib/validation";
import { serverError } from "../../../../lib/apiError";
import {
  getGeminiApiKey,
  generateWithFallback,
} from "../../../../lib/geminiEnv";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = practiceSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: firstIssueMessage(parsed.error) },
        { status: 400 },
      );
    }

    const coreConcepts = parsed.data.core_concepts ?? [];
    const theTrap = Array.isArray(parsed.data.the_trap)
      ? parsed.data.the_trap
      : parsed.data.the_trap
        ? [parsed.data.the_trap]
        : [];

    if (!coreConcepts.length && !theTrap.length) {
      return NextResponse.json(
        { error: "Provide core_concepts and/or the_trap." },
        { status: 400 },
      );
    }

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
      key: uid ? `practice:uid_${uid}` : `practice:ip_${ip}`,
      limit: 15,
      windowSeconds: 60,
    });
    if (!withinRate) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down and try again shortly." },
        { status: 429 },
      );
    }

    const trapText =
      theTrap.length === 1
        ? `And this specific trick/trap: ${theTrap[0]}`
        : `And these specific tricks/traps:\n${theTrap.map((t, i) => `${i + 1}. ${t}`).join("\n")}`;
    const prompt = `Based on these core concepts: ${coreConcepts.join(", ")}
${trapText}

Generate a brand new, highly difficult university-level exam question. Return the response in clean Markdown.`;

    const { result } = await generateWithFallback({
      apiKey,
      contents: prompt,
      systemInstruction:
        "You are a university examiner known for writing deceptively tricky, highly challenging exam questions. You must return ONLY the question in clean Markdown — no preamble, no explanations, no answers.",
    });
    const markdown = result.response.text();

    return NextResponse.json({ markdown });
  } catch (err: unknown) {
    return serverError("/api/practice", err);
  }
}
