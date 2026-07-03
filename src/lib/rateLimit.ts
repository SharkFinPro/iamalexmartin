// Best-effort, in-memory sliding-window rate limiter for Server Actions.
//
// State is per serverless instance, so the effective ceiling scales with
// concurrent instances — this is abuse mitigation (bots hammering one warm
// instance), not a strict global quota. That trade-off keeps the site
// database-free; swap the Map for a KV store if a hard limit is ever needed.

const buckets = new Map<string, number[]>();

// Don't let an attacker rotating keys (IPs) grow the map without bound.
const MAX_BUCKETS = 5000;

/**
 * Record a hit for `key` and report whether it stays within `limit` hits per
 * `windowMs`. Returns false when the caller should be rejected.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }

  hits.push(now);
  buckets.set(key, hits);

  if (buckets.size > MAX_BUCKETS) {
    for (const [k, v] of buckets) {
      if (!v.some((t) => t > cutoff)) buckets.delete(k);
    }
  }

  return true;
}

/** First hop of x-forwarded-for, or "unknown" when unavailable. */
export function clientIpFrom(headerValue: string | null): string {
  return headerValue?.split(",")[0]?.trim() || "unknown";
}
