/**
 * @fileoverview Simple LRU Cache Implementation
 * @version 1.0.0
 * @description Conservative LRU cache for engine evaluations
 * 
 * DESIGN PRINCIPLES:
 * - Simple, battle-tested LRU implementation
 * - Memory-conscious for mobile devices
 * - No external dependencies
 * - Fail-safe error handling
 */

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

interface CacheNode<T> {
  key: string;
  value: T;
  timestamp: number;
  prev: CacheNode<T> | null;
  next: CacheNode<T> | null;
}

export class LRUCache<T> {
  private maxSize: number;
  private cache: Map<string, CacheNode<T>>;
  private head: CacheNode<T> | null = null;
  private tail: CacheNode<T> | null = null;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number = 1000) {
    this.maxSize = Math.max(0, maxSize);
    this.cache = new Map();
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const node = this.cache.get(key);
    
    if (!node) {
      this.misses++;
      return undefined;
    }

    // Move to head (most recently used)
    this.moveToHead(node);
    this.hits++;
    return node.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T): void {
    try {
      // Handle zero capacity
      if (this.maxSize === 0) {
        return;
      }

      const existingNode = this.cache.get(key);
      
      if (existingNode) {
        // Update existing node
        existingNode.value = value;
        existingNode.timestamp = Date.now();
        this.moveToHead(existingNode);
        return;
      }

      // Create new node
      const newNode: CacheNode<T> = {
        key,
        value,
        timestamp: Date.now(),
        prev: null,
        next: null
      };

      // Add to cache
      this.cache.set(key, newNode);
      this.addToHead(newNode);

      // Check if we need to evict
      if (this.cache.size > this.maxSize) {
        this.evictTail();
      }
    } catch (error) {
      console.warn('[LRUCache] Error setting cache value:', error);
    }
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string, maxAge?: number): boolean {
    const node = this.cache.get(key);
    
    if (!node) {
      return false;
    }

    // Check expiration if maxAge is provided
    if (maxAge && (Date.now() - node.timestamp) > maxAge) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete key from cache
   */
  delete(key: string): boolean {
    const node = this.cache.get(key);
    
    if (!node) {
      return false;
    }

    this.cache.delete(key);
    this.removeNode(node);
    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? this.hits / total : 0
    };
  }

  /**
   * Get estimated memory usage in bytes
   */
  getMemoryUsage(): number {
    // Rough estimate: 
    // - Each string key: ~50 bytes average
    // - Each node overhead: ~100 bytes
    // - Each value: estimated at 200 bytes for evaluation data
    return this.cache.size * 350;
  }

  /**
   * Get current size of cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Iterate over all cache entries
   */
  forEach(callback: (value: T, key: string) => void): void {
    let current = this.head;
    while (current) {
      callback(current.value, current.key);
      current = current.next;
    }
  }

  /**
   * Get all keys as array
   */
  keys(): string[] {
    const keys: string[] = [];
    let current = this.head;
    while (current) {
      keys.push(current.key);
      current = current.next;
    }
    return keys;
  }

  /**
   * Get all values as array
   */
  values(): T[] {
    const values: T[] = [];
    let current = this.head;
    while (current) {
      values.push(current.value);
      current = current.next;
    }
    return values;
  }

  private moveToHead(node: CacheNode<T>): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  private addToHead(node: CacheNode<T>): void {
    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: CacheNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private evictTail(): void {
    if (!this.tail) return;

    const key = this.tail.key;
    this.cache.delete(key);
    this.removeNode(this.tail);
  }
}