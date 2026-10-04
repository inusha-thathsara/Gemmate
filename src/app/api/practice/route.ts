import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, getClientIp } from "../../../../lib/apiAuth";
import { checkRateLimit } from "../../../../lib/rateLimit";
import { practiceSchema, firstIssueMessage } from "../../../../lib/validation";
import { serverError } from "../../../../lib/apiError";
import { generatePracticeQuestion } from "../../../../lib/gemmaEnv";

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
    const theTrap = parsed.data.the_trap;

    if (!coreConcepts.length && !theTrap) {
      return NextResponse.json(
        { error: "Provide core_concepts and/or the_trap." },
        { status: 400 },
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

    const practiceResult = await generatePracticeQuestion({
      coreConcepts,
      theTrap,
    });

    return NextResponse.json(practiceResult);
  } catch (err: unknown) {
    return serverError("/api/practice", err);
  }
}
