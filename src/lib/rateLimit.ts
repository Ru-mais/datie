import redis from "./redis";

const RATE_LIMIT_WINDOW = 60; // seconds
const MAX_REQUESTS_PER_WINDOW = 10; // max attempts per window

/**
 * Rate limits requests by IP address using Redis.
 * Returns { allowed: true } if within limits, or { allowed: false, retryAfter } if blocked.
 */
export async function rateLimit(
  ip: string,
  options?: { window?: number; max?: number; prefix?: string }
): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
  const window = options?.window || RATE_LIMIT_WINDOW;
  const max = options?.max || MAX_REQUESTS_PER_WINDOW;
  const prefix = options?.prefix || "rl";
  const key = `${prefix}:${ip}`;

  try {
    const current = await redis.incr(key);

    if (current === 1) {
      // First request in this window — set expiry
      await redis.expire(key, window);
    }

    if (current > max) {
      const ttl = await redis.ttl(key);
      return { allowed: false, remaining: 0, retryAfter: ttl };
    }

    return { allowed: true, remaining: max - current };
  } catch (error) {
    // If Redis is down, fail open (allow request) to avoid blocking all users
    console.error("Rate limit check failed (Redis may be down):", error);
    return { allowed: true, remaining: max };
  }
}
