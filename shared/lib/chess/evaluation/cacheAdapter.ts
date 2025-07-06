/**
 * Cache adapter to bridge LRUCache with ICacheProvider interface
 */

import { LRUCache } from '@shared/lib/cache/LRUCache';
import type { ICacheProvider } from './providers';

export class LRUCacheAdapter<T> implements ICacheProvider<T> {
  constructor(private cache: LRUCache<T>) {}

  async get(key: string): Promise<T | null> {
    const value = this.cache.get(key);
    return value ?? null;
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    this.cache.set(key, value);
    // Note: LRUCache doesn't support TTL, so we ignore it
    // In a real implementation, you might want to add TTL support
  }

  async delete(key: string): Promise<void> {
    // LRUCache doesn't have a delete method, but we can set undefined
    // which will be filtered out in get()
    this.cache.set(key, undefined as any);
  }

  async clear(): Promise<void> {
    // LRUCache doesn't have a clear method
    // You might want to add this to the LRUCache implementation
    // For now, we'll leave it as a no-op
  }
}