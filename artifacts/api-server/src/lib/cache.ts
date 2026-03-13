interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TTLCache {
  private store = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(maxSize = 500) {
    this.maxSize = maxSize;
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (this.store.size >= this.maxSize) {
      this.evictExpired();
      if (this.store.size >= this.maxSize) {
        const firstKey = this.store.keys().next().value;
        if (firstKey) this.store.delete(firstKey);
      }
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  invalidate(key: string): boolean {
    return this.store.delete(key);
  }

  invalidatePattern(pattern: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(pattern)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  stats(): { size: number; maxSize: number } {
    return { size: this.store.size, maxSize: this.maxSize };
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  private cleanup(): void {
    this.evictExpired();
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

export const apiCache = new TTLCache(500);

export const CACHE_TTL = {
  SHORT: 60_000,
  MEDIUM: 5 * 60_000,
  LONG: 15 * 60_000,
  VERY_LONG: 60 * 60_000,
} as const;

import { Request, Response, NextFunction } from "express";

export function cacheMiddleware(ttlMs: number, keyPrefix?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }
    const cacheKey = `${keyPrefix || "api"}:${req.originalUrl}`;
    const cached = apiCache.get<{ body: any; statusCode: number }>(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.status(cached.statusCode).json(cached.body);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        apiCache.set(cacheKey, { body, statusCode: res.statusCode }, ttlMs);
      }
      res.setHeader("X-Cache", "MISS");
      return originalJson(body);
    };
    next();
  };
}
