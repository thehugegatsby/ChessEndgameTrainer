/**
 * @fileoverview UCI Protocol Parser
 * @version 1.0.0
 * @description Dedicated UCI message parsing module for enhanced Stockfish integration
 * 
 * PHASE 1.1 IMPLEMENTATION:
 * - Isolates complex UCI parsing logic for independent testing
 * - Adheres to Single Responsibility Principle from Clean Architecture
 * - Provides structured parsing of Stockfish evaluation data
 * - Handles edge cases and malformed input gracefully
 */

import { getLogger } from '../../../services/logging';

const logger = getLogger();

/**
 * Enhanced UCI evaluation result with comprehensive parsing
 * Extends basic EngineEvaluation with detailed UCI protocol data
 */
export interface UCIEvaluation {
  // Core evaluation (compatible with existing EngineEvaluation)
  score: number;        // Centipawns from Stockfish
  mate: number | null;  // Moves to mate (positive = winning, negative = losing)
  
  // Enhanced UCI data
  depth?: number;       // Search depth reached
  nodes?: number;       // Nodes searched
  time?: number;        // Time spent (ms)
  nps?: number;         // Nodes per second
  hashfull?: number;    // Hash table utilization (0-1000)
  
  // Principal Variation (key enhancement for Phase 2)
  pv?: string[];        // Best line of play as move array
  pvString?: string;    // Raw PV string for debugging
  
  // Multi-PV support (future enhancement)
  multipv?: number;     // Multi-PV line number
  
  // Selective depth and search info
  seldepth?: number;    // Selective search depth
  currmove?: string;    // Current move being searched
  currmovenumber?: number; // Current move number in search
}

/**
 * UCI parsing result with error handling
 */
export interface UCIParseResult {
  evaluation: UCIEvaluation | null;
  isValid: boolean;
  errors: string[];
  rawLine: string;
}

/**
 * Regular expression patterns for UCI protocol parsing
 * Comprehensive patterns to handle all Stockfish output variations
 */
const UCI_PATTERNS = {
  // Score patterns
  SCORE_CP: /score cp (-?\d+)/,
  SCORE_MATE: /score mate (-?\d+)/,
  
  // Search depth patterns
  DEPTH: /depth (\d+)/,
  SELDEPTH: /seldepth (\d+)/,
  
  // Performance metrics
  NODES: /nodes (\d+)/,
  TIME: /time (\d+)/,
  NPS: /nps (\d+)/,
  HASHFULL: /hashfull (\d+)/,
  
  // Principal Variation - proper UCI move format
  PV: /pv\s+((?:[a-h][1-8][a-h][1-8][qrbn]?\s*)+)(?:\s|$)/,
  
  // Multi-PV support
  MULTIPV: /multipv (\d+)/,
  
  // Current search info
  CURRMOVE: /currmove ([a-h][1-8][a-h][1-8][qrbn]?)/,
  CURRMOVENUMBER: /currmovenumber (\d+)/,
} as const;

/**
 * Parse UCI info line into structured evaluation data
 * 
 * EXPERT RECOMMENDATION: Isolate parsing complexity for independent testing
 * 
 * @param line - Raw UCI info line from Stockfish
 * @returns Parsed UCI evaluation or null if not an evaluation line
 * 
 * @example
 * ```typescript
 * const result = parseInfo("info depth 20 score cp 150 nodes 1000000 pv e2e4 e7e5");
 * if (result.isValid && result.evaluation) {
 *   console.log(`Score: ${result.evaluation.score}cp, Depth: ${result.evaluation.depth}`);
 * }
 * ```
 */
export function parseInfo(line: string): UCIParseResult {
  const trimmed = line.trim();
  
  // Initialize result structure
  const result: UCIParseResult = {
    evaluation: null,
    isValid: false,
    errors: [],
    rawLine: trimmed
  };
  
  // Only parse 'info' lines with score data
  if (!trimmed.startsWith('info')) {
    return result;
  }
  
  // Basic validation: check for non-ASCII characters (UCI should be ASCII-only)
  if (!/^[\x00-\x7F]*$/.test(trimmed)) {
    result.errors.push('UCI protocol requires ASCII-only characters');
    return result;
  }
  
  if (!trimmed.includes('score')) {
    result.errors.push('No valid score found in info line');
    return result;
  }
  
  try {
    const evaluation: UCIEvaluation = {
      score: 0,
      mate: null
    };
    
    // Parse score (centipawns or mate) - handle duplicates by taking last occurrence
    let scoreMatch = null;
    let mateMatch = null;
    
    // Find all matches and take the last one for each type
    const allScoreMatches = [...trimmed.matchAll(/score cp (-?\d+)/g)];
    const allMateMatches = [...trimmed.matchAll(/score mate (-?\d+)/g)];
    
    if (allScoreMatches.length > 0) {
      scoreMatch = allScoreMatches[allScoreMatches.length - 1];
    }
    if (allMateMatches.length > 0) {
      mateMatch = allMateMatches[allMateMatches.length - 1];
    }
    
    if (mateMatch) {
      evaluation.mate = parseInt(mateMatch[1]);
      // Convert mate distance to centipawn equivalent for consistency
      evaluation.score = evaluation.mate > 0 ? 10000 : -10000;
    } else if (scoreMatch) {
      evaluation.score = parseInt(scoreMatch[1]);
    } else {
      result.errors.push('No valid score found in info line');
      return result;
    }
    
    // Parse search depth information - handle duplicates by taking last occurrence
    // Use word boundary to avoid matching "seldepth"
    const allDepthMatches = [...trimmed.matchAll(/\bdepth (\d+)/g)];
    if (allDepthMatches.length > 0) {
      const depthMatch = allDepthMatches[allDepthMatches.length - 1];
      evaluation.depth = parseInt(depthMatch[1]);
    }
    
    const seldepthMatch = UCI_PATTERNS.SELDEPTH.exec(trimmed);
    if (seldepthMatch) {
      evaluation.seldepth = parseInt(seldepthMatch[1]);
    }
    
    // Parse performance metrics
    const nodesMatch = UCI_PATTERNS.NODES.exec(trimmed);
    if (nodesMatch) {
      evaluation.nodes = parseInt(nodesMatch[1]);
    }
    
    const timeMatch = UCI_PATTERNS.TIME.exec(trimmed);
    if (timeMatch) {
      evaluation.time = parseInt(timeMatch[1]);
    }
    
    const npsMatch = UCI_PATTERNS.NPS.exec(trimmed);
    if (npsMatch) {
      evaluation.nps = parseInt(npsMatch[1]);
    }
    
    const hashfullMatch = UCI_PATTERNS.HASHFULL.exec(trimmed);
    if (hashfullMatch) {
      evaluation.hashfull = parseInt(hashfullMatch[1]);
    }
    
    // Parse Principal Variation (critical for Phase 2 vertical slice)
    const pvIndex = trimmed.lastIndexOf(' pv ');
    if (pvIndex !== -1) {
      const pvString = trimmed.substring(pvIndex + 4).trim();
      evaluation.pvString = pvString;
      evaluation.pv = pvString.split(/\s+/).filter(move => move.length > 0);
    }
    
    // Parse Multi-PV information
    const multipvMatch = UCI_PATTERNS.MULTIPV.exec(trimmed);
    if (multipvMatch) {
      evaluation.multipv = parseInt(multipvMatch[1]);
    }
    
    // Parse current search information
    const currmoveMatch = UCI_PATTERNS.CURRMOVE.exec(trimmed);
    if (currmoveMatch) {
      evaluation.currmove = currmoveMatch[1];
    }
    
    const currmovenumberMatch = UCI_PATTERNS.CURRMOVENUMBER.exec(trimmed);
    if (currmovenumberMatch) {
      evaluation.currmovenumber = parseInt(currmovenumberMatch[1]);
    }
    
    result.evaluation = evaluation;
    result.isValid = true;
    
  } catch (error) {
    result.errors.push(`Parsing error: ${error}`);
    logger.warn('UCI parsing failed:', { line: trimmed, error });
  }
  
  return result;
}

/**
 * Parse multiple UCI info lines and return the best evaluation
 * Useful for processing accumulated Stockfish output
 * 
 * @param lines - Array of UCI info lines
 * @returns Best evaluation found or null
 */
export function parseBestInfo(lines: string[]): UCIEvaluation | null {
  let bestEvaluation: UCIEvaluation | null = null;
  let maxDepth = -1;
  
  for (const line of lines) {
    const result = parseInfo(line);
    if (result.isValid && result.evaluation) {
      const depth = result.evaluation.depth || 0;
      
      // Prefer mate over centipawn score, then higher depth
      if (result.evaluation.mate !== null) {
        // If we have a mate, prefer it over any centipawn evaluation
        if (!bestEvaluation || bestEvaluation.mate === null || depth > maxDepth) {
          maxDepth = depth;
          bestEvaluation = result.evaluation;
        }
      } else if (!bestEvaluation || (bestEvaluation.mate === null && depth > maxDepth)) {
        // Only update with centipawn if we don't have a mate already
        maxDepth = depth;
        bestEvaluation = result.evaluation;
      }
    }
  }
  
  return bestEvaluation;
}

/**
 * Validate UCI evaluation for completeness and consistency
 * Ensures parsed data meets quality requirements
 * 
 * @param evaluation - Parsed UCI evaluation
 * @returns Validation result with specific error messages
 */
export function validateUCIEvaluation(evaluation: UCIEvaluation): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (typeof evaluation.score !== 'number') {
    errors.push('Score must be a number');
  }
  
  if (evaluation.mate !== null && typeof evaluation.mate !== 'number') {
    errors.push('Mate must be a number or null');
  }
  
  // Validate numeric ranges
  if (evaluation.depth !== undefined && (evaluation.depth < 0 || evaluation.depth > 100)) {
    errors.push('Depth must be between 0 and 100');
  }
  
  if (evaluation.nodes !== undefined && evaluation.nodes < 0) {
    errors.push('Nodes must be non-negative');
  }
  
  if (evaluation.time !== undefined && evaluation.time < 0) {
    errors.push('Time must be non-negative');
  }
  
  if (evaluation.hashfull !== undefined && (evaluation.hashfull < 0 || evaluation.hashfull > 1000)) {
    errors.push('Hashfull must be between 0 and 1000');
  }
  
  // Validate consistency
  if (evaluation.mate !== null && Math.abs(evaluation.score) !== 10000) {
    errors.push('Mate positions should have score ±10000');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Convert UCIEvaluation to legacy EngineEvaluation format
 * Provides backward compatibility with existing IChessEngine interface
 * 
 * @param uciEval - Enhanced UCI evaluation
 * @returns Legacy-compatible engine evaluation
 */
export function toEngineEvaluation(uciEval: UCIEvaluation): {
  score: number;
  mate: number | null;
  depth?: number;
  nodes?: number;
  time?: number;
} {
  return {
    score: uciEval.score,
    mate: uciEval.mate,
    depth: uciEval.depth,
    nodes: uciEval.nodes,
    time: uciEval.time
  };
}

/**
 * Get parser statistics for debugging and monitoring
 * Tracks parser performance and error rates
 */
export function getParserStats(): {
  patternsCount: number;
  supportedFields: string[];
  version: string;
} {
  return {
    patternsCount: Object.keys(UCI_PATTERNS).length,
    supportedFields: [
      'score', 'mate', 'depth', 'seldepth', 'nodes', 'time', 'nps', 
      'hashfull', 'pv', 'multipv', 'currmove', 'currmovenumber'
    ],
    version: '1.0.0'
  };
}