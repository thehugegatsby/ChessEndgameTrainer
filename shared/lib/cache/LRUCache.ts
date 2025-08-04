/**
 * Minimal LRU Cache implementation
 * For position caching only - no tablebase dependencies
 */

/**
 *
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

export class LRUCache<T> {
  private cache = new Map<string, T>();
  private readonly maxSize: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   *
   * @param key
   */
  get(key: string): T | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.hits++;
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    this.misses++;
    return undefined;
  }

  /**
   *
   * @param key
   * @param value
   */
  set(key: string, value: T): void {
    // Remove if exists (to reorder)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  /**
   *
   * @param key
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   *
   * @param key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   *
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   *
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   *
   */
  getMemoryUsage(): number {
    // Rough estimate
    return this.cache.size * 1000; // Assume 1KB per entry
  }

  /**
   *
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}
