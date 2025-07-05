/**
 * Optimized Chess Evaluation System
 * 
 * This module provides high-performance chess position evaluation
 * with intelligent caching, request deduplication, and parallel
 * engine + tablebase lookup strategies.
 */

export { EvaluationDeduplicator } from './EvaluationDeduplicator';
export { ChessAwareCache } from './ChessAwareCache';
export { ParallelEvaluationService } from './ParallelEvaluationService';