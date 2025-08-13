/**
 * TablebaseService Mock Factory
 * 
 * Creates mocks for the Lichess Tablebase API service.
 * Provides realistic tablebase responses for testing.
 */

// @ts-nocheck - Test infrastructure with complex mock typing

import { jest } from '@jest/globals';
import { BaseMockFactory } from './BaseMockFactory';
import type { TablebaseService } from '@shared/services/TablebaseService';
import type { TablebaseEvaluation, TablebaseMovesResult } from '@shared/services/TablebaseService';

type MockedTablebaseService = any<TablebaseService>;

export interface TablebaseServiceMockOverrides {
  // Response data
  defaultEvaluation?: Partial<TablebaseEvaluation>;
  positionResults?: Map<string, TablebaseEvaluation>;
  
  // Behavior flags
  shouldFail?: boolean;
  failureMessage?: string;
  responseDelay?: number;
  
  // Method overrides
  methods?: Partial<MockedTablebaseService>;
}

export class TablebaseServiceMockFactory extends BaseMockFactory<TablebaseService, TablebaseServiceMockOverrides> {
  private positionCache = new Map<string, TablebaseEvaluation>();
  private defaultDelay = 0;

  protected _createDefaultMock(): MockedTablebaseService {
    const mock: MockedTablebaseService = {
      // Main evaluation method
      getEvaluation: vi.fn().mockImplementation(async (fen: string): Promise<TablebaseEvaluation> => {
        // Simulate network delay if configured
        if (this.defaultDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.defaultDelay));
        }

        // Check cache first
        if (this.positionCache.has(fen)) {
          return this.positionCache.get(fen)!;
        }

        // Return default evaluation
        const evaluation = this._createDefaultEvaluation(fen);
        this.positionCache.set(fen, evaluation);
        return evaluation;
      }),

      // Top moves method  
      getTopMoves: vi.fn().mockImplementation(async (fen: string, limit = 5): Promise<TablebaseMovesResult> => {
        const evaluation = await (mock as any).getEvaluation(fen);
        
        if (!evaluation.isAvailable || !evaluation.result) {
          return { moves: [], isAvailable: false };
        }

        // Mock some moves
        const moves = [
          { san: 'Kg7', uci: 'g6g7', wdl: 2, dtm: 15, dtz: 17, category: 'win' as const },
          { san: 'Kh7', uci: 'g6h7', wdl: 0, dtm: 0, dtz: 0, category: 'draw' as const },
          { san: 'Kf7', uci: 'g6f7', wdl: -1, dtm: -20, dtz: -18, category: 'loss' as const }
        ].slice(0, Math.max(0, limit || 5));

        return { moves, isAvailable: true };
      }),

      // Cache management
      clearCache: vi.fn().mockImplementation(() => {
        this.positionCache.clear();
      }),

      // Metrics
      getMetrics: vi.fn().mockImplementation(() => ({
        cacheHits: 0,
        cacheMisses: 0,
        totalRequests: 0,
        errorBreakdown: {}
      }))
    } as unknown as any<TablebaseService>;

    return mock;
  }

  /**
   * Create a default tablebase evaluation for testing
   */
  private _createDefaultEvaluation(fen: string): TablebaseEvaluation {
    return {
      isAvailable: true,
      result: {
        category: 'win',
        wdl: 2,
        dtm: 15,
        dtz: 10,
        precise: true,
        evaluation: "2"
      }
    };
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
      merged.getEvaluation.mockRejectedValue(
        new Error(overrides.failureMessage || 'Tablebase service unavailable')
      );
    }

    // Apply position-specific results
    if (overrides.positionResults) {
      this.positionCache = new Map(overrides.positionResults);
    }

    // Apply default evaluation override
    if (overrides.defaultEvaluation) {
      const defaultEvaluation = overrides.defaultEvaluation;
      merged.getEvaluation.mockImplementation(async (fen: string) => {
        if (this.defaultDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.defaultDelay));
        }
        
        if (this.positionCache.has(fen)) {
          return this.positionCache.get(fen)!;
        }
        
        return { ...this._createDefaultEvaluation(fen), ...defaultEvaluation };
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
   * Helper to set up a winning position
   */
  public setupWinningPosition(fen: string, dtm: number = 5): void {
    if (!fen || typeof fen !== 'string') {
      throw new Error('[TablebaseServiceMockFactory] Invalid FEN string provided');
    }
    this.positionCache.set(fen, {
      isAvailable: true,
      result: {
        category: 'win',
        wdl: 2,
        dtm,
        dtz: dtm + 2,
        precise: true,
        evaluation: "2"
      }
    });
  }

  /**
   * Helper to set up a drawing position
   */
  public setupDrawingPosition(fen: string): void {
    if (!fen || typeof fen !== 'string') {
      throw new Error('[TablebaseServiceMockFactory] Invalid FEN string provided');
    }
    this.positionCache.set(fen, {
      isAvailable: true,
      result: {
        category: 'draw',
        wdl: 0,
        dtm: 0,
        dtz: 0,
        precise: true,
        evaluation: "0"
      }
    });
  }

  /**
   * Helper to set up a losing position
   */
  public setupLosingPosition(fen: string, dtm: number = -5): void {
    if (!fen || typeof fen !== 'string') {
      throw new Error('[TablebaseServiceMockFactory] Invalid FEN string provided');
    }
    this.positionCache.set(fen, {
      isAvailable: true,
      result: {
        category: 'loss',
        wdl: -2,
        dtm,
        dtz: dtm - 2,
        precise: true,
        evaluation: "-2"
      }
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
    if (!this.mockInstance) {
      throw new Error('[TablebaseServiceMockFactory] Mock not initialized. Call create() first.');
    }
    const mock = this.mockInstance as any<TablebaseService>;
    const errorMessage = message || 'Service temporarily unavailable';
    
    mock.getEvaluation.mockRejectedValue(new Error(errorMessage));
    mock.getTopMoves.mockRejectedValue(new Error(errorMessage));
  }
}