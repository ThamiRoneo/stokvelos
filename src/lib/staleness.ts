export const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

/** BR12: cached data older than 24 hours is stale. */
export function isStale(cachedAt: string | number | Date, now: number = Date.now()): boolean {
  const time = new Date(cachedAt).getTime();
  return Number.isFinite(time) && now - time > STALE_AFTER_MS;
}

export function staleMessage(cachedAt: string): string {
  return `Showing cached data from ${new Date(cachedAt).toLocaleString("en-ZA")}. May be out of date.`;
}
