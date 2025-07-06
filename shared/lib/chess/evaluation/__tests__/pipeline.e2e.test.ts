/**
 * End-to-End tests for the Unified Evaluation Pipeline
 * Tests the complete flow from input to formatted output
 */

import './jest.setup'; // Setup mocks
import { UnifiedEvaluationService } from '../unifiedService';
import { EngineProviderAdapter, TablebaseProviderAdapter } from '../providerAdapters';
import { LRUCache } from '@shared/lib/cache/LRUCache';
import type { FormattedEvaluation } from '@shared/types/evaluation';
import type { ICacheProvider } from '../providers';

// Mock the engine and tablebase services
jest.mock('@shared/services/chess/EngineService');
jest.mock('@shared/lib/cache/LRUCache');

describe.skip('Unified Evaluation Pipeline E2E Tests', () => {
  let unifiedService: UnifiedEvaluationService;
  let mockCache: ICacheProvider<FormattedEvaluation>;

  beforeEach(() => {
    // Enable the unified evaluation system for these tests
    process.env.NEXT_PUBLIC_UNIFIED_EVAL = 'true';
    
    // Create mock cache that implements ICacheProvider
    mockCache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined)
    };
    
    // Create service with real providers
    const engineProvider = new EngineProviderAdapter();
    const tablebaseProvider = new TablebaseProviderAdapter();
    
    unifiedService = new UnifiedEvaluationService(
      engineProvider,
      tablebaseProvider,
      mockCache,
      { enableCaching: false } // Disable caching for predictable tests
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Pipeline Flow', () => {
    it('should process a winning position for White correctly', async () => {
      // Mock engine evaluation: +3.5 (White is winning)
      const mockEngineService = require('@shared/services/chess/EngineService').EngineService;
      mockEngineService.getInstance.mockReturnValue({
        getEngine: jest.fn().mockResolvedValue({
          getEvaluation: jest.fn().mockResolvedValue({
            score: 350, // +3.5 in centipawns
            mate: null
          })
        }),
        releaseEngine: jest.fn()
      });

      const fen = 'r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
      
      // Test from White's perspective
      const whiteResult = await unifiedService.getFormattedEvaluation(fen, 'w');
      expect(whiteResult.mainText).toBe('+3.50');
      expect(whiteResult.className).toBe('advantage');
      
      // Test from Black's perspective (should show -3.50)
      const blackResult = await unifiedService.getFormattedEvaluation(fen, 'b');
      expect(blackResult.mainText).toBe('-3.50');
      expect(blackResult.className).toBe('disadvantage');
    });

    it('should handle mate announcements correctly', async () => {
      // Mock engine evaluation: Mate in 5 for White
      const mockEngineService = require('@shared/services/chess/EngineService').EngineService;
      mockEngineService.getInstance.mockReturnValue({
        getEngine: jest.fn().mockResolvedValue({
          getEvaluation: jest.fn().mockResolvedValue({
            score: 0,
            mate: 5 // Mate in 5 moves
          })
        }),
        releaseEngine: jest.fn()
      });

      const fen = 'r1b1kb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
      
      // From White's perspective
      const whiteResult = await unifiedService.getFormattedEvaluation(fen, 'w');
      expect(whiteResult.mainText).toBe('M+5');
      expect(whiteResult.className).toBe('winning');
      
      // From Black's perspective
      const blackResult = await unifiedService.getFormattedEvaluation(fen, 'b');
      expect(blackResult.mainText).toBe('M-5');
      expect(blackResult.className).toBe('losing');
    });

    it('should prioritize tablebase over engine evaluation', async () => {
      // Mock both engine and tablebase responses
      const mockEngineService = require('@shared/services/chess/EngineService').EngineService;
      mockEngineService.getInstance.mockReturnValue({
        getEngine: jest.fn().mockImplementation((type) => {
          if (type === 'evaluation') {
            return Promise.resolve({
              getEvaluation: jest.fn().mockResolvedValue({
                score: 100,
                mate: null
              })
            });
          } else if (type === 'tablebase') {
            return Promise.resolve({
              getTablebaseInfo: jest.fn().mockResolvedValue({
                isTablebasePosition: true,
                result: {
                  wdl: 2, // Win for White
                  dtz: 25,
                  category: 'win',
                  precise: true
                }
              })
            });
          }
        }),
        releaseEngine: jest.fn()
      });

      const fen = 'K7/8/8/8/8/8/8/k2R4 w - - 0 1'; // KR vs K endgame
      
      const result = await unifiedService.getFormattedEvaluation(fen, 'w');
      
      // Should show tablebase result, not engine score
      expect(result.mainText).toBe('TB Win');
      expect(result.detailText).toBe('DTZ: 25');
      expect(result.metadata.isTablebase).toBe(true);
    });

    it('should handle provider errors gracefully', async () => {
      // Mock engine to throw error
      const mockEngineService = require('@shared/services/chess/EngineService').EngineService;
      mockEngineService.getInstance.mockReturnValue({
        getEngine: jest.fn().mockRejectedValue(new Error('Engine failed')),
        releaseEngine: jest.fn()
      });

      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      const result = await unifiedService.getFormattedEvaluation(fen, 'w');
      
      // Should return error formatting
      expect(result.mainText).toBe('...');
      expect(result.className).toBe('neutral');
      expect(result.metadata.isTablebase).toBe(false);
    });

    it('should handle drawn positions correctly', async () => {
      // Mock engine evaluation: 0.0 (drawn position)
      const mockEngineService = require('@shared/services/chess/EngineService').EngineService;
      mockEngineService.getInstance.mockReturnValue({
        getEngine: jest.fn().mockResolvedValue({
          getEvaluation: jest.fn().mockResolvedValue({
            score: 0,
            mate: null
          })
        }),
        releaseEngine: jest.fn()
      });

      const fen = '8/8/8/8/8/8/8/8 w - - 0 1'; // Empty board (theoretical)
      
      const result = await unifiedService.getFormattedEvaluation(fen, 'w');
      expect(result.mainText).toBe('0.00');
      expect(result.className).toBe('neutral');
    });
  });

  describe('Move Quality Analysis', () => {
    it('should correctly identify a blunder', async () => {
      // Mock evaluations before and after a bad move
      const mockEngineService = require('@shared/services/chess/EngineService').EngineService;
      let callCount = 0;
      
      mockEngineService.getInstance.mockReturnValue({
        getEngine: jest.fn().mockResolvedValue({
          getEvaluation: jest.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              // Before move: +5.0 (winning)
              return Promise.resolve({ score: 500, mate: null });
            } else {
              // After move: -2.0 (losing)
              return Promise.resolve({ score: -200, mate: null });
            }
          })
        }),
        releaseEngine: jest.fn()
      });

      // Get evaluations for move quality analysis
      const evalBefore = await unifiedService.getPerspectiveEvaluation(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        'w'
      );
      
      const evalAfter = await unifiedService.getPerspectiveEvaluation(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1',
        'w'
      );
      
      // The evaluations should reflect the dramatic change
      expect(evalBefore.perspectiveScore).toBe(500);
      expect(evalAfter.perspectiveScore).toBe(-200);
    });
  });

  describe('Dual Evaluation Display', () => {
    it('should return both engine and tablebase evaluations', async () => {
      // Mock both providers
      const mockEngineService = require('@shared/services/chess/EngineService').EngineService;
      mockEngineService.getInstance.mockReturnValue({
        getEngine: jest.fn().mockImplementation((type) => {
          if (type === 'evaluation') {
            return Promise.resolve({
              getEvaluation: jest.fn().mockResolvedValue({
                score: 150,
                mate: null
              })
            });
          } else if (type === 'tablebase') {
            return Promise.resolve({
              getTablebaseInfo: jest.fn().mockResolvedValue({
                isTablebasePosition: true,
                result: {
                  wdl: 2,
                  dtz: 15,
                  category: 'win',
                  precise: true
                }
              })
            });
          }
        }),
        releaseEngine: jest.fn()
      });

      const fen = 'K7/8/8/8/8/8/8/k2R4 w - - 0 1';
      const result = await unifiedService.getFormattedDualEvaluation(fen, 'w');
      
      expect(result.engine).toBeDefined();
      expect(result.engine.mainText).toBe('+1.50');
      
      expect(result.tablebase).toBeDefined();
      expect(result.tablebase?.mainText).toBe('TB Win');
    });
  });
});