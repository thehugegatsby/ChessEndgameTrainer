import { vi } from 'vitest';
/**
 * Tests for ChessServiceStranglerFacade
 * Verifies that the Strangler Pattern correctly switches between legacy and new implementations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FeatureFlag, featureFlags } from '../../shared/services/FeatureFlagService';
import { ChessService } from '../../shared/services/ChessServiceStranglerFacade';
import { COMMON_FENS } from '../../tests/fixtures/commonFens';

describe('ChessServiceStranglerFacade', () => {
  // Clean up feature flag overrides after each test
  afterEach(() => {
    featureFlags.clearOverrides();
  });

  describe('Feature Flag Switching', () => {
    it('should use legacy implementation when flag is disabled', () => {
      // Ensure feature flag is disabled
      featureFlags.override(FeatureFlag.USE_NEW_CHESS_CORE, false);
      
      // Test basic functionality
      const success = ChessService.initialize();
      expect(success).toBe(true);
      expect(ChessService.getFen()).toBe(COMMON_FENS.STARTING_POSITION);
    });

    it('should use new implementation when flag is enabled', () => {
      // Enable the new chess core
      featureFlags.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      
      // Test basic functionality
      const success = ChessService.initialize();
      expect(success).toBe(true);
      expect(ChessService.getFen()).toBe(COMMON_FENS.STARTING_POSITION);
    });

    it('should switch implementations dynamically', () => {
      // Start with legacy
      featureFlags.override(FeatureFlag.USE_NEW_CHESS_CORE, false);
      ChessService.initialize();
      ChessService.move('e4');
      
      const legacyFen = ChessService.getFen();
      expect(legacyFen).toBe(COMMON_FENS.OPENING_AFTER_E4);
      
      // Switch to new implementation
      featureFlags.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      
      // The proxy should now use the new implementation
      ChessService.reset();
      ChessService.initialize();
      ChessService.move('e4');
      
      const newFen = ChessService.getFen();
      expect(newFen).toBe(COMMON_FENS.OPENING_AFTER_E4);
      expect(newFen).toBe(legacyFen); // Should produce same result
    });
  });

  describe('Interface Compatibility', () => {
    beforeEach(() => {
      // Test with both implementations
    });


    it('should have consistent move operations interface', () => {
      testBothImplementations(() => {
        ChessService.initialize();
        
        const result = ChessService.move('e4');
        expect(result).toBeTruthy();
        expect(result?.from).toBe('e2');
        expect(result?.to).toBe('e4');
        expect(result?.piece).toBe('p');
      });
    });

    it('should have consistent validation interface', () => {
      testBothImplementations(() => {
        ChessService.initialize();
        
        expect(ChessService.validateMove('e4')).toBe(true);
        expect(ChessService.validateMove('e5')).toBe(false); // Invalid first move
      });
    });

    it('should have consistent game state interface', () => {
      testBothImplementations(() => {
        ChessService.initialize();
        
        expect(ChessService.isGameOver()).toBe(false);
        expect(ChessService.isCheck()).toBe(false);
        expect(ChessService.turn()).toBe('w');
        expect(ChessService.getCurrentMoveIndex()).toBe(-1);
      });
    });

    it('should have consistent navigation interface', () => {
      testBothImplementations(() => {
        ChessService.initialize();
        ChessService.move('e4');
        ChessService.move('e5');
        ChessService.move('Nf3');
        
        expect(ChessService.getCurrentMoveIndex()).toBe(2);
        
        const undoSuccess = ChessService.undo();
        expect(undoSuccess).toBe(true);
        expect(ChessService.getCurrentMoveIndex()).toBe(1);
        
        const redoSuccess = ChessService.redo();
        expect(redoSuccess).toBe(true);
        expect(ChessService.getCurrentMoveIndex()).toBe(2);
        
        const goToSuccess = ChessService.goToMove(0);
        expect(goToSuccess).toBe(true);
        expect(ChessService.getCurrentMoveIndex()).toBe(0);
      });
    });

    it('should have consistent PGN operations', () => {
      testBothImplementations(() => {
        ChessService.initialize();
        ChessService.move('e4');
        ChessService.move('e5');
        
        const pgn = ChessService.getPgn();
        expect(pgn).toContain('1. e4 e5');
        
        ChessService.reset();
        const loadSuccess = ChessService.loadPgn('1. d4 d5');
        expect(loadSuccess).toBe(true);
        expect(ChessService.getMoveHistory()).toHaveLength(2);
      });
    });
  });

  describe('Event System Compatibility', () => {
    it('should emit compatible events from both implementations', () => {
      const eventHandler = vi.fn();
      
      testBothImplementations(() => {
        const unsubscribe = ChessService.subscribe(eventHandler);
        
        ChessService.initialize();
        ChessService.move('e4');
        
        expect(eventHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'stateUpdate',
            payload: expect.objectContaining({
              fen: COMMON_FENS.OPENING_AFTER_E4,
              currentMoveIndex: expect.any(Number)
            })
          })
        );
        
        unsubscribe();
        eventHandler.mockClear();
      });
    });

    it('should handle unsubscribe correctly', () => {
      testBothImplementations(() => {
        const eventHandler = vi.fn();
        
        ChessService.initialize();
        const unsubscribe = ChessService.subscribe(eventHandler);
        
        ChessService.move('e4');
        expect(eventHandler).toHaveBeenCalledTimes(1);
        
        unsubscribe();
        ChessService.move('e5');
        expect(eventHandler).toHaveBeenCalledTimes(1); // Should not increase
        
        eventHandler.mockClear();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors consistently across implementations', () => {
      testBothImplementations(() => {
        // Invalid FEN should be handled gracefully
        const success = ChessService.initialize('invalid-fen');
        expect(success).toBe(false);
        
        // Invalid moves should return null
        ChessService.initialize();
        const invalidMove = ChessService.move('invalid-move');
        expect(invalidMove).toBeNull();
        
        // Invalid PGN should be handled gracefully
        const pgnSuccess = ChessService.loadPgn('invalid pgn');
        expect(pgnSuccess).toBe(false);
      });
    });
  });

  describe('Performance Characteristics', () => {
    it('should maintain similar performance across implementations', () => {
      const measureImplementation = () => {
        const start = performance.now();
        
        ChessService.initialize();
        for (let i = 0; i < 100; i++) {
          ChessService.move('e4');
          ChessService.undo();
        }
        
        return performance.now() - start;
      };

      // Measure legacy implementation
      featureFlags.override(FeatureFlag.USE_NEW_CHESS_CORE, false);
      const legacyTime = measureImplementation();

      // Measure new implementation
      featureFlags.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
      const newTime = measureImplementation();

      // New implementation should not be significantly slower
      // Allow up to 3x slower for complexity overhead
      expect(newTime).toBeLessThan(legacyTime * 3);
    });
  });

  describe('German Notation Support', () => {
    it('should support German notation in both implementations', () => {
      testBothImplementations(() => {
        ChessService.reset();
        ChessService.initialize();
        ChessService.move('e4');
        ChessService.move('e5');
        ChessService.move('Bc4');
        ChessService.move('Nc6');
        
        // Test German notation for Queen (Dame)
        const result = ChessService.move('Dh5');
        expect(result).toBeTruthy();
        expect(result?.piece).toBe('q');
        expect(result?.san).toBe('Qh5');
      });
    });
  });

  describe('Complex Game Scenarios', () => {
    it('should handle Scholar\'s Mate consistently', () => {
      testBothImplementations(() => {
        ChessService.initialize();
        
        ChessService.move('e4');
        ChessService.move('e5');
        ChessService.move('Bc4');
        ChessService.move('Nc6');
        ChessService.move('Qh5');
        ChessService.move('Nf6');
        const checkmateMove = ChessService.move('Qxf7#');
        
        expect(checkmateMove).toBeTruthy();
        expect(ChessService.isCheckmate()).toBe(true);
        expect(ChessService.getGameResult()).toBe('1-0');
      });
    });
  });
});

function testBothImplementations(testFn: () => void) {
  // Test with legacy implementation
  featureFlags.override(FeatureFlag.USE_NEW_CHESS_CORE, false);
  testFn();
  
  // Test with new implementation  
  featureFlags.override(FeatureFlag.USE_NEW_CHESS_CORE, true);
  testFn();
}