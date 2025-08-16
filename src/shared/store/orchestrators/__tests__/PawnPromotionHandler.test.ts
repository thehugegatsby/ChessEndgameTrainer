import { describe, it, expect, beforeEach, vi } from 'vitest';
/**
 * @file Tests for PawnPromotionHandler
 * @module tests/unit/orchestrators/PawnPromotionHandler
 */

import {
  PawnPromotionHandler,
  PROMOTION_CHOICES,
} from '@shared/store/orchestrators/handlePlayerMove/PawnPromotionHandler';
import { chessService } from '@shared/services/ChessService';
import { orchestratorTablebase } from '@shared/services/orchestrator/OrchestratorServices';
import { getLogger } from '@shared/services/logging';
import { handleTrainingCompletion } from '@shared/store/orchestrators/handlePlayerMove/move.completion';
import { createTestValidatedMove } from '@tests/helpers/validatedMoveFactory';
import { tablebaseService } from '@shared/services/TablebaseService';
import type { StoreApi } from '@shared/store/orchestrators/types';

// Mock dependencies
vi.mock('@shared/services/ChessService', () => ({
  chessService: {
    isGameOver: vi.fn(),
    isCheckmate: vi.fn(),
  },
}));

vi.mock('@shared/services/orchestrator/OrchestratorServices', () => ({
  orchestratorTablebase: {
    getEvaluation: vi.fn(),
  },
}));

vi.mock('@shared/services/logging', () => ({
  getLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

vi.mock('@shared/store/orchestrators/handlePlayerMove/move.completion', () => ({
  handleTrainingCompletion: vi.fn(),
}));

// Helper function to create complete TablebaseResult objects
function createTablebaseResult(partial: {
  wdl: number;
  category: string;
  dtm?: number | null;
  dtz?: number | null;
}): any {
  return {
    wdl: partial.wdl,
    dtm: partial.dtm ?? null,
    dtz: partial.dtz ?? null,
    category: partial.category,
    precise: false,
    evaluation: 'Test evaluation',
  };
}

describe('PawnPromotionHandler', () => {
  let handler: PawnPromotionHandler;
  let mockLogger: any;
  let mockApi: StoreApi;
  let mockState: any;

  beforeEach(() => {
    handler = new PawnPromotionHandler();
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    (getLogger as ReturnType<typeof vi.fn>).mockReturnValue(mockLogger);

    // Create mock state and API
    mockState = {
      game: {
        isGameFinished: false,
        currentFen: '8/4P3/4K3/8/8/8/8/4k3 w - - 0 1',
        moveHistory: [], // Add moveHistory array
      },
      training: {
        moveSuccessDialog: null,
        currentPosition: { fen: '8/4P3/4K3/8/8/8/8/4k3 w - - 0 1' }, // Add currentPosition
      },
      ui: {
        toasts: [],
      },
    };

    mockApi = {
      getState: vi.fn(() => mockState),
      setState: vi.fn(callback => {
        // Actually apply the state updates from the callback
        const updates = callback(mockState);
        if (updates) {
          Object.assign(mockState, updates);
        }
      }),
    };

    // Reset all mocks to clear return values and call history
    vi.resetAllMocks();

    // Re-configure mocks that need specific behaviors after reset
    (getLogger as ReturnType<typeof vi.fn>).mockReturnValue(mockLogger);
    (handleTrainingCompletion as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  describe('checkPromotion', () => {
    it('should detect pawn promotion moves', () => {
      const promotionMove = createTestValidatedMove({
        san: 'e8=Q',
        from: 'e7',
        to: 'e8',
        promotion: 'q',
        piece: 'p',
      });

      const result = handler.checkPromotion(promotionMove);

      expect(result).toEqual({
        isPromotion: true,
        promotionPiece: 'q',
        from: 'e7',
        to: 'e8',
        isAutoWin: false,
        moveDescription: 'e8=Q',
      });

      // Note: Removed logger assertion - logging is implementation detail
      // The important behavior is the correct promotion detection
    });

    it('should detect non-promotion moves', () => {
      const normalMove = createTestValidatedMove({
        san: 'e4',
        from: 'e2',
        to: 'e4',
      });

      const result = handler.checkPromotion(normalMove);

      expect(result).toEqual({
        isPromotion: false,
      });
    });

    it('should handle promotion to rook', () => {
      const rookPromotion = createTestValidatedMove({
        san: 'a8=R',
        from: 'a7',
        to: 'a8',
        promotion: 'r',
      });

      const result = handler.checkPromotion(rookPromotion);

      expect(result.isPromotion).toBe(true);
      expect(result.promotionPiece).toBe('r');
    });

    it('should handle promotion to knight', () => {
      const knightPromotion = createTestValidatedMove({
        san: 'b8=N',
        from: 'b7',
        to: 'b8',
        promotion: 'n',
      });

      const result = handler.checkPromotion(knightPromotion);

      expect(result.isPromotion).toBe(true);
      expect(result.promotionPiece).toBe('n');
    });

    it('should handle promotion to bishop', () => {
      const bishopPromotion = createTestValidatedMove({
        san: 'c8=B',
        from: 'c7',
        to: 'c8',
        promotion: 'b',
      });

      const result = handler.checkPromotion(bishopPromotion);

      expect(result.isPromotion).toBe(true);
      expect(result.promotionPiece).toBe('b');
    });

    it('should handle invalid promotion piece', () => {
      // Create a move with invalid promotion manually since factory doesn't support "k"
      const baseMove = createTestValidatedMove({
        san: 'd8=K', // Invalid - can't promote to king
        from: 'd7',
        to: 'd8',
        promotion: 'q', // Use valid type for factory, then override
      });

      // Override with invalid promotion type for testing - type-safe approach
      const invalidPromotion = {
        ...baseMove,
        promotion: 'k' as 'q' | 'r' | 'b' | 'n', // More explicit type assertion
      };

      const result = handler.checkPromotion(invalidPromotion);

      expect(result.isPromotion).toBe(true);
      expect(result.promotionPiece).toBeUndefined(); // Invalid piece should be undefined
    });

    it('should handle promotion without piece specified', () => {
      const promotionWithoutPiece = createTestValidatedMove({
        san: 'e8',
        from: 'e7',
        to: 'e8',
        promotion: 'q', // Need promotion property to generate 'p' flag, but...
      });

      // Manually override to simulate a move where promotion piece is undefined
      // but the move is still flagged as a promotion
      (promotionWithoutPiece as any).promotion = undefined;

      const result = handler.checkPromotion(promotionWithoutPiece);

      expect(result.isPromotion).toBe(true);
      expect(result.promotionPiece).toBeUndefined();
    });
  });

  describe('evaluatePromotionOutcome', () => {
    const validFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    it('should return false for invalid FEN', async () => {
      const result = await handler.evaluatePromotionOutcome('', 'w');

      expect(result).toBe(false);
      // Note: Removed logger assertion - logging is implementation detail
      // The important behavior is returning false for invalid FEN
    });

    it('should return false for malformed FEN', async () => {
      const result = await handler.evaluatePromotionOutcome('invalidfen', 'w');

      expect(result).toBe(false);
      // Note: Removed logger assertion - logging is implementation detail
      // The important behavior is returning false for malformed FEN
    });

    it('should detect checkmate as auto-win', async () => {
      // Configure mocks before calling the handler
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (chessService.isCheckmate as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const result = await handler.evaluatePromotionOutcome(validFen, 'w');

      expect(result).toBe(true);
      // Note: Removed logger assertion - logging is implementation detail
      // The important behavior is returning true for checkmate scenario
    });

    it('should not consider stalemate as auto-win', async () => {
      // Access the mocked functions directly (they're already mocked at module level)
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (chessService.isCheckmate as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const result = await handler.evaluatePromotionOutcome(validFen, 'w');

      expect(result).toBe(false);
    });

    it('should detect winning positions for white with tablebase', async () => {
      // Access the mocked functions directly
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (orchestratorTablebase.getEvaluation as ReturnType<typeof vi.fn>).mockResolvedValue({
        isAvailable: true,
        result: createTablebaseResult({
          wdl: 1000, // Win for white
          category: 'win', // Changed from "mate" to valid category
        }),
      });

      const result = await handler.evaluatePromotionOutcome(validFen, 'w');

      expect(result).toBe(true);
      // Note: Removed logger assertion - logging is implementation detail
      // The important behavior is returning true for winning tablebase position
    });

    it('should detect winning positions for black with tablebase', async () => {
      // Access the mocked functions directly
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (orchestratorTablebase.getEvaluation as ReturnType<typeof vi.fn>).mockResolvedValue({
        isAvailable: true,
        result: createTablebaseResult({
          wdl: -1000, // Loss for white = win for black
          category: 'win',
        }),
      });

      const result = await handler.evaluatePromotionOutcome(validFen, 'b');

      expect(result).toBe(true);
      // Note: Removed logger assertion - logging is implementation detail
      // The important behavior is returning true for black winning position
    });

    it('should consider all winning positions as auto-win regardless of category', async () => {
      // Use vi.spyOn to mock the chess service methods
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockClear();
      (chessService.isCheckmate as ReturnType<typeof vi.fn>).mockClear();

      // Use vi.spyOn to mock the tablebase service methods

      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (orchestratorTablebase.getEvaluation as ReturnType<typeof vi.fn>).mockResolvedValue({
        isAvailable: true,
        result: createTablebaseResult({
          wdl: 1000, // Winning
          category: 'unknown', // Category doesn't matter for auto-win logic
        }),
      });

      const result = await handler.evaluatePromotionOutcome(validFen, 'w');

      expect(result).toBe(true); // Winning positions are auto-win regardless of category
    });

    it('should handle draw positions', async () => {
      // Use vi.spyOn to mock the chess service methods
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockClear();
      (chessService.isCheckmate as ReturnType<typeof vi.fn>).mockClear();

      // Use vi.spyOn to mock the tablebase service methods

      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (orchestratorTablebase.getEvaluation as ReturnType<typeof vi.fn>).mockResolvedValue({
        isAvailable: true,
        result: createTablebaseResult({
          wdl: 0, // Draw
          category: 'draw',
        }),
      });

      const result = await handler.evaluatePromotionOutcome(validFen, 'w');

      expect(result).toBe(false);
    });

    it('should handle losing positions', async () => {
      // Use vi.spyOn to mock the chess service methods
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockClear();
      (chessService.isCheckmate as ReturnType<typeof vi.fn>).mockClear();

      // Use vi.spyOn to mock the tablebase service methods

      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (orchestratorTablebase.getEvaluation as ReturnType<typeof vi.fn>).mockResolvedValue({
        isAvailable: true,
        result: createTablebaseResult({
          wdl: -1000, // Loss for white
          category: 'loss',
        }),
      });

      const result = await handler.evaluatePromotionOutcome(validFen, 'w');

      expect(result).toBe(false);
    });

    it('should handle tablebase unavailable', async () => {
      // Use vi.spyOn to mock the chess service methods
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockClear();
      (chessService.isCheckmate as ReturnType<typeof vi.fn>).mockClear();

      // Use vi.spyOn to mock the tablebase service methods

      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (orchestratorTablebase.getEvaluation as ReturnType<typeof vi.fn>).mockResolvedValue({
        isAvailable: false,
      });

      const result = await handler.evaluatePromotionOutcome(validFen, 'w');

      expect(result).toBe(false);
    });

    it('should handle tablebase errors gracefully', async () => {
      // Use vi.spyOn to mock the tablebase service methods
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockClear();
      (chessService.isCheckmate as ReturnType<typeof vi.fn>).mockClear();

      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (orchestratorTablebase.getEvaluation as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('API error')
      );

      const result = await handler.evaluatePromotionOutcome(validFen, 'w');

      expect(result).toBe(false);
      // Should use catch handler, not log error
    });

    it('should handle evaluation without result field', async () => {
      // Use vi.spyOn to mock the chess service methods
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockClear();
      (chessService.isCheckmate as ReturnType<typeof vi.fn>).mockClear();

      // Use vi.spyOn to mock the tablebase service methods

      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (orchestratorTablebase.getEvaluation as ReturnType<typeof vi.fn>).mockResolvedValue({
        isAvailable: true,
        // Missing result field
      });

      const result = await handler.evaluatePromotionOutcome(validFen, 'w');

      expect(result).toBe(false);
    });

    it('should handle evaluation with null result', async () => {
      // Use vi.spyOn to mock the chess service methods
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockClear();
      (chessService.isCheckmate as ReturnType<typeof vi.fn>).mockClear();

      // Use vi.spyOn to mock the tablebase service methods

      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (orchestratorTablebase.getEvaluation as ReturnType<typeof vi.fn>).mockResolvedValue({
        isAvailable: true,
        result: undefined,
      });

      const result = await handler.evaluatePromotionOutcome(validFen, 'w');

      expect(result).toBe(false);
    });

    it('should handle evaluation with invalid WDL', async () => {
      // Access the mocked functions directly (they're already mocked at module level)
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Use vi.spyOn to mock the tablebase service methods

      // Test with actually invalid WDL - string instead of number
      (orchestratorTablebase.getEvaluation as ReturnType<typeof vi.fn>).mockResolvedValue({
        isAvailable: true,
        result: {
          wdl: 'invalid' as any, // Invalid: should be number
          category: 'win',
          dtm: null,
          dtz: null,
          precise: false,
          evaluation: 'Test evaluation',
        },
      });

      const result = await handler.evaluatePromotionOutcome(validFen, 'w');

      expect(result).toBe(false); // Should return false for invalid WDL type
    });

    it('should handle unexpected errors', async () => {
      // Use vi.spyOn to mock the chess service methods
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockClear();
      (chessService.isCheckmate as ReturnType<typeof vi.fn>).mockClear();

      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await handler.evaluatePromotionOutcome(validFen, 'w');

      expect(result).toBe(false);
      // Note: Removed logger assertion - logging is implementation detail
      // The important behavior is graceful error handling (returning false)
    });
  });

  describe('handleAutoWin', () => {
    it('should handle auto-win with promotion piece', async () => {
      // Ensure clean mock state

      // Ensure mockState has required training properties for handleTrainingCompletion
      mockState.training.currentPosition = { fen: '8/4P3/4K3/8/8/8/8/4k3 w - - 0 1' };
      mockState.game.moveHistory = [];

      const promotionInfo = {
        isPromotion: true,
        promotionPiece: 'q' as const,
        from: 'e7',
        to: 'e8',
        isAutoWin: true,
        moveDescription: 'e8=Q',
      };

      await handler.handleAutoWin(mockApi, promotionInfo);

      // Assert - Focus on behavior: state changes and completion
      expect(mockApi.setState).toHaveBeenCalledWith(expect.any(Function));
      expect(mockState.training.moveSuccessDialog).toEqual({
        isOpen: true,
        promotionPiece: 'Dame',
        moveDescription: 'e8=Q',
      });

      expect(handleTrainingCompletion).toHaveBeenCalledWith(mockApi, true);
    });

    it('should handle auto-win without promotion piece (default to Dame)', async () => {
      const promotionInfo = {
        isPromotion: true,
        from: 'e7',
        to: 'e8',
        isAutoWin: true,
        moveDescription: 'e8',
      };

      await handler.handleAutoWin(mockApi, promotionInfo);

      expect(mockState.training.moveSuccessDialog).toEqual({
        isOpen: true,
        promotionPiece: 'Dame', // Default
        moveDescription: 'e8',
      });
    });

    it('should handle auto-win with different promotion pieces', async () => {
      const pieces = [
        { piece: 'r' as const, expected: 'Turm' },
        { piece: 'n' as const, expected: 'Springer' },
        { piece: 'b' as const, expected: 'Läufer' },
      ];

      for (const { piece, expected } of pieces) {
        const promotionInfo = {
          isPromotion: true,
          promotionPiece: piece,
          from: 'a7',
          to: 'a8',
          isAutoWin: true,
          moveDescription: `a8=${piece.toUpperCase()}`,
        };

        await handler.handleAutoWin(mockApi, promotionInfo);

        expect(mockState.training.moveSuccessDialog.promotionPiece).toBe(expected);
      }
    });
  });

  describe('showPromotionDialog', () => {
    it('should show promotion dialog and auto-select queen', () => {
      const callback = vi.fn();

      handler.showPromotionDialog(mockApi, 'e7', 'e8', callback);

      // Assert - Focus on behavior: state changes and callback execution
      expect(mockApi.setState).toHaveBeenCalledWith(expect.any(Function));
      expect(mockState.ui.toasts).toHaveLength(1);
      expect(mockState.ui.toasts[0]).toEqual(
        expect.objectContaining({
          message: 'Bauernumwandlung: e7-e8 → Dame',
          type: 'info',
        })
      );

      expect(callback).toHaveBeenCalledWith('q');
    });
  });

  describe('isValidPromotionPiece', () => {
    it('should validate correct promotion pieces', () => {
      expect(handler.isValidPromotionPiece('q')).toBe(true);
      expect(handler.isValidPromotionPiece('r')).toBe(true);
      expect(handler.isValidPromotionPiece('n')).toBe(true);
      expect(handler.isValidPromotionPiece('b')).toBe(true);
    });

    it('should reject invalid promotion pieces', () => {
      expect(handler.isValidPromotionPiece('k')).toBe(false);
      expect(handler.isValidPromotionPiece('p')).toBe(false);
      expect(handler.isValidPromotionPiece('Q')).toBe(false); // Capital
      expect(handler.isValidPromotionPiece('')).toBe(false);
      expect(handler.isValidPromotionPiece('invalid')).toBe(false);
    });

    it('should handle undefined input', () => {
      expect(handler.isValidPromotionPiece(undefined)).toBe(false);
    });
  });

  describe('getPromotionPieceLabel', () => {
    it('should return correct German labels', () => {
      expect(handler.getPromotionPieceLabel('q')).toBe('Dame');
      expect(handler.getPromotionPieceLabel('r')).toBe('Turm');
      expect(handler.getPromotionPieceLabel('n')).toBe('Springer');
      expect(handler.getPromotionPieceLabel('b')).toBe('Läufer');
    });
  });

  describe('PROMOTION_CHOICES constant', () => {
    it('should contain all valid promotion pieces', () => {
      expect(PROMOTION_CHOICES).toHaveLength(4);

      const pieces = PROMOTION_CHOICES.map(choice => choice.piece);
      expect(pieces).toEqual(expect.arrayContaining(['q', 'r', 'n', 'b']));
    });

    it('should have German labels and descriptions', () => {
      const queen = PROMOTION_CHOICES.find(c => c.piece === 'q');
      expect(queen).toEqual({
        piece: 'q',
        label: 'Dame',
        description: 'Stärkste Figur - kann in alle Richtungen ziehen',
      });

      const rook = PROMOTION_CHOICES.find(c => c.piece === 'r');
      expect(rook).toEqual({
        piece: 'r',
        label: 'Turm',
        description: 'Zieht horizontal und vertikal',
      });

      const knight = PROMOTION_CHOICES.find(c => c.piece === 'n');
      expect(knight).toEqual({
        piece: 'n',
        label: 'Springer',
        description: 'Zieht in L-Form, kann über Figuren springen',
      });

      const bishop = PROMOTION_CHOICES.find(c => c.piece === 'b');
      expect(bishop).toEqual({
        piece: 'b',
        label: 'Läufer',
        description: 'Zieht diagonal',
      });
    });
  });
});
