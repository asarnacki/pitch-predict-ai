/**
 * This file contains the implementation of the CacheService class, which provides
 * an in-memory caching mechanism with a Time-To-Live (TTL) for API responses.
 *
 * The CacheService is used to store data from external APIs, reducing the number of
 * requests to those services and improving the application's performance.
 *
 * It supports basic cache operations such as get, set, and clear.
 *
 * The cache is implemented as a singleton, so the same instance is shared across
 * the application.
 */
import type { CacheEntry } from '@/types'

export class CacheService {
  private store = new Map<string, CacheEntry<any>>()

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.store.delete(key)
      return null
    }

    return entry.data as T
  }

  set<T>(key: string, data: T, ttl: number): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  clear(key: string): void {
    this.store.delete(key)
  }
}

export const cache = new CacheService()
