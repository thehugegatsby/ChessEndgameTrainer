import { rookEndgames } from '../../positions/rook';
import { EndgamePosition } from '../../types';

describe('Rook Endgame Positions', () => {
  describe('Structure and Validity', () => {
    it('should export an array of rook positions', () => {
      expect(Array.isArray(rookEndgames)).toBe(true);
      expect(rookEndgames.length).toBeGreaterThan(0);
    });

    it('should have all positions with rook category', () => {
      rookEndgames.forEach(position => {
        expect(position.category).toBe('rook');
      });
    });

    it('should have valid position structure', () => {
      rookEndgames.forEach(position => {
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
      const ids = rookEndgames.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have material classification', () => {
      rookEndgames.forEach(position => {
        expect(position.material).toHaveProperty('white');
        expect(position.material).toHaveProperty('black');
        expect(typeof position.material.white).toBe('string');
        expect(typeof position.material.black).toBe('string');
      });
    });
  });

  describe('Content Validation', () => {
    it('should have bridge building positions', () => {
      const bridgePositions = rookEndgames.filter(p => 
        p.tags.includes('bridge-building') || 
        p.tags.includes('bridge-trainer')
      );
      expect(bridgePositions.length).toBeGreaterThan(0);
    });

    it('should have different difficulty levels', () => {
      const difficulties = new Set(rookEndgames.map(p => p.difficulty));
      expect(difficulties.size).toBeGreaterThan(1);
    });

    it('should have baseContent for educational value', () => {
      const positionsWithContent = rookEndgames.filter(p => p.baseContent);
      expect(positionsWithContent.length).toBeGreaterThan(0);
      
      positionsWithContent.forEach(position => {
        if (position.baseContent) {
          expect(position.baseContent).toHaveProperty('strategies');
          expect(position.baseContent).toHaveProperty('commonMistakes');
          expect(position.baseContent).toHaveProperty('keyPrinciples');
        }
      });
    });

    it('should have bridge hints for trainer positions', () => {
      const trainerPositions = rookEndgames.filter(p => 
        p.tags.includes('bridge-trainer')
      );
      expect(trainerPositions.length).toBeGreaterThan(0);
      
      trainerPositions.forEach(position => {
        expect(position.bridgeHints).toBeDefined();
        expect(Array.isArray(position.bridgeHints)).toBe(true);
        expect(position.bridgeHints!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Specific Positions', () => {
    it('should include Brückenbau Technik (id: 4)', () => {
      const position = rookEndgames.find(p => p.id === 4);
      expect(position).toBeDefined();
      expect(position?.title).toBe('Brückenbau Technik');
      expect(position?.difficulty).toBe('intermediate');
    });

    it('should include Philidor Verteidigung (id: 5)', () => {
      const position = rookEndgames.find(p => p.id === 5);
      expect(position).toBeDefined();
      expect(position?.title).toBe('Philidor Verteidigung');
      expect(position?.difficulty).toBe('advanced');
      expect(position?.goal).toBe('draw');
    });

    it('should include all bridge trainer positions', () => {
      const bridgeTrainerIds = [12, 13, 14, 15, 16];
      bridgeTrainerIds.forEach(id => {
        const position = rookEndgames.find(p => p.id === id);
        expect(position).toBeDefined();
        expect(position?.tags).toContain('bridge-trainer');
      });
    });
  });
});