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

// Mock the engine singleton that EngineProviderAdapter actually uses
jest.mock('../../../../../shared/lib/chess/engine/singleton', () => ({
  engine: {
    evaluatePositionEnhanced: jest.fn()
  }
}));

describe('Provider Adapters', () => {
  let mockEngine: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Get the mocked engine from the singleton module
    const { engine } = require('../../../../../shared/lib/chess/engine/singleton');
    mockEngine = engine;
  });

  describe('EngineProviderAdapter', () => {
    let adapter: EngineProviderAdapter;

    beforeEach(() => {
      adapter = new EngineProviderAdapter();
    });

    describe('getEvaluation', () => {
      it('should return engine evaluation with score', async () => {
        const mockEvaluationResult = {
          score: 150,
          mate: null,
          depth: 20,
          nodes: 1000000,
          time: 2000,
          pv: ['e2e4', 'e7e5'],
          pvString: 'e2e4 e7e5',
          nps: 500000,
          hashfull: 50,
          seldepth: 22,
          multipv: 1,
          currmove: 'e2e4',
          currmovenumber: 1
        };
        
        mockEngine.evaluatePositionEnhanced.mockResolvedValue(mockEvaluationResult);
        
        const result = await adapter.getEvaluation('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'w');
        
        expect(result).toEqual({
          score: 150,
          mate: null,
          evaluation: '1.50',
          depth: 20,
          nodes: 1000000,
          time: 2000,
          pv: ['e2e4', 'e7e5'],
          pvString: 'e2e4 e7e5',
          nps: 500000,
          hashfull: 50,
          seldepth: 22,
          multipv: 1,
          currmove: 'e2e4',
          currmovenumber: 1
        });
        
        expect(mockEngine.evaluatePositionEnhanced).toHaveBeenCalledWith('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', false);
      });

      it('should return engine evaluation with mate', async () => {
        const mockEvaluationResult = {
          score: 0,
          mate: 5,
          depth: 15,
          nodes: 500000,
          time: 1000,
          pv: ['Ka8', 'Qb8#'],
          pvString: 'Ka8 Qb8#',
          nps: 500000,
          hashfull: 25,
          seldepth: 15,
          multipv: 1,
          currmove: 'Ka8',
          currmovenumber: 1
        };
        
        mockEngine.evaluatePositionEnhanced.mockResolvedValue(mockEvaluationResult);
        
        const result = await adapter.getEvaluation('8/8/8/8/8/2k5/1q6/K7 w - - 0 1', 'w');
        
        expect(result).toEqual({
          score: 0,
          mate: 5,
          evaluation: '#5',
          depth: 15,
          nodes: 500000,
          time: 1000,
          pv: ['Ka8', 'Qb8#'],
          pvString: 'Ka8 Qb8#',
          nps: 500000,
          hashfull: 25,
          seldepth: 15,
          multipv: 1,
          currmove: 'Ka8',
          currmovenumber: 1
        });
        
        expect(mockEngine.evaluatePositionEnhanced).toHaveBeenCalledWith('8/8/8/8/8/2k5/1q6/K7 w - - 0 1', false);
      });

      it('should handle negative mate values', async () => {
        const mockEvaluationResult = {
          score: 0,
          mate: -3,
          depth: 15,
          nodes: 200000,
          time: 800,
          pv: ['Kb8', 'Qb7#'],
          pvString: 'Kb8 Qb7#',
          nps: 250000,
          hashfull: 30,
          seldepth: 15,
          multipv: 1,
          currmove: 'Kb8',
          currmovenumber: 1
        };
        
        mockEngine.evaluatePositionEnhanced.mockResolvedValue(mockEvaluationResult);
        
        const result = await adapter.getEvaluation('8/8/8/8/8/2K5/1Q6/k7 b - - 0 1', 'b');
        
        expect(result).toEqual({
          score: 0,
          mate: -3,
          evaluation: '#3', // Absolute value for display
          depth: 15,
          nodes: 200000,
          time: 800,
          pv: ['Kb8', 'Qb7#'],
          pvString: 'Kb8 Qb7#',
          nps: 250000,
          hashfull: 30,
          seldepth: 15,
          multipv: 1,
          currmove: 'Kb8',
          currmovenumber: 1
        });
        
        expect(mockEngine.evaluatePositionEnhanced).toHaveBeenCalledWith('8/8/8/8/8/2K5/1Q6/k7 b - - 0 1', false);
      });

      it('should format score to 2 decimal places', async () => {
        const mockEvaluationResult = {
          score: 237,
          mate: null,
          depth: 15,
          nodes: 300000,
          time: 1200,
          pv: [],
          pvString: '',
          nps: 250000,
          hashfull: 40,
          seldepth: 16,
          multipv: 1,
          currmove: '',
          currmovenumber: 1
        };
        
        mockEngine.evaluatePositionEnhanced.mockResolvedValue(mockEvaluationResult);
        
        const result = await adapter.getEvaluation('8/8/8/8/8/8/8/8 w - - 0 1', 'w');
        
        expect(result?.evaluation).toBe('2.37');
        expect(mockEngine.evaluatePositionEnhanced).toHaveBeenCalledWith('8/8/8/8/8/8/8/8 w - - 0 1', false);
      });

      it('should handle negative scores', async () => {
        const mockEvaluationResult = {
          score: -450,
          mate: null,
          depth: 15,
          nodes: 400000,
          time: 1600,
          pv: [],
          pvString: '',
          nps: 250000,
          hashfull: 35,
          seldepth: 17,
          multipv: 1,
          currmove: '',
          currmovenumber: 1
        };
        
        mockEngine.evaluatePositionEnhanced.mockResolvedValue(mockEvaluationResult);
        
        const result = await adapter.getEvaluation('8/8/8/8/8/8/8/8 b - - 0 1', 'b');
        
        expect(result).toEqual({
          score: -450,
          mate: null,
          evaluation: '-4.50',
          depth: 15,
          nodes: 400000,
          time: 1600,
          pv: [],
          pvString: '',
          nps: 250000,
          hashfull: 35,
          seldepth: 17,
          multipv: 1,
          currmove: '',
          currmovenumber: 1
        });
        
        expect(mockEngine.evaluatePositionEnhanced).toHaveBeenCalledWith('8/8/8/8/8/8/8/8 b - - 0 1', false);
      });

      it('should return null when engine returns null', async () => {
        mockEngine.evaluatePositionEnhanced.mockResolvedValue(null);
        
        const result = await adapter.getEvaluation('invalid fen', 'w');
        
        expect(result).toBeNull();
      });

      it('should return null when engine throws error', async () => {
        mockEngine.evaluatePositionEnhanced.mockRejectedValue(new Error('Engine error'));
        
        const result = await adapter.getEvaluation('8/8/8/8/8/8/8/8 w - - 0 1', 'w');
        
        expect(result).toBeNull();
      });

      it('should return null when evaluatePositionEnhanced throws error', async () => {
        mockEngine.evaluatePositionEnhanced.mockRejectedValue(new Error('Service error'));
        
        const result = await adapter.getEvaluation('8/8/8/8/8/8/8/8 w - - 0 1', 'w');
        
        expect(result).toBeNull();
      });

      it('should handle mate 0 correctly', async () => {
        const mockEvaluationResult = {
          score: 0,
          mate: 0,
          depth: 15,
          nodes: 100000,
          time: 500,
          pv: [],
          pvString: '',
          nps: 200000,
          hashfull: 20,
          seldepth: 15,
          multipv: 1,
          currmove: '',
          currmovenumber: 1
        };
        
        mockEngine.evaluatePositionEnhanced.mockResolvedValue(mockEvaluationResult);
        
        const result = await adapter.getEvaluation('8/8/8/8/8/8/8/8 w - - 0 1', 'w');
        
        // mate: 0 is falsy, so it uses score format instead
        expect(result).toEqual({
          score: 0,
          mate: 0, // Keep the original mate value
          evaluation: '0.00', // Since mate is 0 (falsy), it uses score format
          depth: 15,
          nodes: 100000,
          time: 500,
          pv: [],
          pvString: '',
          nps: 200000,
          hashfull: 20,
          seldepth: 15,
          multipv: 1,
          currmove: '',
          currmovenumber: 1
        });
        
        expect(mockEngine.evaluatePositionEnhanced).toHaveBeenCalledWith('8/8/8/8/8/8/8/8 w - - 0 1', false);
      });

      it('should handle score 0 correctly', async () => {
        const mockEvaluationResult = {
          score: 0,
          mate: null,
          depth: 15,
          nodes: 150000,
          time: 600,
          pv: [],
          pvString: '',
          nps: 250000,
          hashfull: 25,
          seldepth: 15,
          multipv: 1,
          currmove: '',
          currmovenumber: 1
        };
        
        mockEngine.evaluatePositionEnhanced.mockResolvedValue(mockEvaluationResult);
        
        const result = await adapter.getEvaluation('8/8/8/8/8/8/8/8 w - - 0 1', 'w');
        
        expect(result).toEqual({
          score: 0,
          mate: null,
          evaluation: '0.00',
          depth: 15,
          nodes: 150000,
          time: 600,
          pv: [],
          pvString: '',
          nps: 250000,
          hashfull: 25,
          seldepth: 15,
          multipv: 1,
          currmove: '',
          currmovenumber: 1
        });
        
        expect(mockEngine.evaluatePositionEnhanced).toHaveBeenCalledWith('8/8/8/8/8/8/8/8 w - - 0 1', false);
      });
    });
  });

  describe('TablebaseProviderAdapter', () => {
    let adapter: TablebaseProviderAdapter;

    beforeEach(() => {
      adapter = new TablebaseProviderAdapter();
    });

    describe('getEvaluation', () => {
      it('should return tablebase result for valid positions', async () => {
        const result = await adapter.getEvaluation('8/8/8/8/8/8/P7/k6K w - - 0 1', 'w');
        
        // With Phase 3.2 implementation, should return actual tablebase data
        expect(result).not.toBeNull();
        expect(result).toHaveProperty('wdl');
        expect(result).toHaveProperty('category');
        expect(result).toHaveProperty('precise');
      });

      // TODO: Re-enable these tests when tablebase integration is implemented
      /*
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
      */
    });
  });
});