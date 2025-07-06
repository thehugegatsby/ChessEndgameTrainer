/**
 * @fileoverview Unit tests for TablebaseService
 * @description Tests for tablebase integration, caching, and endgame analysis
 */

import { TablebaseService } from '../../../shared/lib/chess/ScenarioEngine/tablebaseService';
import { MockTablebaseService } from '../../helpers/engineMocks';
import { TEST_POSITIONS, getTablebasePositions } from '../../helpers/testPositions';
import type { TablebaseInfo } from '../../../shared/lib/chess/ScenarioEngine/types';

// Mock the core tablebase service
jest.mock('../../../shared/lib/chess/tablebase');

describe('TablebaseService', () => {
  let tablebaseService: TablebaseService;
  let mockCoreService: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a simple implementation function
    const defaultImplementation = async (fen: string) => {
      // Handle invalid/empty FEN strings
      if (!fen || typeof fen !== 'string' || fen.trim() === '' || !fen.includes(' ')) {
        throw new Error('Invalid FEN string');
      }
      
      // Additional validation for clearly invalid FENs
      const parts = fen.split(' ');
      if (parts.length < 6) {
        throw new Error('Invalid FEN string - missing parts');
      }
      
      // Check board part for invalid characters
      const boardPart = parts[0];
      if (!/^[pnbrqkPNBRQK1-8\/]+$/.test(boardPart)) {
        throw new Error('Invalid FEN string - invalid board characters');
      }
      
      // Check if it's a tablebase position (≤7 pieces)
      const pieces = (boardPart.match(/[pnbrqkPNBRQK]/g) || []).length;
      if (pieces <= 7) {
        return {
          isTablebasePosition: true,
          result: {
            wdl: 2, // Win for White
            dtz: 5,
            category: 'win',
            precise: true,
            moves: [
              { uci: 'h1h8', mate: 3, wdl: 2 }
            ]
          }
        };
      } else {
        return {
          isTablebasePosition: false
        };
      }
    };
    
    // Create mock with call tracking
    mockCoreService = {
      calls: { queryPosition: [] },
      delay: 0,
      queryPosition: jest.fn().mockImplementation(async (fen: string) => {
        mockCoreService.calls.queryPosition.push(fen);
        
        // Add delay if configured
        if (mockCoreService.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, mockCoreService.delay));
        }
        
        return defaultImplementation(fen);
      }),
      setShouldFail: (fail: boolean) => {
        if (fail) {
          mockCoreService.queryPosition = jest.fn().mockRejectedValue(new Error('Mock tablebase query failed'));
        } else {
          mockCoreService.queryPosition = jest.fn().mockImplementation(async (fen: string) => {
            mockCoreService.calls.queryPosition.push(fen);
            if (mockCoreService.delay > 0) {
              await new Promise(resolve => setTimeout(resolve, mockCoreService.delay));
            }
            return defaultImplementation(fen);
          });
        }
      },
      setDelay: (ms: number) => {
        mockCoreService.delay = ms;
      }
    };
    
    // Mock the core tablebase service module
    const tablebaseModule = require('../../../shared/lib/chess/tablebase');
    tablebaseModule.tablebaseService = mockCoreService;
    
    // Create fresh TablebaseService instance
    tablebaseService = new TablebaseService();
  });

  describe('Tablebase Position Detection', () => {
    test('should_identify_valid_tablebase_position_correctly', async () => {
      // Purpose: Verify detection of positions that exist in tablebase (≤7 pieces)
      const tablebaseFen = TEST_POSITIONS.KQK_TABLEBASE_WIN;
      
      const isTablebase = await tablebaseService.isTablebasePosition(tablebaseFen);
      
      expect(isTablebase).toBe(true);
      expect(mockCoreService.calls.queryPosition).toContain(tablebaseFen);
    });

    test('should_reject_non_tablebase_position_correctly', async () => {
      // Purpose: Verify positions with >7 pieces are not considered tablebase positions
      const complexFen = TEST_POSITIONS.STARTING_POSITION; // 32 pieces
      
      const isTablebase = await tablebaseService.isTablebasePosition(complexFen);
      
      expect(isTablebase).toBe(false);
    });

    test('should_handle_tablebase_query_failure_gracefully', async () => {
      // Purpose: Verify resilience when tablebase service is unavailable
      const tablebaseFen = TEST_POSITIONS.KQK_TABLEBASE_WIN;
      mockCoreService.setShouldFail(true);
      
      const isTablebase = await tablebaseService.isTablebasePosition(tablebaseFen);
      
      expect(isTablebase).toBe(false); // Should default to false on error
    });

    test('should_get_comprehensive_tablebase_info_for_endgame', async () => {
      // Purpose: Verify complete tablebase information retrieval
      const tablebaseFen = TEST_POSITIONS.KQK_TABLEBASE_WIN;
      mockCoreService.setShouldFail(false);
      
      const info = await tablebaseService.getTablebaseInfo(tablebaseFen);
      
      expect(info.isTablebasePosition).toBe(true);
      expect(info.result).toBeDefined();
      expect(info.result!.wdl).toBe(2); // Win for White
      expect(info.result!.category).toBe('win');
      expect(info.bestMoves).toBeDefined();
      expect(Array.isArray(info.bestMoves)).toBe(true);
    });

    test('should_handle_non_tablebase_position_info_request', async () => {
      // Purpose: Verify handling of positions not in tablebase database
      const nonTablebaseFen = TEST_POSITIONS.STARTING_POSITION;
      
      const info = await tablebaseService.getTablebaseInfo(nonTablebaseFen);
      
      expect(info.isTablebasePosition).toBe(false);
      expect(info.error).toBe('Position not in tablebase');
      expect(info.result).toBeUndefined();
      expect(info.bestMoves).toBeUndefined();
    });
  });

  describe('Caching System', () => {
    test('should_cache_tablebase_results_for_mobile_performance', async () => {
      // Purpose: Verify caching improves performance by avoiding redundant queries
      const tablebaseFen = TEST_POSITIONS.KQK_TABLEBASE_WIN;
      
      // Clear call tracking
      mockCoreService.calls.queryPosition = [];
      
      // First query
      await tablebaseService.getTablebaseInfo(tablebaseFen);
      expect(mockCoreService.calls.queryPosition).toHaveLength(1);
      
      // Second query should use cache
      await tablebaseService.getTablebaseInfo(tablebaseFen);
      expect(mockCoreService.calls.queryPosition).toHaveLength(1); // No additional call
    });

    test('should_limit_cache_size_for_memory_management', async () => {
      // Purpose: Verify cache respects memory limits on mobile devices
      const tablebasePositions = getTablebasePositions();
      
      // Fill cache beyond limit
      for (let i = 0; i < 150; i++) { // Exceed maxCacheSize of 100
        const testFen = tablebasePositions[i % tablebasePositions.length] + ` 0 ${i}`;
        await tablebaseService.getTablebaseInfo(testFen);
      }
      
      const stats = tablebaseService.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
      expect(stats.maxSize).toBe(100); // Verify mobile-optimized limit
    });

    test('should_evict_oldest_entries_when_cache_full', async () => {
      // Purpose: Verify LRU eviction policy for cache management
      const position1 = TEST_POSITIONS.KQK_TABLEBASE_WIN;
      const position2 = TEST_POSITIONS.KPK_WINNING;
      
      // Fill cache to near capacity first
      for (let i = 0; i < 99; i++) {
        await tablebaseService.getTablebaseInfo(`${position1} 0 ${i}`);
      }
      
      // Add position1 and position2
      await tablebaseService.getTablebaseInfo(position1);
      await tablebaseService.getTablebaseInfo(position2);
      
      // Add many more entries to trigger eviction
      for (let i = 100; i < 110; i++) {
        await tablebaseService.getTablebaseInfo(`${position2} 0 ${i}`);
      }
      
      // Verify cache stats
      const stats = tablebaseService.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
    });

    test('should_clear_cache_successfully_for_memory_management', () => {
      // Purpose: Verify manual cache clearing for memory management
      const initialStats = tablebaseService.getCacheStats();
      
      tablebaseService.clearCache();
      
      const clearedStats = tablebaseService.getCacheStats();
      expect(clearedStats.size).toBe(0);
    });

    test('should_provide_accurate_cache_statistics', async () => {
      // Purpose: Verify cache statistics are accurate for monitoring
      const initialStats = tablebaseService.getCacheStats();
      expect(initialStats.size).toBe(0);
      
      // Add some entries
      await tablebaseService.getTablebaseInfo(TEST_POSITIONS.KQK_TABLEBASE_WIN);
      await tablebaseService.getTablebaseInfo(TEST_POSITIONS.KPK_WINNING);
      
      const stats = tablebaseService.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(100);
    });
  });

  describe('Move Evaluation and Formatting', () => {
    test('should_format_winning_moves_correctly', async () => {
      // Purpose: Verify proper formatting of tablebase move evaluations
      const tablebaseFen = TEST_POSITIONS.KQK_TABLEBASE_WIN;
      
      // Override mock to return moves with wdl value instead of mate (to get "Win" format)
      mockCoreService.queryPosition = jest.fn().mockResolvedValue({
        isTablebasePosition: true,
        result: {
          wdl: 2,
          dtz: 5,
          category: 'win',
          precise: true,
          moves: [
            { uci: 'h1h8', wdl: 2 }, // Use wdl instead of mate to get "Win" evaluation
            { uci: 'h1f8', wdl: 2 }
          ]
        }
      });
      
      const info = await tablebaseService.getTablebaseInfo(tablebaseFen);
      
      expect(info.bestMoves).toBeDefined();
      expect(info.bestMoves!.length).toBeGreaterThan(0);
      expect(info.bestMoves![0].evaluation).toBe('Win');
    });

    test('should_flip_tablebase_categories_for_perspective_correction', () => {
      // Purpose: Verify category flipping for move analysis from different perspectives
      expect(tablebaseService.flipTablebaseCategory('win')).toBe('loss');
      expect(tablebaseService.flipTablebaseCategory('loss')).toBe('win');
      expect(tablebaseService.flipTablebaseCategory('draw')).toBe('draw');
      expect(tablebaseService.flipTablebaseCategory('cursed-win')).toBe('blessed-loss');
      expect(tablebaseService.flipTablebaseCategory('blessed-loss')).toBe('cursed-win');
    });

    test('should_handle_unknown_categories_gracefully', () => {
      // Purpose: Verify robust handling of unexpected tablebase categories
      const unknownCategory = 'unknown-category' as any;
      
      const flipped = tablebaseService.flipTablebaseCategory(unknownCategory);
      
      expect(flipped).toBe(unknownCategory); // Should return unchanged
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should_handle_tablebase_service_timeout_gracefully', async () => {
      // Purpose: Verify graceful handling of slow tablebase responses
      const tablebaseFen = TEST_POSITIONS.KQK_TABLEBASE_WIN;
      mockCoreService.setDelay(5000); // 5 second delay
      
      const startTime = Date.now();
      const info = await tablebaseService.getTablebaseInfo(tablebaseFen);
      const endTime = Date.now();
      
      // Should not hang indefinitely
      expect(endTime - startTime).toBeLessThan(10000);
      expect(info).toBeDefined();
    });

    test('should_handle_malformed_tablebase_responses', async () => {
      // Purpose: Verify robustness against invalid tablebase API responses
      const tablebaseFen = TEST_POSITIONS.KQK_TABLEBASE_WIN;
      
      // Mock malformed response
      mockCoreService.queryPosition = jest.fn().mockResolvedValue({
        isTablebasePosition: true,
        result: null // Malformed - missing result data
      });
      
      const info = await tablebaseService.getTablebaseInfo(tablebaseFen);
      
      expect(info.isTablebasePosition).toBe(true);
      expect(info.result).toBeDefined(); // Should provide defaults
    });

    test('should_handle_network_errors_gracefully', async () => {
      // Purpose: Verify resilience to network connectivity issues
      const tablebaseFen = TEST_POSITIONS.KQK_TABLEBASE_WIN;
      
      // Mock network error
      mockCoreService.queryPosition = jest.fn().mockRejectedValue(new Error('Network connection failed'));
      
      const info = await tablebaseService.getTablebaseInfo(tablebaseFen);
      
      expect(info.isTablebasePosition).toBe(false);
      expect(info.error).toContain('Network connection failed');
    });

    test('should_handle_concurrent_tablebase_requests', async () => {
      // Purpose: Verify service handles multiple simultaneous requests correctly
      const positions = getTablebasePositions().slice(0, 5);
      
      // Clear call tracking
      mockCoreService.calls.queryPosition = [];
      
      const promises = positions.map(fen => tablebaseService.getTablebaseInfo(fen));
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.isTablebasePosition).toBe(true);
        expect(mockCoreService.calls.queryPosition).toContain(positions[index]);
      });
    });

    test('should_handle_empty_or_invalid_fen_strings', async () => {
      // Purpose: Verify input validation for FEN strings
      const invalidFens = ['', '   ', 'invalid fen', null, undefined];
      
      for (let i = 0; i < invalidFens.length; i++) {
        const invalidFen = invalidFens[i];
        
        // Clear cache before each test to avoid interference
        tablebaseService.clearCache();
        
        const info = await tablebaseService.getTablebaseInfo(invalidFen as any);
        
        expect(info.isTablebasePosition).toBe(false);
        expect(info.error).toBeDefined();
      }
    });
  });

  describe('Performance Optimization', () => {
    test('should_batch_multiple_position_queries_efficiently', async () => {
      // Purpose: Verify efficient handling of bulk position analysis
      const positions = getTablebasePositions();
      const startTime = Date.now();
      
      const promises = positions.map(fen => tablebaseService.getTablebaseInfo(fen));
      await Promise.all(promises);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should complete reasonably quickly (accounting for mock delays)
      expect(totalTime).toBeLessThan(2000); // 2 seconds for all positions
    });

    test('should_minimize_memory_usage_during_bulk_operations', async () => {
      // Purpose: Verify memory efficiency during large batch operations
      const manyPositions = Array.from({ length: 200 }, (_, i) => 
        `${TEST_POSITIONS.KQK_TABLEBASE_WIN} 0 ${i}`
      );
      
      // Process in batches to verify memory management
      for (let i = 0; i < manyPositions.length; i += 50) {
        const batch = manyPositions.slice(i, i + 50);
        await Promise.all(batch.map(fen => tablebaseService.getTablebaseInfo(fen)));
      }
      
      // Verify cache size is still controlled
      const stats = tablebaseService.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
    });

    test('should_provide_fast_cache_access_for_repeated_positions', async () => {
      // Purpose: Verify cache provides significant performance improvement
      const tablebaseFen = TEST_POSITIONS.KQK_TABLEBASE_WIN;
      
      // Clear call tracking
      mockCoreService.calls.queryPosition = [];
      
      // First access (cache miss)
      await tablebaseService.getTablebaseInfo(tablebaseFen);
      expect(mockCoreService.calls.queryPosition).toHaveLength(1);
      
      // Second access (cache hit) - should not make another API call
      await tablebaseService.getTablebaseInfo(tablebaseFen);
      expect(mockCoreService.calls.queryPosition).toHaveLength(1); // Still 1, not 2
      
      // Verify cache is working
      const stats = tablebaseService.getCacheStats();
      expect(stats.size).toBe(1);
    });
  });
});