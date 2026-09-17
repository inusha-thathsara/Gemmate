import { NextRequest, NextResponse } from "next/server";
import admin from "../../../../lib/firebaseAdmin";
import { verifyAuth, getClientIp } from "../../../../lib/apiAuth";
import { checkRateLimit } from "../../../../lib/rateLimit";
import { triageSchema, firstIssueMessage } from "../../../../lib/validation";
import { serverError } from "../../../../lib/apiError";
import {
  getGeminiApiKey,
  generateWithFallback,
} from "../../../../lib/geminiEnv";

const SYSTEM_PROMPT = `You are a senior IT undergrad tutoring a batchmate. Analyze the provided exam question images. DO NOT solve the question. Identify ALL traps and tricks present — there may be more than one. Output strictly in JSON format matching this exact schema: {"core_concepts": ["concept 1"], "the_trap": ["The first trick in the question", "Another trick if present"], "attack_plan": ["step 1", "step 2", "step 3"]}.`;

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
    const { images, idToken } = parsed.data;

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured." },
        { status: 500 },
      );
    }

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
      limit: 10,
      windowSeconds: 60,
    });
    if (!withinRate) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down and try again shortly." },
        { status: 429 },
      );
    }

    // --- Daily quota: 5 for authenticated users, 1 for guests per IP ---
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const usageDocId = uid ? `${uid}_${today}` : `guest_${ip}_${today}`;

    if (admin.apps.length) {
      const usageRef = admin.firestore().collection("usage").doc(usageDocId);
      try {
        await admin.firestore().runTransaction(async (tx) => {
          const snap = await tx.get(usageRef);
          const count = snap.exists ? snap.data()?.count || 0 : 0;
          const limit = uid ? 5 : 1;
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

    // Build inline image parts from validated base64 data URLs
    const imageParts = images.map((dataUrl) => {
      const [meta, data] = dataUrl.split(",");
      const mimeType = meta.replace("data:", "").replace(";base64", "");
      return { inlineData: { mimeType, data } };
    });

    const contentPayload = [
      ...imageParts,
      {
        text: "Analyse these exam question images and respond in the required JSON format.",
      },
    ];

    const { result, modelUsed } = await generateWithFallback({
      apiKey,
      contents: contentPayload,
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
    });

    const text = result.response.text();
    let analysis: unknown;
    try {
      analysis = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "The AI returned an unexpected response. Please try again." },
        { status: 502 },
      );
    }

    // Persist history for authenticated users (best-effort)
    try {
      if (uid && admin.apps.length) {
        await admin
          .firestore()
          .collection("users")
          .doc(uid)
          .collection("history")
          .add({
            imagesCount: images.length,
            result: analysis,
            model: modelUsed,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
      }
    } catch (err) {
      console.warn("[/api/triage] failed to write history:", err);
    }

    return NextResponse.json(analysis);
  } catch (err: unknown) {
    return serverError("/api/triage", err);
  }
}
