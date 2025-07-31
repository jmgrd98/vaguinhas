import { LRUCache } from "lru-cache";

const rateLimitCache =
  process.env.NODE_ENV === "production"
    ? new LRUCache<string, number[]>({
        max: 100,
        ttl: 30 * 60 * 1000, // 30 minutes
      })
    : null;

export default function isRateLimited(token: string, limit = 5) {
  if (!rateLimitCache || process.env.NODE_ENV !== "production") return false;

  const countArr = rateLimitCache.get(token) || [0];
  if (countArr[0] >= limit) return true;

  rateLimitCache.set(token, [countArr[0] + 1]);
  return false;
}