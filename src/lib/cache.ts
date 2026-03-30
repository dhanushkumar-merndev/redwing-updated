const cache = new Map<string, { data: unknown; expiry: number }>();

export const getCache = <T>(key: string): T | null => {
  const item = cache.get(key);
  if (!item || Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.data as T;
};

export const setCache = (key: string, data: unknown): void => {
  cache.set(key, {
    data,
    expiry: Date.now() + 1000 * 60 * 10, // 10 minute TTL
  });
};

export const clearCache = (): void => {
  cache.clear();
};
