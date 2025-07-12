/**
 * Position Service Edge Cases Tests
 * Specialized tests for error handling, edge cases, and boundary conditions
 * Focuses on robustness and resilience of positionService with real Firestore
 */

import { test, expect } from '../firebase-test-fixture';
import { PositionService } from '@shared/services/database/positionService';
import { EndgamePosition } from '@shared/types';

test.describe('PositionService Edge Cases and Error Handling', () => {
  let positionService: PositionService;

  test.beforeEach(async ({ firebaseData }) => {
    await firebaseData.clearAll();
    positionService = new PositionService();
  });

  test.describe('FEN Validation Edge Cases', () => {
    test('should handle positions with valid FEN strings', async ({ firebaseData }) => {
      const validFenPositions: EndgamePosition[] = [
        {
          id: 1,
          title: 'Starting Position',
          description: 'Standard chess starting position',
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          category: 'test',
          difficulty: 'beginner',
          sideToMove: 'white',
          goal: 'win',
          hints: [],
          solution: [],
          lessonNumber: 1,
          chapterNumber: 1,
          tags: []
        },
        {
          id: 2,
          title: 'Endgame Position',
          description: 'King and Queen vs King',
          fen: '8/8/8/3k4/8/3K4/3Q4/8 w - - 0 1',
          category: 'test',
          difficulty: 'beginner',
          sideToMove: 'white',
          goal: 'win',
          hints: [],
          solution: [],
          lessonNumber: 1,
          chapterNumber: 1,
          tags: []
        },
        {
          id: 3,
          title: 'Complex Position',
          description: 'Position with castling rights and en passant',
          fen: 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1',
          category: 'test',
          difficulty: 'advanced',
          sideToMove: 'white',
          goal: 'win',
          hints: [],
          solution: [],
          lessonNumber: 1,
          chapterNumber: 1,
          tags: []
        }
      ];

      await firebaseData.seedBatch({ positions: validFenPositions });

      // All positions should be retrievable
      const position1 = await positionService.getPosition(1);
      expect(position1).not.toBeNull();
      expect(position1!.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

      const position2 = await positionService.getPosition(2);
      expect(position2).not.toBeNull();
      expect(position2!.fen).toBe('8/8/8/3k4/8/3K4/3Q4/8 w - - 0 1');

      const position3 = await positionService.getPosition(3);
      expect(position3).not.toBeNull();
      expect(position3!.fen).toBe('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1');
    });

    test('should handle positions with minimal FEN strings', async ({ firebaseData }) => {
      const minimalFenPosition: EndgamePosition = {
        id: 1,
        title: 'Minimal FEN',
        description: 'Position with minimal FEN notation',
        fen: '8/8/8/8/8/8/8/8 w - - 0 1',
        category: 'test',
        difficulty: 'beginner',
        sideToMove: 'white',
        goal: 'draw',
        hints: [],
        solution: [],
        lessonNumber: 1,
        chapterNumber: 1,
        tags: []
      };

      await firebaseData.seedBatch({ positions: [minimalFenPosition] });

      const position = await positionService.getPosition(1);
      expect(position).not.toBeNull();
      expect(position!.fen).toBe('8/8/8/8/8/8/8/8 w - - 0 1');
    });
  });

  test.describe('Empty Database Scenarios', () => {
    test('should handle getAllPositions with empty database', async () => {
      const positions = await positionService.getAllPositions();
      expect(positions).toHaveLength(0);
      expect(Array.isArray(positions)).toBe(true);
    });

    test('should handle getPositionsByCategory with empty database', async () => {
      const positions = await positionService.getPositionsByCategory('any-category');
      expect(positions).toHaveLength(0);
      expect(Array.isArray(positions)).toBe(true);
    });

    test('should handle getPositionsByDifficulty with empty database', async () => {
      const positions = await positionService.getPositionsByDifficulty('beginner');
      expect(positions).toHaveLength(0);
      expect(Array.isArray(positions)).toBe(true);
    });

    test('should handle searchPositions with empty database', async () => {
      const positions = await positionService.searchPositions('anything');
      expect(positions).toHaveLength(0);
      expect(Array.isArray(positions)).toBe(true);
    });

    test('should handle getCategories with empty database', async () => {
      const categories = await positionService.getCategories();
      expect(categories).toHaveLength(0);
      expect(Array.isArray(categories)).toBe(true);
    });

    test('should handle getChapters with empty database', async () => {
      const chapters = await positionService.getChapters();
      expect(chapters).toHaveLength(0);
      expect(Array.isArray(chapters)).toBe(true);
    });

    test('should handle count methods with empty database', async () => {
      const totalCount = await positionService.getTotalPositionCount();
      expect(totalCount).toBe(0);

      const categoryCount = await positionService.getPositionCountByCategory('any-category');
      expect(categoryCount).toBe(0);
    });
  });

  test.describe('Boundary Value Testing', () => {
    test('should handle position ID edge cases', async ({ firebaseData }) => {
      const boundaryPositions: EndgamePosition[] = [
        {
          id: 0, // Minimum ID
          title: 'Position Zero',
          description: 'Position with ID 0',
          fen: '8/8/8/3k4/8/3K4/8/8 w - - 0 1',
          category: 'test',
          difficulty: 'beginner',
          sideToMove: 'white',
          goal: 'draw',
          hints: [],
          solution: [],
          lessonNumber: 1,
          chapterNumber: 1,
          tags: []
        },
        {
          id: 2147483647, // Max 32-bit integer
          title: 'Max ID Position',
          description: 'Position with maximum ID',
          fen: '8/8/8/3k4/8/3K4/8/8 w - - 0 1',
          category: 'test',
          difficulty: 'beginner',
          sideToMove: 'white',
          goal: 'draw',
          hints: [],
          solution: [],
          lessonNumber: 1,
          chapterNumber: 1,
          tags: []
        }
      ];

      await firebaseData.seedBatch({ positions: boundaryPositions });

      const position0 = await positionService.getPosition(0);
      expect(position0).not.toBeNull();
      expect(position0!.id).toBe(0);

      const positionMax = await positionService.getPosition(2147483647);
      expect(positionMax).not.toBeNull();
      expect(positionMax!.id).toBe(2147483647);
    });

    test('should handle navigation at boundaries', async ({ firebaseData }) => {
      const positions: EndgamePosition[] = [
        {
          id: 1,
          title: 'First Position',
          description: 'The first position',
          fen: '8/8/8/3k4/8/3K4/8/8 w - - 0 1',
          category: 'test',
          difficulty: 'beginner',
          sideToMove: 'white',
          goal: 'draw',
          hints: [],
          solution: [],
          lessonNumber: 1,
          chapterNumber: 1,
          tags: []
        },
        {
          id: 100,
          title: 'Last Position',
          description: 'The last position',
          fen: '8/8/8/3k4/8/3K4/8/8 w - - 0 1',
          category: 'test',
          difficulty: 'beginner',
          sideToMove: 'white',
          goal: 'draw',
          hints: [],
          solution: [],
          lessonNumber: 1,
          chapterNumber: 1,
          tags: []
        }
      ];

      await firebaseData.seedBatch({ positions });

      // Test navigation at boundaries
      const beforeFirst = await positionService.getPreviousPosition(1);
      expect(beforeFirst).toBeNull();

      const afterLast = await positionService.getNextPosition(100);
      expect(afterLast).toBeNull();

      const nextFromFirst = await positionService.getNextPosition(1);
      expect(nextFromFirst).not.toBeNull();
      expect(nextFromFirst!.id).toBe(100);

      const prevFromLast = await positionService.getPreviousPosition(100);
      expect(prevFromLast).not.toBeNull();
      expect(prevFromLast!.id).toBe(1);
    });
  });

  test.describe('Special Characters and Unicode', () => {
    test('should handle positions with special characters', async ({ firebaseData }) => {
      const specialCharPositions: EndgamePosition[] = [
        {
          id: 1,
          title: 'Position with émojis ♔♕♖♗♘♙',
          description: 'Description with spéciál chäractërs and 中文字符',
          fen: '8/8/8/3k4/8/3K4/8/8 w - - 0 1',
          category: 'special-chars',
          difficulty: 'beginner',
          sideToMove: 'white',
          goal: 'win',
          hints: ['Hint with émoji ♔', 'Hint with 中文'],
          solution: ['Move with ♔', 'Another move'],
          lessonNumber: 1,
          chapterNumber: 1,
          tags: ['spéciál', '中文', 'émoji']
        }
      ];

      await firebaseData.seedBatch({ positions: specialCharPositions });

      const position = await positionService.getPosition(1);
      expect(position).not.toBeNull();
      expect(position!.title).toBe('Position with émojis ♔♕♖♗♘♙');
      expect(position!.description).toContain('spéciál chäractërs');
      expect(position!.description).toContain('中文字符');
    });

    test('should handle search with special characters', async ({ firebaseData }) => {
      const positions: EndgamePosition[] = [
        {
          id: 1,
          title: 'Café Position',
          description: 'A position in café style',
          fen: '8/8/8/3k4/8/3K4/8/8 w - - 0 1',
          category: 'test',
          difficulty: 'beginner',
          sideToMove: 'white',
          goal: 'win',
          hints: [],
          solution: [],
          lessonNumber: 1,
          chapterNumber: 1,
          tags: []
        }
      ];

      await firebaseData.seedBatch({ positions });

      const results = await positionService.searchPositions('café');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Café Position');
    });
  });

  test.describe('Large String Handling', () => {
    test('should handle positions with very long descriptions', async ({ firebaseData }) => {
      const longDescription = 'A'.repeat(10000); // 10KB description
      const longHint = 'B'.repeat(5000); // 5KB hint
      
      const longStringPosition: EndgamePosition = {
        id: 1,
        title: 'Position with Long Text',
        description: longDescription,
        fen: '8/8/8/3k4/8/3K4/8/8 w - - 0 1',
        category: 'test',
        difficulty: 'beginner',
        sideToMove: 'white',
        goal: 'win',
        hints: [longHint],
        solution: ['Move'],
        lessonNumber: 1,
        chapterNumber: 1,
        tags: []
      };

      await firebaseData.seedBatch({ positions: [longStringPosition] });

      const position = await positionService.getPosition(1);
      expect(position).not.toBeNull();
      expect(position!.description).toHaveLength(10000);
      expect(position!.hints[0]).toHaveLength(5000);
    });

    test('should handle search with very long search terms', async ({ firebaseData }) => {
      const normalPosition: EndgamePosition = {
        id: 1,
        title: 'Normal Position',
        description: 'A normal position',
        fen: '8/8/8/3k4/8/3K4/8/8 w - - 0 1',
        category: 'test',
        difficulty: 'beginner',
        sideToMove: 'white',
        goal: 'win',
        hints: [],
        solution: [],
        lessonNumber: 1,
        chapterNumber: 1,
        tags: []
      };

      await firebaseData.seedBatch({ positions: [normalPosition] });

      const veryLongSearchTerm = 'x'.repeat(1000);
      const results = await positionService.searchPositions(veryLongSearchTerm);
      expect(results).toHaveLength(0); // Should not match anything
    });
  });

  test.describe('Concurrent Access Patterns', () => {
    test('should handle rapid sequential access', async ({ firebaseData }) => {
      const positions: EndgamePosition[] = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        title: `Position ${i + 1}`,
        description: `Description ${i + 1}`,
        fen: '8/8/8/3k4/8/3K4/8/8 w - - 0 1',
        category: 'test',
        difficulty: 'beginner',
        sideToMove: 'white',
        goal: 'win',
        hints: [],
        solution: [],
        lessonNumber: 1,
        chapterNumber: 1,
        tags: []
      }));

      await firebaseData.seedBatch({ positions });

      // Rapid sequential access
      const startTime = Date.now();
      const results = [];
      for (let i = 1; i <= 10; i++) {
        const position = await positionService.getPosition(i);
        results.push(position);
      }
      const endTime = Date.now();

      // All positions should be retrieved
      expect(results).toHaveLength(10);
      results.forEach((pos, index) => {
        expect(pos).not.toBeNull();
        expect(pos!.id).toBe(index + 1);
      });

      // Should complete reasonably quickly (within 2 seconds)
      expect(endTime - startTime).toBeLessThan(2000);
    });

    test('should handle concurrent requests for same position', async ({ firebaseData }) => {
      const position: EndgamePosition = {
        id: 1,
        title: 'Concurrent Test Position',
        description: 'Position for concurrent access testing',
        fen: '8/8/8/3k4/8/3K4/8/8 w - - 0 1',
        category: 'test',
        difficulty: 'beginner',
        sideToMove: 'white',
        goal: 'win',
        hints: [],
        solution: [],
        lessonNumber: 1,
        chapterNumber: 1,
        tags: []
      };

      await firebaseData.seedBatch({ positions: [position] });

      // Multiple concurrent requests for the same position
      const promises = Array.from({ length: 20 }, () => 
        positionService.getPosition(1)
      );

      const results = await Promise.all(promises);

      // All requests should succeed and return the same data
      results.forEach(result => {
        expect(result).not.toBeNull();
        expect(result!.id).toBe(1);
        expect(result!.title).toBe('Concurrent Test Position');
      });

      // Cache should only have one entry
      const cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(1);
    });

    test('should handle mixed operation patterns', async ({ firebaseData }) => {
      const positions: EndgamePosition[] = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        title: `Position ${i + 1}`,
        description: `Description ${i + 1}`,
        fen: '8/8/8/3k4/8/3K4/8/8 w - - 0 1',
        category: i < 3 ? 'category-a' : 'category-b',
        difficulty: 'beginner',
        sideToMove: 'white',
        goal: 'win',
        hints: [],
        solution: [],
        lessonNumber: 1,
        chapterNumber: 1,
        tags: []
      }));

      await firebaseData.seedBatch({ positions });

      // Mix of different operations running concurrently
      const mixedPromises = [
        positionService.getPosition(1),
        positionService.getAllPositions(),
        positionService.getPositionsByCategory('category-a'),
        positionService.getPosition(2),
        positionService.searchPositions('Position'),
        positionService.getTotalPositionCount(),
        positionService.getPosition(3)
      ];

      const results = await Promise.all(mixedPromises);

      // Verify results
      expect(results[0]).not.toBeNull(); // getPosition(1)
      expect(results[1]).toHaveLength(5); // getAllPositions()
      expect(results[2]).toHaveLength(3); // getPositionsByCategory('category-a')
      expect(results[3]).not.toBeNull(); // getPosition(2)
      expect(results[4]).toHaveLength(5); // searchPositions('Position')
      expect(results[5]).toBe(5); // getTotalPositionCount()
      expect(results[6]).not.toBeNull(); // getPosition(3)
    });
  });

  test.describe('Cache Behavior Under Stress', () => {
    test('should maintain cache integrity under rapid operations', async ({ firebaseData }) => {
      const positions: EndgamePosition[] = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        title: `Cache Test Position ${i + 1}`,
        description: `Description ${i + 1}`,
        fen: '8/8/8/3k4/8/3K4/8/8 w - - 0 1',
        category: 'cache-test',
        difficulty: 'beginner',
        sideToMove: 'white',
        goal: 'win',
        hints: [],
        solution: [],
        lessonNumber: 1,
        chapterNumber: 1,
        tags: []
      }));

      await firebaseData.seedBatch({ positions });

      // Load all positions to cache
      for (let i = 1; i <= 20; i++) {
        await positionService.getPosition(i);
      }

      // Verify cache has all positions
      let cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(20);

      // Clear cache and reload some positions
      positionService.clearCache();
      await positionService.getPosition(1);
      await positionService.getPosition(10);
      await positionService.getPosition(20);

      cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(3);
      expect(cacheStats.keys.sort()).toEqual([1, 10, 20]);
    });

    test('should handle cache misses gracefully', async ({ firebaseData }) => {
      // Load some positions
      const positions: EndgamePosition[] = [1, 2, 3].map(id => ({
        id,
        title: `Position ${id}`,
        description: `Description ${id}`,
        fen: '8/8/8/3k4/8/3K4/8/8 w - - 0 1',
        category: 'test',
        difficulty: 'beginner',
        sideToMove: 'white',
        goal: 'win',
        hints: [],
        solution: [],
        lessonNumber: 1,
        chapterNumber: 1,
        tags: []
      }));

      await firebaseData.seedBatch({ positions });

      // Load positions 1 and 3 (skip 2)
      await positionService.getPosition(1);
      await positionService.getPosition(3);

      const cacheStats = positionService.getCacheStats();
      expect(cacheStats.size).toBe(2);
      expect(cacheStats.keys.sort()).toEqual([1, 3]);

      // Now load position 2 (cache miss)
      const position2 = await positionService.getPosition(2);
      expect(position2).not.toBeNull();
      expect(position2!.id).toBe(2);

      // Cache should now have all three
      const finalCacheStats = positionService.getCacheStats();
      expect(finalCacheStats.size).toBe(3);
      expect(finalCacheStats.keys.sort()).toEqual([1, 2, 3]);
    });
  });
});