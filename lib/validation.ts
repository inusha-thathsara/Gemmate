import { z } from "zod";

/** Max number of images accepted per triage request. */
export const MAX_IMAGES = 3;

/** Max decoded size of a single image (5 MB). */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Base64 inflates payload by ~33%. Add the data-url prefix headroom so the
 * length check rejects oversized uploads before we ever hand them to Gemini.
 */
const MAX_DATA_URL_LENGTH = Math.ceil(MAX_IMAGE_BYTES * 1.37) + 128;

const imageDataUrl = z
  .string()
  .regex(
    /^data:image\/(png|jpe?g|webp|heic|heif|gif);base64,[A-Za-z0-9+/=\s]+$/,
    "Each image must be a base64-encoded PNG, JPEG, WEBP, GIF or HEIC data URL.",
  )
  .max(MAX_DATA_URL_LENGTH, "Each image must be 5 MB or smaller.");

export const triageSchema = z.object({
  images: z
    .array(imageDataUrl)
    .min(1, "Provide at least one image.")
    .max(MAX_IMAGES, `Provide at most ${MAX_IMAGES} images.`),
  idToken: z.string().max(4096).optional(),
});

const conceptString = z.string().trim().min(1).max(2000);

export const practiceSchema = z.object({
  core_concepts: z.array(conceptString).max(40).optional(),
  the_trap: z.union([z.array(conceptString).max(40), conceptString]).optional(),
  idToken: z.string().max(4096).optional(),
});

export const hintSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Provide a question.")
    .max(20000, "Question is too long."),
  existing_hints: z.array(z.string().max(4000)).max(10).optional(),
  idToken: z.string().max(4096).optional(),
});

/**
 * Returns the first human-readable validation issue from a Zod error so the
 * client gets an actionable 400 message without exposing internals.
 */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid request body.";
}
