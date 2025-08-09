/**
 * TablebaseService Mock Factory
 * 
 * Creates mocks for the Lichess Tablebase API service.
 * Provides realistic tablebase responses for testing.
 */

import { jest } from '@jest/globals';
import { BaseMockFactory } from './BaseMockFactory';
import type { TablebaseService } from '@shared/services/TablebaseService';
import type { TablebaseResult, TablebaseMove } from '@shared/types/tablebase.types';

type MockedTablebaseService = jest.Mocked<TablebaseService>;

export interface TablebaseServiceMockOverrides {
  // Response data
  defaultResult?: Partial<TablebaseResult>;
  positionResults?: Map<string, TablebaseResult>;
  
  // Behavior flags
  shouldFail?: boolean;
  failureMessage?: string;
  responseDelay?: number;
  
  // Method overrides
  methods?: Partial<MockedTablebaseService>;
}

export class TablebaseServiceMockFactory extends BaseMockFactory<TablebaseService, TablebaseServiceMockOverrides> {
  private positionCache = new Map<string, TablebaseResult>();
  private defaultDelay = 0;

  protected _createDefaultMock(): MockedTablebaseService {
    const mock: MockedTablebaseService = {
      // Main query method
      queryPosition: jest.fn().mockImplementation(async (fen: string) => {
        // Simulate network delay if configured
        if (this.defaultDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.defaultDelay));
        }

        // Check cache first
        if (this.positionCache.has(fen)) {
          return this.positionCache.get(fen);
        }

        // Return default winning position
        return this._createDefaultResult(fen);
      }),

      // Batch query
      queryPositions: jest.fn().mockImplementation(async (fens: string[]) => {
        const results = await Promise.all(
          fens.map(fen => mock.queryPosition(fen))
        );
        return results;
      }),

      // Best move query
      getBestMove: jest.fn().mockImplementation(async (fen: string) => {
        const result = await mock.queryPosition(fen);
        if (result && result.moves && result.moves.length > 0) {
          // Return the first move (assumed to be best)
          return result.moves[0];
        }
        return null;
      }),

      // Cache management
      clearCache: jest.fn().mockImplementation(() => {
        this.positionCache.clear();
      }),

      getCacheSize: jest.fn().mockImplementation(() => {
        return this.positionCache.size;
      }),

      // Service status
      isAvailable: jest.fn().mockResolvedValue(true),
      
      getLastError: jest.fn().mockReturnValue(null),
    } as any;

    return mock;
  }

  protected _mergeOverrides(
    defaultMock: MockedTablebaseService,
    overrides?: TablebaseServiceMockOverrides
  ): MockedTablebaseService {
    if (!overrides) return defaultMock;

    const merged = { ...defaultMock };

    // Apply response delay
    if (overrides.responseDelay !== undefined) {
      this.defaultDelay = overrides.responseDelay;
    }

    // Apply failure behavior
    if (overrides.shouldFail) {
      merged.queryPosition.mockRejectedValue(
        new Error(overrides.failureMessage || 'Tablebase service unavailable')
      );
      merged.isAvailable.mockResolvedValue(false);
      merged.getLastError.mockReturnValue(overrides.failureMessage || 'Service error');
    }

    // Apply position-specific results
    if (overrides.positionResults) {
      this.positionCache = new Map(overrides.positionResults);
    }

    // Apply default result override
    if (overrides.defaultResult) {
      const defaultResult = overrides.defaultResult;
      merged.queryPosition.mockImplementation(async (fen: string) => {
        if (this.defaultDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.defaultDelay));
        }
        
        if (this.positionCache.has(fen)) {
          return this.positionCache.get(fen);
        }
        
        return { ...this._createDefaultResult(fen), ...defaultResult };
      });
    }

    // Apply method overrides
    if (overrides.methods) {
      Object.assign(merged, overrides.methods);
    }

    return merged;
  }

  protected _beforeCleanup(): void {
    // Clear the position cache
    this.positionCache.clear();
    
    // Reset delay
    this.defaultDelay = 0;
  }

  /**
   * Create a default tablebase result
   */
  private _createDefaultResult(fen: string): TablebaseResult {
    return {
      fen,
      category: 'win',
      dtz: 5,
      dtm: 3,
      checkmate: false,
      stalemate: false,
      insufficient_material: false,
      moves: [
        {
          uci: 'e2e4',
          san: 'e4',
          category: 'win',
          dtz: 4,
          dtm: 2,
          zeroing: false,
          checkmate: false,
          stalemate: false,
          insufficient_material: false,
        },
        {
          uci: 'd2d4',
          san: 'd4',
          category: 'draw',
          dtz: 0,
          dtm: 0,
          zeroing: false,
          checkmate: false,
          stalemate: false,
          insufficient_material: false,
        },
      ],
    };
  }

  /**
   * Helper to set up a winning position
   */
  public setupWinningPosition(fen: string, dtm: number = 5): void {
    this.positionCache.set(fen, {
      fen,
      category: 'win',
      dtz: dtm + 2,
      dtm,
      checkmate: false,
      stalemate: false,
      insufficient_material: false,
      moves: [
        {
          uci: 'e7e8q',
          san: 'e8=Q+',
          category: 'win',
          dtz: dtm - 1,
          dtm: dtm - 1,
          zeroing: true,
          checkmate: false,
          stalemate: false,
          insufficient_material: false,
        },
      ],
    });
  }

  /**
   * Helper to set up a drawing position
   */
  public setupDrawingPosition(fen: string): void {
    this.positionCache.set(fen, {
      fen,
      category: 'draw',
      dtz: 0,
      dtm: 0,
      checkmate: false,
      stalemate: false,
      insufficient_material: false,
      moves: [],
    });
  }

  /**
   * Helper to set up a losing position
   */
  public setupLosingPosition(fen: string, dtm: number = -5): void {
    this.positionCache.set(fen, {
      fen,
      category: 'loss',
      dtz: dtm - 2,
      dtm,
      checkmate: false,
      stalemate: false,
      insufficient_material: false,
      moves: [
        {
          uci: 'a7a6',
          san: 'a6',
          category: 'loss',
          dtz: dtm + 1,
          dtm: dtm + 1,
          zeroing: false,
          checkmate: false,
          stalemate: false,
          insufficient_material: false,
        },
      ],
    });
  }

  /**
   * Helper to simulate network latency
   */
  public simulateLatency(ms: number): void {
    this.defaultDelay = ms;
  }

  /**
   * Helper to simulate service unavailability
   */
  public simulateOutage(message?: string): void {
    const mock = this.get();
    mock.queryPosition.mockRejectedValue(
      new Error(message || 'Service temporarily unavailable')
    );
    mock.isAvailable.mockResolvedValue(false);
  }
}