// Universal & Browser-safe Rate Limiter (Sliding Window Algorithm)

const memoryStore = new Map<string, number[]>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Universal Sliding-Window Rate Limiter
 * @param identifier Unique key (e.g. "swipe:uid123", "chat:uid123")
 * @param limit Max actions allowed in window
 * @param windowSeconds Window length in seconds
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const key = `rl:${identifier}`;

  const timestamps = (memoryStore.get(key) || []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    const oldest = timestamps[0];
    const resetSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      success: false,
      limit,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds)
    };
  }

  timestamps.push(now);
  memoryStore.set(key, timestamps);

  // Periodically clean stale entries to prevent memory growth
  if (memoryStore.size > 1000) {
    for (const [k, v] of memoryStore.entries()) {
      const valid = v.filter((t) => now - t < windowMs);
      if (valid.length === 0) memoryStore.delete(k);
      else memoryStore.set(k, valid);
    }
  }

  return {
    success: true,
    limit,
    remaining: limit - timestamps.length,
    resetSeconds: windowSeconds
  };
}

// Client-side swipe limiter (local store for instant UI response)
const clientSwipeStore: { [key: string]: number[] } = {};

export function checkClientSwipeRateLimit(limit: number = 50, windowSeconds: number = 60): { allowed: boolean; waitSeconds: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  
  if (!clientSwipeStore["swipes"]) {
    clientSwipeStore["swipes"] = [];
  }

  clientSwipeStore["swipes"] = clientSwipeStore["swipes"].filter((t) => now - t < windowMs);

  if (clientSwipeStore["swipes"].length >= limit) {
    const oldest = clientSwipeStore["swipes"][0];
    const waitSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, waitSeconds: Math.max(1, waitSeconds) };
  }

  clientSwipeStore["swipes"].push(now);
  return { allowed: true, waitSeconds: 0 };
}
