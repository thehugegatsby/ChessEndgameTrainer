/**
 * @fileoverview Engine Service Interface - Clean Dependency Injection
 * @version 1.0.0
 * @description Defines the contract for all engine implementations.
 * Enables clean separation between production and test engines.
 * 
 * ARCHITECTURE PRINCIPLES:
 * - Dependency Inversion: High-level modules don't depend on low-level modules
 * - Interface Segregation: Clean, focused contract  
 * - Testability: Mock implementations for deterministic tests
 * - Single Responsibility: Engine concerns separated from UI/Store
 */

import type { EngineStatus } from '../../store/types';

/**
 * Engine analysis result
 */
export interface EngineAnalysis {
  evaluation: number;           // Centipawn evaluation (-200 = -2.00, +150 = +1.50)
  bestMove?: string;           // Best move in SAN notation (e.g., "Nf3", "O-O")
  depth: number;               // Search depth reached
  timeMs: number;              // Time spent analyzing (milliseconds)
  isTablebasePosition?: boolean; // Whether this is a tablebase position
  mateIn?: number;             // Mate in X moves (if applicable)
  principalVariation?: string[]; // Best line of play
}

/**
 * Engine configuration for analysis
 */
export interface EngineConfig {
  depth?: number;              // Maximum search depth (default: 20)
  timeLimit?: number;          // Time limit in milliseconds (default: 1000)
  multiPV?: number;            // Number of variations to analyze (default: 1)
  threads?: number;            // Number of threads to use (default: 1)
}

/**
 * Engine Service Interface
 * 
 * This interface defines how the application interacts with chess engines.
 * Production uses Stockfish, tests use a lightweight mock.
 */
export interface IEngineService {
  /**
   * Initialize the engine
   * @returns Promise that resolves when engine is ready
   */
  initialize(): Promise<void>;

  /**
   * Analyze a chess position
   * @param fen - FEN string of the position to analyze
   * @param config - Optional analysis configuration
   * @returns Promise with analysis result
   */
  analyzePosition(fen: string, config?: EngineConfig): Promise<EngineAnalysis>;

  /**
   * Get current engine status
   */
  getStatus(): EngineStatus;

  /**
   * Stop current analysis (if running)
   */
  stopAnalysis(): void;

  /**
   * Check if the engine is currently analyzing
   */
  isAnalyzing(): boolean;

  /**
   * Cleanup and shutdown the engine
   */
  shutdown(): Promise<void>;

  /**
   * Subscribe to engine status changes
   * @param callback - Function called when status changes
   * @returns Unsubscribe function
   */
  onStatusChange(callback: (status: EngineStatus) => void): () => void;
}

/**
 * Engine Service Factory
 * Creates the appropriate engine service based on environment
 */
export interface IEngineServiceFactory {
  createEngineService(): IEngineService;
}

/**
 * Dependency Injection Key for Engine Service
 * Use this symbol to inject/provide the engine service
 */
export const ENGINE_SERVICE_KEY = Symbol('EngineService');