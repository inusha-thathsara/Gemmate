import admin from "./firebaseAdmin";

export interface RateLimitOptions {
  /** Stable identifier for the caller, e.g. `triage:uid_abc` or `hint:ip_1.2.3.4`. */
  key: string;
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

/**
 * Fixed-window rate limiter backed by Firestore so it works across serverless
 * instances. Degrades gracefully:
 *  - If Firebase Admin is not configured, limiting is skipped (returns true).
 *  - If a transient Firestore error occurs, it fails open (returns true) so a
 *    backend hiccup never takes down the user-facing feature.
 *
 * Documents are written with an `expireAt` field; configure a Firestore TTL
 * policy on the `ratelimits` collection to auto-purge old windows.
 */
export async function checkRateLimit({
  key,
  limit,
  windowSeconds,
}: RateLimitOptions): Promise<boolean> {
  if (!admin.apps.length) return true;

  const windowId = Math.floor(Date.now() / (windowSeconds * 1000));
  const ref = admin
    .firestore()
    .collection("ratelimits")
    .doc(`${key}_${windowId}`);

  try {
    let allowed = true;
    await admin.firestore().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const count = snap.exists ? snap.data()?.count || 0 : 0;
      if (count >= limit) {
        allowed = false;
        return;
      }
      tx.set(
        ref,
        {
          count: count + 1,
          expireAt: new Date((windowId + 1) * windowSeconds * 1000 + 60_000),
        },
        { merge: true },
      );
    });
    return allowed;
  } catch (err) {
    console.warn("[rateLimit] check failed, allowing request:", err);
    return true;
  }
}
