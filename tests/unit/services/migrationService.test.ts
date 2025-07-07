import { FirestoreMigrationService } from '@shared/services/database/migrationService';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@shared/lib/firebase';
import { allEndgamePositions, endgameCategories, endgameChapters } from '@shared/data/endgames';

// Mock Firebase
jest.mock('@shared/lib/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  writeBatch: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 }))
  }
}));

describe('FirestoreMigrationService', () => {
  let migrationService: FirestoreMigrationService;
  let mockBatch: any;

  beforeEach(() => {
    migrationService = new FirestoreMigrationService();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock batch
    mockBatch = {
      set: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined)
    };
    
    // Mock writeBatch to return our mock batch
    const { writeBatch } = require('firebase/firestore');
    (writeBatch as jest.Mock).mockReturnValue(mockBatch);
  });

  describe('migratePositions', () => {
    it('should migrate all positions to Firestore', async () => {
      const result = await migrationService.migratePositions();

      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(allEndgamePositions.length);
      expect(result.errors).toHaveLength(0);

      // Verify batch operations
      expect(mockBatch.set).toHaveBeenCalledTimes(allEndgamePositions.length);
      expect(mockBatch.commit).toHaveBeenCalled();

      // Verify each position was processed
      allEndgamePositions.forEach((position, index) => {
        const call = mockBatch.set.mock.calls[index];
        const docRef = call[0];
        const data = call[1];

        expect(data).toMatchObject({
          ...position,
          createdAt: expect.any(Object),
          updatedAt: expect.any(Object)
        });
      });
    });

    it('should handle batch size limits', async () => {
      // Create a service with a smaller batch size for testing
      const smallBatchService = new FirestoreMigrationService();
      (smallBatchService as any).batchSize = 2; // Override batch size

      const result = await smallBatchService.migratePositions();

      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(allEndgamePositions.length);
      // Should have called commit multiple times based on batch size
      const expectedBatches = Math.ceil(allEndgamePositions.length / 2);
      expect(mockBatch.commit).toHaveBeenCalledTimes(expectedBatches);
    });

    it('should handle errors during migration', async () => {
      // Make batch.set throw an error for the second position
      mockBatch.set.mockImplementationOnce(() => {})
        .mockImplementationOnce(() => { throw new Error('Firestore error'); })
        .mockImplementation(() => {});

      const result = await migrationService.migratePositions();

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to prepare position');
      // Should still migrate other positions
      expect(result.migratedCount).toBe(allEndgamePositions.length - 1);
    });
  });

  describe('migrateCategories', () => {
    it('should migrate all categories to Firestore', async () => {
      const result = await migrationService.migrateCategories();

      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(endgameCategories.length);
      expect(result.errors).toHaveLength(0);

      // Verify batch operations
      expect(mockBatch.set).toHaveBeenCalledTimes(endgameCategories.length);
      expect(mockBatch.commit).toHaveBeenCalled();

      // Verify position count was calculated
      endgameCategories.forEach((category, index) => {
        const call = mockBatch.set.mock.calls[index];
        const data = call[1];

        expect(data).toMatchObject({
          ...category,
          positionCount: expect.any(Number),
          createdAt: expect.any(Object),
          updatedAt: expect.any(Object)
        });
      });
    });
  });

  describe('migrateChapters', () => {
    it('should migrate all chapters to Firestore', async () => {
      const result = await migrationService.migrateChapters();

      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(endgameChapters.length);
      expect(result.errors).toHaveLength(0);

      // Verify batch operations
      expect(mockBatch.set).toHaveBeenCalledTimes(endgameChapters.length);
      expect(mockBatch.commit).toHaveBeenCalled();

      // Verify lessons were converted to IDs
      endgameChapters.forEach((chapter, index) => {
        const call = mockBatch.set.mock.calls[index];
        const data = call[1];

        expect(data.lessons).toEqual(chapter.lessons.map(l => l.id));
        expect(data).toMatchObject({
          createdAt: expect.any(Object),
          updatedAt: expect.any(Object)
        });
      });
    });
  });

  describe('runFullMigration', () => {
    it('should run all migrations successfully', async () => {
      const results = await migrationService.runFullMigration();

      expect(results.positions.success).toBe(true);
      expect(results.categories.success).toBe(true);
      expect(results.chapters.success).toBe(true);

      // Verify all migrations were called
      const totalCalls = allEndgamePositions.length + 
                        endgameCategories.length + 
                        endgameChapters.length;
      expect(mockBatch.set).toHaveBeenCalledTimes(totalCalls);
    });

    it('should report partial success when some migrations fail', async () => {
      // Make categories migration fail
      mockBatch.commit
        .mockResolvedValueOnce(undefined) // positions succeed
        .mockRejectedValueOnce(new Error('Categories failed')) // categories fail
        .mockResolvedValueOnce(undefined); // chapters succeed

      const results = await migrationService.runFullMigration();

      expect(results.positions.success).toBe(true);
      expect(results.categories.success).toBe(false);
      expect(results.chapters.success).toBe(true);
    });
  });

  describe('verifyMigration', () => {
    it('should verify successful migration', async () => {
      // Mock getDocs to return correct counts
      (getDocs as jest.Mock)
        .mockResolvedValueOnce({ size: allEndgamePositions.length })
        .mockResolvedValueOnce({ size: endgameCategories.length })
        .mockResolvedValueOnce({ size: endgameChapters.length });

      const isValid = await migrationService.verifyMigration();

      expect(isValid).toBe(true);
      expect(getDocs).toHaveBeenCalledTimes(3);
    });

    it('should detect count mismatches', async () => {
      // Return wrong count for positions
      (getDocs as jest.Mock)
        .mockResolvedValueOnce({ size: allEndgamePositions.length - 1 })
        .mockResolvedValueOnce({ size: endgameCategories.length })
        .mockResolvedValueOnce({ size: endgameChapters.length });

      const isValid = await migrationService.verifyMigration();

      expect(isValid).toBe(false);
    });

    it('should handle verification errors', async () => {
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const isValid = await migrationService.verifyMigration();

      expect(isValid).toBe(false);
    });
  });
});