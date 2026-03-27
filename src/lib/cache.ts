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
    expiry: 0, // Disabled for now as per user request (was 1000 * 60 * 5)
  });
};

export const clearCache = (): void => {
  cache.clear();
};
