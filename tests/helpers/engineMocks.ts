/**
 * @fileoverview Mock implementations for Engine and related services
 * @description Provides deterministic mock behavior for unit testing
 */

import type { EngineEvaluation, DualEvaluation, TablebaseInfo } from '../../shared/lib/chess/ScenarioEngine/types';
import { TEST_POSITIONS } from './testPositions';

/**
 * Mock Engine implementation with controlled responses
 */
export class MockEngine {
  private static instance: MockEngine;
  private isInitialized = true;
  private evaluationDelay = 0;
  private shouldFail = false;
  
  // Track method calls for verification
  public calls = {
    evaluatePosition: [] as string[],
    getBestMove: [] as string[],
    getMultiPV: [] as string[]
  };

  static getInstance(): MockEngine {
    if (!MockEngine.instance) {
      MockEngine.instance = new MockEngine();
    }
    return MockEngine.instance;
  }

  static resetInstance(): void {
    MockEngine.instance = new MockEngine();
  }

  // Configuration methods for tests
  setEvaluationDelay(ms: number): void {
    this.evaluationDelay = ms;
  }

  setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  setInitialized(initialized: boolean): void {
    this.isInitialized = initialized;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async evaluatePosition(fen: string): Promise<EngineEvaluation> {
    this.calls.evaluatePosition.push(fen);
    
    if (this.shouldFail) {
      throw new Error('Mock engine evaluation failed');
    }

    if (this.evaluationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.evaluationDelay));
    }

    return this.getMockEvaluation(fen);
  }

  async getBestMove(fen: string, timeMs?: number): Promise<{ from: string; to: string; promotion?: string } | null> {
    this.calls.getBestMove.push(fen);
    
    if (this.shouldFail) {
      return null;
    }

    if (this.evaluationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.evaluationDelay));
    }

    return this.getMockBestMove(fen);
  }

  async getMultiPV(fen: string, count: number): Promise<Array<{ move: string; score: number; mate?: number }>> {
    this.calls.getMultiPV.push(fen);
    
    if (this.shouldFail) {
      return [];
    }

    const bestMove = this.getMockBestMove(fen);
    const evaluation = this.getMockEvaluation(fen);
    
    if (!bestMove) return [];

    const moveUci = `${bestMove.from}${bestMove.to}${bestMove.promotion || ''}`;
    
    return Array.from({ length: Math.min(count, 3) }, (_, i) => ({
      move: moveUci,
      score: evaluation.score - (i * 20), // Slightly worse for subsequent moves
      mate: evaluation.mate === null ? undefined : evaluation.mate
    }));
  }

  // Helper methods for mock responses
  private getMockEvaluation(fen: string): EngineEvaluation {
    // Return deterministic evaluations based on position
    switch (fen) {
      case TEST_POSITIONS.STARTING_POSITION:
        return { score: 15, mate: null }; // Slight advantage to first move
      
      case TEST_POSITIONS.KQK_TABLEBASE_WIN:
        return { score: 0, mate: 3 }; // Mate in 3
      
      case TEST_POSITIONS.WHITE_ADVANTAGE:
        return { score: 150, mate: null }; // 1.5 pawn advantage
      
      case TEST_POSITIONS.BLACK_ADVANTAGE:
        return { score: -120, mate: null }; // Black has advantage
      
      case TEST_POSITIONS.EQUAL_POSITION:
        return { score: 5, mate: null }; // Roughly equal
      
      default:
        return { score: 0, mate: null }; // Default neutral evaluation
    }
  }

  private getMockBestMove(fen: string): { from: string; to: string; promotion?: string } | null {
    // Return common opening moves for starting position
    if (fen === TEST_POSITIONS.STARTING_POSITION) {
      return { from: 'e2', to: 'e4' };
    }
    
    // For tablebase positions, return a winning move
    if (fen === TEST_POSITIONS.KQK_TABLEBASE_WIN) {
      return { from: 'h1', to: 'h8' }; // Check with queen
    }
    
    // Default move
    return { from: 'e2', to: 'e4' };
  }

  // Reset call tracking
  resetCalls(): void {
    this.calls = {
      evaluatePosition: [],
      getBestMove: [],
      getMultiPV: []
    };
  }
}

/**
 * Mock Tablebase Service
 */
export class MockTablebaseService {
  private shouldFail = false;
  private delay = 0;
  
  // Track method calls
  public calls = {
    queryPosition: [] as string[],
    getTablebaseInfo: [] as string[]
  };

  setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  setDelay(ms: number): void {
    this.delay = ms;
  }

  async queryPosition(fen: string): Promise<any> {
    this.calls.queryPosition.push(fen);
    
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }
    
    if (this.shouldFail) {
      throw new Error('Mock tablebase query failed');
    }

    return this.getMockTablebaseResult(fen);
  }

  async getTablebaseInfo(fen: string): Promise<TablebaseInfo> {
    this.calls.getTablebaseInfo.push(fen);
    
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }
    
    if (this.shouldFail) {
      return {
        isTablebasePosition: false,
        error: 'Mock tablebase error'
      };
    }

    return this.getMockTablebaseInfo(fen);
  }

  private getMockTablebaseResult(fen: string): any {
    if (this.isTablebasePosition(fen)) {
      return {
        isTablebasePosition: true,
        result: {
          wdl: 2, // Win for White
          dtz: 5, // Distance to zero (50-move rule)
          category: 'win',
          precise: true
        }
      };
    }
    
    return {
      isTablebasePosition: false
    };
  }

  private getMockTablebaseInfo(fen: string): TablebaseInfo {
    if (this.isTablebasePosition(fen)) {
      return {
        isTablebasePosition: true,
        result: {
          wdl: 2,
          dtz: 5,
          category: 'win',
          precise: true
        },
        bestMoves: [
          { move: 'Qh8#', evaluation: 'Win' }
        ]
      };
    }
    
    return {
      isTablebasePosition: false,
      error: 'Position not in tablebase'
    };
  }

  private isTablebasePosition(fen: string): boolean {
    // Mock tablebase positions are those with ≤7 pieces
    const pieces = (fen.split(' ')[0].match(/[pnbrqkPNBRQK]/g) || []).length;
    return pieces <= 7;
  }

  isTablebasePositionSync(fen: string): boolean {
    return this.isTablebasePosition(fen);
  }

  clearCache(): void {
    // Mock implementation - no actual cache to clear
  }

  getCacheStats(): { size: number; maxSize: number } {
    return { size: 5, maxSize: 100 }; // Mock cache stats
  }

  resetCalls(): void {
    this.calls = {
      queryPosition: [],
      getTablebaseInfo: []
    };
  }
}

/**
 * Mock factory functions for Jest
 */
export const createMockEngine = (): jest.Mocked<any> => {
  const mockEngine = new MockEngine();
  return {
    evaluatePosition: jest.fn().mockImplementation((fen: string) => mockEngine.evaluatePosition(fen)),
    getBestMove: jest.fn().mockImplementation((fen: string, timeMs?: number) => mockEngine.getBestMove(fen, timeMs)),
    getMultiPV: jest.fn().mockImplementation((fen: string, count: number) => mockEngine.getMultiPV(fen, count)),
    isReady: jest.fn().mockReturnValue(true),
    getInstance: jest.fn().mockReturnValue(mockEngine),
    terminate: jest.fn().mockResolvedValue(undefined)
  };
};

export const createMockTablebaseService = (): jest.Mocked<any> => {
  const mockService = new MockTablebaseService();
  return {
    queryPosition: jest.fn().mockImplementation((fen: string) => mockService.queryPosition(fen)),
    getTablebaseInfo: jest.fn().mockImplementation((fen: string) => mockService.getTablebaseInfo(fen)),
    clearCache: jest.fn(),
    getCacheStats: jest.fn().mockReturnValue({ size: 5, maxSize: 100 })
  };
};

/**
 * Setup function for common test mocks
 */
export const setupEngineMocks = () => {
  const mockEngine = createMockEngine();
  const mockTablebaseService = createMockTablebaseService();
  
  // Mock the Engine.getInstance() static method
  jest.doMock('../../shared/lib/chess/engine', () => ({
    Engine: {
      getInstance: jest.fn().mockReturnValue(mockEngine)
    }
  }));
  
  // Mock the tablebase service
  jest.doMock('../../shared/lib/chess/tablebase', () => ({
    tablebaseService: mockTablebaseService
  }));
  
  return { mockEngine, mockTablebaseService };
};