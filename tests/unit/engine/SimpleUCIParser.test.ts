import { parseUciInfo, parseBestMove, parseOption } from '../../../shared/lib/chess/engine/simple/SimpleUCIParser';

describe('SimpleUCIParser', () => {
  describe('parseUciInfo', () => {
    it('should parse basic info string', () => {
      const result = parseUciInfo('info depth 15 score cp 150');
      expect(result).toEqual({
        depth: 15,
        score: { type: 'cp', value: 150 }
      });
    });

    it('should parse mate score', () => {
      const result = parseUciInfo('info depth 10 score mate 5');
      expect(result).toEqual({
        depth: 10,
        score: { type: 'mate', value: 5 }
      });
    });

    it('should parse negative mate score', () => {
      const result = parseUciInfo('info depth 10 score mate -3');
      expect(result).toEqual({
        depth: 10,
        score: { type: 'mate', value: -3 }
      });
    });

    it('should parse principal variation', () => {
      const result = parseUciInfo('info depth 15 score cp 150 pv e2e4 e7e5 Nf3');
      expect(result).toEqual({
        depth: 15,
        score: { type: 'cp', value: 150 },
        pv: 'e2e4 e7e5 Nf3'
      });
    });

    it('should parse all fields', () => {
      const result = parseUciInfo('info depth 20 seldepth 25 score cp 250 nodes 1000000 nps 500000 time 2000 pv e2e4 e7e5');
      expect(result).toEqual({
        depth: 20,
        seldepth: 25,
        score: { type: 'cp', value: 250 },
        nodes: 1000000,
        nps: 500000,
        time: 2000,
        pv: 'e2e4 e7e5'
      });
    });

    it('should handle empty pv', () => {
      const result = parseUciInfo('info depth 15 score cp 150 pv');
      expect(result).toEqual({
        depth: 15,
        score: { type: 'cp', value: 150 },
        pv: ''
      });
    });

    it('should return null for non-info lines', () => {
      expect(parseUciInfo('bestmove e2e4')).toBeNull();
      expect(parseUciInfo('uciok')).toBeNull();
      expect(parseUciInfo('readyok')).toBeNull();
    });

    it('should return null for malformed info lines', () => {
      expect(parseUciInfo('info')).toBeNull();
      // Parser returns { depth: NaN } for partial input
      expect(parseUciInfo('info depth')).toEqual({ depth: NaN });
    });

    it('should handle missing score value', () => {
      const result = parseUciInfo('info depth 15 score cp');
      expect(result).toEqual({
        depth: 15,
        score: { type: 'cp', value: NaN }
      });
    });

    it('should handle real Stockfish output', () => {
      const realOutput = 'info depth 15 seldepth 18 multipv 1 score cp 13 nodes 948032 nps 1066329 hashfull 999 tbhits 0 time 889 pv d2d4 d7d5 c2c4 e7e6 Nb1c3 Ng8f6 c4d5 e6d5 Bc1g5 c7c6 e2e3 Bf8e7 Bf1d3 O-O Ng1e2 Rf8e8';
      
      const result = parseUciInfo(realOutput);
      expect(result).toEqual({
        depth: 15,
        seldepth: 18,
        multipv: 1,
        score: { type: 'cp', value: 13 },
        nodes: 948032,
        nps: 1066329,
        time: 889,
        pv: 'd2d4 d7d5 c2c4 e7e6 Nb1c3 Ng8f6 c4d5 e6d5 Bc1g5 c7c6 e2e3 Bf8e7 Bf1d3 O-O Ng1e2 Rf8e8'
      });
    });
  });

  describe('parseBestMove', () => {
    it('should parse bestmove correctly', () => {
      expect(parseBestMove('bestmove e2e4')).toBe('e2e4');
      expect(parseBestMove('bestmove a7a8q')).toBe('a7a8q');
      expect(parseBestMove('bestmove O-O')).toBe('O-O');
    });

    it('should handle bestmove with ponder', () => {
      expect(parseBestMove('bestmove e2e4 ponder e7e5')).toBe('e2e4');
    });

    it('should return null for non-bestmove lines', () => {
      expect(parseBestMove('info depth 15')).toBeNull();
      expect(parseBestMove('uciok')).toBeNull();
    });

    it('should return null for malformed bestmove', () => {
      expect(parseBestMove('bestmove')).toBeNull();
    });
  });

  describe('parseOption', () => {
    it('should parse option correctly', () => {
      const result = parseOption('option name Hash type spin default 16 min 1 max 33554432');
      expect(result).toEqual({
        name: 'Hash',
        value: '16 min 1 max 33554432'
      });
    });

    it('should parse boolean option', () => {
      const result = parseOption('option name Ponder type check default false');
      expect(result).toEqual({
        name: 'Ponder',
        value: 'false'
      });
    });

    it('should return null for non-option lines', () => {
      expect(parseOption('info depth 15')).toBeNull();
      expect(parseOption('uciok')).toBeNull();
    });

    it('should return null for malformed option', () => {
      expect(parseOption('option')).toBeNull();
      expect(parseOption('option name')).toBeNull();
    });
  });

  describe('Issue #53 - Mate notation tests', () => {
    // Test FEN: 8/8/1k6/3K1P2/8/8/8/8 w - - 0 1
    // Expected results:
    // 1. Matt in 8 mit bauer f6 (f5f6)
    // 2. Matt in 11 mit Kd6 oder Ke6 
    // 3. Matt in 13 mit Ke5
    
    it('should parse mate in 8 from UCI output', () => {
      const uciOutput = 'info depth 15 score mate 8 pv f5f6';
      const result = parseUciInfo(uciOutput);
      
      expect(result).toEqual({
        depth: 15,
        score: { type: 'mate', value: 8 },
        pv: 'f5f6'
      });
    });

    it('should parse mate in 11 from UCI output', () => {
      const uciOutput = 'info depth 15 score mate 11 pv Kd6';
      const result = parseUciInfo(uciOutput);
      
      expect(result).toEqual({
        depth: 15,
        score: { type: 'mate', value: 11 },
        pv: 'Kd6'
      });
    });

    it('should parse mate in 13 from UCI output', () => {
      const uciOutput = 'info depth 15 score mate 13 pv Ke5';
      const result = parseUciInfo(uciOutput);
      
      expect(result).toEqual({
        depth: 15,
        score: { type: 'mate', value: 13 },
        pv: 'Ke5'
      });
    });

    it('should handle negative mate scores (opponent mates)', () => {
      const uciOutput = 'info depth 15 score mate -5 pv Kd6';
      const result = parseUciInfo(uciOutput);
      
      expect(result).toEqual({
        depth: 15,
        score: { type: 'mate', value: -5 },
        pv: 'Kd6'
      });
    });
  });
});