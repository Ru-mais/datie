// Discovery Feed Cache Layer (Fast In-Memory + SessionStorage)

const DEFAULT_TTL_SECONDS = 300; // 5 minutes cache
const memoryCache = new Map<string, { deck: any[]; expiresAt: number }>();

export async function getCachedDiscoveryDeck(userId: string): Promise<any[] | null> {
  const now = Date.now();

  // 1. Check in-memory cache
  const inMem = memoryCache.get(userId);
  if (inMem && inMem.expiresAt > now) {
    return inMem.deck;
  }

  // 2. Check client-side sessionStorage
  if (typeof window !== "undefined") {
    try {
      const item = sessionStorage.getItem(`deck_${userId}`);
      if (item) {
        const parsed = JSON.parse(item);
        if (now - parsed.timestamp < DEFAULT_TTL_SECONDS * 1000) {
          memoryCache.set(userId, { deck: parsed.deck, expiresAt: parsed.timestamp + DEFAULT_TTL_SECONDS * 1000 });
          return parsed.deck;
        }
      }
    } catch {
      // sessionStorage unavailable
    }
  }

  return null;
}

export async function setCachedDiscoveryDeck(userId: string, deck: any[], ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<void> {
  const now = Date.now();
  const expiresAt = now + ttlSeconds * 1000;

  memoryCache.set(userId, { deck, expiresAt });

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(`deck_${userId}`, JSON.stringify({ deck, timestamp: now }));
    } catch {
      // ignore
    }
  }
}

export async function invalidateDiscoveryDeck(userId: string): Promise<void> {
  memoryCache.delete(userId);

  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(`deck_${userId}`);
    } catch {
      // ignore
    }
  }
}
