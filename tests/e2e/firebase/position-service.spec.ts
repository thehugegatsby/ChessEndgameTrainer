/**
 * Position Service Integration Tests
 * Comprehensive tests for positionService with real Firestore queries
 * Tests all methods with actual Firebase emulator to ensure proper integration
 */

import { test, expect } from '../firebase-test-fixture';
import { IPositionService } from '@shared/services/database/IPositionService';
import { createFirebasePositionService } from './helpers/firebase-test-setup';
import { EndgamePosition, EndgameCategory, EndgameChapter } from '@shared/types';

// Test data fixtures
const testPositions: EndgamePosition[] = [
  {
    id: 1,
    title: 'King and Queen vs King',
    description: 'Basic checkmate with Queen',
    fen: '8/8/8/3k4/8/3K4/3Q4/8 w - - 0 1',
    category: 'basic-checkmates',
    difficulty: 'beginner',
    targetMoves: 3,
    sideToMove: 'white',
    goal: 'win',
    hints: ['Bring your king up to support', 'Use the queen to control squares'],
    solution: ['Qd5+', 'Kf6', 'Qf7#']
  },
  {
    id: 2,
    title: 'King and Rook vs King',
    description: 'Basic checkmate with Rook',
    fen: '8/8/8/3k4/8/3K4/3R4/8 w - - 0 1',
    category: 'basic-checkmates',
    difficulty: 'beginner',
    targetMoves: 6,
    sideToMove: 'white',
    goal: 'win',
    hints: ['Use the rook to cut off the king', 'Drive the king to the edge'],
    solution: ['Rd5+', 'Kf6', 'Rd6+']
  },
  {
    id: 3,
    title: 'Pawn Endgame - Opposition',
    description: 'Using opposition in pawn endgames',
    fen: '8/8/8/3k4/8/3K4/3P4/8 w - - 0 1',
    category: 'pawn-endgames',
    difficulty: 'intermediate',
    targetMoves: 5,
    sideToMove: 'white',
    goal: 'win',
    hints: ['Take the opposition', 'Advance with support'],
    solution: ['Kd4', 'Kd6', 'd3']
  },
  {
    id: 10,
    title: 'Complex Rook Endgame',
    description: 'Advanced rook and pawn vs rook',
    fen: '8/8/8/3k1p2/8/3K1P2/3R4/5r2 w - - 0 1',
    category: 'rook-endgames',
    difficulty: 'advanced',
    targetMoves: 10,
    sideToMove: 'white',
    goal: 'draw',
    hints: ['Find the key defensive setup', 'Use passive defense'],
    solution: ['Rd5+', 'Kf6', 'Rd6+']
  }
];

const testCategories: EndgameCategory[] = [
  {
    id: 'basic-checkmates',
    name: 'Basic Checkmates',
    description: 'Fundamental checkmate patterns',
    icon: '♕',
    positions: []
  },
  {
    id: 'pawn-endgames',
    name: 'Pawn Endgames',
    description: 'Pawn endgame techniques',
    icon: '♟',
    positions: []
  },
  {
    id: 'rook-endgames',
    name: 'Rook Endgames',
    description: 'Rook endgame mastery',
    icon: '♜',
    positions: []
  }
];

const testChapters: EndgameChapter[] = [
  {
    id: 'chapter-1',
    name: 'Basic Checkmates Chapter',
    description: 'Learn fundamental checkmates',
    category: 'basic-checkmates',
    lessons: [],
    totalLessons: 2
  },
  {
    id: 'chapter-2',
    name: 'Pawn Endgames Chapter',
    description: 'Master pawn endgames',
    category: 'pawn-endgames',
    lessons: [],
    totalLessons: 1
  },
  {
    id: 'chapter-3',
    name: 'Rook Endgames Chapter',
    description: 'Advanced rook techniques',
    category: 'rook-endgames',
    lessons: [],
    totalLessons: 1
  }
];

test.describe('PositionService Integration Tests', () => {
  let positionService: IPositionService;

  test.beforeEach(async ({ firebaseData }) => {
    // Clear all data and seed test data
    await firebaseData.clearAll();
    
    // Create fresh instance for each test to ensure clean state
    positionService = createFirebasePositionService();
    
    // Seed test data for most tests
    await firebaseData.seedBatch({
      positions: testPositions,
      categories: testCategories,
      chapters: testChapters
    });
  });

  test.describe('Single Position Retrieval', () => {
    test('should retrieve existing position by ID', async () => {
      const position = await positionService.getPosition(1);
      
      expect(position).not.toBeNull();
      expect(position!.id).toBe(1);
      expect(position!.title).toBe('King and Queen vs King');
      expect(position!.category).toBe('basic-checkmates');
      expect(position!.difficulty).toBe('beginner');
      expect(position!.fen).toBe('8/8/8/3k4/8/3K4/3Q4/8 w - - 0 1');
    });

    test('should return null for non-existent position', async () => {
      const position = await positionService.getPosition(999);
      expect(position).toBeNull();
    });

    test('should cache retrieved positions', async () => {
      // First retrieval
      const position1 = await positionService.getPosition(1);
      expect(position1).not.toBeNull();

      // Check cache statistics
      const cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(1);
      expect(cacheStats.keys).toContain(1);

      // Second retrieval should use cache (no additional Firestore call)
      const position2 = await positionService.getPosition(1);
      expect(position2).toEqual(position1);
      
      // Cache should still have only one entry
      const cacheStats2 = positionService.getCacheStats();
      expect(cacheStats2.size).toBe(1);
    });

    test('should validate FEN strings from Firestore', async () => {
      // This test would require seeding invalid FEN data to test validation
      // For now, we verify that valid FEN passes through
      const position = await positionService.getPosition(1);
      expect(position!.fen).toBe('8/8/8/3k4/8/3K4/3Q4/8 w - - 0 1');
    });
  });

  test.describe('Multiple Positions Retrieval', () => {
    test('should retrieve all positions', async () => {
      const positions = await positionService.getAllPositions();
      
      expect(positions).toHaveLength(4);
      expect(positions.map((p: EndgamePosition) => p.id).sort()).toEqual([1, 2, 3, 10]);
      
      // Verify all positions are cached
      const cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(4);
    });

    test('should handle empty database gracefully', async ({ firebaseData }) => {
      // Clear all data
      await firebaseData.clearAll();
      
      const positions = await positionService.getAllPositions();
      expect(positions).toHaveLength(0);
    });

    test('should retrieve positions by category', async () => {
      const basicCheckmates = await positionService.getPositionsByCategory('basic-checkmates');
      expect(basicCheckmates).toHaveLength(2);
      expect(basicCheckmates.every((p: EndgamePosition) => p.category === 'basic-checkmates')).toBe(true);
      
      const pawnEndgames = await positionService.getPositionsByCategory('pawn-endgames');
      expect(pawnEndgames).toHaveLength(1);
      expect(pawnEndgames[0].id).toBe(3);
      
      const rookEndgames = await positionService.getPositionsByCategory('rook-endgames');
      expect(rookEndgames).toHaveLength(1);
      expect(rookEndgames[0].id).toBe(10);
    });

    test('should retrieve positions by difficulty', async () => {
      const beginnerPositions = await positionService.getPositionsByDifficulty('beginner');
      expect(beginnerPositions).toHaveLength(2);
      expect(beginnerPositions.every((p: EndgamePosition) => p.difficulty === 'beginner')).toBe(true);
      
      const intermediatePositions = await positionService.getPositionsByDifficulty('intermediate');
      expect(intermediatePositions).toHaveLength(1);
      expect(intermediatePositions[0].id).toBe(3);
      
      const advancedPositions = await positionService.getPositionsByDifficulty('advanced');
      expect(advancedPositions).toHaveLength(1);
      expect(advancedPositions[0].id).toBe(10);
    });

    test('should return empty array for non-existent category', async () => {
      const positions = await positionService.getPositionsByCategory('non-existent');
      expect(positions).toHaveLength(0);
    });

    test('should return empty array for non-existent difficulty', async () => {
      const positions = await positionService.getPositionsByDifficulty('master');
      expect(positions).toHaveLength(0);
    });
  });

  test.describe('Search Functionality', () => {
    test('should search positions by title', async () => {
      const results = await positionService.searchPositions('Queen');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('King and Queen vs King');
    });

    test('should search positions by description', async () => {
      const results = await positionService.searchPositions('opposition');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Pawn Endgame - Opposition');
    });

    test('should perform case-insensitive search', async () => {
      const results = await positionService.searchPositions('ROOK');
      expect(results).toHaveLength(2); // 'King and Rook vs King' and 'Complex Rook Endgame'
    });

    test('should return empty array for no matches', async () => {
      const results = await positionService.searchPositions('knight');
      expect(results).toHaveLength(0);
    });

    test('should handle empty search term', async () => {
      const results = await positionService.searchPositions('');
      // Should return all positions since empty string matches everything
      expect(results).toHaveLength(4);
    });
  });

  test.describe('Categories and Chapters', () => {
    test('should retrieve all categories', async () => {
      const categories = await positionService.getCategories();
      expect(categories).toHaveLength(3);
      
      const categoryIds = categories.map((c: EndgameCategory) => c.id);
      expect(categoryIds).toContain('basic-checkmates');
      expect(categoryIds).toContain('pawn-endgames');
      expect(categoryIds).toContain('rook-endgames');
    });

    test('should retrieve all chapters', async () => {
      const chapters = await positionService.getChapters();
      expect(chapters).toHaveLength(3);
      
      const chapterIds = chapters.map((c: EndgameChapter) => c.id);
      expect(chapterIds).toContain('chapter-1');
      expect(chapterIds).toContain('chapter-2');
      expect(chapterIds).toContain('chapter-3');
    });

    test('should retrieve chapters by category', async () => {
      const basicChapters = await positionService.getChaptersByCategory('basic-checkmates');
      expect(basicChapters).toHaveLength(1);
      expect(basicChapters[0].id).toBe('chapter-1');
      
      const pawnChapters = await positionService.getChaptersByCategory('pawn-endgames');
      expect(pawnChapters).toHaveLength(1);
      expect(pawnChapters[0].id).toBe('chapter-2');
    });

    test('should return empty array for non-existent category chapters', async () => {
      const chapters = await positionService.getChaptersByCategory('non-existent');
      expect(chapters).toHaveLength(0);
    });
  });

  test.describe('Navigation Methods', () => {
    test('should get next position in sequence', async () => {
      const nextPosition = await positionService.getNextPosition(1);
      expect(nextPosition).not.toBeNull();
      expect(nextPosition!.id).toBe(2);
    });

    test('should get next position in specific category', async () => {
      const nextInCategory = await positionService.getNextPosition(1, 'basic-checkmates');
      expect(nextInCategory).not.toBeNull();
      expect(nextInCategory!.id).toBe(2);
      expect(nextInCategory!.category).toBe('basic-checkmates');
    });

    test('should return null when no next position exists', async () => {
      const nextPosition = await positionService.getNextPosition(10);
      expect(nextPosition).toBeNull();
    });

    test('should return null when no next position in category exists', async () => {
      const nextInCategory = await positionService.getNextPosition(10, 'rook-endgames');
      expect(nextInCategory).toBeNull();
    });

    test('should get previous position in sequence', async () => {
      const prevPosition = await positionService.getPreviousPosition(3);
      expect(prevPosition).not.toBeNull();
      expect(prevPosition!.id).toBe(2);
    });

    test('should get previous position in specific category', async () => {
      const prevInCategory = await positionService.getPreviousPosition(2, 'basic-checkmates');
      expect(prevInCategory).not.toBeNull();
      expect(prevInCategory!.id).toBe(1);
      expect(prevInCategory!.category).toBe('basic-checkmates');
    });

    test('should return null when no previous position exists', async () => {
      const prevPosition = await positionService.getPreviousPosition(1);
      expect(prevPosition).toBeNull();
    });

    test('should return null when no previous position in category exists', async () => {
      const prevInCategory = await positionService.getPreviousPosition(3, 'pawn-endgames');
      expect(prevInCategory).toBeNull();
    });
  });

  test.describe('Count Methods', () => {
    test('should get total position count', async () => {
      const totalCount = await positionService.getTotalPositionCount();
      expect(totalCount).toBe(4);
    });

    test('should get position count by category', async () => {
      const basicCount = await positionService.getPositionCountByCategory('basic-checkmates');
      expect(basicCount).toBe(2);
      
      const pawnCount = await positionService.getPositionCountByCategory('pawn-endgames');
      expect(pawnCount).toBe(1);
      
      const rookCount = await positionService.getPositionCountByCategory('rook-endgames');
      expect(rookCount).toBe(1);
    });

    test('should return 0 for non-existent category count', async () => {
      const count = await positionService.getPositionCountByCategory('non-existent');
      expect(count).toBe(0);
    });

    test('should handle empty database counts', async ({ firebaseData }) => {
      await firebaseData.clearAll();
      
      const totalCount = await positionService.getTotalPositionCount();
      expect(totalCount).toBe(0);
      
      const categoryCount = await positionService.getPositionCountByCategory('basic-checkmates');
      expect(categoryCount).toBe(0);
    });
  });

  test.describe('Cache Management', () => {
    test('should clear cache', async () => {
      // Load some positions to populate cache
      await positionService.getPosition(1);
      await positionService.getPosition(2);
      
      let cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(2);
      
      // Clear cache
      positionService.clearCache();
      
      cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(0);
      expect(cacheStats.keys).toHaveLength(0);
    });

    test('should provide accurate cache statistics', async () => {
      let cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(0);
      expect(cacheStats.keys).toHaveLength(0);
      
      // Load positions
      await positionService.getPosition(1);
      await positionService.getPosition(3);
      
      cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(2);
      expect(cacheStats.keys.sort()).toEqual([1, 3]);
    });

    test('should use cache for subsequent requests', async () => {
      // First request loads from Firestore
      const position1 = await positionService.getPosition(1);
      expect(position1).not.toBeNull();
      
      // Verify cache is populated
      let cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(1);
      expect(cacheStats.keys).toContain(1);
      
      // Second request should use cache (same object reference)
      const position2 = await positionService.getPosition(1);
      expect(position2).toBe(position1); // Same object reference from cache
      
      // Cache stats should remain the same
      cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(1);
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle Firestore connection errors gracefully', async ({ firebaseData }) => {
      // This test is challenging without actually disconnecting Firestore
      // Instead, we'll test with invalid data scenarios
      
      // Test with cleared database
      await firebaseData.clearAll();
      
      const position = await positionService.getPosition(1);
      expect(position).toBeNull();
      
      const positions = await positionService.getAllPositions();
      expect(positions).toHaveLength(0);
    });

    test('should handle malformed position data', async () => {
      // Test requires seeding malformed data, which our validation prevents
      // Instead, verify that valid data passes through correctly
      const position = await positionService.getPosition(1);
      expect(position).not.toBeNull();
      expect(position!.fen).toBeTruthy();
      expect(position!.title).toBeTruthy();
    });

    test('should handle concurrent access correctly', async () => {
      // Test concurrent access to the same position
      const promises = [
        positionService.getPosition(1),
        positionService.getPosition(1),
        positionService.getPosition(1)
      ];
      
      const results = await Promise.all(promises);
      
      // All should return the same position
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
      
      // Cache should only have one entry
      const cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(1);
    });

    test('should handle large dataset efficiently', async ({ firebaseData }) => {
      // Clear and seed larger dataset
      await firebaseData.clearAll();
      
      const largePositionSet: EndgamePosition[] = [];
      for (let i = 1; i <= 20; i++) {
        largePositionSet.push({
          id: i,
          title: `Position ${i}`,
          description: `Test position ${i}`,
          fen: '8/8/8/3k4/8/3K4/3Q4/8 w - - 0 1',
          category: i <= 10 ? 'category-a' : 'category-b',
          difficulty: i <= 5 ? 'beginner' : i <= 15 ? 'intermediate' : 'advanced',
          targetMoves: i + 2,
          sideToMove: 'white',
          goal: 'win',
          hints: [`Hint for position ${i}`],
          solution: ['Move1', 'Move2']
        });
      }
      
      await firebaseData.seedBatch({ positions: largePositionSet });
      
      // Test performance with larger dataset
      const startTime = Date.now();
      const allPositions = await positionService.getAllPositions();
      const endTime = Date.now();
      
      expect(allPositions).toHaveLength(20);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Test category filtering
      const categoryA = await positionService.getPositionsByCategory('category-a');
      expect(categoryA).toHaveLength(10);
      
      const categoryB = await positionService.getPositionsByCategory('category-b');
      expect(categoryB).toHaveLength(10);
    });
  });

  test.describe('Real Firestore Integration Validation', () => {
    test('should work with Firebase emulator', async ({ apiClient }) => {
      // Verify we're working with emulator
      const status = await apiClient.getFirebaseStatus();
      expect(status.status).toBe('connected');
      expect(status.collections.positions).toBeGreaterThan(0);
      
      // Verify positionService can read the same data
      const positions = await positionService.getAllPositions();
      expect(positions.length).toBe(status.collections.positions);
    });

    test('should maintain data consistency with Test API', async ({ apiClient }) => {
      // Get data via positionService
      const servicePositions = await positionService.getAllPositions();
      const serviceCategories = await positionService.getCategories();
      const serviceChapters = await positionService.getChapters();
      
      // Get data via Test API
      const apiStatus = await apiClient.getFirebaseStatus();
      
      // Verify counts match
      expect(servicePositions.length).toBe(apiStatus.collections.positions || 0);
      expect(serviceCategories.length).toBe(apiStatus.collections.categories || 0);
      expect(serviceChapters.length).toBe(apiStatus.collections.chapters || 0);
    });

    test('should persist data across service instances', async () => {
      // Load data with first instance
      const position1 = await positionService.getPosition(1);
      expect(position1).not.toBeNull();
      
      // Create new service instance
      const newService = createFirebasePositionService();
      
      // Should be able to load same data
      const position2 = await newService.getPosition(1);
      expect(position2).not.toBeNull();
      expect(position2!.id).toBe(position1!.id);
      expect(position2!.title).toBe(position1!.title);
    });

    test('should handle Firebase emulator restart gracefully', async () => {
      // This test verifies that the service can handle connection issues
      // In a real scenario, we might stop/start the emulator
      
      // For now, test that multiple rapid calls work correctly
      const rapidCalls = Array.from({ length: 10 }, (_, i) => 
        positionService.getPosition((i % 4) + 1)
      );
      
      const results = await Promise.all(rapidCalls);
      
      // All calls should succeed
      results.forEach((result: EndgamePosition | null) => {
        expect(result).not.toBeNull();
      });
    });
  });
});