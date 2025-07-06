import { 
  createSubcategories, 
  getIconForMaterial, 
  validateFen, 
  createEndgameCategories,
  categoryUtils 
} from '@/data/endgames/categories';
import type { EndgamePosition } from '@/data/endgames/types';

describe('Endgames Categories', () => {
  const mockPositions: EndgamePosition[] = [
    {
      id: 1,
      title: 'K+P vs K',
      fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
      category: 'pawn',
      difficulty: 'beginner',
      description: 'Basic pawn endgame',
      goal: 'win',
      sideToMove: 'white',
      material: {
        white: 'K+P',
        black: 'K'
      },
      tags: ['fundamental']
    },
    {
      id: 2,
      title: 'K+2P vs K+P',
      fen: '4k3/4p3/8/4K3/4P3/4P3/8/8 w - - 0 1',
      category: 'pawn',
      difficulty: 'intermediate',
      description: 'Two pawns vs one pawn',
      goal: 'win',
      sideToMove: 'white',
      material: {
        white: 'K+2P',
        black: 'K+P'
      },
      tags: ['advanced']
    },
    {
      id: 3,
      title: 'K+R vs K',
      fen: '4k3/8/4K3/8/8/8/8/4R3 w - - 0 1',
      category: 'rook',
      difficulty: 'beginner',
      description: 'Rook vs King',
      goal: 'win',
      sideToMove: 'white',
      material: {
        white: 'K+R',
        black: 'K'
      },
      tags: ['fundamental']
    }
  ];

  describe('createSubcategories', () => {
    it('sollte Subkategorien basierend auf Material erstellen', () => {
      const pawnPositions = mockPositions.filter(p => p.category === 'pawn');
      const subcategories = createSubcategories('pawn', pawnPositions);
      
      expect(subcategories).toHaveLength(2);
      expect(subcategories[0].material).toBe('K+P vs K');
      expect(subcategories[1].material).toBe('K+2P vs K+P');
    });

    it('sollte korrekte IDs für Subkategorien generieren', () => {
      const pawnPositions = mockPositions.filter(p => p.category === 'pawn');
      const subcategories = createSubcategories('pawn', pawnPositions);
      
      expect(subcategories[0].id).toBe('pawn-kp-vs-k');
      expect(subcategories[1].id).toBe('pawn-k2p-vs-kp');
    });

    it('sollte Positionen korrekt gruppieren', () => {
      const subcategories = createSubcategories('pawn', mockPositions.filter(p => p.category === 'pawn'));
      
      expect(subcategories[0].positions).toHaveLength(1);
      expect(subcategories[0].positions[0].id).toBe(1);
      
      expect(subcategories[1].positions).toHaveLength(1);
      expect(subcategories[1].positions[0].id).toBe(2);
    });

    it('sollte Icons für Material-Kombinationen setzen', () => {
      const subcategories = createSubcategories('pawn', mockPositions.filter(p => p.category === 'pawn'));
      
      expect(subcategories[0].icon).toBeTruthy();
      expect(subcategories[1].icon).toBeTruthy();
    });

    it('sollte mit leeren Positionen umgehen', () => {
      const subcategories = createSubcategories('empty', []);
      
      expect(subcategories).toHaveLength(0);
    });
  });

  describe('getIconForMaterial', () => {
    it('sollte korrekte Icons für verschiedene Material-Kombinationen zurückgeben', () => {
      expect(getIconForMaterial('K+P vs K')).toBe('♙♟ vs ♙');
      expect(getIconForMaterial('K+2P vs K+P')).toBe('♙♟♟ vs ♙♟');
      expect(getIconForMaterial('K+R+P vs K+R')).toBe('♜♙ vs ♜');
      expect(getIconForMaterial('K+Q')).toBe('♛');
      expect(getIconForMaterial('K+R')).toBe('♜');
      expect(getIconForMaterial('K+B')).toBe('♗');
      expect(getIconForMaterial('K+N')).toBe('♘');
    });

    it('sollte Default-Icon für unbekannte Material-Kombinationen zurückgeben', () => {
      expect(getIconForMaterial('Unknown Material')).toBe('♙♟');
      expect(getIconForMaterial('')).toBe('♙♟');
    });
  });

  describe('validateFen', () => {
    it('sollte gültige FEN-Strings validieren', () => {
      expect(validateFen('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1')).toBe(true);
      expect(validateFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toBe(true);
    });

    it('sollte ungültige FEN-Strings ablehnen', () => {
      expect(validateFen('invalid-fen')).toBe(false);
      expect(validateFen('')).toBe(false);
      expect(validateFen('4k3/8/4K3/4P3/8/8/8')).toBe(false); // Missing parts
    });

    it('sollte FEN mit falscher Syntax ablehnen', () => {
      expect(validateFen('4k3/8/4K3/4P3/8/8/8/8 x - - 0 1')).toBe(false); // Invalid turn
      expect(validateFen('9k3/8/4K3/4P3/8/8/8/8 w - - 0 1')).toBe(false); // Invalid rank
    });
  });

  describe('createEndgameCategories', () => {
    it('sollte alle Hauptkategorien erstellen', () => {
      const categories = createEndgameCategories(mockPositions);
      
      expect(categories).toHaveLength(4);
      expect(categories.map(c => c.id)).toEqual(['pawn', 'rook', 'queen', 'minor']);
    });

    it('sollte korrekte Positionen für jede Kategorie zuweisen', () => {
      const categories = createEndgameCategories(mockPositions);
      
      const pawnCategory = categories.find(c => c.id === 'pawn');
      const rookCategory = categories.find(c => c.id === 'rook');
      
      expect(pawnCategory?.positions).toHaveLength(2);
      expect(rookCategory?.positions).toHaveLength(1);
    });

    it('sollte Mobile-Prioritäten setzen', () => {
      const categories = createEndgameCategories(mockPositions);
      
      expect(categories.find(c => c.id === 'pawn')?.mobilePriority).toBe(1);
      expect(categories.find(c => c.id === 'rook')?.mobilePriority).toBe(2);
      expect(categories.find(c => c.id === 'minor')?.mobilePriority).toBe(3);
      expect(categories.find(c => c.id === 'queen')?.mobilePriority).toBe(4);
    });

    it('sollte Metadaten für jede Kategorie erstellen', () => {
      const categories = createEndgameCategories(mockPositions);
      
      const pawnCategory = categories.find(c => c.id === 'pawn');
      expect(pawnCategory?.estimatedStudyTime).toBe('2-4 Wochen');
      expect(pawnCategory?.skillLevel).toBe('Beginner bis Fortgeschritten');
      expect(pawnCategory?.description).toContain('Fundamentale Endspiele');
    });

    it('sollte Subkategorien für jede Hauptkategorie erstellen', () => {
      const categories = createEndgameCategories(mockPositions);
      
      const pawnCategory = categories.find(c => c.id === 'pawn');
      expect(pawnCategory?.subcategories).toHaveLength(2);
    });
  });

  describe('categoryUtils.getCategoryById', () => {
    it('sollte Kategorie nach ID finden', () => {
      const categories = createEndgameCategories(mockPositions);
      const category = categoryUtils.getCategoryById(categories, 'pawn');
      
      expect(category).toBeDefined();
      expect(category?.id).toBe('pawn');
      expect(category?.name).toBe('Bauernendspiele');
    });

    it('sollte undefined für nicht existierende ID zurückgeben', () => {
      const categories = createEndgameCategories(mockPositions);
      const category = categoryUtils.getCategoryById(categories, 'nonexistent');
      
      expect(category).toBeUndefined();
    });
  });

  describe('categoryUtils.getPositionsByDifficulty', () => {
    it('sollte Positionen nach Schwierigkeit filtern', () => {
      const beginnerPositions = categoryUtils.getPositionsByDifficulty(mockPositions, 'beginner');
      const intermediatePositions = categoryUtils.getPositionsByDifficulty(mockPositions, 'intermediate');
      
      expect(beginnerPositions).toHaveLength(2);
      expect(intermediatePositions).toHaveLength(1);
      expect(intermediatePositions[0].id).toBe(2);
    });

    it('sollte leeres Array für nicht existierende Schwierigkeit zurückgeben', () => {
      const advancedPositions = categoryUtils.getPositionsByDifficulty(mockPositions, 'advanced');
      
      expect(advancedPositions).toHaveLength(0);
    });
  });

  describe('categoryUtils.getDuePositions', () => {
    it('sollte Positionen ohne Benutzer-Rating als fällig markieren', () => {
      const duePositions = categoryUtils.getDuePositions(mockPositions);
      
      // All mock positions have no userRating, so all should be due
      expect(duePositions).toHaveLength(3);
    });

    it('sollte Positionen mit timesPlayed=0 als fällig markieren', () => {
      const positionsWithPlayCount = mockPositions.map(p => ({
        ...p,
        userRating: 5,
        timesPlayed: 0
      }));
      
      const duePositions = categoryUtils.getDuePositions(positionsWithPlayCount);
      expect(duePositions).toHaveLength(3);
    });
  });

  describe('categoryUtils.calculateProgress', () => {
    it('sollte korrekte Fortschritts-Statistiken berechnen', () => {
      const positionsWithStats = mockPositions.map((p, index) => ({
        ...p,
        userRating: index + 3, // 3, 4, 5
        successRate: index === 0 ? 0.9 : 0.7, // Only first position is "completed"
        timesPlayed: index + 1 // 1, 2, 3
      }));
      
      const progress = categoryUtils.calculateProgress(positionsWithStats);
      
      expect(progress.total).toBe(3);
      expect(progress.completed).toBe(1); // Only first position has successRate > 0.8
      expect(progress.averageRating).toBe(4); // (3+4+5)/3
      expect(progress.totalStudyTime).toBe(6); // 1+2+3
    });

    it('sollte mit Positionen ohne Statistiken umgehen', () => {
      const progress = categoryUtils.calculateProgress(mockPositions);
      
      expect(progress.total).toBe(3);
      expect(progress.completed).toBe(0);
      expect(progress.averageRating).toBe(0);
      expect(progress.totalStudyTime).toBe(0);
    });

    it('sollte mit leerer Positions-Liste umgehen', () => {
      const progress = categoryUtils.calculateProgress([]);
      
      expect(progress.total).toBe(0);
      expect(progress.completed).toBe(0);
      expect(progress.averageRating).toBeNaN(); // 0/0
      expect(progress.totalStudyTime).toBe(0);
    });
  });
});