/**
 * Provider interfaces for UnifiedEvaluationService
 * 
 * These interfaces define the contracts for external evaluation sources.
 * Using interfaces enables dependency injection and easier testing.
 * 
 * @module EvaluationProviders
 */

import type { EngineEvaluation, TablebaseResult } from '@shared/types/evaluation';

/**
 * Interface for chess engine evaluation providers
 */
export interface IEngineProvider {
  /**
   * Gets evaluation from chess engine for given position
   * @param fen - Position in FEN notation
   * @param playerToMove - Which player is to move ('w' or 'b')
   * @returns Engine evaluation or null if unavailable/error
   */
  getEvaluation(fen: string, playerToMove: 'w' | 'b'): Promise<EngineEvaluation | null>;
}

/**
 * Interface for tablebase evaluation providers
 */
export interface ITablebaseProvider {
  /**
   * Gets evaluation from tablebase for given position
   * @param fen - Position in FEN notation
   * @param playerToMove - Which player is to move ('w' or 'b')
   * @returns Tablebase result or null if unavailable/error
   */
  getEvaluation(fen: string, playerToMove: 'w' | 'b'): Promise<TablebaseResult | null>;
}

/**
 * Generic cache interface for evaluation caching
 */
export interface ICacheProvider<T> {
  /**
   * Retrieves cached value by key
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   */
  get(key: string): Promise<T | null>;

  /**
   * Stores value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (optional)
   */
  set(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Removes value from cache
   * @param key - Cache key
   */
  delete(key: string): Promise<void>;

  /**
   * Clears all cached values
   */
  clear(): Promise<void>;
}

/**
 * Configuration options for UnifiedEvaluationService
 */
export interface UnifiedEvaluationConfig {
  /** Enable caching of evaluations */
  enableCaching?: boolean;
  
  /** Default cache TTL in seconds */
  cacheTtl?: number;
  
  /** Timeout for engine evaluation in milliseconds */
  engineTimeout?: number;
  
  /** Timeout for tablebase evaluation in milliseconds */
  tablebaseTimeout?: number;
  
  /** Whether to fallback to engine if tablebase fails */
  fallbackToEngine?: boolean;
}

/**
 * Result wrapper for better error handling
 */
export type EvaluationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  fallback?: T;
};