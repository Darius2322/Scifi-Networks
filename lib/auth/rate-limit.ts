/**
 * Minimal in-memory rate limiter for login/verification endpoints.
 *
 * IMPORTANT: this resets on every server restart/deploy and does not share
 * state across serverless instances. For production on Vercel, replace with
 * a durable store (Upstash Redis is the standard pairing) — the interface
 * below is deliberately small so swapping the backend is a one-file change.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  bucket.count += 1;
  if (bucket.count > limit) return true;
  return false;
}

/** Login-specific defaults: 5 attempts per 10 minutes per key (e.g. IP+identifier). */
export function isLoginRateLimited(key: string): boolean {
  return isRateLimited(`login:${key}`, 5, 10 * 60 * 1000);
}

/** Ticket-lookup-specific defaults: 8 attempts per 10 minutes — slightly looser
 * than login since customers legitimately mistype ticket numbers. */
export function isTrackLookupRateLimited(key: string): boolean {
  return isRateLimited(`track:${key}`, 8, 10 * 60 * 1000);
}
