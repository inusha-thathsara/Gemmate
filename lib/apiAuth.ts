import type { NextRequest } from "next/server";
import admin from "./firebaseAdmin";

export interface AuthResult {
  uid: string | null;
  /**
   * - "not_initialized": a token was supplied but Firebase Admin is not
   *   configured on the server, so it cannot be verified.
   * - "invalid_token": the supplied token failed verification.
   */
  error?: "not_initialized" | "invalid_token";
}

/**
 * Resolves the caller's Firebase UID from either an `Authorization: Bearer`
 * header or a body-supplied `idToken`. Anonymous callers resolve to
 * `{ uid: null }` (no error) so routes can still serve guests.
 */
export async function verifyAuth(
  req: NextRequest,
  bodyToken?: string | null,
): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : bodyToken || null;

  if (!token) return { uid: null };
  if (!admin.apps.length) return { uid: null, error: "not_initialized" };

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return { uid: null, error: "invalid_token" };
  }
}

/** Best-effort client IP for guest rate limiting / quotas. */
export function getClientIp(req: NextRequest): string {
  return (
    (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
