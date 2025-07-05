/**
 * @fileoverview Tests for RequestManager
 * @description Comprehensive tests for engine request management and promise resolution
 */

import { RequestManager } from '../requestManager';
import { Move as ChessJsMove } from 'chess.js';

describe('RequestManager', () => {
  let manager: RequestManager;
  
  beforeEach(() => {
    manager = new RequestManager();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Request ID Generation', () => {
    test('should generate unique request IDs', () => {
      const id1 = manager.generateRequestId('bestmove');
      const id2 = manager.generateRequestId('bestmove');
      const id3 = manager.generateRequestId('evaluation');
      
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).toMatch(/^bestmove-\d+-\d+$/);
      expect(id3).toMatch(/^evaluation-\d+-\d+$/);
    });

    test('should increment counter for each request', () => {
      const id1 = manager.generateRequestId('test');
      const id2 = manager.generateRequestId('test');
      
      const counter1 = parseInt(id1.split('-')[1]);
      const counter2 = parseInt(id2.split('-')[1]);
      
      expect(counter2).toBe(counter1 + 1);
    });
  });

  describe('Request Registration', () => {
    test('should register a new request successfully', () => {
      const mockResolve = jest.fn();
      const mockReject = jest.fn();
      const id = 'test-1';

      manager.registerRequest(id, 'bestmove', mockResolve, mockReject, 5000);
      
      const stats = manager.getStats();
      expect(stats.pendingCount).toBe(1);
      expect(stats.totalRequests).toBe(0); // totalRequests only counts generateRequestId calls
    });

    test('should warn and replace existing request with same ID', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockResolve1 = jest.fn();
      const mockReject1 = jest.fn();
      const mockResolve2 = jest.fn();
      const mockReject2 = jest.fn();
      const id = 'test-1';

      manager.registerRequest(id, 'bestmove', mockResolve1, mockReject1, 5000);
      manager.registerRequest(id, 'evaluation', mockResolve2, mockReject2, 3000);
      
      expect(consoleSpy).toHaveBeenCalledWith(`[RequestManager] Overwriting existing request: ${id}`);
      expect(mockReject1).toHaveBeenCalledWith(new Error('Request test-1 was cancelled'));
      
      const stats = manager.getStats();
      expect(stats.pendingCount).toBe(1);
      
      consoleSpy.mockRestore();
    });

    test('should handle timeout correctly', () => {
      const mockResolve = jest.fn();
      const mockReject = jest.fn();
      const id = 'test-timeout';
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      manager.registerRequest(id, 'bestmove', mockResolve, mockReject, 1000);
      
      // Fast-forward time beyond timeout (1000ms + 1000ms buffer)
      jest.advanceTimersByTime(2100);
      
      expect(mockReject).toHaveBeenCalledWith(new Error(`Request ${id} timed out after 1000ms`));
      expect(consoleSpy).toHaveBeenCalledWith(`[RequestManager] Request timeout: ${id}`);
      
      const stats = manager.getStats();
      expect(stats.pendingCount).toBe(0);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Best Move Request Resolution', () => {
    test('should resolve best move request successfully', () => {
      const mockResolve = jest.fn();
      const mockReject = jest.fn();
      const id = 'bestmove-1';
      const move: ChessJsMove = {
        from: 'e2',
        to: 'e4',
        piece: 'p',
        color: 'w',
        flags: 'b',
        san: 'e4'
      } as ChessJsMove;

      manager.registerRequest(id, 'bestmove', mockResolve, mockReject, 5000);
      const result = manager.resolveBestMoveRequest(id, move);
      
      expect(result).toBe(true);
      expect(mockResolve).toHaveBeenCalledWith(move);
      expect(mockReject).not.toHaveBeenCalled();
      
      const stats = manager.getStats();
      expect(stats.pendingCount).toBe(0);
    });

    test('should handle null move (no legal move)', () => {
      const mockResolve = jest.fn();
      const mockReject = jest.fn();
      const id = 'bestmove-null';

      manager.registerRequest(id, 'bestmove', mockResolve, mockReject, 5000);
      const result = manager.resolveBestMoveRequest(id, null);
      
      expect(result).toBe(true);
      expect(mockResolve).toHaveBeenCalledWith(null);
    });

    test('should return false for non-existent request', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const move: ChessJsMove = { from: 'e2', to: 'e4' } as ChessJsMove;
      
      const result = manager.resolveBestMoveRequest('non-existent', move);
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[RequestManager] No pending request found: non-existent');
      
      consoleSpy.mockRestore();
    });

    test('should clear timeout when resolving', () => {
      const mockResolve = jest.fn();
      const mockReject = jest.fn();
      const id = 'bestmove-timeout-clear';
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      manager.registerRequest(id, 'bestmove', mockResolve, mockReject, 5000);
      manager.resolveBestMoveRequest(id, null);
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      // Advance time beyond original timeout - should not trigger
      jest.advanceTimersByTime(6000);
      expect(mockReject).not.toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Evaluation Request Resolution', () => {
    test('should resolve evaluation request successfully', () => {
      const mockResolve = jest.fn();
      const mockReject = jest.fn();
      const id = 'eval-1';
      const evaluation = { score: 42, mate: null, depth: 15 };

      manager.registerRequest(id, 'evaluation', mockResolve, mockReject, 5000);
      const result = manager.resolveEvaluationRequest(id, evaluation);
      
      expect(result).toBe(true);
      expect(mockResolve).toHaveBeenCalledWith(evaluation);
      
      const stats = manager.getStats();
      expect(stats.pendingCount).toBe(0);
    });

    test('should return false for non-existent evaluation request', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const evaluation = { score: 0, mate: null };
      
      const result = manager.resolveEvaluationRequest('non-existent', evaluation);
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[RequestManager] No pending request found: non-existent');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Request Cancellation', () => {
    test('should cancel individual request', () => {
      const mockResolve = jest.fn();
      const mockReject = jest.fn();
      const id = 'cancel-test';

      manager.registerRequest(id, 'bestmove', mockResolve, mockReject, 5000);
      manager.cancelRequest(id);
      
      expect(mockReject).toHaveBeenCalledWith(new Error('Request cancel-test was cancelled'));
      
      const stats = manager.getStats();
      expect(stats.pendingCount).toBe(0);
    });

    test('should handle cancelling non-existent request', () => {
      expect(() => manager.cancelRequest('non-existent')).not.toThrow();
    });

    test('should cancel all requests', () => {
      const mockResolve1 = jest.fn();
      const mockReject1 = jest.fn();
      const mockResolve2 = jest.fn();
      const mockReject2 = jest.fn();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      manager.registerRequest('req1', 'bestmove', mockResolve1, mockReject1, 5000);
      manager.registerRequest('req2', 'evaluation', mockResolve2, mockReject2, 5000);
      
      manager.cancelAllRequests('Engine reset');
      
      expect(mockReject1).toHaveBeenCalledWith(new Error('Engine reset: req1'));
      expect(mockReject2).toHaveBeenCalledWith(new Error('Engine reset: req2'));
      expect(consoleSpy).toHaveBeenCalledWith('[RequestManager] Cancelled all 2 pending requests');
      
      const stats = manager.getStats();
      expect(stats.pendingCount).toBe(0);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should provide accurate statistics', () => {
      const mockResolve = jest.fn();
      const mockReject = jest.fn();

      // Register multiple requests
      manager.registerRequest('req1', 'bestmove', mockResolve, mockReject, 5000);
      manager.registerRequest('req2', 'evaluation', mockResolve, mockReject, 5000);
      manager.registerRequest('req3', 'bestmove', mockResolve, mockReject, 5000);
      
      const stats = manager.getStats();
      expect(stats.pendingCount).toBe(3);
      expect(stats.totalRequests).toBe(0); // No generateRequestId calls yet
      
      // Resolve one request
      manager.resolveBestMoveRequest('req1', null);
      
      const updatedStats = manager.getStats();
      expect(updatedStats.pendingCount).toBe(2);
      expect(updatedStats.totalRequests).toBe(0); // Still no generateRequestId calls
    });

    test('should track oldest pending request time', () => {
      const mockResolve = jest.fn();
      const mockReject = jest.fn();

      // No pending requests initially
      let stats = manager.getStats();
      expect(stats.oldestPendingMs).toBeNull();

      manager.registerRequest('req1', 'bestmove', mockResolve, mockReject, 5000);
      
      // Advance time slightly
      jest.advanceTimersByTime(100);
      
      stats = manager.getStats();
      expect(stats.oldestPendingMs).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    test('should handle timeout clearing errors gracefully', () => {
      const mockResolve = jest.fn();
      const mockReject = jest.fn();
      const id = 'error-test';
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock clearTimeout to throw
      const originalClearTimeout = global.clearTimeout;
      global.clearTimeout = jest.fn(() => {
        throw new Error('clearTimeout failed');
      });

      manager.registerRequest(id, 'bestmove', mockResolve, mockReject, 5000);
      
      // Should not throw even if clearTimeout fails
      expect(() => manager.resolveBestMoveRequest(id, null)).not.toThrow();
      expect(mockResolve).toHaveBeenCalled();
      
      global.clearTimeout = originalClearTimeout;
      consoleSpy.mockRestore();
    });

    test('should handle multiple resolution attempts', () => {
      const mockResolve = jest.fn();
      const mockReject = jest.fn();
      const id = 'multi-resolve';
      const move: ChessJsMove = { from: 'e2', to: 'e4' } as ChessJsMove;

      manager.registerRequest(id, 'bestmove', mockResolve, mockReject, 5000);
      
      const result1 = manager.resolveBestMoveRequest(id, move);
      const result2 = manager.resolveBestMoveRequest(id, move);
      
      expect(result1).toBe(true);
      expect(result2).toBe(false);
      expect(mockResolve).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle mixed request types correctly', () => {
      const bestMoveResolve = jest.fn();
      const bestMoveReject = jest.fn();
      const evalResolve = jest.fn();
      const evalReject = jest.fn();

      // Register mixed requests
      manager.registerRequest('bm1', 'bestmove', bestMoveResolve, bestMoveReject, 5000);
      manager.registerRequest('ev1', 'evaluation', evalResolve, evalReject, 3000);
      
      // Resolve them differently
      const move: ChessJsMove = { from: 'e2', to: 'e4' } as ChessJsMove;
      const evaluation = { score: 100, mate: 3 };
      
      manager.resolveBestMoveRequest('bm1', move);
      manager.resolveEvaluationRequest('ev1', evaluation);
      
      expect(bestMoveResolve).toHaveBeenCalledWith(move);
      expect(evalResolve).toHaveBeenCalledWith(evaluation);
      
      const stats = manager.getStats();
      expect(stats.pendingCount).toBe(0);
      expect(stats.totalRequests).toBe(0); // Manual IDs used, no generateRequestId calls
    });

    test('should handle rapid request cycling', () => {
      const results: any[] = [];
      
      // Create many requests rapidly
      for (let i = 0; i < 10; i++) {
        const resolve = jest.fn((result) => results.push(result));
        const reject = jest.fn();
        const id = manager.generateRequestId('rapid');
        
        manager.registerRequest(id, 'bestmove', resolve, reject, 5000);
        manager.resolveBestMoveRequest(id, { from: 'a1', to: 'a2' } as ChessJsMove);
      }
      
      expect(results).toHaveLength(10);
      
      const stats = manager.getStats();
      expect(stats.pendingCount).toBe(0);
      expect(stats.totalRequests).toBe(10); // This uses generateRequestId, so counter increases
    });
  });

  describe('Maintenance Operations', () => {
    test('should cleanup stale requests', () => {
      const mockResolve = jest.fn();
      const mockReject1 = jest.fn();
      const mockReject2 = jest.fn();
      const mockReject3 = jest.fn();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock Date.now to control timestamps
      const startTime = Date.now();
      const mockDateNow = jest.spyOn(Date, 'now');
      mockDateNow.mockReturnValue(startTime);
      
      // Register first request
      manager.registerRequest('old1', 'bestmove', mockResolve, mockReject1, 10000);
      
      // Advance time to 30s later
      mockDateNow.mockReturnValue(startTime + 30000);
      manager.registerRequest('old2', 'evaluation', mockResolve, mockReject2, 10000);
      
      // Advance time to 70s from start (40s after second request)
      mockDateNow.mockReturnValue(startTime + 70000);
      manager.registerRequest('fresh', 'bestmove', mockResolve, mockReject3, 10000);
      
      // Cleanup requests older than 60s (first request is 70s old, should be cleaned)
      const cleaned = manager.cleanupStaleRequests(60000);
      
      expect(cleaned).toBe(1); // Only the first request should be cleaned
      expect(mockReject1).toHaveBeenCalledWith(new Error('Request old1 was cancelled'));
      expect(mockReject2).not.toHaveBeenCalled(); // 40s old, under limit
      expect(mockReject3).not.toHaveBeenCalled(); // Fresh
      expect(consoleSpy).toHaveBeenCalledWith('[RequestManager] Cleaned up 1 stale requests');
      
      const stats = manager.getStats();
      expect(stats.pendingCount).toBe(2);
      
      mockDateNow.mockRestore();
      consoleSpy.mockRestore();
    });

    test('should not warn when no stale requests found', () => {
      const mockResolve = jest.fn();
      const mockReject = jest.fn();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      manager.registerRequest('fresh', 'bestmove', mockResolve, mockReject, 10000);
      
      const cleaned = manager.cleanupStaleRequests(60000);
      
      expect(cleaned).toBe(0);
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});