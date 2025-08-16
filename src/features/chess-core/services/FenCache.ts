/**
 * FenCache - LRU cache for FEN positions
 *
 * This class provides a Least Recently Used (LRU) cache for storing
 * FEN positions and associated data, optimizing repeated position lookups.
 * Part of the Clean Architecture refactoring.
 */

import { SIZE_MULTIPLIERS } from '@shared/constants/multipliers';

import type { IFenCache } from '../types/interfaces';

interface CacheNode<T> {
  key: string;
  value: T;
  prev: CacheNode<T> | null;
  next: CacheNode<T> | null;
}

export default class FenCache implements IFenCache {
  private cache: Map<string, CacheNode<string>> = new Map();
  private head: CacheNode<string> | null = null;
  private tail: CacheNode<string> | null = null;
  private maxSize: number;
  private static readonly DEFAULT_MAX_SIZE = SIZE_MULTIPLIERS.LARGE_FACTOR;

  constructor(maxSize: number = FenCache.DEFAULT_MAX_SIZE) {
    if (maxSize <= 0) {
      throw new Error('Cache size must be positive');
    }
    this.maxSize = maxSize;
  }

  /**
   * Get a value from the cache
   */
  public get(key: string): string | undefined {
    const node = this.cache.get(key);
    if (!node) {
      return undefined;
    }

    // Move to front (most recently used)
    this.moveToFront(node);
    return node.value;
  }

  /**
   * Set a value in the cache
   */
  public set(key: string, value: string): void {
    // Check if key exists
    const existingNode = this.cache.get(key);

    if (existingNode) {
      // Update value and move to front
      existingNode.value = value;
      this.moveToFront(existingNode);
      return;
    }

    // Create new node
    const newNode: CacheNode<string> = {
      key,
      value,
      prev: null,
      next: null,
    };

    // Add to cache
    this.cache.set(key, newNode);
    this.addToFront(newNode);

    // Check size limit
    if (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }

  /**
   * Check if key exists in cache
   */
  public has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Clear the cache
   */
  public clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
  }

  /**
   * Get current cache size
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * Set maximum cache size
   */
  public setMaxSize(size: number): void {
    if (size <= 0) {
      throw new Error('Cache size must be positive');
    }

    this.maxSize = size;

    // Evict entries if needed
    while (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }

  /**
   * Get maximum cache size
   */
  public getMaxSize(): number {
    return this.maxSize;
  }

  /**
   * Get all keys in cache (most to least recently used)
   */
  public keys(): string[] {
    const keys: string[] = [];
    let current = this.head;

    while (current) {
      keys.push(current.key);
      current = current.next;
    }

    return keys;
  }

  /**
   * Get cache statistics
   */
  public getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * Move node to front of the list (most recently used)
   */
  private moveToFront(node: CacheNode<string>): void {
    if (node === this.head) {
      return; // Already at front
    }

    // Remove from current position
    this.removeNode(node);

    // Add to front
    this.addToFront(node);
  }

  /**
   * Add node to front of the list
   */
  private addToFront(node: CacheNode<string>): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * Remove node from the list
   */
  private removeNode(node: CacheNode<string>): void {
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

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    if (!this.tail) {
      return;
    }

    const lru = this.tail;
    this.cache.delete(lru.key);

    if (lru.prev) {
      lru.prev.next = null;
      this.tail = lru.prev;
    } else {
      // Cache is now empty
      this.head = null;
      this.tail = null;
    }
  }
}
