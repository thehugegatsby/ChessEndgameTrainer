/**
 * Tests for tablebase best moves functionality
 */

import { ScenarioEngine } from '../index';
import { TablebaseService } from '../tablebaseService';
import { Engine } from '../../engine';

// Mock the dependencies
jest.mock('../tablebaseService');
jest.mock('../../engine');

describe('ScenarioEngine - Tablebase Best Moves', () => {
  let engine: ScenarioEngine;
  let mockTablebaseService: jest.Mocked<TablebaseService>;
  let mockEngine: jest.Mocked<Engine>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup engine mock
    mockEngine = {
      getMultiPV: jest.fn().mockResolvedValue([]),
      getBestMove: jest.fn(),
      evaluatePosition: jest.fn(),
      updatePosition: jest.fn(),
      reset: jest.fn(),
      quit: jest.fn()
    } as any;
    
    // Mock Engine.getInstance to return our mock
    (Engine.getInstance as jest.Mock).mockReturnValue(mockEngine);
    
    // Setup tablebase service mock
    mockTablebaseService = {
      getTablebaseInfo: jest.fn(),
      clearCache: jest.fn(),
      getCacheStats: jest.fn().mockReturnValue({ size: 0, maxSize: 100 })
    } as any;
    
    // Mock TablebaseService constructor
    (TablebaseService as jest.MockedClass<typeof TablebaseService>).mockImplementation(() => mockTablebaseService);
  });

  afterEach(() => {
    if (engine) {
      engine.quit();
    }
  });

  describe('getBestMoves', () => {
    it('should return empty tablebase moves for positions with more than 7 pieces', async () => {
      // Starting position has 32 pieces
      engine = new ScenarioEngine();
      
      // Mock engine moves
      mockEngine.getMultiPV.mockResolvedValue([
        { move: 'e2e4', score: 20, mate: undefined },
        { move: 'd2d4', score: 15, mate: undefined },
        { move: 'g1f3', score: 10, mate: undefined }
      ]);
      
      const result = await engine.getBestMoves(engine.getFen(), 3);
      
      expect(result.tablebase).toEqual([]);
      expect(mockTablebaseService.getTablebaseInfo).not.toHaveBeenCalled();
      expect(result.engine).toHaveLength(3);
    });

    it('should return tablebase moves for endgame positions', async () => {
      // KQ vs K endgame (3 pieces)
      const fen = '8/8/8/8/8/8/8/4K1Qk w - - 0 1';
      engine = new ScenarioEngine(fen);

      // Mock engine moves
      mockEngine.getMultiPV.mockResolvedValue([
        { move: 'g8g1', score: 9000, mate: 5 }
      ]);
      
      // Mock tablebase responses for different moves
      // We check up to 9 moves (count * 3)
      for (let i = 0; i < 9; i++) {
        mockTablebaseService.getTablebaseInfo
          .mockResolvedValueOnce({ 
            isTablebasePosition: true,
            result: { wdl: -2, dtz: 5 + i, category: 'loss', precise: true }
          });
      }

      const result = await engine.getBestMoves(fen, 3);

      expect(result.tablebase).toHaveLength(3);
      expect(result.tablebase[0]).toEqual({
        move: expect.any(String),
        wdl: 2, // Negated because it's from white's perspective
        dtm: expect.any(Number),
        evaluation: 'Win'
      });
      expect(mockTablebaseService.getTablebaseInfo).toHaveBeenCalledTimes(9);
    });

    it('should sort tablebase moves by WDL value', async () => {
      // KR vs K endgame
      const fen = '8/8/8/8/8/8/R7/4K2k w - - 0 1';
      engine = new ScenarioEngine(fen);

      // Mock different WDL values
      mockTablebaseService.getTablebaseInfo
        .mockResolvedValueOnce({ 
          isTablebasePosition: true,
          result: { wdl: 0, dtz: undefined, category: 'draw', precise: true }
        })  // Draw move
        .mockResolvedValueOnce({ 
          isTablebasePosition: true,
          result: { wdl: -2, dtz: 10, category: 'loss', precise: true }
        })  // Win move (from opponent's perspective)
        .mockResolvedValueOnce({ 
          isTablebasePosition: true,
          result: { wdl: 2, dtz: undefined, category: 'win', precise: true }
        }); // Loss move (from opponent's perspective)

      const result = await engine.getBestMoves(fen, 3);

      // Should be sorted: Win (2), Draw (0), Loss (-2)
      expect(result.tablebase[0].wdl).toBe(2);
      expect(result.tablebase[0].evaluation).toBe('Win');
      expect(result.tablebase[1].wdl).toBe(-0); // JavaScript -0 === 0
      expect(result.tablebase[1].evaluation).toBe('Draw');
      expect(result.tablebase[2].wdl).toBe(-2);
      expect(result.tablebase[2].evaluation).toBe('Loss');
    });

    it('should handle tablebase service errors gracefully', async () => {
      const fen = '8/8/8/8/8/8/8/4K1Qk w - - 0 1';
      engine = new ScenarioEngine(fen);

      // Mock tablebase service to throw error
      mockTablebaseService.getTablebaseInfo.mockRejectedValue(new Error('Tablebase API error'));

      const result = await engine.getBestMoves(fen, 3);

      expect(result.tablebase).toEqual([]);
      expect(result.engine).toBeDefined(); // Engine moves should still work
    });

    it('should respect the count parameter for tablebase moves', async () => {
      const fen = '8/8/8/8/8/8/8/4K1Qk w - - 0 1';
      engine = new ScenarioEngine(fen);

      mockTablebaseService.getTablebaseInfo
        .mockResolvedValue({ wdl: -2, dtm: 5, isTablebasePosition: true });

      const result = await engine.getBestMoves(fen, 2);

      expect(result.tablebase.length).toBeLessThanOrEqual(2);
    });

    it('should convert moves to algebraic notation', async () => {
      const fen = '8/8/8/8/8/8/8/4K1Qk w - - 0 1';
      engine = new ScenarioEngine(fen);

      // Mock engine moves
      mockEngine.getMultiPV.mockResolvedValue([
        { move: 'g8g1', score: 9000, mate: 5 }
      ]);

      // Mock tablebase response for the position after the move
      mockTablebaseService.getTablebaseInfo
        .mockResolvedValue({ 
          isTablebasePosition: true,
          result: { wdl: -2, dtz: 5, category: 'loss', precise: true }
        });

      const result = await engine.getBestMoves(fen, 1);

      // Should have at least one tablebase move
      expect(result.tablebase.length).toBeGreaterThan(0);
      
      // Should be in algebraic notation (e.g., "Qg1+", not "g8g1")
      expect(result.tablebase[0].move).toMatch(/^[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8][\+#]?$/);
    });
  });

  describe('countPieces', () => {
    it('should correctly count pieces in different positions', async () => {
      // Test with starting position (32 pieces)
      engine = new ScenarioEngine();
      const startingPieces = (engine as any).countPieces(engine.getFen());
      expect(startingPieces).toBe(32);

      // Test with endgame position (3 pieces)
      const endgameFen = '8/8/8/8/8/8/8/4K1Qk w - - 0 1';
      const endgamePieces = (engine as any).countPieces(endgameFen);
      expect(endgamePieces).toBe(3);

      // Test with position where pawns were captured (24 pieces)
      const capturedPawnsFen = 'r1bqkb1r/ppp2ppp/2n2n2/3p4/3P4/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 6';
      const capturedPawnsPieces = (engine as any).countPieces(capturedPawnsFen);
      expect(capturedPawnsPieces).toBe(30);
    });
  });
});