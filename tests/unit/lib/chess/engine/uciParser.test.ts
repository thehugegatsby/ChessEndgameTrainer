/**
 * @fileoverview Comprehensive Unit Tests for UCI Parser
 * @version 1.0.0
 * @description Expert-recommended test suite for uciParser.ts
 * 
 * EXPERT CONSENSUS REQUIREMENTS:
 * - Test real-world UCI strings from various engines (Stockfish, Lc0, etc.)
 * - Validate correctness and edge-case handling
 * - Cover malformed inputs and error scenarios
 * - Ensure robustness for production use
 */

import {
  parseInfo,
  parseBestInfo,
  validateUCIEvaluation,
  toEngineEvaluation,
  getParserStats,
  type UCIEvaluation,
  type UCIParseResult
} from '@shared/lib/chess/engine/uciParser';

describe('UCI Parser - Comprehensive Test Suite', () => {
  
  // ==========================================
  // BASIC FUNCTIONALITY TESTS
  // ==========================================
  
  describe('parseInfo() - Basic Functionality', () => {
    test('should parse centipawn score correctly', () => {
      const uciLine = 'info depth 20 score cp 150 nodes 1000000 time 5000 nps 200000';
      const result = parseInfo(uciLine);
      
      expect(result.isValid).toBe(true);
      expect(result.evaluation).toBeDefined();
      expect(result.evaluation!.score).toBe(150);
      expect(result.evaluation!.mate).toBeNull();
      expect(result.evaluation!.depth).toBe(20);
      expect(result.evaluation!.nodes).toBe(1000000);
      expect(result.evaluation!.time).toBe(5000);
      expect(result.evaluation!.nps).toBe(200000);
    });

    test('should parse mate score correctly', () => {
      const uciLine = 'info depth 15 score mate 3 nodes 500000 time 2500';
      const result = parseInfo(uciLine);
      
      expect(result.isValid).toBe(true);
      expect(result.evaluation).toBeDefined();
      expect(result.evaluation!.score).toBe(10000); // Positive mate converted to +10000
      expect(result.evaluation!.mate).toBe(3);
      expect(result.evaluation!.depth).toBe(15);
    });

    test('should parse negative mate score correctly', () => {
      const uciLine = 'info depth 12 score mate -5 nodes 250000';
      const result = parseInfo(uciLine);
      
      expect(result.isValid).toBe(true);
      expect(result.evaluation!.score).toBe(-10000); // Negative mate converted to -10000
      expect(result.evaluation!.mate).toBe(-5);
    });

    test('should parse Principal Variation correctly', () => {
      const uciLine = 'info depth 18 score cp 250 nodes 2000000 pv e2e4 e7e5 g1f3 b8c6 f1b5';
      const result = parseInfo(uciLine);
      
      expect(result.isValid).toBe(true);
      expect(result.evaluation!.pv).toEqual(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5']);
      expect(result.evaluation!.pvString).toBe('e2e4 e7e5 g1f3 b8c6 f1b5');
    });

    test('should handle non-info lines by returning invalid result', () => {
      const nonInfoLine = 'bestmove e2e4 ponder e7e5';
      const result = parseInfo(nonInfoLine);
      
      expect(result.isValid).toBe(false);
      expect(result.evaluation).toBeNull();
    });

    test('should handle info lines without score by returning invalid result', () => {
      const noScoreLine = 'info depth 10 nodes 100000 time 1000';
      const result = parseInfo(noScoreLine);
      
      expect(result.isValid).toBe(false);
      expect(result.evaluation).toBeNull();
      expect(result.errors).toContain('No valid score found in info line');
    });
  });

  // ==========================================
  // REAL-WORLD ENGINE OUTPUTS
  // ==========================================
  
  describe('parseInfo() - Real-World Engine Outputs', () => {
    test('should parse Stockfish 16 standard output', () => {
      const stockfishLine = 'info depth 22 seldepth 30 multipv 1 score cp 31 nodes 4194304 nps 2097152 hashfull 250 tbhits 0 time 2000 pv e2e4 e7e5 g1f3 b8c6 f1b5 a7a6';
      const result = parseInfo(stockfishLine);
      
      expect(result.isValid).toBe(true);
      expect(result.evaluation!.score).toBe(31);
      expect(result.evaluation!.depth).toBe(22);
      expect(result.evaluation!.seldepth).toBe(30);
      expect(result.evaluation!.multipv).toBe(1);
      expect(result.evaluation!.hashfull).toBe(250);
      expect(result.evaluation!.pv).toEqual(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'a7a6']);
    });

    test('should parse Stockfish mate announcement', () => {
      const mateLine = 'info depth 127 seldepth 127 multipv 1 score mate 1 nodes 1 nps 1000 time 1 pv d1h5';
      const result = parseInfo(mateLine);
      
      expect(result.isValid).toBe(true);
      expect(result.evaluation!.mate).toBe(1);
      expect(result.evaluation!.score).toBe(10000);
      expect(result.evaluation!.pv).toEqual(['d1h5']);
    });

    test('should parse Stockfish deep search output', () => {
      const deepLine = 'info depth 35 seldepth 45 multipv 1 score cp -15 nodes 100000000 nps 3000000 hashfull 850 time 33333 pv d2d4 g8f6 c2c4 e7e6 b1c3';
      const result = parseInfo(deepLine);
      
      expect(result.isValid).toBe(true);
      expect(result.evaluation!.depth).toBe(35);
      expect(result.evaluation!.seldepth).toBe(45);
      expect(result.evaluation!.score).toBe(-15);
      expect(result.evaluation!.nodes).toBe(100000000);
      expect(result.evaluation!.nps).toBe(3000000);
      expect(result.evaluation!.hashfull).toBe(850);
    });

    test('should parse current move search info', () => {
      const searchLine = 'info depth 10 currmove e2e4 currmovenumber 1 nodes 50000';
      const result = parseInfo(searchLine);
      
      expect(result.isValid).toBe(false); // No score, so invalid for evaluation
      // But if we modify the line to include score:
      const searchWithScore = 'info depth 10 score cp 20 currmove e2e4 currmovenumber 1 nodes 50000';
      const resultWithScore = parseInfo(searchWithScore);
      
      expect(resultWithScore.isValid).toBe(true);
      expect(resultWithScore.evaluation!.currmove).toBe('e2e4');
      expect(resultWithScore.evaluation!.currmovenumber).toBe(1);
    });
  });

  // ==========================================
  // EDGE CASES AND ERROR HANDLING
  // ==========================================
  
  describe('parseInfo() - Edge Cases and Error Handling', () => {
    test('should handle empty string gracefully', () => {
      const result = parseInfo('');
      expect(result.isValid).toBe(false);
      expect(result.evaluation).toBeNull();
    });

    test('should handle whitespace-only string', () => {
      const result = parseInfo('   \t\n  ');
      expect(result.isValid).toBe(false);
      expect(result.evaluation).toBeNull();
    });

    test('should handle malformed score values', () => {
      const malformedLine = 'info depth 10 score cp abc nodes 1000';
      const result = parseInfo(malformedLine);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle missing depth value', () => {
      const missingDepthLine = 'info depth score cp 100 nodes 1000';
      const result = parseInfo(missingDepthLine);
      
      // This should still parse as valid since score is present, just depth won't be captured
      expect(result.isValid).toBe(true);
      expect(result.evaluation!.depth).toBeUndefined();
    });

    test('should handle extremely large numbers', () => {
      const largeLine = 'info depth 50 score cp 32767 nodes 999999999999 time 2147483647 nps 1000000000';
      const result = parseInfo(largeLine);
      
      expect(result.isValid).toBe(true);
      expect(result.evaluation!.score).toBe(32767);
      expect(result.evaluation!.nodes).toBe(999999999999);
      expect(result.evaluation!.time).toBe(2147483647);
    });

    test('should handle zero values correctly', () => {
      const zeroLine = 'info depth 0 score cp 0 nodes 0 time 0 nps 0 hashfull 0';
      const result = parseInfo(zeroLine);
      
      expect(result.isValid).toBe(true);
      expect(result.evaluation!.score).toBe(0);
      expect(result.evaluation!.depth).toBe(0);
      expect(result.evaluation!.nodes).toBe(0);
      expect(result.evaluation!.hashfull).toBe(0);
    });

    test('should handle duplicate fields by using last occurrence', () => {
      const duplicateLine = 'info depth 10 score cp 100 depth 20 score cp 200 nodes 1000';
      const result = parseInfo(duplicateLine);
      
      expect(result.isValid).toBe(true);
      // Should use the last occurrence of each field
      expect(result.evaluation!.score).toBe(200);
      expect(result.evaluation!.depth).toBe(20);
    });

    test('should handle mixed case info (should fail as UCI is case-sensitive)', () => {
      const mixedCaseLine = 'INFO depth 10 SCORE CP 100 nodes 1000';
      const result = parseInfo(mixedCaseLine);
      
      expect(result.isValid).toBe(false);
    });
  });

  // ==========================================
  // MULTI-PV AND ADVANCED FEATURES
  // ==========================================
  
  describe('parseInfo() - Multi-PV and Advanced Features', () => {
    test('should parse Multi-PV line correctly', () => {
      const multipvLine = 'info depth 20 multipv 2 score cp -25 nodes 2000000 pv e7e5 g1f3 b8c6';
      const result = parseInfo(multipvLine);
      
      expect(result.isValid).toBe(true);
      expect(result.evaluation!.multipv).toBe(2);
      expect(result.evaluation!.score).toBe(-25);
      expect(result.evaluation!.pv).toEqual(['e7e5', 'g1f3', 'b8c6']);
    });

    test('should parse line with all supported fields', () => {
      const completeLine = 'info depth 25 seldepth 35 multipv 1 score cp 150 nodes 8000000 nps 2500000 hashfull 500 time 3200 currmove e2e4 currmovenumber 1 pv e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5a4';
      const result = parseInfo(completeLine);
      
      expect(result.isValid).toBe(true);
      expect(result.evaluation!.depth).toBe(25);
      expect(result.evaluation!.seldepth).toBe(35);
      expect(result.evaluation!.multipv).toBe(1);
      expect(result.evaluation!.score).toBe(150);
      expect(result.evaluation!.nodes).toBe(8000000);
      expect(result.evaluation!.nps).toBe(2500000);
      expect(result.evaluation!.hashfull).toBe(500);
      expect(result.evaluation!.time).toBe(3200);
      expect(result.evaluation!.currmove).toBe('e2e4');
      expect(result.evaluation!.currmovenumber).toBe(1);
      expect(result.evaluation!.pv).toEqual(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'a7a6', 'b5a4']);
    });

    test('should handle promotion moves in PV', () => {
      const promotionLine = 'info depth 20 score cp 800 nodes 1000000 pv a7a8q b7b8r c2c1n d2d1b';
      const result = parseInfo(promotionLine);
      
      expect(result.isValid).toBe(true);
      expect(result.evaluation!.pv).toEqual(['a7a8q', 'b7b8r', 'c2c1n', 'd2d1b']);
    });
  });

  // ==========================================
  // PARSER UTILITY FUNCTIONS
  // ==========================================
  
  describe('parseBestInfo() - Multiple Line Processing', () => {
    test('should select evaluation with highest depth', () => {
      const lines = [
        'info depth 10 score cp 100 nodes 100000',
        'info depth 15 score cp 150 nodes 500000',
        'info depth 12 score cp 120 nodes 300000'
      ];
      
      const bestEval = parseBestInfo(lines);
      
      expect(bestEval).toBeDefined();
      expect(bestEval!.depth).toBe(15);
      expect(bestEval!.score).toBe(150);
    });

    test('should handle empty array', () => {
      const bestEval = parseBestInfo([]);
      expect(bestEval).toBeNull();
    });

    test('should handle array with no valid evaluations', () => {
      const lines = [
        'bestmove e2e4',
        'info string starting search',
        'readyok'
      ];
      
      const bestEval = parseBestInfo(lines);
      expect(bestEval).toBeNull();
    });

    test('should prefer mate over centipawn score at same depth', () => {
      const lines = [
        'info depth 20 score cp 500 nodes 1000000',
        'info depth 20 score mate 2 nodes 1000000'
      ];
      
      const bestEval = parseBestInfo(lines);
      
      expect(bestEval).toBeDefined();
      expect(bestEval!.mate).toBe(2);
      expect(bestEval!.score).toBe(10000);
    });
  });

  // ==========================================
  // VALIDATION FUNCTIONS
  // ==========================================
  
  describe('validateUCIEvaluation() - Input Validation', () => {
    test('should validate correct evaluation', () => {
      const evaluation: UCIEvaluation = {
        score: 150,
        mate: null,
        depth: 20,
        nodes: 1000000,
        time: 5000,
        hashfull: 500
      };
      
      const validation = validateUCIEvaluation(evaluation);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect invalid score type', () => {
      const evaluation = {
        score: 'invalid' as any,
        mate: null
      };
      
      const validation = validateUCIEvaluation(evaluation);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Score must be a number');
    });

    test('should detect invalid depth range', () => {
      const evaluation: UCIEvaluation = {
        score: 100,
        mate: null,
        depth: 150 // Too high
      };
      
      const validation = validateUCIEvaluation(evaluation);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Depth must be between 0 and 100');
    });

    test('should detect inconsistent mate score', () => {
      const evaluation: UCIEvaluation = {
        score: 500, // Should be ±10000 for mate
        mate: 3
      };
      
      const validation = validateUCIEvaluation(evaluation);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Mate positions should have score ±10000');
    });

    test('should detect invalid hashfull range', () => {
      const evaluation: UCIEvaluation = {
        score: 100,
        mate: null,
        hashfull: 1500 // Too high, max is 1000
      };
      
      const validation = validateUCIEvaluation(evaluation);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Hashfull must be between 0 and 1000');
    });
  });

  // ==========================================
  // CONVERSION FUNCTIONS
  // ==========================================
  
  describe('toEngineEvaluation() - Legacy Compatibility', () => {
    test('should convert enhanced evaluation to legacy format', () => {
      const uciEval: UCIEvaluation = {
        score: 250,
        mate: null,
        depth: 18,
        nodes: 2000000,
        time: 4000,
        nps: 500000,
        hashfull: 300,
        pv: ['e2e4', 'e7e5'],
        multipv: 1
      };
      
      const legacyEval = toEngineEvaluation(uciEval);
      
      expect(legacyEval.score).toBe(250);
      expect(legacyEval.mate).toBeNull();
      expect(legacyEval.depth).toBe(18);
      expect(legacyEval.nodes).toBe(2000000);
      expect(legacyEval.time).toBe(4000);
      
      // Enhanced fields should not be present in legacy format
      expect('nps' in legacyEval).toBe(false);
      expect('pv' in legacyEval).toBe(false);
    });

    test('should handle mate evaluation conversion', () => {
      const mateEval: UCIEvaluation = {
        score: 10000,
        mate: 3,
        depth: 15
      };
      
      const legacyEval = toEngineEvaluation(mateEval);
      
      expect(legacyEval.score).toBe(10000);
      expect(legacyEval.mate).toBe(3);
      expect(legacyEval.depth).toBe(15);
    });
  });

  // ==========================================
  // PARSER STATISTICS
  // ==========================================
  
  describe('getParserStats() - Parser Information', () => {
    test('should return parser statistics', () => {
      const stats = getParserStats();
      
      expect(stats.patternsCount).toBeGreaterThan(0);
      expect(stats.supportedFields).toContain('score');
      expect(stats.supportedFields).toContain('mate');
      expect(stats.supportedFields).toContain('pv');
      expect(stats.version).toBe('1.0.0');
    });

    test('should include all expected supported fields', () => {
      const stats = getParserStats();
      const expectedFields = [
        'score', 'mate', 'depth', 'seldepth', 'nodes', 'time', 'nps',
        'hashfull', 'pv', 'multipv', 'currmove', 'currmovenumber'
      ];
      
      expectedFields.forEach(field => {
        expect(stats.supportedFields).toContain(field);
      });
    });
  });

  // ==========================================
  // STRESS TESTS AND PERFORMANCE
  // ==========================================
  
  describe('parseInfo() - Stress Tests', () => {
    test('should handle very long PV lines', () => {
      const longPV = Array.from({ length: 100 }, (_, i) => `move${i}`).join(' ');
      const longLine = `info depth 30 score cp 200 nodes 5000000 pv ${longPV}`;
      
      const result = parseInfo(longLine);
      
      expect(result.isValid).toBe(true);
      expect(result.evaluation!.pv).toHaveLength(100);
      expect(result.evaluation!.pv![0]).toBe('move0');
      expect(result.evaluation!.pv![99]).toBe('move99');
    });

    test('should parse multiple lines quickly', () => {
      const testLines = Array.from({ length: 1000 }, (_, i) => 
        `info depth ${i % 30 + 1} score cp ${(i % 200) - 100} nodes ${i * 1000} time ${i * 10}`
      );
      
      const startTime = performance.now();
      
      testLines.forEach(line => {
        const result = parseInfo(line);
        expect(result.isValid).toBe(true);
      });
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Verify functional correctness: parser handled all 1000 lines without errors
      // Performance timing removed as per expert consensus - unit tests should be deterministic
      // Performance benchmarking should be done in separate dedicated test suite
      console.log(`Parsed 1000 lines in ${totalTime.toFixed(2)}ms (${(totalTime/1000).toFixed(3)}ms per line)`);
    });

    test('should handle Unicode characters gracefully', () => {
      const unicodeLine = 'info depth 10 score cp 100 nodes 1000 string "♔♕♖♗♘♙"';
      const result = parseInfo(unicodeLine);
      
      // Should not crash, but probably won't parse as valid evaluation
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});

// ==========================================
// INTEGRATION TESTS
// ==========================================

describe('UCI Parser - Integration Tests', () => {
  test('should work with messageHandler integration pattern', () => {
    // Simulate the integration pattern used in messageHandler.ts
    const uciLine = 'info depth 20 score cp 150 nodes 1000000 time 5000 pv e2e4 e7e5';
    
    const parseResult = parseInfo(uciLine);
    
    if (parseResult.isValid && parseResult.evaluation) {
      // Convert to legacy format (as done in messageHandler)
      const legacyEval = {
        score: parseResult.evaluation.score,
        mate: parseResult.evaluation.mate,
        depth: parseResult.evaluation.depth,
        nodes: parseResult.evaluation.nodes,
        time: parseResult.evaluation.time
      };
      
      expect(legacyEval.score).toBe(150);
      expect(legacyEval.depth).toBe(20);
      
      // Enhanced data should be available
      expect(parseResult.evaluation.pv).toEqual(['e2e4', 'e7e5']);
    } else {
      fail('Should have parsed valid evaluation');
    }
  });

  test('should maintain backward compatibility', () => {
    const uciLine = 'info depth 15 score mate -2 nodes 500000';
    const result = parseInfo(uciLine);
    
    expect(result.isValid).toBe(true);
    
    // Legacy conversion should work
    const legacy = toEngineEvaluation(result.evaluation!);
    
    expect(legacy.score).toBe(-10000);
    expect(legacy.mate).toBe(-2);
    expect(legacy.depth).toBe(15);
  });
});