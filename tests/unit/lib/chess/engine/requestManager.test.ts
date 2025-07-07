/**
 * @fileoverview Unit tests for RequestManager
 * @version 1.0.0
 * @description Tests request management, timeout handling, and request deduplication
 * Following TESTING_GUIDELINES.md principles
 */

import { RequestManager } from '../../../../../shared/lib/chess/engine/requestManager';
import type { EngineEvaluation } from '../../../../../shared/lib/chess/engine/types';
import type { Move as ChessJsMove } from 'chess.js';

// Test constants
const DEFAULT_TIMEOUT = 5000;
const QUICK_TIMEOUT = 100;
const TEST_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Mock data
const mockMove: ChessJsMove = {
  from: 'e2',
  to: 'e4',
  color: 'w',
  piece: 'p',
  flags: 'b',
  san: 'e4',
  lan: 'e2e4',
  captured: undefined,
  promotion: undefined,
  before: TEST_FEN,
  after: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
  isCapture: () => false,
  isPromotion: () => false,
  isEnPassant: () => false,
  isKingsideCastle: () => false,
  isQueensideCastle: () => false,
  isBigPawn: () => true
};

const mockEvaluation: EngineEvaluation = {
  score: 50,
  mate: null,
  depth: 20,
  nodes: 100000,
  time: 150
};

describe('RequestManager_[method]_[condition]_[expected]', () => {
  let requestManager: RequestManager;

  beforeEach(() => {
    requestManager = new RequestManager();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generateRequestId', () => {
    it('should generate unique request IDs with type prefix', () => {
      const id1 = requestManager.generateRequestId('bestmove');
      const id2 = requestManager.generateRequestId('evaluation');
      const id3 = requestManager.generateRequestId('bestmove');

      expect(id1).toMatch(/^bestmove-1-\d+$/);
      expect(id2).toMatch(/^evaluation-2-\d+$/);
      expect(id3).toMatch(/^bestmove-3-\d+$/);
      expect(id1).not.toBe(id2);
      expect(id1).not.toBe(id3);
    });

    it('should increment request counter for each ID', () => {
      const ids = [];
      for (let i = 0; i < 5; i++) {
        ids.push(requestManager.generateRequestId('test'));
      }

      // Extract counter from IDs
      const counters = ids.map(id => parseInt(id.split('-')[1]));
      expect(counters).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('registerRequest', () => {
    it('should register a new request with timeout', () => {
      const resolve = jest.fn();
      const reject = jest.fn();
      const id = 'test-request-1';

      requestManager.registerRequest(id, 'bestmove', resolve, reject, DEFAULT_TIMEOUT);

      // Check that request is registered (indirectly through stats)
      const stats = requestManager.getStats();
      expect(stats.pendingCount).toBe(1);
    });

    it('should cancel existing request with same ID before registering new one', () => {
      const resolve1 = jest.fn();
      const reject1 = jest.fn();
      const resolve2 = jest.fn();
      const reject2 = jest.fn();
      const id = 'duplicate-request';

      requestManager.registerRequest(id, 'bestmove', resolve1, reject1, DEFAULT_TIMEOUT);
      requestManager.registerRequest(id, 'evaluation', resolve2, reject2, DEFAULT_TIMEOUT);

      // First request should be cancelled
      expect(reject1).toHaveBeenCalledWith(new Error(`Request ${id} was cancelled`));
      
      // Only one request should be pending
      const stats = requestManager.getStats();
      expect(stats.pendingCount).toBe(1);
    });

    it('should set up timeout with buffer', () => {
      const resolve = jest.fn();
      const reject = jest.fn();
      const id = 'timeout-test';

      requestManager.registerRequest(id, 'bestmove', resolve, reject, QUICK_TIMEOUT);

      // Advance time to just before timeout
      jest.advanceTimersByTime(QUICK_TIMEOUT);
      expect(reject).not.toHaveBeenCalled();

      // Advance past timeout + buffer (1000ms)
      jest.advanceTimersByTime(1100);
      expect(reject).toHaveBeenCalledWith(new Error(`Request ${id} timed out after ${QUICK_TIMEOUT}ms`));
    });
  });

  describe('resolveBestMoveRequest', () => {
    it('should resolve pending bestmove request successfully', () => {
      const resolve = jest.fn();
      const reject = jest.fn();
      const id = 'bestmove-test';

      requestManager.registerRequest(id, 'bestmove', resolve, reject, DEFAULT_TIMEOUT);
      const result = requestManager.resolveBestMoveRequest(id, mockMove);

      expect(result).toBe(true);
      expect(resolve).toHaveBeenCalledWith(mockMove);
      expect(reject).not.toHaveBeenCalled();
      
      // Request should be removed
      const stats = requestManager.getStats();
      expect(stats.pendingCount).toBe(0);
    });

    it('should handle null move (no legal moves)', () => {
      const resolve = jest.fn();
      const reject = jest.fn();
      const id = 'checkmate-test';

      requestManager.registerRequest(id, 'bestmove', resolve, reject, DEFAULT_TIMEOUT);
      const result = requestManager.resolveBestMoveRequest(id, null);

      expect(result).toBe(true);
      expect(resolve).toHaveBeenCalledWith(null);
    });

    it('should return false for non-existent request', () => {
      const result = requestManager.resolveBestMoveRequest('non-existent', mockMove);
      expect(result).toBe(false);
    });

    it('should return false for wrong request type', () => {
      const resolve = jest.fn();
      const reject = jest.fn();
      const id = 'wrong-type';

      requestManager.registerRequest(id, 'evaluation', resolve, reject, DEFAULT_TIMEOUT);
      const result = requestManager.resolveBestMoveRequest(id, mockMove);

      expect(result).toBe(false);
      expect(resolve).not.toHaveBeenCalled();
      
      // Request should still be pending
      const stats = requestManager.getStats();
      expect(stats.pendingCount).toBe(1);
    });

    it('should clear timeout on successful resolution', () => {
      const resolve = jest.fn();
      const reject = jest.fn();
      const id = 'timeout-clear-test';

      requestManager.registerRequest(id, 'bestmove', resolve, reject, QUICK_TIMEOUT);
      requestManager.resolveBestMoveRequest(id, mockMove);

      // Advance time past timeout
      jest.advanceTimersByTime(QUICK_TIMEOUT + 1100);
      
      // Reject should not be called since timeout was cleared
      expect(reject).not.toHaveBeenCalled();
    });
  });

  describe('resolveEvaluationRequest', () => {
    it('should resolve pending evaluation request successfully', () => {
      const resolve = jest.fn();
      const reject = jest.fn();
      const id = 'eval-test';

      requestManager.registerRequest(id, 'evaluation', resolve, reject, DEFAULT_TIMEOUT);
      const result = requestManager.resolveEvaluationRequest(id, mockEvaluation);

      expect(result).toBe(true);
      expect(resolve).toHaveBeenCalledWith(mockEvaluation);
      expect(reject).not.toHaveBeenCalled();
      
      // Request should be removed
      const stats = requestManager.getStats();
      expect(stats.pendingCount).toBe(0);
    });

    it('should return false for wrong request type', () => {
      const resolve = jest.fn();
      const reject = jest.fn();
      const id = 'wrong-type-eval';

      requestManager.registerRequest(id, 'bestmove', resolve, reject, DEFAULT_TIMEOUT);
      const result = requestManager.resolveEvaluationRequest(id, mockEvaluation);

      expect(result).toBe(false);
      expect(resolve).not.toHaveBeenCalled();
    });
  });

  describe('rejectRequest', () => {
    it('should reject pending request with error message', () => {
      const resolve = jest.fn();
      const reject = jest.fn();
      const id = 'reject-test';
      const errorMessage = 'Engine crashed';

      requestManager.registerRequest(id, 'bestmove', resolve, reject, DEFAULT_TIMEOUT);
      const result = requestManager.rejectRequest(id, errorMessage);

      expect(result).toBe(true);
      expect(reject).toHaveBeenCalledWith(new Error(errorMessage));
      expect(resolve).not.toHaveBeenCalled();
      
      // Request should be removed
      const stats = requestManager.getStats();
      expect(stats.pendingCount).toBe(0);
    });

    it('should return false for non-existent request', () => {
      const result = requestManager.rejectRequest('non-existent', 'error');
      expect(result).toBe(false);
    });

    it('should clear timeout on rejection', () => {
      const resolve = jest.fn();
      const reject = jest.fn();
      const id = 'timeout-reject-test';

      requestManager.registerRequest(id, 'evaluation', resolve, reject, QUICK_TIMEOUT);
      requestManager.rejectRequest(id, 'Manual rejection');

      // Advance time past timeout
      jest.advanceTimersByTime(QUICK_TIMEOUT + 1100);
      
      // Should only be called once with manual rejection
      expect(reject).toHaveBeenCalledTimes(1);
      expect(reject).toHaveBeenCalledWith(new Error('Manual rejection'));
    });
  });

  describe('cancelRequest', () => {
    it('should cancel specific request', () => {
      const resolve = jest.fn();
      const reject = jest.fn();
      const id = 'cancel-test';

      requestManager.registerRequest(id, 'bestmove', resolve, reject, DEFAULT_TIMEOUT);
      requestManager.cancelRequest(id);

      expect(reject).toHaveBeenCalledWith(new Error(`Request ${id} was cancelled`));
      expect(resolve).not.toHaveBeenCalled();
      
      // Request should be removed
      const stats = requestManager.getStats();
      expect(stats.pendingCount).toBe(0);
    });

    it('should handle cancelling non-existent request gracefully', () => {
      // Should not throw
      expect(() => {
        requestManager.cancelRequest('non-existent');
      }).not.toThrow();
    });
  });

  describe('cancelAllRequests', () => {
    it('should cancel all pending requests', () => {
      const rejects: jest.Mock[] = [];
      const resolves: jest.Mock[] = [];
      const ids = ['req1', 'req2', 'req3'];

      // Register multiple requests
      ids.forEach((id, index) => {
        const resolve = jest.fn();
        const reject = jest.fn();
        resolves.push(resolve);
        rejects.push(reject);
        requestManager.registerRequest(
          id, 
          index % 2 === 0 ? 'bestmove' : 'evaluation',
          resolve,
          reject,
          DEFAULT_TIMEOUT
        );
      });

      requestManager.cancelAllRequests();

      // All requests should be rejected
      rejects.forEach((reject, index) => {
        expect(reject).toHaveBeenCalledWith(
          new Error(`All requests cancelled: ${ids[index]}`)
        );
      });

      // No requests should be resolved
      resolves.forEach(resolve => {
        expect(resolve).not.toHaveBeenCalled();
      });

      // All requests should be cleared
      const stats = requestManager.getStats();
      expect(stats.pendingCount).toBe(0);
    });

    it('should use custom cancellation reason', () => {
      const reject = jest.fn();
      const id = 'custom-reason-test';
      const customReason = 'Engine shutdown';

      requestManager.registerRequest(id, 'evaluation', jest.fn(), reject, DEFAULT_TIMEOUT);
      requestManager.cancelAllRequests(customReason);

      expect(reject).toHaveBeenCalledWith(new Error(`${customReason}: ${id}`));
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      // Initial stats
      let stats = requestManager.getStats();
      expect(stats).toEqual({
        pendingCount: 0,
        totalRequests: 0,
        oldestPendingMs: null
      });

      // Generate some requests
      requestManager.generateRequestId('test');
      requestManager.generateRequestId('test');
      
      stats = requestManager.getStats();
      expect(stats.totalRequests).toBe(2);

      // Add pending requests
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      requestManager.registerRequest('req1', 'bestmove', jest.fn(), jest.fn(), DEFAULT_TIMEOUT);
      
      // Advance time
      jest.spyOn(Date, 'now').mockReturnValue(now + 1000);
      requestManager.registerRequest('req2', 'evaluation', jest.fn(), jest.fn(), DEFAULT_TIMEOUT);

      // Check stats
      jest.spyOn(Date, 'now').mockReturnValue(now + 2000);
      stats = requestManager.getStats();
      
      expect(stats.pendingCount).toBe(2);
      expect(stats.totalRequests).toBe(2);
      expect(stats.oldestPendingMs).toBe(2000); // First request is 2000ms old
    });
  });

  describe('cleanupStaleRequests', () => {
    it('should cleanup requests older than max age', () => {
      const rejects: jest.Mock[] = [];
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      // Register old request
      const reject1 = jest.fn();
      rejects.push(reject1);
      requestManager.registerRequest('old-req', 'bestmove', jest.fn(), reject1, DEFAULT_TIMEOUT);

      // Advance time past max age
      jest.spyOn(Date, 'now').mockReturnValue(now + 70000); // 70 seconds

      // Register recent request
      const reject2 = jest.fn();
      rejects.push(reject2);
      requestManager.registerRequest('new-req', 'evaluation', jest.fn(), reject2, DEFAULT_TIMEOUT);

      // Cleanup with 60s max age
      const cleaned = requestManager.cleanupStaleRequests(60000);

      expect(cleaned).toBe(1);
      expect(reject1).toHaveBeenCalledWith(new Error('Request old-req was cancelled'));
      expect(reject2).not.toHaveBeenCalled();

      // Check remaining requests
      const stats = requestManager.getStats();
      expect(stats.pendingCount).toBe(1);
    });

    it('should use custom max age', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      requestManager.registerRequest('req1', 'bestmove', jest.fn(), jest.fn(), DEFAULT_TIMEOUT);

      // Advance time
      jest.spyOn(Date, 'now').mockReturnValue(now + 5500);

      // Cleanup with 5s max age
      const cleaned = requestManager.cleanupStaleRequests(5000);
      expect(cleaned).toBe(1);
    });

    it('should return 0 when no stale requests', () => {
      requestManager.registerRequest('fresh-req', 'evaluation', jest.fn(), jest.fn(), DEFAULT_TIMEOUT);
      
      const cleaned = requestManager.cleanupStaleRequests();
      expect(cleaned).toBe(0);
    });
  });

  describe('Request deduplication scenarios', () => {
    it('should handle concurrent requests for same position gracefully', () => {
      const resolves: jest.Mock[] = [];
      const rejects: jest.Mock[] = [];

      // Note: This RequestManager doesn't have built-in deduplication
      // It cancels the previous request with the same ID
      // Real deduplication would be handled at a higher level
      
      // Simulate concurrent requests with same ID
      const id = 'same-position';
      
      for (let i = 0; i < 3; i++) {
        const resolve = jest.fn();
        const reject = jest.fn();
        resolves.push(resolve);
        rejects.push(reject);
        requestManager.registerRequest(id, 'evaluation', resolve, reject, DEFAULT_TIMEOUT);
      }

      // Only the last request should be active
      const stats = requestManager.getStats();
      expect(stats.pendingCount).toBe(1);

      // First two should be cancelled
      expect(rejects[0]).toHaveBeenCalled();
      expect(rejects[1]).toHaveBeenCalled();
      expect(rejects[2]).not.toHaveBeenCalled();
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle clearTimeout errors gracefully', () => {
      const resolve = jest.fn();
      const reject = jest.fn();
      const id = 'error-test';

      requestManager.registerRequest(id, 'bestmove', resolve, reject, DEFAULT_TIMEOUT);

      // Mock clearTimeout to throw
      const originalClearTimeout = global.clearTimeout;
      global.clearTimeout = jest.fn(() => {
        throw new Error('clearTimeout failed');
      });

      // Should not throw
      expect(() => {
        requestManager.resolveBestMoveRequest(id, mockMove);
      }).not.toThrow();

      expect(resolve).toHaveBeenCalledWith(mockMove);

      // Restore
      global.clearTimeout = originalClearTimeout;
    });
  });

  describe('Performance characteristics', () => {
    it('should handle many requests efficiently', () => {
      const start = performance.now();
      const requestCount = 1000;

      // Register many requests
      for (let i = 0; i < requestCount; i++) {
        requestManager.registerRequest(
          `perf-test-${i}`,
          i % 2 === 0 ? 'bestmove' : 'evaluation',
          jest.fn(),
          jest.fn(),
          DEFAULT_TIMEOUT
        );
      }

      const registerTime = performance.now() - start;
      expect(registerTime).toBeLessThan(50); // Should be fast

      // Resolve all requests
      const resolveStart = performance.now();
      for (let i = 0; i < requestCount; i++) {
        if (i % 2 === 0) {
          requestManager.resolveBestMoveRequest(`perf-test-${i}`, mockMove);
        } else {
          requestManager.resolveEvaluationRequest(`perf-test-${i}`, mockEvaluation);
        }
      }

      const resolveTime = performance.now() - resolveStart;
      expect(resolveTime).toBeLessThan(50); // Should be fast

      const stats = requestManager.getStats();
      expect(stats.pendingCount).toBe(0);
      // totalRequests tracks calls to generateRequestId, not registerRequest
      // We didn't call generateRequestId in this test
      expect(stats.totalRequests).toBe(0);
    });
  });
});