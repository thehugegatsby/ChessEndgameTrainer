import { TablebaseService } from '../tablebaseService';
import { tablebaseService as coreTablebaseService } from '../../tablebase';

// Mock the core tablebase service
jest.mock('../../tablebase', () => ({
  tablebaseService: {
    queryPosition: jest.fn()
  }
}));

describe('TablebaseService', () => {
  let service: TablebaseService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    service = new TablebaseService();
  });

  describe('getTablebaseInfo', () => {
    test('should return cached result if available', async () => {
      const fen = '8/8/8/8/8/8/8/K1k5 w - - 0 1';
      const cachedInfo = {
        isTablebasePosition: true,
        result: {
          wdl: 0,
          dtz: 0,
          category: 'draw' as const,
          precise: true
        },
        bestMoves: []
      };
      
      // Set up cache
      service['cache'].set(fen, cachedInfo);
      
      const result = await service.getTablebaseInfo(fen);
      
      expect(result).toBe(cachedInfo);
      expect(coreTablebaseService.queryPosition).not.toHaveBeenCalled();
    });

    test('should handle non-tablebase position', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      (coreTablebaseService.queryPosition as jest.Mock).mockResolvedValue({
        isTablebasePosition: false
      });
      
      const result = await service.getTablebaseInfo(fen);
      
      expect(result.isTablebasePosition).toBe(false);
      expect(result.error).toBe('Position not in tablebase');
      expect(coreTablebaseService.queryPosition).toHaveBeenCalledWith(fen);
    });

    test('should handle successful tablebase query', async () => {
      const fen = '8/8/8/8/8/8/8/K1k5 w - - 0 1';
      
      (coreTablebaseService.queryPosition as jest.Mock).mockResolvedValue({
        isTablebasePosition: true,
        result: {
          wdl: 0,
          dtz: 0,
          category: 'draw',
          precise: true,
          moves: [
            { uci: 'a1a2', wdl: 0 },
            { uci: 'a1b1', wdl: 0 }
          ]
        }
      });
      
      const result = await service.getTablebaseInfo(fen);
      
      expect(result.isTablebasePosition).toBe(true);
      expect(result.result).toEqual({
        wdl: 0,
        dtz: undefined,
        category: 'draw',
        precise: true
      });
      expect(result.bestMoves).toHaveLength(2);
      expect(result.bestMoves![0].move).toBe('a1a2');
    });

    test('should handle query with missing result data', async () => {
      const fen = '8/8/8/8/8/8/8/K1k5 w - - 0 1';
      
      (coreTablebaseService.queryPosition as jest.Mock).mockResolvedValue({
        isTablebasePosition: true,
        result: null
      });
      
      const result = await service.getTablebaseInfo(fen);
      
      expect(result.isTablebasePosition).toBe(true);
      expect(result.result).toEqual({
        wdl: 0,
        dtz: undefined,
        category: 'draw',
        precise: false
      });
      expect(result.bestMoves).toEqual([]);
    });

    test('should handle tablebase query errors', async () => {
      const fen = '8/8/8/8/8/8/8/K1k5 w - - 0 1';
      const error = new Error('Network error');
      
      (coreTablebaseService.queryPosition as jest.Mock).mockRejectedValue(error);
      
      const result = await service.getTablebaseInfo(fen);
      
      expect(result.isTablebasePosition).toBe(false);
      expect(result.error).toBe('Network error');
    });

    test('should handle non-Error exceptions', async () => {
      const fen = '8/8/8/8/8/8/8/K1k5 w - - 0 1';
      
      (coreTablebaseService.queryPosition as jest.Mock).mockRejectedValue('String error');
      
      const result = await service.getTablebaseInfo(fen);
      
      expect(result.isTablebasePosition).toBe(false);
      expect(result.error).toBe('Unknown tablebase error');
    });

    test('should limit cache size', async () => {
      // Fill cache to max size
      for (let i = 0; i < 100; i++) {
        const fen = `position${i}`;
        service['cache'].set(fen, {
          isTablebasePosition: true,
          result: {
            wdl: 0,
            dtz: 0,
            category: 'draw' as const,
            precise: true
          },
          bestMoves: []
        });
      }
      
      expect(service['cache'].size).toBe(100);
      
      // Add one more - should trigger cache cleanup
      const newFen = 'newposition';
      
      (coreTablebaseService.queryPosition as jest.Mock).mockResolvedValue({
        isTablebasePosition: true,
        result: { wdl: 0 }
      });
      
      await service.getTablebaseInfo(newFen);
      
      // Cache should have been cleaned up
      expect(service['cache'].size).toBeLessThanOrEqual(100);
      expect(service['cache'].has(newFen)).toBe(true);
    });

    test('should handle moves without uci property', async () => {
      const fen = '8/8/8/8/8/8/8/K1k5 w - - 0 1';
      
      (coreTablebaseService.queryPosition as jest.Mock).mockResolvedValue({
        isTablebasePosition: true,
        result: {
          wdl: 0,
          moves: [
            { san: 'Ka2' }, // No uci property
            { uci: 'a1b1', wdl: 0 }
          ]
        }
      });
      
      const result = await service.getTablebaseInfo(fen);
      
      expect(result.bestMoves).toHaveLength(2);
      expect(result.bestMoves![0].move).toBe(''); // Missing uci becomes empty string
      expect(result.bestMoves![1].move).toBe('a1b1');
    });
  });

  describe('formatMoveEvaluation', () => {
    test('should format win evaluation', () => {
      const move = { wdl: 2, dtz: 15 };
      const result = service['formatMoveEvaluation'](move);
      expect(result).toContain('Win');
    });

    test('should format draw evaluation', () => {
      const move = { wdl: 0 };
      const result = service['formatMoveEvaluation'](move);
      expect(result).toBe('Draw');
    });

    test('should format loss evaluation', () => {
      const move = { wdl: -2, dtz: -10 };
      const result = service['formatMoveEvaluation'](move);
      expect(result).toContain('Loss');
    });

    test('should format evaluation without dtz', () => {
      const move = { wdl: 2 };
      const result = service['formatMoveEvaluation'](move);
      expect(result).toBe('Win');
    });
  });

  describe('setCached', () => {
    test('should add to cache when under limit', () => {
      const fen = 'test-fen';
      const info = {
        isTablebasePosition: false,
        error: 'test error'
      };
      
      service['setCached'](fen, info);
      
      expect(service['cache'].has(fen)).toBe(true);
      expect(service['cache'].get(fen)).toBe(info);
    });

    test('should clear old entries when cache is full', () => {
      // Fill cache
      for (let i = 0; i < 100; i++) {
        service['cache'].set(`fen${i}`, {
          isTablebasePosition: false
        });
      }
      
      const newFen = 'new-fen';
      const newInfo = {
        isTablebasePosition: true,
        result: {
          wdl: 1,
          category: 'win' as const,
          precise: true
        }
      };
      
      service['setCached'](newFen, newInfo);
      
      // Should maintain max cache size
      expect(service['cache'].size).toBeLessThanOrEqual(100);
      expect(service['cache'].has(newFen)).toBe(true);
    });
  });

  describe('getCategory', () => {
    test('should categorize win', () => {
      expect(service['getCategory'](2)).toBe('win');
      expect(service['getCategory'](1)).toBe('win');
    });

    test('should categorize draw', () => {
      expect(service['getCategory'](0)).toBe('draw');
    });

    test('should categorize loss', () => {
      expect(service['getCategory'](-1)).toBe('loss');
      expect(service['getCategory'](-2)).toBe('loss');
    });

    test('should default to draw for unknown values', () => {
      expect(service['getCategory'](3)).toBe('draw');
      expect(service['getCategory'](-3)).toBe('draw');
    });
  });
});