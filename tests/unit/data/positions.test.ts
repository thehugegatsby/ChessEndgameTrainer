import { pawnEndgames } from '@/data/endgames/positions/pawn';
import { EndgamePosition } from '@/data/endgames/types';

describe('Pawn Endgame Positions', () => {
  describe('Structure and Validity', () => {
    it('should export an array of pawn positions', () => {
      expect(Array.isArray(pawnEndgames)).toBe(true);
      expect(pawnEndgames.length).toBeGreaterThan(0);
    });

    it('should have all positions with pawn category', () => {
      pawnEndgames.forEach(position => {
        expect(position.category).toBe('pawn');
      });
    });

    it('should have valid position structure', () => {
      pawnEndgames.forEach(position => {
        // Required fields
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

        // Type checks
        expect(typeof position.id).toBe('number');
        expect(typeof position.title).toBe('string');
        expect(typeof position.description).toBe('string');
        expect(typeof position.fen).toBe('string');
        expect(['beginner', 'intermediate', 'advanced']).toContain(position.difficulty);
        expect(['win', 'draw', 'defend']).toContain(position.goal);
        expect(['white', 'black']).toContain(position.sideToMove);
        expect(Array.isArray(position.tags)).toBe(true);
      });
    });

    it('should have unique IDs', () => {
      const ids = pawnEndgames.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have material classification', () => {
      pawnEndgames.forEach(position => {
        expect(position.material).toHaveProperty('white');
        expect(position.material).toHaveProperty('black');
        expect(typeof position.material.white).toBe('string');
        expect(typeof position.material.black).toBe('string');
      });
    });
  });

  describe('Content Validation', () => {
    it('should have opposition positions', () => {
      const oppositionPositions = pawnEndgames.filter(p => 
        p.tags.includes('opposition')
      );
      expect(oppositionPositions.length).toBeGreaterThan(0);
    });

    it('should have different difficulty levels', () => {
      const difficulties = new Set(pawnEndgames.map(p => p.difficulty));
      expect(difficulties.size).toBeGreaterThan(1);
    });

    it('should have baseContent for educational value', () => {
      const positionsWithContent = pawnEndgames.filter(p => p.baseContent);
      expect(positionsWithContent.length).toBeGreaterThan(0);
      
      positionsWithContent.forEach(position => {
        if (position.baseContent) {
          expect(position.baseContent).toHaveProperty('strategies');
          expect(position.baseContent).toHaveProperty('commonMistakes');
          expect(position.baseContent).toHaveProperty('keyPrinciples');
        }
      });
    });
  });

  describe('Specific Positions', () => {
    it('should include Opposition Grundlagen (id: 1)', () => {
      const position = pawnEndgames.find(p => p.id === 1);
      expect(position).toBeDefined();
      expect(position?.title).toBe('Opposition Grundlagen');
      expect(position?.difficulty).toBe('beginner');
    });

    it('should include Opposition Fortgeschritten (id: 2)', () => {
      const position = pawnEndgames.find(p => p.id === 2);
      expect(position).toBeDefined();
      expect(position?.title).toBe('Opposition Fortgeschritten');
      expect(position?.difficulty).toBe('intermediate');
    });

    it('should include Entfernte Opposition (id: 3)', () => {
      const position = pawnEndgames.find(p => p.id === 3);
      expect(position).toBeDefined();
      expect(position?.title).toBe('Entfernte Opposition');
      expect(position?.difficulty).toBe('intermediate');
    });
  });
});