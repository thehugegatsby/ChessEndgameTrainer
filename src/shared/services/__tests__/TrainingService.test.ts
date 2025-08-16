import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { StoreApi } from '@shared/store/StoreContext';
import type { ValidatedMove } from '@shared/types/chess';

// Mock dependencies - must be defined before imports
vi.mock('../logging/Logger', () => ({
  getLogger: () => ({
    setContext: () => ({
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  }),
}));

vi.mock('../ChessService', () => ({
  chessService: {
    getFen: vi.fn(),
    turn: vi.fn(),
    getPgn: vi.fn(),
    isGameOver: vi.fn(),
    isCheckmate: vi.fn(),
    isDraw: vi.fn(),
    isStalemate: vi.fn(),
    getMoveHistory: vi.fn(),
    isCheck: vi.fn(),
  },
}));

// Import after mocks are set up
import { TrainingService } from '../TrainingService';
import { chessService } from '../ChessService';

// Define type for our mock state to ensure type safety in tests
type MockState = {
  game: {
    isGameFinished?: boolean;
    moveHistory?: ValidatedMove[];
    currentFen?: string;
    currentPgn?: string;
  };
  training: {
    isSuccess?: boolean;
  };
  handlePlayerMove: (move: unknown) => Promise<ValidatedMove | null>;
};

describe('TrainingService', () => {
  let trainingService: TrainingService;
  let mockApi: StoreApi;
  let mockState: MockState;
  let mockOnComplete: (success: boolean) => void;

  beforeEach(() => {
    trainingService = new TrainingService();

    // Reset mock state for each test to ensure isolation
    mockState = {
      game: {
        isGameFinished: false,
        moveHistory: [],
        currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        currentPgn: '',
      },
      training: {
        isSuccess: false,
      },
      handlePlayerMove: vi.fn(),
    };

    // The StoreApi is an object with a getState method
    mockApi = {
      getState: () => mockState,
    } as unknown as StoreApi;

    mockOnComplete = vi.fn();

    // Reset ChessService mocks
    vi.mocked(chessService.getFen).mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    vi.mocked(chessService.turn).mockReturnValue('w');
    vi.mocked(chessService.getPgn).mockReturnValue('');
    vi.mocked(chessService.isGameOver).mockReturnValue(false);
    vi.mocked(chessService.isCheckmate).mockReturnValue(false);
    vi.mocked(chessService.isDraw).mockReturnValue(false);
    vi.mocked(chessService.isStalemate).mockReturnValue(false);
    vi.mocked(chessService.getMoveHistory).mockReturnValue([]);
    vi.mocked(chessService.isCheck).mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('executeMove', () => {
    describe('Move Format Parsing', () => {
      it.each([
        // Standard move format
        { move: 'e2-e4', expected: { from: 'e2', to: 'e4' } },
        { move: 'g1-f3', expected: { from: 'g1', to: 'f3' } },
        // Standard promotion
        { move: 'e7-e8=q', expected: { from: 'e7', to: 'e8', promotion: 'q' } },
        { move: 'a7-a8=r', expected: { from: 'a7', to: 'a8', promotion: 'r' } },
        // German promotion (Dame -> Queen)
        { move: 'a7-a8=D', expected: { from: 'a7', to: 'a8', promotion: 'q' } },
        // German promotion (Turm -> Rook)
        { move: 'b7-b8=T', expected: { from: 'b7', to: 'b8', promotion: 'r' } },
        // German promotion (Läufer -> Bishop)
        { move: 'c7-c8=L', expected: { from: 'c7', to: 'c8', promotion: 'b' } },
        // German promotion (Springer -> Knight)
        { move: 'f7-f8=S', expected: { from: 'f7', to: 'f8', promotion: 'n' } },
        // SAN notation
        { move: 'Nf3', expected: 'Nf3' },
        { move: 'Qxd5+', expected: 'Qxd5+' },
        { move: 'O-O', expected: 'O-O' },
      ])('should parse move "$move" and call handlePlayerMove with $expected', async ({ move, expected }) => {
        // Arrange
        vi.mocked(mockState.handlePlayerMove).mockResolvedValue({ san: 'e4' } as ValidatedMove);

        // Act
        await trainingService.executeMove(mockApi, move, mockOnComplete);

        // Assert
        expect(mockState.handlePlayerMove).toHaveBeenCalledOnce();
        expect(mockState.handlePlayerMove).toHaveBeenCalledWith(expected);
      });

      it('should handle promotion without German conversion when already English', async () => {
        // Arrange
        vi.mocked(mockState.handlePlayerMove).mockResolvedValue({ san: 'e8=Q' } as ValidatedMove);

        // Act
        await trainingService.executeMove(mockApi, 'e7-e8=q', mockOnComplete);

        // Assert
        expect(mockState.handlePlayerMove).toHaveBeenCalledWith({ from: 'e7', to: 'e8', promotion: 'q' });
      });

      it('should handle promotion with unknown piece (fallback)', async () => {
        // Arrange
        vi.mocked(mockState.handlePlayerMove).mockResolvedValue({ san: 'e8=X' } as ValidatedMove);

        // Act
        await trainingService.executeMove(mockApi, 'e7-e8=X', mockOnComplete);

        // Assert
        // Unknown promotion piece should be passed through (will likely fail in chess validation)
        expect(mockState.handlePlayerMove).toHaveBeenCalledWith({ from: 'e7', to: 'e8', promotion: 'X' });
      });
    });

    describe('Invalid Move Format Handling', () => {
      it.each([
        { move: '', description: 'empty string' },
        { move: 'e2-', description: 'missing destination' },
        { move: '-e4', description: 'missing source' },
        { move: 'e7-e8=', description: 'promotion without piece' },
        { move: '-', description: 'only dash' },
        { move: 'e2--e4', description: 'double dash' },
      ])('should return failure for invalid move format: $description', async ({ move }) => {
        // Act
        const result = await trainingService.executeMove(mockApi, move, mockOnComplete);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid');
        expect(mockState.handlePlayerMove).not.toHaveBeenCalled();
        expect(mockOnComplete).not.toHaveBeenCalled();
      });
    });

    describe('Training Completion Logic', () => {
      it('should trigger onComplete(true) when training is finished and successful', async () => {
        // Arrange: Simulate that the move orchestrator will finish the game successfully
        vi.mocked(mockState.handlePlayerMove).mockImplementation(async () => {
          mockState.game.isGameFinished = true;
          mockState.training.isSuccess = true;
          return { san: 'e4' } as ValidatedMove;
        });

        // Act
        const result = await trainingService.executeMove(mockApi, 'e2-e4', mockOnComplete);

        // Assert
        expect(result.success).toBe(true);
        expect(mockOnComplete).toHaveBeenCalledOnce();
        expect(mockOnComplete).toHaveBeenCalledWith(true);
      });

      it('should trigger onComplete(false) when training is finished and unsuccessful', async () => {
        // Arrange: Simulate that the move orchestrator will finish the game unsuccessfully
        vi.mocked(mockState.handlePlayerMove).mockImplementation(async () => {
          mockState.game.isGameFinished = true;
          mockState.training.isSuccess = false;
          return { san: 'e4' } as ValidatedMove;
        });

        // Act
        const result = await trainingService.executeMove(mockApi, 'e2-e4', mockOnComplete);

        // Assert
        expect(result.success).toBe(true);
        expect(mockOnComplete).toHaveBeenCalledOnce();
        expect(mockOnComplete).toHaveBeenCalledWith(false);
      });

      it('should not trigger onComplete when training is not finished', async () => {
        // Arrange: The default state is not finished
        vi.mocked(mockState.handlePlayerMove).mockResolvedValue({ san: 'e4' } as ValidatedMove);

        // Act
        const result = await trainingService.executeMove(mockApi, 'e2-e4', mockOnComplete);

        // Assert
        expect(result.success).toBe(true);
        expect(mockOnComplete).not.toHaveBeenCalled();
      });

      it('should not trigger onComplete when game is finished but not successful', async () => {
        // Arrange: Game finished but training not successful
        vi.mocked(mockState.handlePlayerMove).mockImplementation(async () => {
          mockState.game.isGameFinished = false; // Still not finished
          mockState.training.isSuccess = true; // Success doesn't matter if not finished
          return { san: 'e4' } as ValidatedMove;
        });

        // Act
        const result = await trainingService.executeMove(mockApi, 'e2-e4', mockOnComplete);

        // Assert
        expect(result.success).toBe(true);
        expect(mockOnComplete).not.toHaveBeenCalled();
      });

      it('should handle cases where onComplete callback is not provided', async () => {
        // Arrange
        vi.mocked(mockState.handlePlayerMove).mockImplementation(async () => {
          mockState.game.isGameFinished = true;
          mockState.training.isSuccess = true;
          return { san: 'e4' } as ValidatedMove;
        });

        // Act & Assert: Should not throw an error
        await expect(trainingService.executeMove(mockApi, 'e2-e4', undefined)).resolves.toEqual({
          success: true,
        });
      });
    });

    describe('Error Handling', () => {
      it('should return failure result if handlePlayerMove returns null', async () => {
        // Arrange
        vi.mocked(mockState.handlePlayerMove).mockResolvedValue(null);

        // Act
        const result = await trainingService.executeMove(mockApi, 'e2-e4', mockOnComplete);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('Move execution failed');
        expect(mockOnComplete).not.toHaveBeenCalled();
      });

      it('should return failure result if handlePlayerMove returns undefined', async () => {
        // Arrange
        vi.mocked(mockState.handlePlayerMove).mockResolvedValue(undefined as any);

        // Act
        const result = await trainingService.executeMove(mockApi, 'e2-e4', mockOnComplete);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('Move execution failed');
      });

      it('should return failure result and message if handlePlayerMove throws an error', async () => {
        // Arrange
        const errorMessage = 'Invalid move by chess engine';
        vi.mocked(mockState.handlePlayerMove).mockRejectedValue(new Error(errorMessage));

        // Act
        const result = await trainingService.executeMove(mockApi, 'e2-e4', mockOnComplete);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe(errorMessage);
        expect(mockOnComplete).not.toHaveBeenCalled();
      });

      it('should handle non-Error exceptions from handlePlayerMove', async () => {
        // Arrange
        const errorMessage = 'String error';
        vi.mocked(mockState.handlePlayerMove).mockRejectedValue(errorMessage);

        // Act
        const result = await trainingService.executeMove(mockApi, 'e2-e4', mockOnComplete);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe(errorMessage);
      });

      it('should propagate exceptions from the onComplete callback', async () => {
        // Arrange
        const callbackError = new Error('Callback failed!');
        mockOnComplete.mockImplementation(() => {
          throw callbackError;
        });
        vi.mocked(mockState.handlePlayerMove).mockImplementation(async () => {
          mockState.game.isGameFinished = true;
          mockState.training.isSuccess = true;
          return { san: 'e4' } as ValidatedMove;
        });

        // Act & Assert
        await expect(trainingService.executeMove(mockApi, 'e2-e4', mockOnComplete)).rejects.toThrow(callbackError);
      });

      it('should handle errors during state access', async () => {
        // Arrange
        const brokenApi = {
          getState: () => {
            throw new Error('State access failed');
          },
        } as StoreApi;

        // Act
        const result = await trainingService.executeMove(brokenApi, 'e2-e4', mockOnComplete);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('State access failed');
      });
    });

    describe('Integration with handlePlayerMove', () => {
      it('should call handlePlayerMove with parsed move object for dash notation', async () => {
        // Arrange
        vi.mocked(mockState.handlePlayerMove).mockResolvedValue({ san: 'Nf3' } as ValidatedMove);

        // Act
        await trainingService.executeMove(mockApi, 'g1-f3', mockOnComplete);

        // Assert
        expect(mockState.handlePlayerMove).toHaveBeenCalledWith({ from: 'g1', to: 'f3' });
      });

      it('should call handlePlayerMove with string for SAN notation', async () => {
        // Arrange
        vi.mocked(mockState.handlePlayerMove).mockResolvedValue({ san: 'Nf3' } as ValidatedMove);

        // Act
        await trainingService.executeMove(mockApi, 'Nf3', mockOnComplete);

        // Assert
        expect(mockState.handlePlayerMove).toHaveBeenCalledWith('Nf3');
      });
    });
  });

  describe('getGameState', () => {
    it('should return a comprehensive game state snapshot', () => {
      // Arrange
      const lastMove: ValidatedMove = {
        from: 'e2',
        to: 'e4',
        san: 'e4',
        lan: 'e2e4',
        before: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        after: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
        piece: 'p',
        color: 'w',
        flags: 'b',
      };
      mockState.game.currentFen = 'test-fen-string';
      mockState.game.currentPgn = '1. e4';
      mockState.game.moveHistory = [lastMove];

      vi.mocked(chessService).turn.mockReturnValue('b');
      vi.mocked(chessService).isGameOver.mockReturnValue(true);
      vi.mocked(chessService).isCheckmate.mockReturnValue(true);
      vi.mocked(chessService).isDraw.mockReturnValue(false);
      vi.mocked(chessService).isStalemate.mockReturnValue(false);
      vi.mocked(chessService).isCheck.mockReturnValue(true);
      vi.mocked(chessService).getMoveHistory.mockReturnValue([lastMove]);

      // Act
      const gameState = trainingService.getGameState(mockApi);

      // Assert
      expect(gameState).toEqual({
        fen: 'test-fen-string',
        turn: 'b',
        moveCount: 1,
        pgn: '1. e4',
        isGameOver: true,
        gameOverReason: 'checkmate',
        history: [lastMove],
        evaluation: undefined,
        isCheck: true,
        isCheckmate: true,
        isDraw: false,
        lastMove: lastMove,
      });
    });

    it('should fall back to ChessService FEN when state FEN is not available', () => {
      // Arrange
      mockState.game.currentFen = undefined;
      vi.mocked(chessService).getFen.mockReturnValue('fallback-fen');

      // Act
      const gameState = trainingService.getGameState(mockApi);

      // Assert
      expect(gameState.fen).toBe('fallback-fen');
      expect(vi.mocked(chessService).getFen).toHaveBeenCalled();
    });

    it('should fall back to ChessService PGN when state PGN is not available', () => {
      // Arrange
      mockState.game.currentPgn = undefined;
      vi.mocked(chessService).getPgn.mockReturnValue('fallback-pgn');

      // Act
      const gameState = trainingService.getGameState(mockApi);

      // Assert
      expect(gameState.pgn).toBe('fallback-pgn');
      expect(vi.mocked(chessService).getPgn).toHaveBeenCalled();
    });

    it('should correctly identify draw by stalemate', () => {
      // Arrange
      vi.mocked(chessService).isGameOver.mockReturnValue(true);
      vi.mocked(chessService).isCheckmate.mockReturnValue(false);
      vi.mocked(chessService).isDraw.mockReturnValue(true);
      vi.mocked(chessService).isStalemate.mockReturnValue(true);

      // Act
      const gameState = trainingService.getGameState(mockApi);

      // Assert
      expect(gameState.gameOverReason).toBe('stalemate');
    });

    it('should correctly identify draw (general)', () => {
      // Arrange
      vi.mocked(chessService).isGameOver.mockReturnValue(true);
      vi.mocked(chessService).isCheckmate.mockReturnValue(false);
      vi.mocked(chessService).isDraw.mockReturnValue(true);
      vi.mocked(chessService).isStalemate.mockReturnValue(false);

      // Act
      const gameState = trainingService.getGameState(mockApi);

      // Assert
      expect(gameState.gameOverReason).toBe('draw');
    });

    it('should return unknown for unknown game over reason', () => {
      // Arrange
      vi.mocked(chessService).isGameOver.mockReturnValue(true);
      vi.mocked(chessService).isCheckmate.mockReturnValue(false);
      vi.mocked(chessService).isDraw.mockReturnValue(false);
      vi.mocked(chessService).isStalemate.mockReturnValue(false);

      // Act
      const gameState = trainingService.getGameState(mockApi);

      // Assert
      expect(gameState.gameOverReason).toBe('unknown');
    });

    it('should return undefined gameOverReason when game is not over', () => {
      // Arrange
      vi.mocked(chessService).isGameOver.mockReturnValue(false);

      // Act
      const gameState = trainingService.getGameState(mockApi);

      // Assert
      expect(gameState.gameOverReason).toBeUndefined();
    });

    it('should return undefined for lastMove when history is empty', () => {
      // Arrange
      mockState.game.moveHistory = [];

      // Act
      const gameState = trainingService.getGameState(mockApi);

      // Assert
      expect(gameState.lastMove).toBeUndefined();
    });

    it('should handle missing game state gracefully', () => {
      // Arrange
      const stateWithoutGame = {
        training: { isSuccess: false },
        handlePlayerMove: vi.fn(),
      };
      const apiWithoutGame = {
        getState: () => stateWithoutGame,
      } as unknown as StoreApi;

      // Act & Assert: Should not throw
      expect(() => trainingService.getGameState(apiWithoutGame)).not.toThrow();
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle empty move string', async () => {
      // Act
      const result = await trainingService.executeMove(mockApi, '', mockOnComplete);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });

    it('should handle very long move strings', async () => {
      // Arrange
      const longMove = 'a'.repeat(1000);

      // Act
      const result = await trainingService.executeMove(mockApi, longMove, mockOnComplete);

      // Assert - Should pass through to handlePlayerMove as SAN (no dash)
      expect(mockState.handlePlayerMove).toHaveBeenCalledWith(longMove);
    });

    it('should handle complex promotion scenarios', async () => {
      // Arrange
      vi.mocked(mockState.handlePlayerMove).mockResolvedValue({ san: 'e8=Q+' } as ValidatedMove);

      // Act
      await trainingService.executeMove(mockApi, 'e7-e8=D', mockOnComplete);

      // Assert - German D should be converted to English q
      expect(mockState.handlePlayerMove).toHaveBeenCalledWith({ from: 'e7', to: 'e8', promotion: 'q' });
    });
  });
});