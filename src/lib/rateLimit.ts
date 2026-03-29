const store = new Map<string, { count: number; time: number }>();

export function rateLimit(ip: string, limit: number = 60): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const entry = store.get(ip);

  if (!entry || now - entry.time > windowMs) {
    store.set(ip, { count: 1, time: now });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
