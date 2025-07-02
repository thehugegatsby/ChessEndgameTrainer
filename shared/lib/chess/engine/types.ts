/**
 * @fileoverview Engine Types and Interfaces
 * @version 1.0.0
 * @description Type definitions for chess engine operations
 * Optimized for mobile performance and Android compatibility
 */

import type { Move } from '../../../types/chess';

/**
 * Request types for engine operations
 * Mobile-optimized with appropriate timeouts
 */
export interface EngineRequest {
  type: 'bestmove' | 'evaluation';
  fen: string;
  timeLimit: number;
  id: string; // Unique request ID for mobile debugging
}

/**
 * Best move request with mobile optimization
 */
export interface BestMoveRequest extends EngineRequest {
  type: 'bestmove';
  resolve: (move: Move | null) => void;
}

/**
 * Evaluation request with performance tracking
 */
export interface EvaluationRequest extends EngineRequest {
  type: 'evaluation';
  resolve: (result: EngineEvaluation) => void;
}

/**
 * Engine evaluation result
 * Standardized format for mobile display
 */
export interface EngineEvaluation {
  score: number;      // Centipawns
  mate: number | null; // Moves to mate (positive = winning, negative = losing)
  depth?: number;     // Search depth reached
  nodes?: number;     // Nodes searched (for performance monitoring)
  time?: number;      // Time spent (ms) - mobile performance tracking
}

/**
 * Worker message types for communication
 * Mobile-safe message passing
 */
export type WorkerMessage = 
  | 'uci'
  | 'readyok' 
  | 'uciok'
  | string; // Stockfish responses

/**
 * Engine configuration for mobile devices
 */
export interface EngineConfig {
  // Performance settings for mobile
  maxDepth: number;        // Maximum search depth
  maxTime: number;         // Maximum think time (ms)
  maxNodes: number;        // Maximum nodes to search
  useThreads: number;      // Number of threads (1 for mobile)
  
  // Memory settings for Android
  hashSize: number;        // Hash table size (MB)
  syzygyPath?: string;     // Tablebase path (if available)
  
  // Mobile optimization flags
  reduceStrength?: number; // Strength reduction for practice mode
  skillLevel?: number;     // Stockfish skill level (0-20)
  contempt?: number;       // Contempt factor
}

/**
 * Engine statistics for mobile debugging
 */
export interface EngineStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  isWorkerReady: boolean;
  lastError?: string;
  uptime: number; // Milliseconds since engine start
} 