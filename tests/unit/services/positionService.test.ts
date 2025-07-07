import { PositionService } from '@shared/services/database/positionService';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@shared/lib/firebase';
import { allEndgamePositions, getPositionById } from '@shared/data/endgames';

// Mock Firebase
jest.mock('@shared/lib/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn()
}));

// Mock environment variable
const originalEnv = process.env;

describe('PositionService', () => {
  let positionService: PositionService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('with Firestore disabled', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_USE_FIRESTORE = 'false';
      positionService = new PositionService();
    });

    it('should get position from array when Firestore is disabled', async () => {
      const position = await positionService.getPosition(1);

      expect(position).toBeDefined();
      expect(position?.id).toBe(1);
      expect(getDoc).not.toHaveBeenCalled();
    });

    it('should get all positions from array', async () => {
      const positions = await positionService.getAllPositions();

      expect(positions).toEqual(allEndgamePositions);
      expect(getDocs).not.toHaveBeenCalled();
    });

    it('should filter positions by category from array', async () => {
      const positions = await positionService.getPositionsByCategory('pawn');

      expect(positions.length).toBeGreaterThan(0);
      expect(positions.every(p => p.category === 'pawn')).toBe(true);
      expect(getDocs).not.toHaveBeenCalled();
    });

    it('should search positions from array', async () => {
      const positions = await positionService.searchPositions('bauern');

      expect(positions.length).toBeGreaterThan(0);
      expect(getDocs).not.toHaveBeenCalled();
    });
  });

  describe('with Firestore enabled', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_USE_FIRESTORE = 'true';
      positionService = new PositionService();
    });

    it('should get position from Firestore when available', async () => {
      const mockPosition = allEndgamePositions[0];
      const mockDocSnap = {
        exists: () => true,
        data: () => mockPosition
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const position = await positionService.getPosition(1);

      expect(position).toEqual(mockPosition);
      expect(getDoc).toHaveBeenCalled();
    });

    it('should fallback to array when position not in Firestore', async () => {
      const mockDocSnap = {
        exists: () => false
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const position = await positionService.getPosition(1);

      expect(position).toBeDefined();
      expect(position?.id).toBe(1);
      expect(getDoc).toHaveBeenCalled();
    });

    it('should fallback to array on Firestore error', async () => {
      (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const position = await positionService.getPosition(1);

      expect(position).toBeDefined();
      expect(position?.id).toBe(1);
    });

    it('should cache positions after fetching', async () => {
      const mockPosition = allEndgamePositions[0];
      const mockDocSnap = {
        exists: () => true,
        data: () => mockPosition
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      // First call - should hit Firestore
      await positionService.getPosition(1);
      expect(getDoc).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await positionService.getPosition(1);
      expect(getDoc).toHaveBeenCalledTimes(1); // Still only 1 call

      // Verify cache stats
      const stats = positionService.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.keys).toContain(1);
    });

    it('should get all positions from Firestore', async () => {
      const mockSnapshot = {
        forEach: (callback: Function) => {
          allEndgamePositions.forEach(pos => {
            callback({ data: () => pos });
          });
        }
      };

      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const positions = await positionService.getAllPositions();

      expect(positions).toHaveLength(allEndgamePositions.length);
      expect(getDocs).toHaveBeenCalled();
    });

    it('should fallback when Firestore returns empty', async () => {
      const mockSnapshot = {
        forEach: (callback: Function) => {
          // Empty result
        }
      };

      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const positions = await positionService.getAllPositions();

      expect(positions).toEqual(allEndgamePositions);
    });

    it('should query positions by category', async () => {
      const pawnPositions = allEndgamePositions.filter(p => p.category === 'pawn');
      const mockSnapshot = {
        forEach: (callback: Function) => {
          pawnPositions.forEach(pos => {
            callback({ data: () => pos });
          });
        }
      };

      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const positions = await positionService.getPositionsByCategory('pawn');

      expect(positions).toHaveLength(pawnPositions.length);
      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('category', '==', 'pawn');
    });

    it('should search positions using client-side filtering', async () => {
      const mockSnapshot = {
        forEach: (callback: Function) => {
          allEndgamePositions.forEach(pos => {
            callback({ data: () => pos });
          });
        }
      };

      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const positions = await positionService.searchPositions('bauern');

      expect(positions.length).toBeGreaterThan(0);
      expect(positions.every(p => 
        p.title.toLowerCase().includes('bauern') ||
        p.description.toLowerCase().includes('bauern')
      )).toBe(true);
    });
  });

  describe('cache management', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_USE_FIRESTORE = 'true';
      positionService = new PositionService();
    });

    it('should clear cache', async () => {
      const mockPosition = allEndgamePositions[0];
      const mockDocSnap = {
        exists: () => true,
        data: () => mockPosition
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      // Add to cache
      await positionService.getPosition(1);
      expect(positionService.getCacheStats().size).toBe(1);

      // Clear cache
      positionService.clearCache();
      expect(positionService.getCacheStats().size).toBe(0);

      // Should hit Firestore again
      await positionService.getPosition(1);
      expect(getDoc).toHaveBeenCalledTimes(2);
    });
  });
});