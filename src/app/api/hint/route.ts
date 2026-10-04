import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, getClientIp } from "../../../../lib/apiAuth";
import { checkRateLimit } from "../../../../lib/rateLimit";
import { hintSchema, firstIssueMessage } from "../../../../lib/validation";
import { serverError } from "../../../../lib/apiError";
import { generateSocraticHint } from "../../../../lib/gemmaEnv";

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

    const hintResult = await generateSocraticHint({
      question,
      existingHints,
    });

    return NextResponse.json(hintResult);
  } catch (err: unknown) {
    return serverError("/api/hint", err);
  }
}
