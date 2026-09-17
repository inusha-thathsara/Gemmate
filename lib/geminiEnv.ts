import fs from "fs";
import path from "path";
import {
  GoogleGenerativeAI,
  GenerateContentResult,
  Part,
} from "@google/generative-ai";

/**
 * Returns the Gemini API key.
 * In development, reads directly from `.env.local` first so changes take effect
 * immediately without having to restart the Next.js dev server.
 * In production, falls back to `process.env.GEMINI_API_KEY`.
 */
export function getGeminiApiKey(): string | undefined {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(/^GEMINI_API_KEY=(.*)$/m);
      if (match && match[1].trim()) {
        return match[1].trim();
      }
    }
  } catch (err) {
    console.warn("[getGeminiApiKey] Failed to read .env.local directly:", err);
  }
  return process.env.GEMINI_API_KEY;
}

/**
 * Returns the configured Gemini model (default: "gemini-3.6-flash").
 */
export function getGeminiModel(): string {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(/^GEMINI_MODEL=(.*)$/m);
      if (match && match[1].trim()) {
        return match[1].trim();
      }
    }
  } catch {}
  return process.env.GEMINI_MODEL || "gemini-3.6-flash";
}

export interface GenerateOptions {
  apiKey: string;
  contents: string | Array<string | Part>;
  systemInstruction?: string;
  responseMimeType?: string;
  preferredModel?: string;
}

export interface GenerateResult {
  result: GenerateContentResult;
  modelUsed: string;
}

/**
 * Calls Gemini with automatic retry and model fallback.
 * If a model returns 503 (high demand) or 429 (rate limit), it retries with backoff
 * and cascades through candidate models (preferred -> gemini-3.6-flash -> gemini-3.5-flash).
 */
export async function generateWithFallback({
  apiKey,
  contents,
  systemInstruction,
  responseMimeType,
  preferredModel,
}: GenerateOptions): Promise<GenerateResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const primary = preferredModel || getGeminiModel();

  // Deduplicated candidate chain: preferred -> 3.6-flash -> 3.5-flash -> 3.1-flash-lite
  const candidateModels = Array.from(
    new Set([
      primary,
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
    ]),
  );

  let lastError: unknown;

  for (const modelName of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
          ...(responseMimeType
            ? { generationConfig: { responseMimeType } }
            : {}),
        });

        const result = await model.generateContent(contents);
        return { result, modelUsed: modelName };
      } catch (err: unknown) {
        lastError = err;
        const status = (err as { status?: number })?.status;
        const isTransient = status === 503 || status === 429;

        if (isTransient) {
          console.warn(
            `[Gemini] ${modelName} returned ${status} on attempt ${attempt}. Waiting 1200ms before retry/fallback...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 1200));
        } else {
          // For non-transient errors (e.g. 400 Bad Request), don't retry same model
          break;
        }
      }
    }
  }

  throw lastError;
}
