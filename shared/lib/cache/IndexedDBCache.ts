/**
 * IndexedDB-based persistent cache implementation
 * 
 * Provides cross-session persistence for chess evaluations
 * with automatic cleanup and performance optimization
 * 
 * @module IndexedDBCache
 */

import type { ICacheProvider } from '../chess/evaluation/providers';
import { Logger } from '@shared/services/logging/Logger';

const logger = new Logger();

export interface IndexedDBCacheOptions {
  /** Database name */
  dbName: string;
  /** Object store name */
  storeName: string;
  /** Database version */
  version: number;
  /** Default TTL in milliseconds */
  defaultTtl: number;
  /** Maximum cache size (entries) */
  maxSize: number;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export class IndexedDBCache<T> implements ICacheProvider<T> {
  private readonly options: IndexedDBCacheOptions;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(options: Partial<IndexedDBCacheOptions> = {}) {
    this.options = {
      dbName: options.dbName || 'chess-evaluations',
      storeName: options.storeName || 'evaluations',
      version: options.version || 1,
      defaultTtl: options.defaultTtl || 30 * 60 * 1000, // 30 minutes
      maxSize: options.maxSize || 1000,
      ...options
    };
  }

  /**
   * Initialize IndexedDB connection
   */
  private async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(this.options.dbName, this.options.version);

      request.onerror = () => {
        logger.error('[IndexedDBCache] Database error', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.info('[IndexedDBCache] Database initialized', {
          name: this.options.dbName,
          version: this.options.version
        });
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.options.storeName)) {
          const store = db.createObjectStore(this.options.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
          logger.info('[IndexedDBCache] Object store created', {
            storeName: this.options.storeName
          });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Get cached value
   */
  async get(key: string): Promise<T | null> {
    try {
      await this.initialize();
      
      if (!this.db) {
        return null;
      }

      const transaction = this.db.transaction([this.options.storeName], 'readonly');
      const store = transaction.objectStore(this.options.storeName);
      const request = store.get(key);

      const result = await this.promisifyRequest<CacheEntry<T>>(request);
      
      if (!result) {
        return null;
      }

      // Check if expired
      const now = Date.now();
      if (now - result.timestamp > result.ttl) {
        // Expired - delete and return null
        await this.delete(key);
        return null;
      }

      return result.value;
    } catch (error) {
      logger.error('[IndexedDBCache] Error getting value', error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  async set(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.initialize();
      
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp: Date.now(),
        ttl: ttl || this.options.defaultTtl
      };

      const transaction = this.db.transaction([this.options.storeName], 'readwrite');
      const store = transaction.objectStore(this.options.storeName);
      const request = store.put(entry);

      await this.promisifyRequest(request);

      // Check if we need to cleanup old entries
      await this.cleanupIfNeeded();
    } catch (error) {
      logger.error('[IndexedDBCache] Error setting value', error);
      throw error;
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    try {
      await this.initialize();
      
      if (!this.db) {
        return;
      }

      const transaction = this.db.transaction([this.options.storeName], 'readwrite');
      const store = transaction.objectStore(this.options.storeName);
      const request = store.delete(key);

      await this.promisifyRequest(request);
    } catch (error) {
      logger.error('[IndexedDBCache] Error deleting value', error);
    }
  }

  /**
   * Clear all cached values
   */
  async clear(): Promise<void> {
    try {
      await this.initialize();
      
      if (!this.db) {
        return;
      }

      const transaction = this.db.transaction([this.options.storeName], 'readwrite');
      const store = transaction.objectStore(this.options.storeName);
      const request = store.clear();

      await this.promisifyRequest(request);
      logger.info('[IndexedDBCache] Cache cleared');
    } catch (error) {
      logger.error('[IndexedDBCache] Error clearing cache', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ size: number; oldestEntry: number | null }> {
    try {
      await this.initialize();
      
      if (!this.db) {
        return { size: 0, oldestEntry: null };
      }

      const transaction = this.db.transaction([this.options.storeName], 'readonly');
      const store = transaction.objectStore(this.options.storeName);
      const countRequest = store.count();
      const count = await this.promisifyRequest<number>(countRequest);

      // Get oldest entry timestamp
      const index = store.index('timestamp');
      const oldestRequest = index.openCursor();
      const oldestResult = await this.promisifyRequest(oldestRequest);
      const oldestEntry = oldestResult ? oldestResult.value.timestamp : null;

      return {
        size: count,
        oldestEntry
      };
    } catch (error) {
      logger.error('[IndexedDBCache] Error getting stats', error);
      return { size: 0, oldestEntry: null };
    }
  }

  /**
   * Cleanup expired entries and enforce size limits
   */
  private async cleanupIfNeeded(): Promise<void> {
    try {
      const stats = await this.getStats();
      
      if (stats.size <= this.options.maxSize) {
        return;
      }

      const transaction = this.db!.transaction([this.options.storeName], 'readwrite');
      const store = transaction.objectStore(this.options.storeName);
      const index = store.index('timestamp');
      
      // Get all entries sorted by timestamp (oldest first)
      const request = index.openCursor();
      const entriesToDelete = Math.ceil(stats.size * 0.2); // Remove 20% of entries
      let deletedCount = 0;

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && deletedCount < entriesToDelete) {
          const entry = cursor.value as CacheEntry<T>;
          const now = Date.now();
          
          // Delete if expired or if we need to free space
          if (now - entry.timestamp > entry.ttl || deletedCount < entriesToDelete) {
            store.delete(entry.key);
            deletedCount++;
          }
          
          cursor.continue();
        }
      };

      await this.promisifyRequest(request);
      
      if (deletedCount > 0) {
        logger.info('[IndexedDBCache] Cleaned up entries', {
          deletedCount,
          remainingSize: stats.size - deletedCount
        });
      }
    } catch (error) {
      logger.error('[IndexedDBCache] Error during cleanup', error);
    }
  }

  /**
   * Convert IDBRequest to Promise
   */
  private promisifyRequest<TResult>(request: IDBRequest<TResult>): Promise<TResult> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}