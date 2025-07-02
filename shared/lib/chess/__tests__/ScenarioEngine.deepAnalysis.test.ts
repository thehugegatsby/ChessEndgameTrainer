import { Chess } from 'chess.js';
import { ScenarioEngine } from '../ScenarioEngine';
import { Engine } from '../engine';

// Mock the Engine class
jest.mock('../engine', () => ({
  Engine: {
    getInstance: jest.fn()
  }
}));

const MockedEngine = Engine as jest.Mocked<typeof Engine>;

describe('ScenarioEngine - Deep Analysis', () => {
  let mockEngineInstance: jest.Mocked<Engine>;
  let scenarioEngine: ScenarioEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEngineInstance = {
      evaluatePosition: jest.fn(),
      getBestMove: jest.fn(),
      reset: jest.fn(),
      quit: jest.fn(),
    } as any;

    (MockedEngine.getInstance as jest.Mock).mockReturnValue(mockEngineInstance);
  });

  afterEach(() => {
    if (scenarioEngine) {
      scenarioEngine.quit();
    }
  });

  describe('Deep Analysis Triggering', () => {
    it('should handle identical tablebase scores without deep analysis', async () => {
      const initialFen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      const afterMoveFen = '4k3/8/5K2/4P3/8/8/8/8 b - - 1 1';
      
      scenarioEngine = new ScenarioEngine(initialFen);
      
      // Mock identical tablebase scores (>3000 cp)
      mockEngineInstance.evaluatePosition
        .mockResolvedValueOnce({ score: 4268, mate: null }) // Before
        .mockResolvedValueOnce({ score: 4268, mate: null }); // After
      
      const isMistake = await scenarioEngine.isCriticalMistake(initialFen, afterMoveFen);
      
      // New simplified implementation doesn't use deep analysis
      expect(isMistake).toBe(false); // No blunder detected
    });

    it('should handle regular evaluation scores correctly', async () => {
      const initialFen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      const afterMoveFen = '4k3/8/5K2/4P3/8/8/8/8 b - - 1 1';
      
      scenarioEngine = new ScenarioEngine(initialFen);
      
      // Mock regular evaluation scores (<3000 cp) - need to flip for side change
      mockEngineInstance.evaluatePosition
        .mockResolvedValueOnce({ score: 150, mate: null })
        .mockResolvedValueOnce({ score: 100, mate: null }); // Will be flipped to -100
      
      const isMistake = await scenarioEngine.isCriticalMistake(initialFen, afterMoveFen);
      
      // New implementation uses simplified evaluation logic
      expect(isMistake).toBe(true); // Sign flip detected (150 to -100)
    });

    it('should handle same tablebase scores consistently', async () => {
      const initialFen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      const afterMoveFen = '4k3/8/5K2/4P3/8/8/8/8 b - - 1 1';
      
      scenarioEngine = new ScenarioEngine(initialFen);
      
      // Mock identical tablebase scores
      mockEngineInstance.evaluatePosition
        .mockResolvedValueOnce({ score: 4268, mate: null })
        .mockResolvedValueOnce({ score: 4268, mate: null });
      
      const isMistake = await scenarioEngine.isCriticalMistake(initialFen, afterMoveFen);
      
      // Simplified implementation doesn't trigger deep analysis
      expect(isMistake).toBe(false);
    });
  });

  describe('Simplified Evaluation Logic', () => {
    it('should use basic evaluation without continuation analysis', async () => {
      const initialFen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      const afterMoveFen = '4k3/8/5K2/4P3/8/8/8/8 b - - 1 1';
      
      scenarioEngine = new ScenarioEngine(initialFen);
      
      // Mock basic evaluation
      mockEngineInstance.evaluatePosition
        .mockResolvedValueOnce({ score: 4268, mate: null })
        .mockResolvedValueOnce({ score: 4268, mate: null });
      
      const isMistake = await scenarioEngine.isCriticalMistake(initialFen, afterMoveFen);
      
      // No deep analysis in simplified implementation
      expect(mockEngineInstance.evaluatePosition).toHaveBeenCalledTimes(2);
      expect(isMistake).toBe(false);
    });

    it('should handle score differences correctly', async () => {
      const initialFen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      const afterMoveFen = '4k3/8/5K2/4P3/8/8/8/8 b - - 1 1';
      
      scenarioEngine = new ScenarioEngine(initialFen);
      
      // Mock different scores
      mockEngineInstance.evaluatePosition
        .mockResolvedValueOnce({ score: 4268, mate: null })
        .mockResolvedValueOnce({ score: 100, mate: null }); // Different score after move
      
      const isMistake = await scenarioEngine.isCriticalMistake(initialFen, afterMoveFen);
      
      expect(isMistake).toBe(true); // Significant score drop should be detected
    });
  });

  describe('Error Handling', () => {
    it('should handle evaluation errors gracefully', async () => {
      const initialFen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      const afterMoveFen = '4k3/8/5K2/4P3/8/8/8/8 b - - 1 1';
      
      scenarioEngine = new ScenarioEngine(initialFen);
      
      // Mock evaluation to throw error
      mockEngineInstance.evaluatePosition.mockRejectedValue(new Error('Engine error'));
      
      const isMistake = await scenarioEngine.isCriticalMistake(initialFen, afterMoveFen);
      
      expect(isMistake).toBe(false); // Should not crash
    });
  });

}); 