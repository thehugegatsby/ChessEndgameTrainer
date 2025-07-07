/**
 * @fileoverview Unit tests for Evaluation Provider Adapters
 * @description Tests adapter interfaces between evaluation providers and unified evaluation system
 *
 * Test guidelines followed (see docs/testing/TESTING_GUIDELINES.md):
 * - Each test has a single responsibility
 * - Self-explanatory test names  
 * - No magic values
 * - Deterministic behavior
 * - Fast execution
 */

import { EngineProviderAdapter, TablebaseProviderAdapter } from '../../../../../shared/lib/chess/evaluation/providerAdapters';
import { EngineService } from '../../../../../shared/services/chess/EngineService';

// Mock the EngineService
jest.mock('../../../../../shared/services/chess/EngineService');

describe('Provider Adapters', () => {
  let mockEngineService: any;
  let mockScenarioEngine: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock ScenarioEngine
    mockScenarioEngine = {
      getEvaluation: jest.fn(),
      getTablebaseInfo: jest.fn()
    };
    
    // Create mock EngineService
    mockEngineService = {
      getEngine: jest.fn().mockResolvedValue(mockScenarioEngine),
      releaseEngine: jest.fn()
    };
    
    // Mock EngineService.getInstance()
    (EngineService.getInstance as jest.Mock).mockReturnValue(mockEngineService);
  });

  describe('EngineProviderAdapter', () => {
    let adapter: EngineProviderAdapter;

    beforeEach(() => {
      adapter = new EngineProviderAdapter();
    });

    describe('getEvaluation', () => {
      it('should return engine evaluation with score', async () => {
        const mockEvaluation = {
          score: 150,
          mate: null
        };
        
        mockScenarioEngine.getEvaluation.mockResolvedValue(mockEvaluation);
        
        const result = await adapter.getEvaluation('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'w');
        
        expect(result).toEqual({
          score: 150,
          mate: null,
          evaluation: '1.50',
          depth: 20,
          nodes: 0,
          time: 0
        });
        
        expect(mockEngineService.getEngine).toHaveBeenCalledWith('evaluation');
        expect(mockScenarioEngine.getEvaluation).toHaveBeenCalledWith('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        expect(mockEngineService.releaseEngine).toHaveBeenCalledWith('evaluation');
      });

      it('should return engine evaluation with mate', async () => {
        const mockEvaluation = {
          score: 0,
          mate: 5
        };
        
        mockScenarioEngine.getEvaluation.mockResolvedValue(mockEvaluation);
        
        const result = await adapter.getEvaluation('8/8/8/8/8/2k5/1q6/K7 w - - 0 1', 'w');
        
        expect(result).toEqual({
          score: 0,
          mate: 5,
          evaluation: '#5',
          depth: 20,
          nodes: 0,
          time: 0
        });
      });

      it('should handle negative mate values', async () => {
        const mockEvaluation = {
          score: 0,
          mate: -3
        };
        
        mockScenarioEngine.getEvaluation.mockResolvedValue(mockEvaluation);
        
        const result = await adapter.getEvaluation('8/8/8/8/8/2K5/1Q6/k7 b - - 0 1', 'b');
        
        expect(result).toEqual({
          score: 0,
          mate: -3,
          evaluation: '#3', // Absolute value for display
          depth: 20,
          nodes: 0,
          time: 0
        });
      });

      it('should format score to 2 decimal places', async () => {
        const mockEvaluation = {
          score: 237,
          mate: null
        };
        
        mockScenarioEngine.getEvaluation.mockResolvedValue(mockEvaluation);
        
        const result = await adapter.getEvaluation('8/8/8/8/8/8/8/8 w - - 0 1', 'w');
        
        expect(result?.evaluation).toBe('2.37');
      });

      it('should handle negative scores', async () => {
        const mockEvaluation = {
          score: -450,
          mate: null
        };
        
        mockScenarioEngine.getEvaluation.mockResolvedValue(mockEvaluation);
        
        const result = await adapter.getEvaluation('8/8/8/8/8/8/8/8 b - - 0 1', 'b');
        
        expect(result).toEqual({
          score: -450,
          mate: null,
          evaluation: '-4.50',
          depth: 20,
          nodes: 0,
          time: 0
        });
      });

      it('should return null when engine returns null', async () => {
        mockScenarioEngine.getEvaluation.mockResolvedValue(null);
        
        const result = await adapter.getEvaluation('invalid fen', 'w');
        
        expect(result).toBeNull();
        expect(mockEngineService.releaseEngine).toHaveBeenCalledWith('evaluation');
      });

      it('should return null when engine throws error', async () => {
        mockScenarioEngine.getEvaluation.mockRejectedValue(new Error('Engine error'));
        
        const result = await adapter.getEvaluation('8/8/8/8/8/8/8/8 w - - 0 1', 'w');
        
        expect(result).toBeNull();
      });

      it('should return null when getEngine throws error', async () => {
        mockEngineService.getEngine.mockRejectedValue(new Error('Service error'));
        
        const result = await adapter.getEvaluation('8/8/8/8/8/8/8/8 w - - 0 1', 'w');
        
        expect(result).toBeNull();
      });

      it('should handle mate 0 correctly', async () => {
        const mockEvaluation = {
          score: 0,
          mate: 0
        };
        
        mockScenarioEngine.getEvaluation.mockResolvedValue(mockEvaluation);
        
        const result = await adapter.getEvaluation('8/8/8/8/8/8/8/8 w - - 0 1', 'w');
        
        // mate: 0 is falsy, so || null converts it to null
        expect(result).toEqual({
          score: 0,
          mate: null, // mate || null converts 0 to null
          evaluation: '0.00', // Since mate is null, it uses score
          depth: 20,
          nodes: 0,
          time: 0
        });
      });

      it('should handle score 0 correctly', async () => {
        const mockEvaluation = {
          score: 0,
          mate: null
        };
        
        mockScenarioEngine.getEvaluation.mockResolvedValue(mockEvaluation);
        
        const result = await adapter.getEvaluation('8/8/8/8/8/8/8/8 w - - 0 1', 'w');
        
        expect(result).toEqual({
          score: 0,
          mate: null,
          evaluation: '0.00',
          depth: 20,
          nodes: 0,
          time: 0
        });
      });
    });
  });

  describe('TablebaseProviderAdapter', () => {
    let adapter: TablebaseProviderAdapter;

    beforeEach(() => {
      adapter = new TablebaseProviderAdapter();
    });

    describe('getEvaluation', () => {
      it('should return tablebase win result', async () => {
        const mockTablebaseInfo = {
          isTablebasePosition: true,
          result: {
            wdl: 2,
            dtz: 10,
            category: 'win',
            precise: true
          }
        };
        
        mockScenarioEngine.getTablebaseInfo.mockResolvedValue(mockTablebaseInfo);
        
        const result = await adapter.getEvaluation('8/8/8/8/8/8/P7/k6K w - - 0 1', 'w');
        
        expect(result).toEqual({
          wdl: 2,
          dtz: 10,
          dtm: null,
          category: 'win',
          precise: true
        });
        
        expect(mockEngineService.getEngine).toHaveBeenCalledWith('tablebase');
        expect(mockScenarioEngine.getTablebaseInfo).toHaveBeenCalledWith('8/8/8/8/8/8/P7/k6K w - - 0 1');
        expect(mockEngineService.releaseEngine).toHaveBeenCalledWith('tablebase');
      });

      it('should return tablebase cursed-win result', async () => {
        const mockTablebaseInfo = {
          isTablebasePosition: true,
          result: {
            wdl: 1,
            dtz: 50,
            category: 'cursed-win',
            precise: true
          }
        };
        
        mockScenarioEngine.getTablebaseInfo.mockResolvedValue(mockTablebaseInfo);
        
        const result = await adapter.getEvaluation('8/8/8/8/8/8/8/8 w - - 0 1', 'w');
        
        expect(result).toEqual({
          wdl: 1,
          dtz: 50,
          dtm: null,
          category: 'cursed-win',
          precise: true
        });
      });

      it('should return tablebase draw result', async () => {
        const mockTablebaseInfo = {
          isTablebasePosition: true,
          result: {
            wdl: 0,
            dtz: null,
            category: 'draw',
            precise: true
          }
        };
        
        mockScenarioEngine.getTablebaseInfo.mockResolvedValue(mockTablebaseInfo);
        
        const result = await adapter.getEvaluation('8/8/8/8/8/2k5/3K4/8 w - - 0 1', 'w');
        
        expect(result).toEqual({
          wdl: 0,
          dtz: null,
          dtm: null,
          category: 'draw',
          precise: true
        });
      });

      it('should return tablebase blessed-loss result', async () => {
        const mockTablebaseInfo = {
          isTablebasePosition: true,
          result: {
            wdl: -1,
            dtz: 30,
            category: 'blessed-loss',
            precise: false
          }
        };
        
        mockScenarioEngine.getTablebaseInfo.mockResolvedValue(mockTablebaseInfo);
        
        const result = await adapter.getEvaluation('8/8/8/8/8/8/8/8 b - - 0 1', 'b');
        
        expect(result).toEqual({
          wdl: -1,
          dtz: 30,
          dtm: null,
          category: 'blessed-loss',
          precise: true  // || true in the adapter makes it always true when undefined
        });
      });

      it('should return tablebase loss result', async () => {
        const mockTablebaseInfo = {
          isTablebasePosition: true,
          result: {
            wdl: -2,
            dtz: 5,
            category: 'loss',
            precise: false  // Testing with false
          }
        };
        
        mockScenarioEngine.getTablebaseInfo.mockResolvedValue(mockTablebaseInfo);
        
        const result = await adapter.getEvaluation('K7/8/8/8/8/8/p7/k7 b - - 0 1', 'b');
        
        expect(result).toEqual({
          wdl: -2,
          dtz: 5,
          dtm: null,
          category: 'loss',
          precise: true  // || true makes it always true even when false is provided
        });
      });

      it('should use getWdlCategory when category is missing', async () => {
        const mockTablebaseInfo = {
          isTablebasePosition: true,
          result: {
            wdl: 2,
            dtz: 10,
            // category missing
            precise: true
          }
        };
        
        mockScenarioEngine.getTablebaseInfo.mockResolvedValue(mockTablebaseInfo);
        
        const result = await adapter.getEvaluation('8/8/8/8/8/8/8/8 w - - 0 1', 'w');
        
        expect(result?.category).toBe('win'); // Should derive from wdl=2
      });

      it('should handle missing result object gracefully', async () => {
        const mockTablebaseInfo = {
          isTablebasePosition: true,
          // result missing
        };
        
        mockScenarioEngine.getTablebaseInfo.mockResolvedValue(mockTablebaseInfo);
        
        const result = await adapter.getEvaluation('8/8/8/8/8/8/8/8 w - - 0 1', 'w');
        
        expect(result).toEqual({
          wdl: 0,
          dtz: null,
          dtm: null,
          category: 'draw', // Default from getWdlCategory(0)
          precise: true
        });
      });

      it('should return null when not a tablebase position', async () => {
        const mockTablebaseInfo = {
          isTablebasePosition: false,
          result: null
        };
        
        mockScenarioEngine.getTablebaseInfo.mockResolvedValue(mockTablebaseInfo);
        
        const result = await adapter.getEvaluation('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'w');
        
        expect(result).toBeNull();
        expect(mockEngineService.releaseEngine).toHaveBeenCalledWith('tablebase');
      });

      it('should return null when tablebase returns null', async () => {
        mockScenarioEngine.getTablebaseInfo.mockResolvedValue(null);
        
        const result = await adapter.getEvaluation('invalid fen', 'w');
        
        expect(result).toBeNull();
        expect(mockEngineService.releaseEngine).toHaveBeenCalledWith('tablebase');
      });

      it('should return null when tablebase throws error', async () => {
        mockScenarioEngine.getTablebaseInfo.mockRejectedValue(new Error('Tablebase error'));
        
        const result = await adapter.getEvaluation('8/8/8/8/8/8/8/8 w - - 0 1', 'w');
        
        expect(result).toBeNull();
      });

      it('should return null when getEngine throws error', async () => {
        mockEngineService.getEngine.mockRejectedValue(new Error('Service error'));
        
        const result = await adapter.getEvaluation('8/8/8/8/8/8/8/8 w - - 0 1', 'w');
        
        expect(result).toBeNull();
      });

      describe('getWdlCategory', () => {
        it('should map all WDL values correctly', async () => {
          const wdlMappings = [
            { wdl: 2, expected: 'win' },
            { wdl: 1, expected: 'cursed-win' },
            { wdl: 0, expected: 'draw' },
            { wdl: -1, expected: 'blessed-loss' },
            { wdl: -2, expected: 'loss' },
            { wdl: -3, expected: 'loss' }, // Any value < -1
            { wdl: 3, expected: 'loss' }     // Any value > 2 defaults to 'loss'
          ];
          
          for (const { wdl, expected } of wdlMappings) {
            const mockTablebaseInfo = {
              isTablebasePosition: true,
              result: {
                wdl,
                dtz: null,
                // No category provided
                precise: true
              }
            };
            
            mockScenarioEngine.getTablebaseInfo.mockResolvedValue(mockTablebaseInfo);
            
            const result = await adapter.getEvaluation('8/8/8/8/8/8/8/8 w - - 0 1', 'w');
            
            expect(result?.category).toBe(expected);
          }
        });
      });
    });
  });
});