/**
 * In-memory fixed-window rate limiter. Good enough for a single instance; for
 * multiple serverless instances replace the Map with Redis/Upstash (same API).
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
    }
    return { ok: true, retryAfter: 0 };
  }
  bucket.count += 1;
  return { ok: bucket.count <= limit, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
