/**
 * @fileoverview Unit tests for InstanceManager
 * Tests instance counting, FEN validation, and Chess instance management
 */

// Mock dependencies before imports
jest.mock('chess.js');
jest.mock('@shared/utils/fenValidator');

import { Chess } from 'chess.js';
import { validateAndSanitizeFen } from '@shared/utils/fenValidator';
import { InstanceManager } from '@shared/lib/chess/ScenarioEngine/core/instanceManager';

describe('InstanceManager', () => {
  const validFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const customFen = 'rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2';
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset instance count for each test
    InstanceManager.resetInstanceCount();
    
    // Default mock for validateAndSanitizeFen - returns valid
    (validateAndSanitizeFen as jest.Mock).mockReturnValue({
      isValid: true,
      sanitized: validFen,
      errors: []
    });
  });

  describe('validateFen', () => {
    it('should validate a valid FEN string', () => {
      expect(() => InstanceManager.validateFen(validFen)).not.toThrow();
      expect(validateAndSanitizeFen).toHaveBeenCalledWith(validFen);
    });

    it('should throw error for empty string', () => {
      expect(() => InstanceManager.validateFen('')).toThrow('FEN must be a non-empty string');
      expect(validateAndSanitizeFen).not.toHaveBeenCalled();
    });

    it('should throw error for null', () => {
      expect(() => InstanceManager.validateFen(null as any)).toThrow('FEN must be a non-empty string');
      expect(validateAndSanitizeFen).not.toHaveBeenCalled();
    });

    it('should throw error for undefined', () => {
      expect(() => InstanceManager.validateFen(undefined as any)).toThrow('FEN must be a non-empty string');
      expect(validateAndSanitizeFen).not.toHaveBeenCalled();
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => InstanceManager.validateFen('   ')).toThrow('FEN must be a non-empty string');
      expect(validateAndSanitizeFen).not.toHaveBeenCalled();
    });

    it('should throw error for invalid FEN format', () => {
      (validateAndSanitizeFen as jest.Mock).mockReturnValue({
        isValid: false,
        sanitized: '',
        errors: ['Invalid piece placement', 'Invalid active color']
      });

      expect(() => InstanceManager.validateFen('invalid-fen')).toThrow(
        '[ScenarioEngine] Invalid FEN format: Invalid piece placement, Invalid active color'
      );
    });
  });

  describe('Instance Counting', () => {
    it('should track instance count', () => {
      expect(InstanceManager.getInstanceCount()).toBe(0);
      
      InstanceManager.trackInstanceCount();
      expect(InstanceManager.getInstanceCount()).toBe(1);
      
      InstanceManager.trackInstanceCount();
      expect(InstanceManager.getInstanceCount()).toBe(2);
    });

    it('should decrement instance count', () => {
      InstanceManager.trackInstanceCount();
      InstanceManager.trackInstanceCount();
      expect(InstanceManager.getInstanceCount()).toBe(2);
      
      InstanceManager.decrementInstanceCount();
      expect(InstanceManager.getInstanceCount()).toBe(1);
      
      InstanceManager.decrementInstanceCount();
      expect(InstanceManager.getInstanceCount()).toBe(0);
    });

    it('should handle negative instance count', () => {
      expect(InstanceManager.getInstanceCount()).toBe(0);
      
      InstanceManager.decrementInstanceCount();
      expect(InstanceManager.getInstanceCount()).toBe(-1);
    });

    it('should reset instance count', () => {
      InstanceManager.trackInstanceCount();
      InstanceManager.trackInstanceCount();
      InstanceManager.trackInstanceCount();
      expect(InstanceManager.getInstanceCount()).toBe(3);
      
      InstanceManager.resetInstanceCount();
      expect(InstanceManager.getInstanceCount()).toBe(0);
    });
  });

  describe('validateEngineInitialization', () => {
    it('should pass with valid engine', () => {
      const mockEngine = {} as any;
      expect(() => InstanceManager.validateEngineInitialization(mockEngine)).not.toThrow();
    });

    it('should throw error for null engine', () => {
      expect(() => InstanceManager.validateEngineInitialization(null as any))
        .toThrow('[ScenarioEngine] Engine failed to initialize');
    });

    it('should throw error for undefined engine', () => {
      expect(() => InstanceManager.validateEngineInitialization(undefined as any))
        .toThrow('[ScenarioEngine] Engine failed to initialize');
    });
  });

  describe('createChessInstance', () => {
    let mockChessConstructor: jest.Mock;

    beforeEach(() => {
      mockChessConstructor = Chess as jest.Mock;
      mockChessConstructor.mockClear();
    });

    it('should create Chess instance with valid FEN', () => {
      const mockChessInstance = { fen: jest.fn() };
      mockChessConstructor.mockReturnValue(mockChessInstance);
      
      (validateAndSanitizeFen as jest.Mock).mockReturnValue({
        isValid: true,
        sanitized: validFen,
        errors: []
      });

      const result = InstanceManager.createChessInstance(validFen);

      expect(validateAndSanitizeFen).toHaveBeenCalledWith(validFen);
      expect(mockChessConstructor).toHaveBeenCalledWith(validFen);
      expect(result).toBe(mockChessInstance);
    });

    it('should throw error for invalid FEN', () => {
      (validateAndSanitizeFen as jest.Mock).mockReturnValue({
        isValid: false,
        sanitized: '',
        errors: ['Invalid FEN structure']
      });

      expect(() => InstanceManager.createChessInstance('invalid'))
        .toThrow('[ScenarioEngine] Invalid FEN: Invalid FEN structure');
      expect(mockChessConstructor).not.toHaveBeenCalled();
    });

    it('should throw error if Chess constructor fails', () => {
      mockChessConstructor.mockImplementation(() => {
        throw new Error('Chess.js error');
      });
      
      (validateAndSanitizeFen as jest.Mock).mockReturnValue({
        isValid: true,
        sanitized: validFen,
        errors: []
      });

      expect(() => InstanceManager.createChessInstance(validFen))
        .toThrow(`[ScenarioEngine] Invalid FEN: ${validFen}`);
    });

    it('should use sanitized FEN from validator', () => {
      const dirtyFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1; DROP TABLE;';
      const cleanFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      (validateAndSanitizeFen as jest.Mock).mockReturnValue({
        isValid: true,
        sanitized: cleanFen,
        errors: []
      });
      
      mockChessConstructor.mockReturnValue({ fen: jest.fn() });

      InstanceManager.createChessInstance(dirtyFen);

      expect(validateAndSanitizeFen).toHaveBeenCalledWith(dirtyFen);
      expect(mockChessConstructor).toHaveBeenCalledWith(cleanFen);
    });
  });

  describe('updateChessPosition', () => {
    let mockChess: jest.Mocked<Chess>;

    beforeEach(() => {
      mockChess = {
        load: jest.fn()
      } as any;
    });

    it('should update position with valid FEN', () => {
      (validateAndSanitizeFen as jest.Mock).mockReturnValue({
        isValid: true,
        sanitized: customFen,
        errors: []
      });

      InstanceManager.updateChessPosition(mockChess, customFen);

      expect(validateAndSanitizeFen).toHaveBeenCalledWith(customFen);
      expect(mockChess.load).toHaveBeenCalledWith(customFen);
    });

    it('should throw error for invalid FEN', () => {
      (validateAndSanitizeFen as jest.Mock).mockReturnValue({
        isValid: false,
        sanitized: '',
        errors: ['Invalid move counters']
      });

      expect(() => InstanceManager.updateChessPosition(mockChess, 'invalid'))
        .toThrow('[ScenarioEngine] Invalid FEN: Invalid move counters');
      expect(mockChess.load).not.toHaveBeenCalled();
    });

    it('should throw error if chess.load fails', () => {
      mockChess.load.mockImplementation(() => {
        throw new Error('Load failed');
      });
      
      (validateAndSanitizeFen as jest.Mock).mockReturnValue({
        isValid: true,
        sanitized: customFen,
        errors: []
      });

      expect(() => InstanceManager.updateChessPosition(mockChess, customFen))
        .toThrow(`[ScenarioEngine] Failed to load FEN: ${customFen}`);
    });

    it('should use sanitized FEN for loading', () => {
      const dirtyFen = 'position<script>alert(1)</script>';
      const cleanFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      (validateAndSanitizeFen as jest.Mock).mockReturnValue({
        isValid: true,
        sanitized: cleanFen,
        errors: []
      });

      InstanceManager.updateChessPosition(mockChess, dirtyFen);

      expect(mockChess.load).toHaveBeenCalledWith(cleanFen);
    });
  });

  describe('resetChessPosition', () => {
    let mockChess: jest.Mocked<Chess>;

    beforeEach(() => {
      mockChess = {
        load: jest.fn()
      } as any;
    });

    it('should reset to initial position', () => {
      (validateAndSanitizeFen as jest.Mock).mockReturnValue({
        isValid: true,
        sanitized: validFen,
        errors: []
      });

      InstanceManager.resetChessPosition(mockChess, validFen);

      expect(validateAndSanitizeFen).toHaveBeenCalledWith(validFen);
      expect(mockChess.load).toHaveBeenCalledWith(validFen);
    });

    it('should throw error for invalid initial FEN', () => {
      (validateAndSanitizeFen as jest.Mock).mockReturnValue({
        isValid: false,
        sanitized: '',
        errors: ['Missing castling availability']
      });

      expect(() => InstanceManager.resetChessPosition(mockChess, 'invalid'))
        .toThrow('[ScenarioEngine] Invalid initial FEN: Missing castling availability');
      expect(mockChess.load).not.toHaveBeenCalled();
    });

    it('should throw error if reset fails', () => {
      mockChess.load.mockImplementation(() => {
        throw new Error('Reset failed');
      });
      
      (validateAndSanitizeFen as jest.Mock).mockReturnValue({
        isValid: true,
        sanitized: validFen,
        errors: []
      });

      expect(() => InstanceManager.resetChessPosition(mockChess, validFen))
        .toThrow('[ScenarioEngine] Failed to reset to initial position');
    });

    it('should use sanitized initial FEN', () => {
      const dirtyFen = validFen + '"; system("rm -rf /")';
      
      (validateAndSanitizeFen as jest.Mock).mockReturnValue({
        isValid: true,
        sanitized: validFen,
        errors: []
      });

      InstanceManager.resetChessPosition(mockChess, dirtyFen);

      expect(mockChess.load).toHaveBeenCalledWith(validFen);
    });
  });
});