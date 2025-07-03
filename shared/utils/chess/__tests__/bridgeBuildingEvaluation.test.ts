import {
  evaluateBridgeBuildingMove,
  bridgeBuildingToEnhancedDisplay
} from '../bridgeBuildingEvaluation';

describe('bridgeBuildingEvaluation', () => {
  describe('evaluateBridgeBuildingMove', () => {
    describe('Starting position: 2K5/2P2k2/8/8/4R3/8/1r6/8 w', () => {
      const startingFen = '2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1';

      test('should evaluate Kd7 as optimal didactic move', () => {
        const result = evaluateBridgeBuildingMove(startingFen, 'Kd7');
        
        expect(result).toBeDefined();
        expect(result?.move).toBe('Kd7');
        expect(result?.category).toBe('didactic');
        expect(result?.qualityClass).toBe('optimal');
        expect(result?.shouldContinue).toBe(true);
        expect(result?.feedback).toContain('Exzellent');
        expect(result?.feedback).toContain('Brückenbau');
      });

      test('should evaluate Rc4 as alternative safe move', () => {
        const result = evaluateBridgeBuildingMove(startingFen, 'Rc4');
        
        expect(result).toBeDefined();
        expect(result?.move).toBe('Rc4');
        expect(result?.category).toBe('alternative');
        expect(result?.qualityClass).toBe('sicher');
        expect(result?.shouldContinue).toBe(false);
        expect(result?.feedback).toContain('führt ebenfalls zum Gewinn');
      });

      test('should evaluate Re5 as alternative', () => {
        const result = evaluateBridgeBuildingMove(startingFen, 'Re5');
        
        expect(result).toBeDefined();
        expect(result?.category).toBe('alternative');
        expect(result?.qualityClass).toBe('sicher');
        expect(result?.shouldContinue).toBe(false);
      });

      test('should evaluate Re1 as alternative', () => {
        const result = evaluateBridgeBuildingMove(startingFen, 'Re1');
        
        expect(result).toBeDefined();
        expect(result?.category).toBe('alternative');
        expect(result?.qualityClass).toBe('sicher');
        expect(result?.shouldContinue).toBe(false);
      });

      test('should evaluate untracked moves as incorrect', () => {
        const result = evaluateBridgeBuildingMove(startingFen, 'Kb7');
        
        expect(result).toBeDefined();
        expect(result?.move).toBe('Kb7');
        expect(result?.category).toBe('incorrect');
        expect(result?.qualityClass).toBe('fehler');
        expect(result?.shouldContinue).toBe(false);
        expect(result?.feedback).toContain('hilft nicht beim Brückenbau');
      });
    });

    describe('After Kd7 Rb7: 3K4/1rP1k3/8/8/4R3/8/8/8 w', () => {
      const fen = '3K4/1rP1k3/8/8/4R3/8/8/8 w - - 0 1';

      test('should evaluate Kc6 as optimal didactic move', () => {
        const result = evaluateBridgeBuildingMove(fen, 'Kc6');
        
        expect(result).toBeDefined();
        expect(result?.move).toBe('Kc6');
        expect(result?.category).toBe('didactic');
        expect(result?.qualityClass).toBe('optimal');
        expect(result?.shouldContinue).toBe(true);
        expect(result?.feedback).toContain('Perfekt');
        expect(result?.feedback).toContain('Zickzack');
      });

      test('should evaluate Rc4 as alternative', () => {
        const result = evaluateBridgeBuildingMove(fen, 'Rc4');
        
        expect(result).toBeDefined();
        expect(result?.category).toBe('alternative');
        expect(result?.qualityClass).toBe('sicher');
        expect(result?.shouldContinue).toBe(false);
      });
    });

    describe('After Kc6 Rb1: 8/2PK4/8/4k3/4R3/8/8/1r6 w', () => {
      const fen = '8/2PK4/8/4k3/4R3/8/8/1r6 w - - 0 1';

      test('should evaluate Kb5 as optimal didactic move', () => {
        const result = evaluateBridgeBuildingMove(fen, 'Kb5');
        
        expect(result).toBeDefined();
        expect(result?.move).toBe('Kb5');
        expect(result?.category).toBe('didactic');
        expect(result?.qualityClass).toBe('optimal');
        expect(result?.shouldContinue).toBe(true);
      });

      test('should evaluate premature Rc4 as alternative', () => {
        const result = evaluateBridgeBuildingMove(fen, 'Rc4');
        
        expect(result).toBeDefined();
        expect(result?.category).toBe('alternative');
        expect(result?.qualityClass).toBe('sicher');
        expect(result?.shouldContinue).toBe(false);
        expect(result?.feedback).toContain('verfrüht');
      });
    });

    describe('After Kb5 Rb1+: 8/2P5/8/1K2k3/4R3/8/8/1r6 w', () => {
      const fen = '8/2P5/8/1K2k3/4R3/8/8/1r6 w - - 0 1';

      test('should evaluate Rc4 as optimal bridge building move', () => {
        const result = evaluateBridgeBuildingMove(fen, 'Rc4');
        
        expect(result).toBeDefined();
        expect(result?.move).toBe('Rc4');
        expect(result?.category).toBe('didactic');
        expect(result?.qualityClass).toBe('optimal');
        expect(result?.shouldContinue).toBe(true);
        expect(result?.feedback).toContain('Brillant');
        expect(result?.feedback).toContain('Brücke ist gebaut');
      });

      test('should evaluate Ka4 as critical error', () => {
        const result = evaluateBridgeBuildingMove(fen, 'Ka4');
        
        expect(result).toBeDefined();
        expect(result?.move).toBe('Ka4');
        expect(result?.category).toBe('incorrect');
        expect(result?.qualityClass).toBe('fehler');
        expect(result?.shouldContinue).toBe(false);
        expect(result?.feedback).toContain('gibt die Kontrolle auf');
      });
    });

    describe('Untracked positions', () => {
      test('should return null for untracked positions', () => {
        const result = evaluateBridgeBuildingMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'e4');
        expect(result).toBeNull();
      });
    });

    describe('FEN normalization', () => {
      test('should handle FEN with full notation', () => {
        const fullFen = '2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 5 42';
        const result = evaluateBridgeBuildingMove(fullFen, 'Kd7');
        
        expect(result).toBeDefined();
        expect(result?.qualityClass).toBe('optimal');
      });

      test('should handle case-insensitive moves', () => {
        const fen = '2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1';
        
        const upperResult = evaluateBridgeBuildingMove(fen, 'KD7');
        const lowerResult = evaluateBridgeBuildingMove(fen, 'kd7');
        
        expect(upperResult?.qualityClass).toBe('optimal');
        expect(lowerResult?.qualityClass).toBe('optimal');
      });
    });
  });

  describe('bridgeBuildingToEnhancedDisplay', () => {
    test('should convert optimal move to display format', () => {
      const bridgeEval = {
        move: 'Kd7',
        category: 'didactic' as const,
        qualityClass: 'optimal' as const,
        feedback: 'Test feedback',
        shouldContinue: true
      };

      const result = bridgeBuildingToEnhancedDisplay(bridgeEval);

      expect(result.text).toBe('🟢');
      expect(result.className).toBe('eval-optimal');
      expect(result.color).toBe('var(--success-text)');
      expect(result.bgColor).toBe('var(--success-bg)');
      expect(result.qualityClass).toBe('optimal');
      expect(result.educationalTip).toBe('Test feedback');
    });

    test('should convert sicher move to display format', () => {
      const bridgeEval = {
        move: 'Rc4',
        category: 'alternative' as const,
        qualityClass: 'sicher' as const,
        feedback: 'Safe move feedback',
        shouldContinue: false
      };

      const result = bridgeBuildingToEnhancedDisplay(bridgeEval);

      expect(result.text).toBe('✅');
      expect(result.className).toBe('eval-sicher');
      expect(result.color).toBe('var(--success-text)');
      expect(result.bgColor).toBe('var(--success-bg)');
    });

    test('should convert umweg move to display format', () => {
      const bridgeEval = {
        move: 'Test',
        category: 'alternative' as const,
        qualityClass: 'umweg' as const,
        feedback: 'Detour feedback',
        shouldContinue: false
      };

      const result = bridgeBuildingToEnhancedDisplay(bridgeEval);

      expect(result.text).toBe('🟡');
      expect(result.className).toBe('eval-umweg');
      expect(result.color).toBe('var(--warning-text)');
      expect(result.bgColor).toBe('var(--warning-bg)');
    });

    test('should convert riskant move to display format', () => {
      const bridgeEval = {
        move: 'Test',
        category: 'incorrect' as const,
        qualityClass: 'riskant' as const,
        feedback: 'Risky feedback',
        shouldContinue: false
      };

      const result = bridgeBuildingToEnhancedDisplay(bridgeEval);

      expect(result.text).toBe('⚠️');
      expect(result.className).toBe('eval-riskant');
      expect(result.color).toBe('var(--warning-text)');
      expect(result.bgColor).toBe('var(--warning-bg)');
    });

    test('should convert fehler move to display format', () => {
      const bridgeEval = {
        move: 'Ka4',
        category: 'incorrect' as const,
        qualityClass: 'fehler' as const,
        feedback: 'Error feedback',
        shouldContinue: false
      };

      const result = bridgeBuildingToEnhancedDisplay(bridgeEval);

      expect(result.text).toBe('🚨');
      expect(result.className).toBe('eval-fehler');
      expect(result.color).toBe('var(--error-text)');
      expect(result.bgColor).toBe('var(--error-bg)');
    });

    test('should preserve educational tip from feedback', () => {
      const testFeedback = 'This is a detailed educational explanation';
      const bridgeEval = {
        move: 'Kd7',
        category: 'didactic' as const,
        qualityClass: 'optimal' as const,
        feedback: testFeedback,
        shouldContinue: true
      };

      const result = bridgeBuildingToEnhancedDisplay(bridgeEval);

      expect(result.educationalTip).toBe(testFeedback);
    });
  });

  describe('Integration scenarios', () => {
    test('should handle complete bridge building sequence', () => {
      // Step 1: Kd7
      let result = evaluateBridgeBuildingMove('2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1', 'Kd7');
      expect(result?.shouldContinue).toBe(true);
      expect(result?.qualityClass).toBe('optimal');

      // Step 2: Kc6
      result = evaluateBridgeBuildingMove('3K4/1rP1k3/8/8/4R3/8/8/8 w - - 0 1', 'Kc6');
      expect(result?.shouldContinue).toBe(true);
      expect(result?.qualityClass).toBe('optimal');

      // Step 3: Kb5
      result = evaluateBridgeBuildingMove('8/2PK4/8/4k3/4R3/8/8/1r6 w - - 0 1', 'Kb5');
      expect(result?.shouldContinue).toBe(true);
      expect(result?.qualityClass).toBe('optimal');

      // Step 4: Rc4 (Bridge!)
      result = evaluateBridgeBuildingMove('8/2P5/8/1K2k3/4R3/8/8/1r6 w - - 0 1', 'Rc4');
      expect(result?.shouldContinue).toBe(true);
      expect(result?.qualityClass).toBe('optimal');
      expect(result?.feedback).toContain('Brücke ist gebaut');
    });

    test('should convert evaluation to display and maintain all properties', () => {
      const moveResult = evaluateBridgeBuildingMove('2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1', 'Kd7');
      expect(moveResult).toBeDefined();

      const display = bridgeBuildingToEnhancedDisplay(moveResult!);
      
      expect(display.qualityClass).toBe(moveResult!.qualityClass);
      expect(display.educationalTip).toBe(moveResult!.feedback);
      expect(display.text).toBeDefined();
      expect(display.className).toBeDefined();
      expect(display.color).toBeDefined();
      expect(display.bgColor).toBeDefined();
    });
  });
});