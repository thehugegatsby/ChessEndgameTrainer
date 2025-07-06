/**
 * Chess Evaluation System
 * 
 * This module provides high-performance chess position evaluation
 * with intelligent caching, request deduplication, and parallel
 * engine + tablebase lookup strategies.
 */

// Core evaluation system
export { UnifiedEvaluationService } from './unifiedService';

// Legacy components (used in tests)
export { EvaluationDeduplicator } from './EvaluationDeduplicator';
export { ChessAwareCache } from './ChessAwareCache';
export { ParallelEvaluationService } from './ParallelEvaluationService';
export { EvaluationNormalizer } from './normalizer';
export { PlayerPerspectiveTransformer } from './perspectiveTransformer';
export { EvaluationFormatter } from './formatter';
export { EvaluationPipelineFactory } from './pipelineFactory';
export { MoveQualityAnalyzer } from './moveQualityAnalyzer';
export * from './providers';