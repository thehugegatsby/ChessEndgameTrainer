import { 
  getPositionById, 
  getPositionsByCategory, 
  validateFen,
  allEndgamePositions 
} from '../index';

describe('Endgames Index - Comprehensive Coverage', () => {
  describe('getPositionById', () => {
    it('sollte Position mit gültiger ID finden', () => {
      const position = getPositionById(1);
      
      expect(position).toBeDefined();
      expect(position?.id).toBe(1);
      expect(position?.title).toBe('Opposition Grundlagen');
      expect(position?.category).toBe('pawn');
    });

    it('sollte undefined für ungültige ID zurückgeben', () => {
      const position = getPositionById(999999);
      
      expect(position).toBeUndefined();
    });

    it('sollte undefined für negative ID zurückgeben', () => {
      const position = getPositionById(-1);
      
      expect(position).toBeUndefined();
    });

    it('sollte undefined für ID 0 zurückgeben', () => {
      const position = getPositionById(0);
      
      expect(position).toBeUndefined();
    });

    it('sollte verschiedene bekannte Positionen finden', () => {
      const position2 = getPositionById(2);
      const position4 = getPositionById(4);
      const position5 = getPositionById(5);

      expect(position2?.title).toBe('Opposition Fortgeschritten');
      expect(position4?.title).toBe('Brückenbau Technik');
      expect(position5?.title).toBe('Philidor Verteidigung');
    });
  });

  describe('getPositionsByCategory', () => {
    it('sollte Pawn-Positionen finden', () => {
      const pawnPositions = getPositionsByCategory('pawn');
      
      expect(pawnPositions.length).toBeGreaterThan(0);
      expect(pawnPositions.every(pos => pos.category === 'pawn')).toBe(true);
      expect(pawnPositions.some(pos => pos.title === 'Opposition Grundlagen')).toBe(true);
    });

    it('sollte Rook-Positionen finden', () => {
      const rookPositions = getPositionsByCategory('rook');
      
      expect(rookPositions.length).toBeGreaterThan(0);
      expect(rookPositions.every(pos => pos.category === 'rook')).toBe(true);
      expect(rookPositions.some(pos => pos.title === 'Brückenbau Technik')).toBe(true);
    });

    it('sollte Queen-Positionen finden', () => {
      const queenPositions = getPositionsByCategory('queen');
      
      expect(Array.isArray(queenPositions)).toBe(true);
      expect(queenPositions.every(pos => pos.category === 'queen')).toBe(true);
    });

    it('sollte Minor-Piece-Positionen finden', () => {
      const minorPositions = getPositionsByCategory('minor');
      
      expect(Array.isArray(minorPositions)).toBe(true);
      expect(minorPositions.every(pos => pos.category === 'minor')).toBe(true);
    });

    it('sollte Other-Positionen finden', () => {
      const otherPositions = getPositionsByCategory('other');
      
      expect(Array.isArray(otherPositions)).toBe(true);
      expect(otherPositions.every(pos => pos.category === 'other')).toBe(true);
    });

    it('sollte leeres Array für unbekannte Kategorie zurückgeben', () => {
      const unknownPositions = getPositionsByCategory('unknown');
      
      expect(unknownPositions).toEqual([]);
    });

    it('sollte case-sensitive sein', () => {
      const upperCasePositions = getPositionsByCategory('PAWN');
      const mixedCasePositions = getPositionsByCategory('Pawn');
      
      expect(upperCasePositions).toEqual([]);
      expect(mixedCasePositions).toEqual([]);
    });
  });

  describe('validateFen', () => {
    it('sollte gültige Start-Position validieren', () => {
      const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      expect(validateFen(startFen)).toBe(true);
    });

    it('sollte gültige Endspiel-FENs validieren', () => {
      const pawnEndgame = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      const rookEndgame = '2K1k3/2P5/8/8/8/6R1/1r6/8 w - - 0 1';
      
      expect(validateFen(pawnEndgame)).toBe(true);
      expect(validateFen(rookEndgame)).toBe(true);
    });

    it('sollte ungültige FENs ablehnen', () => {
      const invalidFens = [
        '',
        'invalid',
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR', // Missing parts
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - -1 1', // Invalid halfmove clock
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNX w KQkq - 0 1', // Invalid piece
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w KQkq - 0 1', // Missing rank
        'invalid/position/format/here w KQkq - 0 1', // Invalid format
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1', // Invalid turn
        'completely invalid FEN string', // Completely invalid
        '8/8/8/8/8/8/8/8 w z - 0 1', // Invalid castling rights
      ];

      invalidFens.forEach(fen => {
        expect(validateFen(fen)).toBe(false);
      });
    });

    it('sollte verschiedene gültige Stellungen validieren', () => {
      const validFens = [
        '4k3/8/8/8/8/8/8/4K3 w - - 0 1', // Only kings
        'r6k/8/8/8/8/8/8/R6K w - - 0 1', // Rook endgame
        'q6k/8/8/8/8/8/8/Q6K w - - 0 1', // Queen endgame
        'rnbqk2r/pppppppp/8/8/8/8/PPPPPPPP/RNBQK2R w KQkq - 0 1', // Castling available
      ];

      validFens.forEach(fen => {
        expect(validateFen(fen)).toBe(true);
      });
    });

    it('sollte FENs mit verschiedenen Zugrechten validieren', () => {
      const castlingFens = [
        'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', // All castling
        'r3k2r/8/8/8/8/8/8/R3K2R w Kq - 0 1', // Partial castling
        'r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1', // No castling
        'r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1', // Black to move
      ];

      castlingFens.forEach(fen => {
        expect(validateFen(fen)).toBe(true);
      });
    });

    it('sollte En passant FENs validieren', () => {
      const enPassantFens = [
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2',
      ];

      enPassantFens.forEach(fen => {
        expect(validateFen(fen)).toBe(true);
      });
    });
  });

  describe('allEndgamePositions', () => {
    it('sollte Array von Positionen sein', () => {
      expect(Array.isArray(allEndgamePositions)).toBe(true);
      expect(allEndgamePositions.length).toBeGreaterThan(0);
    });

    it('sollte alle Positionen haben gültige Struktur', () => {
      allEndgamePositions.forEach(position => {
        expect(position).toHaveProperty('id');
        expect(position).toHaveProperty('title');
        expect(position).toHaveProperty('description');
        expect(position).toHaveProperty('fen');
        expect(position).toHaveProperty('category');
        expect(position).toHaveProperty('difficulty');
        expect(position).toHaveProperty('goal');
        expect(position).toHaveProperty('sideToMove');
        expect(position).toHaveProperty('material');
        expect(position).toHaveProperty('tags');

        expect(typeof position.id).toBe('number');
        expect(typeof position.title).toBe('string');
        expect(typeof position.description).toBe('string');
        expect(typeof position.fen).toBe('string');
        expect(typeof position.material).toBe('object');
        expect(Array.isArray(position.tags)).toBe(true);
      });
    });

    it('sollte alle Positionen haben gültige FENs', () => {
      allEndgamePositions.forEach(position => {
        expect(validateFen(position.fen)).toBe(true);
      });
    });

    it('sollte alle Positionen haben unique IDs', () => {
      const ids = allEndgamePositions.map(pos => pos.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('sollte verschiedene Kategorien haben', () => {
      const categories = new Set(allEndgamePositions.map(pos => pos.category));
      
      expect(categories.has('pawn')).toBe(true);
      expect(categories.has('rook')).toBe(true);
      expect(categories.size).toBeGreaterThan(1);
    });

    it('sollte verschiedene Schwierigkeitsgrade haben', () => {
      const difficulties = new Set(allEndgamePositions.map(pos => pos.difficulty));
      
      expect(difficulties.has('beginner')).toBe(true);
      expect(difficulties.has('intermediate')).toBe(true);
      expect(difficulties.size).toBeGreaterThan(1);
    });

    it('sollte verschiedene Ziele haben', () => {
      const goals = new Set(allEndgamePositions.map(pos => pos.goal));
      
      expect(goals.has('win')).toBe(true);
      expect(goals.has('draw')).toBe(true);
      expect(goals.size).toBeGreaterThan(1);
    });
  });
}); 