import { NextResponse } from "next/server";

/**
 * Logs the real error server-side and returns a generic 500 to the client so
 * we never leak stack traces, provider messages, or other internals.
 */
export function serverError(context: string, err: unknown): NextResponse {
  console.error(`[${context}] error:`, err);
  const detail =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : JSON.stringify(err);
  const isDev = process.env.NODE_ENV !== "production";
  return NextResponse.json(
    {
      error:
        isDev && detail
          ? `[${context}] ${detail}`
          : "Something went wrong. Please try again.",
    },
    { status: 500 },
  );
}
