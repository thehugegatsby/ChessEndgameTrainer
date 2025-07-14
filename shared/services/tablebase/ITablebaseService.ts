/**
 * ITablebaseService - Clean Architecture Interface for Tablebase Services
 * 
 * PHASE 3.1: Service-level interface for tablebase evaluation queries
 * Defines the contract for tablebase data access following clean architecture
 * 
 * @module ITablebaseService
 */

import type { TablebaseResult } from '@shared/types/evaluation';

/**
 * Configuration options for tablebase services
 */
export interface TablebaseServiceConfig {
  /** Base URL for tablebase API */
  baseUrl?: string;
  
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Maximum number of pieces supported */
  maxPieces?: number;
  
  /** Enable caching of tablebase results */
  enableCaching?: boolean;
  
  /** Cache TTL in seconds */
  cacheTtl?: number;
  
  /** User agent for API requests */
  userAgent?: string;
}

/**
 * Tablebase lookup result with metadata
 */
export interface TablebaseLookupResult {
  /** The tablebase evaluation data */
  result: TablebaseResult;
  
  /** Source of the data (e.g., 'lichess', 'chessdb', 'local') */
  source: string;
  
  /** Lookup time in milliseconds */
  lookupTime: number;
  
  /** Whether result came from cache */
  fromCache: boolean;
  
  /** Number of pieces in position */
  pieceCount: number;
}

/**
 * Service-level interface for tablebase evaluation services
 * 
 * This interface abstracts tablebase data access and follows clean architecture
 * principles by separating business logic from implementation details.
 */
export interface ITablebaseService {
  /**
   * Queries tablebase for position evaluation
   * 
   * @param fen - Position in FEN notation
   * @returns Tablebase lookup result or null if position not in tablebase
   * @throws Error if service fails or position is invalid
   */
  lookupPosition(fen: string): Promise<TablebaseLookupResult | null>;
  
  /**
   * Checks if a position is likely in tablebase (piece count check)
   * 
   * @param fen - Position in FEN notation  
   * @returns True if position might be in tablebase
   */
  isTablebasePosition(fen: string): boolean;
  
  /**
   * Gets maximum number of pieces supported by this service
   * 
   * @returns Maximum piece count for tablebase lookups
   */
  getMaxPieces(): number;
  
  /**
   * Gets service configuration
   * 
   * @returns Current service configuration
   */
  getConfig(): TablebaseServiceConfig;
  
  /**
   * Health check for tablebase service
   * 
   * @returns True if service is available and responding
   */
  isHealthy(): Promise<boolean>;
  
  /**
   * Clears any cached tablebase data
   * 
   * @returns Promise that resolves when cache is cleared
   */
  clearCache(): Promise<void>;
  
  /**
   * Gets Top-3 tablebase moves for a position (PHASE 3.2)
   * 
   * @param fen - Position in FEN notation
   * @returns Array of top moves with DTZ/DTM data or null if not in tablebase
   */
  getTopMoves(fen: string): Promise<Array<{
    move: string;
    san: string;
    dtz: number;
    dtm: number;
    wdl: number;
    category: 'win' | 'draw' | 'loss';
  }> | null>;
}