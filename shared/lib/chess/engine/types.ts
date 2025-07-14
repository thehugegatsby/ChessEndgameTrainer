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
export type EngineRequest = BestMoveRequest | EvaluationRequest | MultiPvRequest;

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
export type EngineResponse = BestMoveResponse | EvaluationResponse | MultiPvResponse | ErrorResponse;

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
 * Enhanced engine evaluation with Principal Variation
 * PHASE 2: Extended evaluation data for UI display
 */
export interface EnhancedEngineEvaluation extends EngineEvaluation {
  // Principal Variation data (Phase 2 enhancement)
  pv?: string[];        // Best line of play as move array
  pvString?: string;    // Raw PV string for debugging
  
  // Enhanced UCI data
  nps?: number;         // Nodes per second
  hashfull?: number;    // Hash table utilization (0-1000)
  seldepth?: number;    // Selective search depth
  multipv?: number;     // Multi-PV line number
  currmove?: string;    // Current move being searched
  currmovenumber?: number; // Current move number in search
}

/**
 * Multi-PV evaluation result for Top-3 moves display
 * PHASE 3: Multi-PV support for Lichess-style Top-3 moves
 */
export interface MultiPvResult {
  move: string;         // UCI move notation (e.g., "e2e4")
  san: string;          // Standard algebraic notation (e.g., "e4")
  score: {
    type: 'cp' | 'mate';
    value: number;      // Centipawns or mate in N moves
  };
  pv: string[];         // Principal variation for this line
  rank: number;         // Multi-PV rank (1 = best, 2 = second best, etc.)
  depth?: number;       // Search depth for this line
}

/**
 * Multi-PV evaluation request (serializable)
 */
export interface MultiPvRequest extends BaseEngineRequest {
  type: 'multipv';
  lines: number;        // Number of lines to calculate (typically 3 for Top-3)
}

/**
 * Multi-PV evaluation response from worker
 */
export interface MultiPvResponse {
  id: string;           // Must match request ID
  type: 'multipv';
  results: MultiPvResult[];
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