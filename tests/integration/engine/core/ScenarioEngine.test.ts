import { Chess } from 'chess.js';
import { ScenarioEngine } from '../ScenarioEngine';
import { Engine } from '../engine';

// Mock the Engine class to provide predictable evaluations
jest.mock('../engine', () => ({
  Engine: {
    getInstance: jest.fn()
  }
}));

const MockedEngine = Engine as jest.Mocked<typeof Engine>;

describe('ScenarioEngine - King and Pawn Endgame', () => {
  let mockEngineInstance: jest.Mocked<Engine>;
  let scenarioEngine: ScenarioEngine;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a mock engine instance
    mockEngineInstance = {
      evaluatePosition: jest.fn(),
      getBestMove: jest.fn(),
      reset: jest.fn(),
      quit: jest.fn(),
    } as any;

    // Mock the singleton getInstance method
    (MockedEngine.getInstance as jest.Mock).mockReturnValue(mockEngineInstance);
  });

  describe('Critical Mistake Detection in K+P vs K Endgame', () => {
    const initialFen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1'; // White King e6, Black King e8, White Pawn e5
    
    beforeEach(() => {
      scenarioEngine = new ScenarioEngine(initialFen);
    });

    afterEach(() => {
      scenarioEngine.quit();
    });

    it('should recognize Kf6 as a good move (winning to winning)', async () => {
      // Setup: Initial position is winning for White (+4268 cp tablebase score)
      const fenBefore = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      const fenAfter = '4k3/8/5K2/4P3/8/8/8/8 b - - 1 1'; // After 1.Kf6
      
      // Mock evaluations: both positions show White winning with tablebase scores
      mockEngineInstance.evaluatePosition
        .mockResolvedValueOnce({ score: 4268, mate: null }) // Before Kf6
        .mockResolvedValueOnce({ score: 4268, mate: null }); // After Kf6
      
      const isMistake = await scenarioEngine.isCriticalMistake(fenBefore, fenAfter);
      
      expect(isMistake).toBe(false);
      expect(mockEngineInstance.evaluatePosition).toHaveBeenCalledTimes(2);
      expect(mockEngineInstance.evaluatePosition).toHaveBeenCalledWith(fenBefore);
      expect(mockEngineInstance.evaluatePosition).toHaveBeenCalledWith(fenAfter);
    });

    it('should recognize Kg5 as a critical mistake (winning to draw)', async () => {
      // Setup: After 1.Kf6 Kf8, White plays 2.Kg5 (allowing the draw)
      const fenBefore = '5k2/8/8/4PK2/8/8/8/8 w - - 2 2'; // White King f5, Black King f8, Pawn e5
      const fenAfter = '5k2/8/8/4P1K1/8/8/8/8 b - - 3 2'; // After 2.Kg5
      
      // Mock evaluations: 
      // - Before: White still winning (tablebase score)
      // - After: Position is drawn (0 cp)
      mockEngineInstance.evaluatePosition
        .mockResolvedValueOnce({ score: 4268, mate: null }) // Before Kg5 (winning)
        .mockResolvedValueOnce({ score: 0, mate: null });    // After Kg5 (draw)
      
      const isMistake = await scenarioEngine.isCriticalMistake(fenBefore, fenAfter);
      
      expect(isMistake).toBe(true);
      expect(mockEngineInstance.evaluatePosition).toHaveBeenCalledTimes(2);
    });

    it('should handle the complete sequence: good move followed by blunder', async () => {
      // Test the complete sequence described in the user's scenario
      
      // Step 1: Test 1.Kf6 (should be good)
      const initialPos = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      const afterKf6 = '4k3/8/5K2/4P3/8/8/8/8 b - - 1 1';
      
      mockEngineInstance.evaluatePosition
        .mockResolvedValueOnce({ score: 4268, mate: null })
        .mockResolvedValueOnce({ score: 4268, mate: null });
      
      const kf6IsMistake = await scenarioEngine.isCriticalMistake(initialPos, afterKf6);
      expect(kf6IsMistake).toBe(false);
      
      // Step 2: Simulate Black's response Kf8
      const chess = new Chess(afterKf6);
      chess.move('Kf8');
      const afterKf8 = chess.fen(); // Should be: 5k2/8/5K2/4P3/8/8/8/8 w - - 2 2
      
      // Step 3: Test 2.Kg5 (should be a blunder)
      chess.move('Kg5');
      const afterKg5 = chess.fen(); // Should be: 5k2/8/8/4P1K1/8/8/8/8 b - - 3 2
      
      mockEngineInstance.evaluatePosition
        .mockResolvedValueOnce({ score: 4268, mate: null }) // Before Kg5 (still winning)
        .mockResolvedValueOnce({ score: 0, mate: null });    // After Kg5 (draw)
      
      const kg5IsMistake = await scenarioEngine.isCriticalMistake(afterKf8, afterKg5);
      expect(kg5IsMistake).toBe(true);
    });

    it('should detect sign flip from winning to losing', async () => {
      const fenBefore = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      const fenAfter = '4k3/8/4K3/4P3/8/8/8/8 b - - 1 1'; // Hypothetical bad move
      
      // Mock: White was winning, now Black is winning (after perspective flip)
      mockEngineInstance.evaluatePosition
        .mockResolvedValueOnce({ score: 300, mate: null })  // White advantage
        .mockResolvedValueOnce({ score: 300, mate: null }); // Black advantage (before flip)
      
      const isMistake = await scenarioEngine.isCriticalMistake(fenBefore, fenAfter);
      // Since sideToMove changes from w to b, the score gets flipped to -300, creating a sign flip
      expect(isMistake).toBe(true);
    });

    it('should detect loss of forced mate', async () => {
      const fenBefore = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      const fenAfter = '4k3/8/4K3/4P3/8/8/8/8 b - - 1 1';
      
      // Mock: Had mate in 5, now just a normal advantage
      mockEngineInstance.evaluatePosition
        .mockResolvedValueOnce({ score: 10000, mate: 5 })   // Mate in 5
        .mockResolvedValueOnce({ score: 200, mate: null }); // Just an advantage
      
      const isMistake = await scenarioEngine.isCriticalMistake(fenBefore, fenAfter);
      expect(isMistake).toBe(true);
    });

    it('should not flag small evaluation changes as mistakes', async () => {
      const fenBefore = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      const fenAfter = '4k3/8/5K2/4P3/8/8/8/8 w - - 1 1'; // Same side to move (w)
      
      // Mock: Small evaluation change (within threshold) - same side so no flip
      mockEngineInstance.evaluatePosition
        .mockResolvedValueOnce({ score: 150, mate: null })
        .mockResolvedValueOnce({ score: 100, mate: null }); // Drop of 50 cp (below 200 threshold)
      
      const isMistake = await scenarioEngine.isCriticalMistake(fenBefore, fenAfter);
      expect(isMistake).toBe(false);
    });

    it('should handle tablebase scores correctly (no flip needed)', async () => {
      const fenBefore = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      const fenAfter = '4k3/8/5K2/4P3/8/8/8/8 b - - 1 1';
      
      // Mock: Both positions have tablebase scores (>3000), no flipping should occur
      mockEngineInstance.evaluatePosition
        .mockResolvedValueOnce({ score: 4268, mate: null })
        .mockResolvedValueOnce({ score: 4268, mate: null });
      
      const isMistake = await scenarioEngine.isCriticalMistake(fenBefore, fenAfter);
      expect(isMistake).toBe(false);
    });
  });

  describe('getBestMove functionality', () => {
    it('should return SAN format move string', async () => {
      const fen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      scenarioEngine = new ScenarioEngine(fen);
      
      // Mock engine to return a Move object
      mockEngineInstance.getBestMove.mockResolvedValue({
        from: 'e6',
        to: 'f6',
        piece: 'k',
        color: 'w',
        san: 'Kf6'
      } as any);

      const bestMove = await scenarioEngine.getBestMove(fen);
      expect(bestMove).toBe('e6f6'); // UCI notation (from-to format)
      expect(mockEngineInstance.getBestMove).toHaveBeenCalledWith(fen);
    });

    it('should return null when no move available', async () => {
      const fen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      scenarioEngine = new ScenarioEngine(fen);
      
      mockEngineInstance.getBestMove.mockResolvedValue(null);
      
      const bestMove = await scenarioEngine.getBestMove(fen);
      expect(bestMove).toBe(null);
    });
  });
}); 