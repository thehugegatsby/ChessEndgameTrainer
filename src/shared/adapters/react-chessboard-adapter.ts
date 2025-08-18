/**
 * Anti-Corruption Adapter for react-chessboard
 * 
 * This module provides a clean boundary between external react-chessboard
 * events and our internal domain logic. It normalizes all external data
 * formats to our canonical types before passing to domain services.
 * 
 * Key responsibilities:
 * - Validate and normalize external piece data
 * - Handle errors gracefully with user feedback
 * - Provide type-safe interfaces for domain logic
 * - Track move chains with correlation IDs for debugging
 */

import { z } from 'zod';
import { 
  normalizeSquareClickEvent, 
  normalizePieceDropEvent,
  tryNormalizePieceData,
  type ChessPiece,
  type Square 
} from '@shared/types/chess-validation';
import { getLogger } from '@shared/services/logging';

// ============================================================================
// MOVE CONTEXT FOR CORRELATION TRACKING
// ============================================================================

export interface MoveContext {
  readonly chainId: string;
  readonly source: 'ui' | 'engine' | 'test';
  readonly startedAt: number;
  readonly timestamp: string;
}

/**
 * Generate a new move context for tracking move chains
 */
export function createMoveContext(source: MoveContext['source'] = 'ui'): MoveContext {
  return {
    chainId: crypto.randomUUID(),
    source,
    startedAt: Date.now(),
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// ADAPTER INTERFACES
// ============================================================================

/**
 * Normalized square click event data
 */
export interface NormalizedSquareClickEvent {
  readonly piece: ChessPiece | null;
  readonly square: Square;
  readonly context: MoveContext;
}

/**
 * Normalized piece drop event data
 */
export interface NormalizedPieceDropEvent {
  readonly sourceSquare: Square;
  readonly targetSquare: Square;
  readonly piece: ChessPiece;
  readonly promotion?: string;
  readonly context: MoveContext;
}

/**
 * Result type for adapter operations
 */
export type AdapterResult<T> = 
  | { ok: true; value: T }
  | { ok: false; error: string; details?: unknown };

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Convert Zod error to user-friendly message
 */
function formatValidationError(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  if (firstIssue) {
    return firstIssue.message;
  }
  return 'Invalid chess data format';
}

/**
 * Log adapter errors with context
 */
function logAdapterError(
  operation: string, 
  context: MoveContext,
  error: unknown,
  input?: unknown
): void {
  getLogger().error(`[ADAPTER] ${operation} failed`, {
    chainId: context.chainId,
    source: context.source,
    error: error instanceof Error ? error.message : String(error),
    input: input ? JSON.stringify(input) : undefined,
    timestamp: context.timestamp
  });
}

// ============================================================================
// SQUARE CLICK ADAPTER
// ============================================================================

/**
 * Adapter for react-chessboard onSquareClick events
 * 
 * Handles the complex piece data normalization that caused our original bug.
 * Ensures piece color extraction always works regardless of input format.
 * 
 * @param rawEvent - Raw event data from react-chessboard
 * @param context - Move tracking context (optional, will create if not provided)
 * @returns Normalized event data or error result
 */
export function adaptSquareClickEvent(
  rawEvent: unknown,
  context: MoveContext = createMoveContext()
): AdapterResult<NormalizedSquareClickEvent> {
  
  getLogger().info(`[ADAPTER] Processing square click`, {
    chainId: context.chainId,
    source: context.source,
    rawEvent: JSON.stringify(rawEvent)
  });
  
  try {
    const normalized = normalizeSquareClickEvent(rawEvent);
    
    const result: NormalizedSquareClickEvent = {
      piece: normalized.piece,
      square: normalized.square,
      context
    };
    
    getLogger().info(`[ADAPTER] Square click normalized successfully`, {
      chainId: context.chainId,
      square: result.square,
      pieceCode: result.piece?.code || 'empty',
      pieceColor: result.piece?.color || 'none'
    });
    
    return { ok: true, value: result };
    
  } catch (error) {
    const errorMessage = error instanceof z.ZodError 
      ? formatValidationError(error)
      : `Unexpected validation error: ${error instanceof Error ? error.message : String(error)}`;
      
    logAdapterError('square click', context, error, rawEvent);
    
    return { 
      ok: false, 
      error: errorMessage,
      details: error instanceof z.ZodError ? error.issues : error
    };
  }
}

// ============================================================================
// PIECE DROP ADAPTER
// ============================================================================

/**
 * Adapter for react-chessboard onPieceDrop events
 * 
 * @param sourceSquare - Source square (should be valid)
 * @param targetSquare - Target square (should be valid)
 * @param piece - Piece being moved (should be valid piece code)
 * @param promotion - Optional promotion piece
 * @param context - Move tracking context (optional, will create if not provided)
 * @returns Normalized event data or error result
 */
export function adaptPieceDropEvent(
  sourceSquare: unknown,
  targetSquare: unknown,
  piece: unknown,
  promotion?: unknown,
  context: MoveContext = createMoveContext()
): AdapterResult<NormalizedPieceDropEvent> {
  
  getLogger().info(`[ADAPTER] Processing piece drop`, {
    chainId: context.chainId,
    source: context.source,
    sourceSquare,
    targetSquare,
    piece,
    promotion
  });
  
  try {
    const rawEvent = {
      sourceSquare,
      targetSquare,
      piece
    };
    
    const normalized = normalizePieceDropEvent(rawEvent);
    
    const result: NormalizedPieceDropEvent = {
      sourceSquare: normalized.sourceSquare,
      targetSquare: normalized.targetSquare,
      piece: normalized.piece,
      ...(typeof promotion === 'string' && { promotion }),
      context
    };
    
    getLogger().info(`[ADAPTER] Piece drop normalized successfully`, {
      chainId: context.chainId,
      move: `${result.sourceSquare}-${result.targetSquare}`,
      pieceCode: result.piece.code,
      promotion: result.promotion
    });
    
    return { ok: true, value: result };
    
  } catch (error) {
    const errorMessage = error instanceof z.ZodError 
      ? formatValidationError(error)
      : `Unexpected validation error: ${error instanceof Error ? error.message : String(error)}`;
      
    logAdapterError('piece drop', context, error, { sourceSquare, targetSquare, piece, promotion });
    
    return { 
      ok: false, 
      error: errorMessage,
      details: error instanceof z.ZodError ? error.issues : error
    };
  }
}

// ============================================================================
// ADAPTER FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a type-safe onSquareClick handler that uses the adapter
 * 
 * @param handler - Domain handler that accepts normalized data
 * @param onError - Optional error handler for UI feedback
 * @returns react-chessboard compatible onSquareClick handler
 */
export function createSquareClickHandler(
  handler: (event: NormalizedSquareClickEvent) => void,
  onError?: (error: string, details?: unknown) => void
) {
  return (rawEvent: { piece: unknown; square: unknown }) => {
    const context = createMoveContext();
    const result = adaptSquareClickEvent(rawEvent, context);
    
    if (result.ok) {
      handler(result.value);
    } else {
      getLogger().warn(`[ADAPTER] Square click handler rejected input`, {
        chainId: context.chainId,
        error: result.error,
        rawEvent: JSON.stringify(rawEvent)
      });
      
      if (onError) {
        onError(result.error, result.details);
      }
    }
  };
}

/**
 * Create a type-safe onPieceDrop handler that uses the adapter
 * 
 * @param handler - Domain handler that accepts normalized data and returns success boolean
 * @param onError - Optional error handler for UI feedback
 * @returns react-chessboard compatible onPieceDrop handler
 */
export function createPieceDropHandler(
  handler: (event: NormalizedPieceDropEvent) => boolean,
  onError?: (error: string, details?: unknown) => void
) {
  return (
    sourceSquare: unknown, 
    targetSquare: unknown, 
    piece: unknown, 
    promotion?: unknown
  ): boolean => {
    const context = createMoveContext();
    const result = adaptPieceDropEvent(sourceSquare, targetSquare, piece, promotion, context);
    
    if (result.ok) {
      return handler(result.value);
    } else {
      getLogger().warn(`[ADAPTER] Piece drop handler rejected input`, {
        chainId: context.chainId,
        error: result.error,
        sourceSquare,
        targetSquare,
        piece,
        promotion
      });
      
      if (onError) {
        onError(result.error, result.details);
      }
      
      return false; // Reject the move on validation error
    }
  };
}

// ============================================================================
// LEGACY COMPATIBILITY HELPERS
// ============================================================================

/**
 * Extract piece color safely from any piece format
 * This replaces the buggy piece?.[0] pattern that caused our navigation bug
 * 
 * @param piece - Any piece format
 * @returns Piece color or null if no piece/invalid
 */
export function extractPieceColorSafely(piece: unknown): 'w' | 'b' | null {
  const result = tryNormalizePieceData(piece);
  return result.ok && result.value ? result.value.color : null;
}

/**
 * Check if piece belongs to specified color
 * Replaces manual color checking that was error-prone
 * 
 * @param piece - Any piece format
 * @param expectedColor - Expected piece color
 * @returns True if piece matches expected color
 */
export function isPieceOfColor(piece: unknown, expectedColor: 'w' | 'b'): boolean {
  const color = extractPieceColorSafely(piece);
  return color === expectedColor;
}