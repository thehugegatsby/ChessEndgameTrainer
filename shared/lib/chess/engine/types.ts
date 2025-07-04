/**
 * @fileoverview Engine Types and Interfaces
 * @version 1.0.0
 * @description Type definitions for chess engine operations
 * Optimized for mobile performance and Android compatibility
 */

import { Move as ChessJsMove } from 'chess.js';

/**
 * Base request interface for engine operations
 * Mobile-optimized with appropriate timeouts
 */
export interface BaseEngineRequest {
  id: string; // Unique request ID for tracking
  fen: string;
  timeLimit: number;
}

/**
 * Best move request (serializable)
 */
export interface BestMoveRequest extends BaseEngineRequest {
  type: 'bestmove';
}

/**
 * Evaluation request (serializable)
 */
export interface EvaluationRequest extends BaseEngineRequest {
  type: 'evaluation';
}

/**
 * Union of all possible engine requests
 */
export type EngineRequest = BestMoveRequest | EvaluationRequest;

/**
 * Best move response from worker
 */
export interface BestMoveResponse {
  id: string; // Must match request ID
  type: 'bestmove';
  move: ChessJsMove | null;
}

/**
 * Evaluation response from worker
 */
export interface EvaluationResponse {
  id: string; // Must match request ID
  type: 'evaluation';
  evaluation: EngineEvaluation;
}

/**
 * Error response from worker
 */
export interface ErrorResponse {
  id: string; // ID of failed request
  type: 'error';
  error: string; // Error message
}

/**
 * Union of all possible engine responses
 */
export type EngineResponse = BestMoveResponse | EvaluationResponse | ErrorResponse;

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