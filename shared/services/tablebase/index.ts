/**
 * Tablebase Services Module
 * 
 * PHASE 3.1: Clean Architecture Tablebase Service Layer
 * Exports interfaces and implementations for tablebase evaluation services
 * 
 * @module TablebaseServices
 */

// Core interfaces
export type { 
  ITablebaseService,
  TablebaseServiceConfig,
  TablebaseLookupResult
} from './ITablebaseService';

// Mock implementation for development/testing
export { MockTablebaseService } from './MockTablebaseService';

// Adapter for evaluation system integration
export { TablebaseServiceAdapter } from './TablebaseServiceAdapter';

// Import for factory function
import { MockTablebaseService } from './MockTablebaseService';
import type { ITablebaseService, TablebaseServiceConfig } from './ITablebaseService';

// TODO: Add real implementations
// export { LichessTablebaseService } from './LichessTablebaseService';
// export { ChessDbTablebaseService } from './ChessDbTablebaseService';

/**
 * Factory function to create tablebase service instances
 * 
 * @param type - Type of tablebase service to create
 * @param config - Configuration options
 * @returns Tablebase service instance
 */
export function createTablebaseService(
  type: 'mock' | 'lichess' | 'chessdb' = 'mock',
  config: TablebaseServiceConfig = {}
): ITablebaseService {
  switch (type) {
    case 'mock':
      return new MockTablebaseService(config);
    
    case 'lichess':
      // TODO: Implement LichessTablebaseService
      throw new Error('LichessTablebaseService not yet implemented');
    
    case 'chessdb':
      // TODO: Implement ChessDbTablebaseService  
      throw new Error('ChessDbTablebaseService not yet implemented');
    
    default:
      throw new Error(`Unknown tablebase service type: ${type}`);
  }
}