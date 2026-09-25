// Simple in-memory sliding-window rate limiter for the /api/agents/:id/run
// endpoint, so a shared demo URL can't run up model spend.

const WINDOW_MS = 60_000;
const MAX_CALLS_PER_WINDOW = 6;

const hits = new Map<string, number[]>();

export function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const existing = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (existing.length >= MAX_CALLS_PER_WINDOW) {
    const oldest = existing[0];
    const retryAfterSeconds = Math.ceil((oldest + WINDOW_MS - now) / 1000);
    hits.set(key, existing);
    return { allowed: false, retryAfterSeconds };
  }

  existing.push(now);
  hits.set(key, existing);
  return { allowed: true };
}
