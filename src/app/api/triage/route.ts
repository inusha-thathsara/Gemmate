import { NextRequest, NextResponse } from "next/server";
import admin from "../../../../lib/firebaseAdmin";
import { verifyAuth, getClientIp } from "../../../../lib/apiAuth";
import { checkRateLimit } from "../../../../lib/rateLimit";
import { triageSchema, firstIssueMessage } from "../../../../lib/validation";
import { serverError } from "../../../../lib/apiError";
import { triageExamQuestion } from "../../../../lib/gemmaEnv";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = triageSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: firstIssueMessage(parsed.error) },
        { status: 400 },
      );
    }
    const { images, questionText, idToken } = parsed.data;

    // --- Authentication (optional): Bearer header or body.idToken ---
    const auth = await verifyAuth(req, idToken);
    if (auth.error === "not_initialized") {
      return NextResponse.json(
        { error: "Authentication is not available right now." },
        { status: 503 },
      );
    }
    if (auth.error === "invalid_token") {
      return NextResponse.json(
        { error: "Invalid auth token." },
        { status: 401 },
      );
    }
    const uid = auth.uid;
    const ip = getClientIp(req);

    // --- Short-window rate limit (abuse protection) ---
    const rlKey = uid ? `triage:uid_${uid}` : `triage:ip_${ip}`;
    const withinRate = await checkRateLimit({
      key: rlKey,
      limit: 20,
      windowSeconds: 60,
    });
    if (!withinRate) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down and try again shortly." },
        { status: 429 },
      );
    }

    // --- Daily quota check if Firebase Admin is connected ---
    const today = new Date().toISOString().slice(0, 10);
    const usageDocId = uid ? `${uid}_${today}` : `guest_${ip}_${today}`;

    if (admin.apps.length) {
      const usageRef = admin.firestore().collection("usage").doc(usageDocId);
      try {
        await admin.firestore().runTransaction(async (tx) => {
          const snap = await tx.get(usageRef);
          const count = snap.exists ? snap.data()?.count || 0 : 0;
          const limit = uid ? 20 : 10;
          if (count >= limit) {
            throw new Error("quota_exceeded");
          }
          tx.set(
            usageRef,
            {
              count: count + 1,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.message === "quota_exceeded") {
          return NextResponse.json(
            { error: "Daily triage quota exceeded." },
            { status: 402 },
          );
        }
        return serverError("/api/triage usage", err);
      }
    }

    // Execute Triage with Open-Source Gemma Model
    const analysis = await triageExamQuestion({
      images,
      questionText,
    });

    // Persist history for authenticated users (best-effort)
    try {
      if (uid && admin.apps.length) {
        await admin
          .firestore()
          .collection("users")
          .doc(uid)
          .collection("history")
          .add({
            imagesCount: images?.length || 0,
            hasQuestionText: Boolean(questionText),
            result: analysis,
            model: analysis.model_used,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
      }
    } catch (err) {
      console.warn("[/api/triage] failed to write history:", err);
    }

    return NextResponse.json(analysis);
  } catch (err: unknown) {
    console.error("[/api/triage] error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error:
          msg ||
          "Unable to triage the exam question. Please verify your GEMINI_API_KEY or GROQ_API_KEY in your Vercel Project Environment Variables.",
      },
      { status: 400 },
    );
  }
}
