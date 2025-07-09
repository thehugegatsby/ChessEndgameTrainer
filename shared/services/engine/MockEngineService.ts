/**
 * @fileoverview Mock Engine Service for Tests
 * @version 1.0.0
 * @description Lightning-fast mock engine for deterministic E2E tests.
 * Provides instant responses without actual chess analysis.
 * 
 * DESIGN GOALS:
 * - Zero latency: Instant responses for fast tests
 * - Deterministic: Same input always produces same output  
 * - Configurable: Tests can define custom responses
 * - Realistic: Mimics real engine behavior patterns
 */

import type { IEngineService, EngineAnalysis, EngineConfig } from './IEngineService';
import type { EngineStatus } from '../../store/types';

/**
 * Mock Engine Service
 * Provides instant, deterministic responses for testing
 */
export class MockEngineService implements IEngineService {
  private status: EngineStatus = 'idle';
  private statusCallbacks: ((status: EngineStatus) => void)[] = [];
  private customResponses = new Map<string, EngineAnalysis>();
  private isInitialized = false;

  constructor() {
    this.setupDefaultResponses();
  }

  /**
   * Initialize mock engine (instant)
   */
  async initialize(): Promise<void> {
    this.setStatus('initializing');
    
    // Simulate very brief initialization
    await new Promise(resolve => setTimeout(resolve, 1));
    
    this.setStatus('ready');
    this.isInitialized = true;
  }

  /**
   * Analyze position with instant mock response
   */
  async analyzePosition(fen: string, config?: EngineConfig): Promise<EngineAnalysis> {
    if (!this.isInitialized) {
      throw new Error('Mock engine not initialized');
    }

    this.setStatus('analyzing');
    
    // Simulate very brief analysis time
    await new Promise(resolve => setTimeout(resolve, config?.timeLimit || 10));
    
    // Get predefined response or generate default
    const analysis = this.customResponses.get(fen) || this.generateDefaultAnalysis(fen);
    
    this.setStatus('ready');
    return analysis;
  }

  /**
   * Get current engine status
   */
  getStatus(): EngineStatus {
    return this.status;
  }

  /**
   * Stop analysis (instant for mock)
   */
  stopAnalysis(): void {
    if (this.status === 'analyzing') {
      this.setStatus('ready');
    }
  }

  /**
   * Check if analyzing
   */
  isAnalyzing(): boolean {
    return this.status === 'analyzing';
  }

  /**
   * Shutdown mock engine
   */
  async shutdown(): Promise<void> {
    this.setStatus('idle');
    this.statusCallbacks.length = 0;
    this.customResponses.clear();
    this.isInitialized = false;
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (status: EngineStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index !== -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * TEST UTILITIES
   * Methods for configuring mock behavior in tests
   */

  /**
   * Add custom response for specific position
   */
  addCustomResponse(fen: string, analysis: EngineAnalysis): void {
    this.customResponses.set(fen, analysis);
  }

  /**
   * Add multiple custom responses
   */
  addCustomResponses(responses: Record<string, EngineAnalysis>): void {
    Object.entries(responses).forEach(([fen, analysis]) => {
      this.customResponses.set(fen, analysis);
    });
  }

  /**
   * Clear all custom responses
   */
  clearCustomResponses(): void {
    this.customResponses.clear();
    this.setupDefaultResponses();
  }

  /**
   * Simulate engine error for testing error handling
   */
  simulateError(fen: string, errorMessage: string): void {
    this.customResponses.set(fen, {
      evaluation: 0,
      depth: 0,
      timeMs: 0,
      bestMove: undefined
    });
  }

  /**
   * Sets only the best move for a given FEN, preserving or creating other analysis details.
   * Used by E2E Test Bridge for precise move control.
   */
  setNextMove(fen: string, move: string): void {
    const existingAnalysis = this.customResponses.get(fen) || this.generateDefaultAnalysis(fen);
    this.addCustomResponse(fen, {
      ...existingAnalysis,
      bestMove: move,
    });
  }

  /**
   * Sets only the evaluation for a given FEN, preserving or creating other analysis details.
   * Used by E2E Test Bridge for precise evaluation control.
   */
  setEvaluation(fen: string, evaluation: number): void {
    const existingAnalysis = this.customResponses.get(fen) || this.generateDefaultAnalysis(fen);
    this.addCustomResponse(fen, {
      ...existingAnalysis,
      evaluation: evaluation,
    });
  }

  /**
   * PRIVATE METHODS
   */

  /**
   * Setup default responses for common positions
   */
  private setupDefaultResponses(): void {
    // Opposition training position 1 - Initial position
    this.customResponses.set('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', {
      evaluation: 80,  // +0.80 pawns
      bestMove: 'Kd6',
      depth: 20,
      timeMs: 50,
      principalVariation: ['Kd6', 'Kd8', 'e6', 'Ke8']
    });
    
    // After 1.Kd6
    this.customResponses.set('4k3/8/3K4/4P3/8/8/8/8 b - - 1 1', {
      evaluation: -80,  // -0.80 pawns (from black's perspective)
      bestMove: 'Kd8',
      depth: 20,
      timeMs: 45,
      principalVariation: ['Kd8', 'e6', 'Ke8', 'Ke6']
    });
    
    // After 1.Kd6 Kd8 2.Ke6
    this.customResponses.set('3k4/8/4K3/4P3/8/8/8/8 b - - 3 2', {
      evaluation: -90,  // -0.90 pawns
      bestMove: 'Ke8',
      depth: 22,
      timeMs: 40,
      principalVariation: ['Ke8', 'Kd6', 'Kd8', 'e6+']
    });
    
    // Losing line: After 1.Kd5 (bad move)
    this.customResponses.set('4k3/8/8/3K4/4P3/8/8/8 b - - 1 1', {
      evaluation: -150,  // -1.50 pawns (significant disadvantage)
      bestMove: 'Kd7',
      depth: 18,
      timeMs: 35,
      principalVariation: ['Kd7', 'Kc5', 'Ke7', 'Kc6']
    });
  }

  /**
   * Generate a reasonable default analysis for unknown positions
   */
  private generateDefaultAnalysis(fen: string): EngineAnalysis {
    // Simple heuristic based on FEN to make responses somewhat realistic
    const hash = this.hashFen(fen);
    const evaluation = (hash % 200) - 100; // Random-ish evaluation between -1.00 and +1.00
    
    const defaultMoves = ['Ke2', 'Kf3', 'Kg2', 'Kh3', 'e4', 'e5', 'e6', 'd4', 'd5', 'd6'];
    const bestMove = defaultMoves[hash % defaultMoves.length];
    
    return {
      evaluation,
      bestMove,
      depth: 15,
      timeMs: 30,
      principalVariation: [bestMove]
    };
  }

  /**
   * Simple hash function for FEN strings
   */
  private hashFen(fen: string): number {
    let hash = 0;
    for (let i = 0; i < fen.length; i++) {
      const char = fen.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Update status and notify callbacks
   */
  private setStatus(newStatus: EngineStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusCallbacks.forEach(callback => callback(newStatus));
    }
  }
}