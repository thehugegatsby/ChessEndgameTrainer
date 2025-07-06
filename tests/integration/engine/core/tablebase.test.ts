import { tablebaseService, TablebaseService } from '@/shared/lib/chess/tablebase';

// Test positions
const KING_PAWN_ENDGAME = '8/8/8/8/8/1P6/k7/K7 w - - 0 1'; // Simple K+P vs K
const COMPLEX_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // Starting position (too many pieces)
const ROOK_ENDGAME = '8/8/8/8/8/8/k7/KR6 w - - 0 1'; // K+R vs K (should be winning)

describe('Tablebase Service', () => {
  let service: TablebaseService;

  beforeEach(() => {
    service = new TablebaseService();
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('Position Recognition', () => {
    test('should recognize simple endgame positions', async () => {
      const result = await service.queryPosition(KING_PAWN_ENDGAME);
      
      expect(result.isTablebasePosition).toBe(true);
      expect(result.pieceCount).toBe(3); // K + K + P
    });

    test('should reject complex positions', async () => {
      const result = await service.queryPosition(COMPLEX_POSITION);
      
      expect(result.isTablebasePosition).toBe(false);
      expect(result.pieceCount).toBe(32); // Full starting position
    });

    test('should handle rook endgames', async () => {
      const result = await service.queryPosition(ROOK_ENDGAME);
      
      expect(result.isTablebasePosition).toBe(true);
      expect(result.pieceCount).toBe(3); // K + R + K
    });
  });

  describe('Evaluation Text', () => {
    test('should format winning positions correctly', () => {
      const result = {
        wdl: 2,
        dtz: 15,
        precise: true,
        category: 'win' as const
      };
      
      const text = service.getEvaluationText(result);
      expect(text).toBe('Gewinn in 15 Zügen');
    });

    test('should format draw positions correctly', () => {
      const result = {
        wdl: 0,
        dtz: null,
        precise: true,
        category: 'draw' as const
      };
      
      const text = service.getEvaluationText(result);
      expect(text).toBe('Theoretisches Remis');
    });

    test('should format losing positions correctly', () => {
      const result = {
        wdl: -2,
        dtz: -20,
        precise: true,
        category: 'loss' as const
      };
      
      const text = service.getEvaluationText(result);
      expect(text).toBe('Verlust in 20 Zügen');
    });
  });

  describe('Caching', () => {
    test('should cache successful queries', async () => {
      // First query
      const result1 = await service.queryPosition(KING_PAWN_ENDGAME);
      
      // Second query (should use cache)
      const result2 = await service.queryPosition(KING_PAWN_ENDGAME);
      
      expect(result1).toEqual(result2);
    });

    test('should clear cache when requested', async () => {
      await service.queryPosition(KING_PAWN_ENDGAME);
      expect(service['cache'].size).toBeGreaterThan(0);
      
      service.clearCache();
      expect(service['cache'].size).toBe(0);
    });
  });

  describe('Move Sorting', () => {
    test('should sort moves by WDL then DTZ', () => {
      const moves = [
        { uci: 'a1b1', san: 'Kb1', wdl: 1, dtz: 30, precise: true },
        { uci: 'a1a2', san: 'Ka2', wdl: 2, dtz: 15, precise: true },
        { uci: 'a1b2', san: 'Kb2', wdl: 2, dtz: 10, precise: true },
      ];
      
      const result = {
        wdl: 2,
        dtz: 10,
        precise: true,
        category: 'win' as const,
        moves
      };
      
      const sorted = service.getBestMoves(result);
      
      // Should be sorted: Kb2 (WDL=2, DTZ=10), Ka2 (WDL=2, DTZ=15), Kb1 (WDL=1, DTZ=30)
      expect(sorted[0].san).toBe('Kb2');
      expect(sorted[1].san).toBe('Ka2');
      expect(sorted[2].san).toBe('Kb1');
    });
  });
});

// Integration test with actual API (skip in CI)
describe('Tablebase API Integration', () => {
  const shouldRunIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';
  
  test.skip('should query actual tablebase API', async () => {
    if (!shouldRunIntegrationTests) return;
    
    const result = await tablebaseService.queryPosition(KING_PAWN_ENDGAME);
    
    expect(result.isTablebasePosition).toBe(true);
    if (result.result) {
      expect(result.result.wdl).toBeDefined();
      expect(result.result.category).toBeDefined();
    }
  });
});