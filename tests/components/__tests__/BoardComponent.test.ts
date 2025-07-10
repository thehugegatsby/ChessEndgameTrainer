/**
 * @fileoverview Component Tests for BoardComponent
 * @description Isolated tests providing stable foundation for E2E tests
 */

// Manual mocks in __mocks__ folder will be automatically used
// No need for explicit jest.mock() for BaseComponent

import { BoardComponent } from '../../e2e/components/BoardComponent';
import { 
  createMockPage, 
  createMockLocator,
  MockPage,
  Locator
} from '../__mocks__/playwright';
import type { Page } from '@playwright/test';

// Increase timeout for debugging
jest.setTimeout(30000);

describe('BoardComponent - Board Initialization', () => {
  let mockPage: MockPage;
  let boardComponent: BoardComponent;

  beforeEach(() => {
    mockPage = createMockPage();
    boardComponent = new BoardComponent(mockPage as unknown as Page);
  });

  describe('waitForBoard', () => {
    test('should return immediately if board is already visible', async () => {
      // Arrange
      const mockLocator = createMockLocator({
        isVisible: jest.fn().mockResolvedValue(true)
      });
      mockPage.locator.mockReturnValue(mockLocator);

      // Act
      await boardComponent.waitForBoard();

      // Assert
      expect(mockPage.locator).toHaveBeenCalledWith(
        '[data-testid="training-board"], .react-chessboard, #chessboard'
      );
      expect(mockLocator.isVisible).toHaveBeenCalled();
      expect(mockLocator.waitFor).not.toHaveBeenCalled();
    });

    test('should wait for selector if board not initially visible', async () => {
      // Arrange - Setup mocks for the two locator calls
      const mockBoardLocator = createMockLocator({
        isVisible: jest.fn().mockResolvedValue(false) // Not visible
      });
      
      const mockWaitingLocator = createMockLocator({
        waitFor: jest.fn().mockResolvedValue(undefined)
      });
      
      // First call returns board check, subsequent calls for waitForElement
      mockPage.locator
        .mockReturnValueOnce(mockBoardLocator)
        .mockReturnValue(mockWaitingLocator);

      // Act
      await boardComponent.waitForBoard();

      // Assert
      expect(mockBoardLocator.isVisible).toHaveBeenCalledTimes(1);
      expect(mockWaitingLocator.waitFor).toHaveBeenCalledWith({
        state: 'visible',
        timeout: expect.any(Number)
      });
    });

    test('should handle exception when checking visibility', async () => {
      // Arrange
      const mockWaitingLocator = createMockLocator({
        waitFor: jest.fn().mockResolvedValue(undefined)
      });
      
      // First call throws (in try block), then returns valid locator
      mockPage.locator
        .mockImplementationOnce(() => {
          throw new Error('Element not found');
        })
        .mockReturnValue(mockWaitingLocator);

      // Act
      await boardComponent.waitForBoard();

      // Assert
      expect(mockPage.locator).toHaveBeenCalledTimes(2);
      expect(mockWaitingLocator.waitFor).toHaveBeenCalledWith({
        state: 'visible',
        timeout: expect.any(Number)
      });
    });
  });

  describe('getDefaultSelector', () => {
    test('should return correct default selector string', () => {
      // Act
      const selector = boardComponent.getDefaultSelector();

      // Assert
      expect(selector).toBe('[data-testid="training-board"], .react-chessboard, #chessboard');
    });
  });

  describe('Move Handling', () => {
    test('should make move using e2e_makeMove when available', async () => {
      // Mock e2e_makeMove availability
      (mockPage.evaluate as jest.Mock)
        .mockResolvedValueOnce('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') // getCurrentFen
        .mockResolvedValueOnce(true) // hasE2EMakeMove
        .mockResolvedValueOnce({ success: true }) // e2e_makeMove result
        .mockResolvedValue('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'); // new FEN

      await boardComponent.makeMove('e2', 'e4');

      expect(mockPage.evaluate).toHaveBeenCalledWith(
        expect.any(Function),
        'e2-e4'
      );
    });

    test('should fall back to click-to-click when e2e_makeMove unavailable', async () => {
      // Mock no e2e_makeMove
      (mockPage.evaluate as jest.Mock)
        .mockResolvedValueOnce('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') // getCurrentFen
        .mockResolvedValueOnce(false) // hasE2EMakeMove
        .mockResolvedValue('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'); // new FEN

      const mockLocator = mockPage.locator('') as any;

      await boardComponent.makeMove('e2', 'e4');

      // Should click source and destination squares
      expect(mockPage.locator).toHaveBeenCalledWith('[data-square="e2"]');
      expect(mockPage.locator).toHaveBeenCalledWith('[data-square="e4"]');
      expect(mockLocator.click).toHaveBeenCalledTimes(2);
    });

    test('should throw error on invalid move', async () => {
      (mockPage.evaluate as jest.Mock)
        .mockResolvedValueOnce('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce({ success: false, error: 'Invalid move' });

      await expect(boardComponent.makeMove('e2', 'e5')).rejects.toThrow(
        'Failed to make move e2 -> e5: Invalid move'
      );
    });
  });

  describe('FEN Handling', () => {
    test('should get current position from data-fen attribute', async () => {
      const mockLocator = mockPage.locator('') as any;
      (mockLocator.getAttribute as jest.Mock).mockResolvedValue(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      );

      const position = await boardComponent.getPosition();

      expect(position).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
    });

    test('should fall back to test bridge for FEN', async () => {
      const mockLocator = mockPage.locator('') as any;
      (mockLocator.getAttribute as jest.Mock).mockResolvedValue(null);
      (mockPage.evaluate as jest.Mock).mockResolvedValue(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      );

      const position = await boardComponent.getPosition();

      expect(position).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
    });

    test('should validate FEN format', async () => {
      const mockLocator = mockPage.locator('') as any;
      
      // Test invalid FEN
      (mockLocator.getAttribute as jest.Mock).mockResolvedValue('invalid-fen');
      const position = await boardComponent.getPosition();
      
      // Should fall back to starting position
      expect(position).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });
  });

  describe('Piece Detection', () => {
    test('should detect piece at square', async () => {
      const mockLocator = mockPage.locator('') as any;
      (mockLocator.getAttribute as jest.Mock).mockResolvedValue('wK');

      const piece = await boardComponent.getPieceAt('e1');

      expect(piece).toEqual({
        type: 'king',
        color: 'white',
        square: 'e1',
        notation: 'wK'
      });
    });

    test('should return null for empty square', async () => {
      const mockLocator = mockPage.locator('') as any;
      (mockLocator.getAttribute as jest.Mock).mockResolvedValue(null);
      (mockLocator.count as jest.Mock).mockResolvedValue(0);

      const piece = await boardComponent.getPieceAt('e4');

      expect(piece).toBeNull();
    });
  });

  describe('Highlight Detection', () => {
    test('should detect highlighted squares', async () => {
      const mockHighlightedSquare = {
        getAttribute: jest.fn().mockResolvedValue('e4'),
      } as unknown as Locator;

      (mockPage.locator as jest.Mock).mockImplementation((selector: string) => {
        if (selector === '[data-highlight="true"]') {
          return {
            all: jest.fn().mockResolvedValue([mockHighlightedSquare]),
          } as unknown as Locator;
        }
        return {
          all: jest.fn().mockResolvedValue([]),
        } as unknown as Locator;
      });

      const highlights = await boardComponent.getHighlightedSquares();

      expect(highlights).toEqual(['e4']);
    });

    test('should handle multiple highlight selectors', async () => {
      const mockSquare1 = { getAttribute: jest.fn().mockResolvedValue('e4') };
      const mockSquare2 = { getAttribute: jest.fn().mockResolvedValue('e5') };

      (mockPage.locator as jest.Mock).mockImplementation((selector: string) => {
        if (selector === '[data-highlight="true"]') {
          return { all: jest.fn().mockResolvedValue([mockSquare1]) };
        }
        if (selector === '.highlight-legal') {
          return { all: jest.fn().mockResolvedValue([mockSquare2]) };
        }
        return { all: jest.fn().mockResolvedValue([]) };
      });

      const highlights = await boardComponent.getHighlightedSquares();

      expect(highlights).toContain('e4');
      expect(highlights).toContain('e5');
    });
  });

  describe('Position Loading', () => {
    test('should load position using test bridge', async () => {
      const testPosition = {
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 4',
        turn: 'w' as const,
        moveNumber: 4
      };

      (mockPage.evaluate as jest.Mock)
        .mockResolvedValueOnce(true) // setPosition success
        .mockResolvedValue(testPosition.fen); // getCurrentFen for waitForPosition

      await boardComponent.loadPosition(testPosition);

      expect(mockPage.evaluate).toHaveBeenCalledWith(
        expect.any(Function),
        testPosition.fen
      );
    });
  });

  describe('Move Validation', () => {
    test('should validate legal moves', async () => {
      const mockLocator = mockPage.locator('') as any;
      
      // Mock piece at source
      (mockLocator.getAttribute as jest.Mock).mockResolvedValue('wP');
      
      // Mock highlighted squares after clicking
      (mockPage.locator as jest.Mock).mockImplementation((selector: string) => {
        if (selector === '[data-highlight="true"]') {
          return {
            all: jest.fn().mockResolvedValue([
              { getAttribute: jest.fn().mockResolvedValue('e3') },
              { getAttribute: jest.fn().mockResolvedValue('e4') }
            ]),
          };
        }
        return mockLocator;
      });

      const isValid = await boardComponent.isMoveValid('e2', 'e4');

      expect(isValid).toBe(true);
    });

    test('should return false for invalid moves', async () => {
      const mockLocator = mockPage.locator('') as any;
      
      // Mock piece at source
      (mockLocator.getAttribute as jest.Mock).mockResolvedValue('wP');
      
      // Mock no highlighted squares for illegal move
      (mockPage.locator as jest.Mock).mockReturnValue({
        all: jest.fn().mockResolvedValue([]),
      });

      const isValid = await boardComponent.isMoveValid('e2', 'e5');

      expect(isValid).toBe(false);
    });
  });
});