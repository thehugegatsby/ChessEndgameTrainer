/**
 * @fileoverview Mock ScenarioEngine for E2E Tests - Registry-Based
 * @version 2.0.0
 * @description Lightning-fast mock engine using centralized TestPositions registry.
 * Implements the same API as ScenarioEngine for seamless test integration.
 * 
 * DESIGN GOALS:
 * - Zero latency: Instant responses for fast tests
 * - Deterministic: Same input always produces same output
 * - Registry-based: Uses central TestPositions as single source of truth
 * - API Compatible: Drop-in replacement for ScenarioEngine
 * - Error-first: Throws clear errors for unmapped positions
 */

import { Chess } from 'chess.js';
import type { 
  IScenarioEngine, 
  BestMovesResult 
} from './IScenarioEngine';
import type { 
  DualEvaluation, 
  EngineEvaluation, 
  TablebaseInfo 
} from './ScenarioEngine/types';
import { 
  TestPositions,
  TestPositionUtils,
  FenToScenarioMap,
  type TestScenario,
  type EngineMove
} from '@shared/testing/TestPositions';

/**
 * Mock response configuration
 */
interface MockResponse {
  fen: string;
  bestMove?: { from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n' };
  evaluation?: number;
  mate?: number;
  tablebaseResult?: { wdl: number; dtz?: number; dtm?: number };
  principalVariation?: string[];
}

/**
 * Mock ScenarioEngine - Registry-Based Implementation
 * Uses centralized TestPositions for all responses
 */
export class MockScenarioEngine implements IScenarioEngine {
  private chess: Chess;
  private initialFen: string;
  private moveHistory: Array<{ from: string; to: string; promotion?: string }> = [];
  private positionHistory: string[] = []; // Track FEN history for interactions
  private customResponses = new Map<string, MockResponse>(); // Custom response cache
  
  // Statistics tracking
  private stats = {
    instanceCount: 1,
    cacheSize: FenToScenarioMap.size,
    evaluationCount: 0,
    tablebaseHits: 0
  };

  constructor(fen?: string) {
    console.log(`[MockScenarioEngine] Registry-based constructor called with FEN: "${fen}"`);  
    this.initialFen = fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    this.chess = new Chess(this.initialFen);
    this.positionHistory.push(this.chess.fen());
    console.log(`[MockScenarioEngine] Initialized with ${FenToScenarioMap.size} real registry scenarios`);
    console.log(`[MockScenarioEngine] Available test scenarios:`, Object.keys(TestPositions));
    console.log(`[MockScenarioEngine] Position 1 FEN:`, TestPositions.POSITION_1_OPPOSITION_BASICS.fen);
  }

  // === Position Management ===

  getFen(): string {
    return this.chess.fen();
  }

  updatePosition(fen: string): void {
    console.log(`[MockScenarioEngine] updatePosition called with FEN: "${fen}"`);
    this.chess.load(fen);
  }

  reset(): void {
    this.chess.load(this.initialFen);
    this.moveHistory = [];
  }

  getChessInstance(): Chess {
    return this.chess;
  }

  // === Move Operations ===

  async makeMove(move: { 
    from: string; 
    to: string; 
    promotion?: 'q' | 'r' | 'b' | 'n' 
  }): Promise<any | null> {
    // Simulate brief processing
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const result = this.chess.move(move);
    if (result) {
      this.moveHistory.push(move);
      
      // Auto-response for training mode (mock behavior)
      const response = this.customResponses.get(this.chess.fen());
      if (response?.bestMove) {
        const engineMove = this.chess.move(response.bestMove);
        if (engineMove) {
          this.moveHistory.push(response.bestMove);
        }
      }
    }
    
    return result;
  }

  async getBestMove(fen: string): Promise<{ 
    from: string; 
    to: string; 
    promotion?: 'q' | 'r' | 'b' | 'n' 
  } | null> {
    console.log(`[MockScenarioEngine] getBestMove called with FEN: "${fen}"`);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const scenario = this.findScenarioForPosition(fen);
    if (!scenario) {
      throw new Error(`MockScenarioEngine: No test scenario found for FEN: ${fen}`);
    }
    
    // Check if we have interaction data for this position
    const move = this.findExpectedMoveForPosition(scenario, fen);
    return move;
  }

  // === Evaluation Methods ===

  async getDualEvaluation(fen: string): Promise<DualEvaluation> {
    await new Promise(resolve => setTimeout(resolve, 10));
    this.stats.evaluationCount++;
    
    console.log(`[MockScenarioEngine] getDualEvaluation called with FEN: "${fen}"`);    
    console.log(`[MockScenarioEngine] Available registry scenarios:`, Object.keys(TestPositions));
    
    const scenario = this.findScenarioForPosition(fen);
    if (!scenario) {
      throw new Error(`MockScenarioEngine: No test scenario found for FEN: ${fen}`);
    }
    
    console.log(`[MockScenarioEngine] Found scenario: ${scenario.id}`);
    
    return {
      engine: {
        score: scenario.initialExpectedEvaluation || 0,
        evaluation: this.formatEvaluation(scenario.initialExpectedEvaluation || 0, scenario.initialExpectedMate),
        mate: scenario.initialExpectedMate || null
      },
      tablebase: scenario.isTablebasePosition ? {
        isAvailable: true,
        result: {
          wdl: scenario.initialExpectedEvaluation && scenario.initialExpectedEvaluation > 100 ? 2 : 
               scenario.initialExpectedEvaluation && scenario.initialExpectedEvaluation < -100 ? -2 : 0,
          dtz: scenario.initialExpectedMate ? Math.abs(scenario.initialExpectedMate) : undefined,
          category: scenario.initialExpectedEvaluation && scenario.initialExpectedEvaluation > 100 ? 'win' : 
                   scenario.initialExpectedEvaluation && scenario.initialExpectedEvaluation < -100 ? 'loss' : 'draw',
          precise: true
        },
        evaluation: scenario.initialExpectedEvaluation && scenario.initialExpectedEvaluation > 100 ? 'Win' : 
                   scenario.initialExpectedEvaluation && scenario.initialExpectedEvaluation < -100 ? 'Loss' : 'Draw'
      } : {
        isAvailable: false
      }
    };
  }

  /**
   * Generate default response for unmapped positions
   * Implements fail-fast approach with descriptive errors
   */
  private generateDefaultResponse(fen: string): MockResponse {
    // First try to find in registry
    const scenario = this.findScenarioForPosition(fen);
    if (scenario) {
      return {
        fen,
        evaluation: scenario.initialExpectedEvaluation || 0,
        mate: scenario.initialExpectedMate
      };
    }
    
    // Fail fast with descriptive error
    throw new Error(
      `[MockScenarioEngine] No test scenario found for FEN: ${fen}\n` +
      `Available positions: ${Object.keys(TestPositions).join(', ')}\n` +
      `Please add this position to TestPositions.ts registry.`
    );
  }

  async getEvaluation(fen?: string): Promise<EngineEvaluation> {
    const targetFen = fen || this.chess.fen();
    console.log(`[MockScenarioEngine] getEvaluation called with FEN: "${targetFen}"`);
    await new Promise(resolve => setTimeout(resolve, 10));
    this.stats.evaluationCount++;
    
    const response = this.customResponses.get(targetFen) || this.generateDefaultResponse(targetFen);
    
    return {
      score: response.evaluation || 0,
      mate: response.mate || null
    };
  }

  async isCriticalMistake(fenBefore: string, fenAfter: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Simple mock logic: consider it a mistake if evaluation drops by more than 200 centipawns
    const evalBefore = (await this.getEvaluation(fenBefore)).score;
    const evalAfter = (await this.getEvaluation(fenAfter)).score;
    
    return (evalBefore - evalAfter) > 200;
  }

  // === Analysis Methods ===

  async getBestMoves(fen: string, count: number = 3): Promise<BestMovesResult> {
    await new Promise(resolve => setTimeout(resolve, 10));
    
    console.log(`[MockScenarioEngine] *** getBestMoves called with FEN: "${fen}" ***`);    
    console.log(`[MockScenarioEngine] Available registry scenarios:`, Object.keys(TestPositions));
    console.log(`[MockScenarioEngine] Comparing with Position 1 FEN: "${TestPositions.POSITION_1_OPPOSITION_BASICS.fen}"`);
    console.log(`[MockScenarioEngine] FEN exact match:`, fen === TestPositions.POSITION_1_OPPOSITION_BASICS.fen);
    
    const scenario = this.findScenarioForPosition(fen);
    if (!scenario) {
      console.error(`[MockScenarioEngine] ❌ No test scenario found for FEN: ${fen}`);
      throw new Error(`MockScenarioEngine: No test scenario found for FEN: ${fen}`);
    }
    
    console.log(`[MockScenarioEngine] ✅ Found scenario: ${scenario.id}`);
    
    // Generate mock best moves from scenario
    const engineMoves = [];
    const move = this.findExpectedMoveForPosition(scenario, fen);
    if (move) {
      const moveStr = `${move.from}${move.to}${move.promotion || ''}`;
      console.log(`[MockScenarioEngine] ✅ Returning engine move: ${moveStr}`);
      engineMoves.push({
        move: moveStr,
        evaluation: scenario.initialExpectedEvaluation || 0,
        mate: scenario.initialExpectedMate
      });
    } else {
      console.error(`[MockScenarioEngine] ❌ No move found for scenario ${scenario.id}`);
    }
    
    // Add alternative moves for testing variety (simplified)
    for (let i = 1; i < count && i < 3; i++) {
      const altMove = `${move?.from || 'e2'}${move?.to || 'e4'}`;
      engineMoves.push({
        move: altMove,
        evaluation: (scenario.initialExpectedEvaluation || 0) - (i * 20),
        mate: undefined
      });
    }
    
    const tablebaseMoves = [];
    if (scenario.isTablebasePosition && move) {
      this.stats.tablebaseHits++;
      const moveStr = `${move.from}${move.to}${move.promotion || ''}`;
      const wdl = scenario.initialExpectedEvaluation && scenario.initialExpectedEvaluation > 100 ? 2 : 
                  scenario.initialExpectedEvaluation && scenario.initialExpectedEvaluation < -100 ? -2 : 0;
      tablebaseMoves.push({
        move: moveStr,
        wdl: wdl,
        dtm: scenario.initialExpectedMate,
        evaluation: wdl > 0 ? 'Win' : wdl < 0 ? 'Loss' : 'Draw'
      });
    }
    
    console.log(`[MockScenarioEngine] ✅ Returning moves: engine=${engineMoves.length}, tablebase=${tablebaseMoves.length}`);
    return { engine: engineMoves, tablebase: tablebaseMoves };
  }

  async getTablebaseInfo(fen: string): Promise<TablebaseInfo> {
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const response = this.customResponses.get(fen);
    if (response?.tablebaseResult) {
      this.stats.tablebaseHits++;
      return {
        isTablebasePosition: true,
        result: {
          wdl: response.tablebaseResult.wdl,
          dtz: response.tablebaseResult.dtz || null,
          category: response.tablebaseResult.wdl > 0 ? 'win' : 
                   response.tablebaseResult.wdl < 0 ? 'loss' : 'draw',
          precise: true
        }
      };
    }
    
    return { isTablebasePosition: false };
  }

  // === Lifecycle & Stats ===

  getStats(): { 
    instanceCount: number;
    cacheSize: number;
    evaluationCount: number;
    tablebaseHits: number;
  } {
    return { ...this.stats, cacheSize: this.customResponses.size };
  }

  quit(): void {
    // Clean up
    this.customResponses.clear();
    this.moveHistory = [];
    this.stats.evaluationCount = 0;
    this.stats.tablebaseHits = 0;
  }

  // === TEST UTILITIES ===

  /**
   * Add custom response for specific position
   */
  addCustomResponse(response: MockResponse): void {
    this.customResponses.set(response.fen, response);
    this.stats.cacheSize = this.customResponses.size;
  }

  /**
   * Clear all custom responses
   */
  clearCustomResponses(): void {
    this.customResponses.clear();
  }

  /**
   * Set next move for a position (E2E Test Bridge compatibility)
   */
  setNextMove(fen: string, move: string): void {
    // Parse algebraic notation to from/to format
    const from = move.substring(0, 2);
    const to = move.substring(2, 4);
    const promotion = move.length > 4 ? move[4] as 'q' | 'r' | 'b' | 'n' : undefined;
    
    const existing = this.customResponses.get(fen) || { fen };
    existing.bestMove = { from, to, promotion };
    this.customResponses.set(fen, existing);
  }

  /**
   * Set evaluation for a position (E2E Test Bridge compatibility)
   */
  setEvaluation(fen: string, evaluation: number): void {
    const existing = this.customResponses.get(fen) || { fen };
    existing.evaluation = evaluation;
    this.customResponses.set(fen, existing);
  }

  // === PRIVATE METHODS ===

  /**
   * Find test scenario for a given FEN position
   */
  private findScenarioForPosition(fen: string): TestScenario | null {
    const normalizedFen = TestPositionUtils.normalizeFen(fen);
    
    // Direct lookup first
    let scenario = TestPositionUtils.getScenarioByFen(normalizedFen);
    if (scenario) {
      return scenario;
    }
    
    // Try without normalization
    scenario = TestPositionUtils.getScenarioByFen(fen);
    if (scenario) {
      return scenario;
    }
    
    // Look for partial matches (position + side to move only)
    const fenParts = fen.split(' ');
    if (fenParts.length >= 2) {
      const positionOnly = `${fenParts[0]} ${fenParts[1]}`;
      for (const scenario of Object.values(TestPositions)) {
        const scenarioParts = scenario.fen.split(' ');
        if (scenarioParts.length >= 2) {
          const scenarioPositionOnly = `${scenarioParts[0]} ${scenarioParts[1]}`;
          if (positionOnly === scenarioPositionOnly) {
            return scenario;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Find expected move for a position based on scenario interactions
   */
  private findExpectedMoveForPosition(scenario: TestScenario, fen: string): EngineMove | null {
    // First check if this is the initial position
    if (this.positionsMatch(fen, scenario.fen)) {
      return scenario.initialExpectedMove;
    }
    
    // Check interactions for matching positions
    if (scenario.interactions) {
      for (const interaction of scenario.interactions) {
        // This is simplified - in a full implementation, we'd track the game state
        // For now, just return the first interaction's response
        return interaction.expectedEngineResponse;
      }
    }
    
    return scenario.initialExpectedMove; // Fallback
  }

  /**
   * Check if two FEN positions match (allowing for move counter differences)
   */
  private positionsMatch(fen1: string, fen2: string): boolean {
    const normalized1 = TestPositionUtils.normalizeFen(fen1);
    const normalized2 = TestPositionUtils.normalizeFen(fen2);
    return normalized1 === normalized2;
  }

  /**
   * Format evaluation for display
   */
  private formatEvaluation(score: number, mate?: number): string {
    if (mate) {
      return `M${Math.abs(mate)}`;
    }
    const formatted = (score / 100).toFixed(1);
    return score >= 0 ? `+${formatted}` : formatted;
  }
}