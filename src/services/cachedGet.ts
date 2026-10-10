import axios from 'axios';

const CACHE_TTL_MS = 10_000;
const cache = new Map<string, { expiresAt: number; value: unknown }>();
const pending = new Map<string, Promise<unknown>>();
let cacheGeneration = 0;

export function invalidateAdminCache(): void {
  cacheGeneration++;
  cache.clear();
  pending.clear();
}

export async function cachedGet<T>(url: string, fresh = false): Promise<T> {
  if (fresh) cache.delete(url);
  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;
  if (cached) cache.delete(url);

  const inFlight = pending.get(url);
  if (inFlight) return inFlight as Promise<T>;

  const requestGeneration = cacheGeneration;
  const request = axios
    .get<T>(url)
    .then((response) => {
      if (requestGeneration === cacheGeneration) {
        cache.set(url, {
          expiresAt: Date.now() + CACHE_TTL_MS,
          value: response.data,
        });
      }
      return response.data;
    })
    .finally(() => {
      if (pending.get(url) === request) pending.delete(url);
    });
  pending.set(url, request);
  return request;
}
