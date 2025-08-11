/**
 * @file Unit tests for useProgressSync hook
 * @description Tests debounced sync, optimistic updates, retry logic, and offline handling
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useProgressSync } from "@shared/hooks/useProgressSync";
import { type ProgressService } from "@shared/services/ProgressService";
import type { UserStats, CardProgress } from "@shared/store/slices/types";

// Mock progress actions
const mockProgressActions = {
  batchUpdateProgress: jest.fn(),
  setCardProgress: jest.fn(),
  setLastSync: jest.fn(),
  setSyncError: jest.fn(),
};

jest.mock("@shared/store/hooks/useProgressStore", () => ({
  /**
   *
   */
  useProgressActions: () => mockProgressActions,
}));

// Mock logger
jest.mock("@shared/services/logging/Logger", () => {
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return {
    /**
     *
     */
    getLogger: () => ({
      /**
       *
       */
      setContext: () => mockLogger,
    }),
  };
});

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    /**
     *
     * @param key
     */
    getItem: (key: string) => store[key] || null,
    /**
     *
     * @param key
     * @param value
     */
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    /**
     *
     * @param key
     */
    removeItem: (key: string) => {
      delete store[key];
    },
    /**
     *
     */
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

// Mock window online/offline events
const mockWindowEventListeners: { [key: string]: EventListener[] } = {};

Object.defineProperty(window, "addEventListener", {
  /**
   *
   * @param event
   * @param listener
   */
  value: (event: string, listener: EventListener) => {
    if (!mockWindowEventListeners[event]) {
      mockWindowEventListeners[event] = [];
    }
    mockWindowEventListeners[event].push(listener);
  },
});

Object.defineProperty(window, "removeEventListener", {
  /**
   *
   * @param event
   * @param listener
   */
  value: (event: string, listener: EventListener) => {
    if (mockWindowEventListeners[event]) {
      const index = mockWindowEventListeners[event].indexOf(listener);
      if (index > -1) {
        mockWindowEventListeners[event].splice(index, 1);
      }
    }
  },
});

/**
 *
 */
const triggerOnlineEvent = (): void => {
  // Mock navigator.onLine
  Object.defineProperty(navigator, "onLine", {
    writable: true,
    value: true,
  });

  mockWindowEventListeners["online"]?.forEach((listener) =>
    listener(new Event("online")),
  );
};

/**
 *
 */
const triggerOfflineEvent = (): void => {
  // Mock navigator.onLine
  Object.defineProperty(navigator, "onLine", {
    writable: true,
    value: false,
  });

  mockWindowEventListeners["offline"]?.forEach((listener) =>
    listener(new Event("offline")),
  );
};

// Test helpers
/**
 *
 */
const createMockProgressService = (): jest.Mocked<ProgressService> =>
  ({
    updateUserStats: jest.fn().mockResolvedValue(undefined),
    upsertCardProgress: jest.fn().mockResolvedValue(undefined),
    updateProgressTransaction: jest.fn().mockResolvedValue(undefined),
  }) as any;

/**
 *
 */
const createTestUserStats = (): Partial<UserStats> => ({
  totalPositionsCompleted: 10,
  overallSuccessRate: 0.85,
});

/**
 *
 * @param id
 */
const createTestCardProgress = (id: string): CardProgress => ({
  id,
  nextReviewAt: Date.now() + 86400000, // 24 hours from now
  lastReviewedAt: Date.now() - 3600000, // 1 hour ago
  interval: 1,
  repetition: 1,
  efactor: 2.5,
  lapses: 0,
});

describe("useProgressSync", () => {
  const userId = "test-user-123";
  let mockProgressService: jest.Mocked<ProgressService>;

  beforeEach(() => {
    mockProgressService = createMockProgressService();
    jest.clearAllMocks();
    mockLocalStorage.clear();

    // Clear all window event listeners
    Object.keys(mockWindowEventListeners).forEach((key) => {
      mockWindowEventListeners[key] = [];
    });

    // Reset navigator.onLine to true
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });

    // Reset timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(async () => {
    // Properly clean up timers and wait for any pending state updates
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("Basic sync operations", () => {
    it("should sync user stats with optimistic updates", async () => {
      const { result } = renderHook(() =>
        useProgressSync(userId, mockProgressService),
      );

      const statsUpdate = createTestUserStats();

      act(() => {
        result.current.syncUserStats(statsUpdate);
      });

      // Should perform optimistic update immediately
      expect(mockProgressActions.batchUpdateProgress).toHaveBeenCalledWith({
        userStats: statsUpdate,
      });

      // Should queue operation
      expect(result.current.syncStatus.pendingCount).toBe(1);
      expect(result.current.syncStatus.isDebounced).toBe(true);

      // Fast-forward debounce timer and wait for async operations
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockProgressService.updateUserStats).toHaveBeenCalledWith(
          userId,
          statsUpdate,
        );
      });
    });

    it("should sync card progress with optimistic updates", async () => {
      const { result } = renderHook(() =>
        useProgressSync(userId, mockProgressService),
      );

      const cardProgress = createTestCardProgress("test-card-1");

      act(() => {
        result.current.syncCardProgress("test-card-1", cardProgress);
      });

      // Should perform optimistic update immediately
      expect(mockProgressActions.setCardProgress).toHaveBeenCalledWith(
        "test-card-1",
        cardProgress,
      );

      // Fast-forward debounce timer and wait for async operations
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockProgressService.upsertCardProgress).toHaveBeenCalledWith(
          userId,
          "test-card-1",
          cardProgress,
        );
      });
    });

    it("should handle batch sync operations", async () => {
      const { result } = renderHook(() =>
        useProgressSync(userId, mockProgressService),
      );

      const statsUpdate = createTestUserStats();
      const cardUpdates = [
        { positionId: "card-1", progress: createTestCardProgress("card-1") },
        { positionId: "card-2", progress: createTestCardProgress("card-2") },
      ];

      act(() => {
        result.current.syncBatch(statsUpdate, cardUpdates);
      });

      // Should perform optimistic updates
      expect(mockProgressActions.batchUpdateProgress).toHaveBeenCalledWith({
        userStats: statsUpdate,
      });
      expect(mockProgressActions.batchUpdateProgress).toHaveBeenCalledWith({
        cardProgress: {
          "card-1": cardUpdates[0].progress,
          "card-2": cardUpdates[1].progress,
        },
      });

      // Fast-forward debounce timer and wait for async operations
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(
          mockProgressService.updateProgressTransaction,
        ).toHaveBeenCalledWith(userId, statsUpdate, cardUpdates);
      });
    });
  });

  describe("Error handling and retry logic", () => {
    it.skip("should retry failed operations with exponential backoff", async () => {
      const { result } = renderHook(() =>
        useProgressSync(userId, mockProgressService, { maxRetries: 2 }),
      );

      // Make service fail initially
      mockProgressService.updateUserStats
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(undefined);

      const statsUpdate = createTestUserStats();

      act(() => {
        result.current.syncUserStats(statsUpdate);
      });

      // Initial sync attempt
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockProgressService.updateUserStats).toHaveBeenCalledTimes(1);
        expect(result.current.syncStatus.status).toBe("error");
      });

      expect(result.current.syncStatus.pendingCount).toBe(1);

      // First retry (after 1s exponential backoff)
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockProgressService.updateUserStats).toHaveBeenCalledTimes(2);
      });

      // Second retry (after 2s exponential backoff)
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockProgressService.updateUserStats).toHaveBeenCalledTimes(3);
      });

      // Should eventually succeed
      expect(result.current.syncStatus.status).toBe("idle");
      expect(result.current.syncStatus.pendingCount).toBe(0);
    });

    it.skip("should give up after max retries", async () => {
      const { result } = renderHook(() =>
        useProgressSync(userId, mockProgressService, { maxRetries: 1 }),
      );

      // Make service always fail
      mockProgressService.updateUserStats.mockRejectedValue(
        new Error("Permanent error"),
      );

      const statsUpdate = createTestUserStats();

      act(() => {
        result.current.syncUserStats(statsUpdate);
      });

      // Initial attempt
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockProgressService.updateUserStats).toHaveBeenCalledTimes(1);
      });

      // First retry attempt (1000ms retry delay)
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(
        () => {
          expect(mockProgressService.updateUserStats).toHaveBeenCalledTimes(2);
        },
        { timeout: 3000 },
      );

      // Should give up and remove from queue
      expect(result.current.syncStatus.status).toBe("error");
      expect(result.current.syncStatus.pendingCount).toBe(0);
      expect(mockProgressActions.setSyncError).toHaveBeenCalledWith(
        "Permanent error",
      );
    });
  });

  describe("Offline/Online handling", () => {
    it("should queue operations while offline", async () => {
      const { result } = renderHook(() =>
        useProgressSync(userId, mockProgressService),
      );

      // Trigger offline event
      act(() => {
        triggerOfflineEvent();
      });

      expect(result.current.syncStatus.status).toBe("offline");

      // Queue operations while offline
      const statsUpdate = createTestUserStats();
      act(() => {
        result.current.syncUserStats(statsUpdate);
      });

      expect(result.current.syncStatus.pendingCount).toBe(1);

      // Service should not be called while offline
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockProgressService.updateUserStats).not.toHaveBeenCalled();
    });

    it("should process queue when coming back online", async () => {
      const { result } = renderHook(() =>
        useProgressSync(userId, mockProgressService),
      );

      // Go offline and queue operations
      act(() => {
        triggerOfflineEvent();
      });

      const statsUpdate = createTestUserStats();
      act(() => {
        result.current.syncUserStats(statsUpdate);
      });

      expect(result.current.syncStatus.pendingCount).toBe(1);

      // Come back online
      act(() => {
        triggerOnlineEvent();
      });

      expect(result.current.syncStatus.status).toBe("idle");

      // Should process queued operations
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockProgressService.updateUserStats).toHaveBeenCalledWith(
          userId,
          statsUpdate,
        );
      });
    });
  });

  describe("Queue management", () => {
    it("should persist queue to localStorage", () => {
      const { result } = renderHook(() =>
        useProgressSync(userId, mockProgressService),
      );

      const statsUpdate = createTestUserStats();
      act(() => {
        result.current.syncUserStats(statsUpdate);
      });

      // Should save to localStorage
      const savedQueue = mockLocalStorage.getItem(`syncQueue-${userId}`);
      expect(savedQueue).toBeTruthy();

      const parsedQueue = JSON.parse(savedQueue!);
      expect(parsedQueue).toHaveLength(1);
      expect(parsedQueue[0].operation.type).toBe("userStats");
    });

    it("should restore queue from localStorage on mount", () => {
      // Pre-populate localStorage
      const queueData = [
        {
          id: "test-id",
          operation: {
            type: "userStats",
            userId,
            updates: createTestUserStats(),
          },
          timestamp: Date.now(),
          retries: 0,
          lastAttempt: null,
        },
      ];

      mockLocalStorage.setItem(
        `syncQueue-${userId}`,
        JSON.stringify(queueData),
      );

      const { result } = renderHook(() =>
        useProgressSync(userId, mockProgressService),
      );

      expect(result.current.syncStatus.pendingCount).toBe(1);
    });

    it("should enforce queue size limit", () => {
      const { result } = renderHook(() =>
        useProgressSync(userId, mockProgressService),
      );

      // Fill queue beyond limit (MAX_QUEUE_SIZE = 100)
      act(() => {
        for (let i = 0; i < 105; i++) {
          result.current.syncUserStats({ totalPositionsCompleted: i });
        }
      });

      // Should drop oldest operations and keep under limit
      expect(result.current.syncStatus.pendingCount).toBeLessThanOrEqual(100);
    });

    it("should clear queue on demand", () => {
      const { result } = renderHook(() =>
        useProgressSync(userId, mockProgressService),
      );

      // Queue some operations
      act(() => {
        result.current.syncUserStats(createTestUserStats());
        result.current.syncCardProgress(
          "test-card",
          createTestCardProgress("test-card"),
        );
      });

      expect(result.current.syncStatus.pendingCount).toBe(2);

      // Clear queue
      act(() => {
        result.current.clearQueue();
      });

      expect(result.current.syncStatus.pendingCount).toBe(0);
      expect(result.current.syncStatus.status).toBe("idle");
    });
  });

  describe("Batch splitting", () => {
    it("should split large batches into chunks", async () => {
      const { result } = renderHook(() =>
        useProgressSync(userId, mockProgressService, { maxBatchSize: 2 }),
      );

      const statsUpdate = createTestUserStats();
      const cardUpdates = [
        { positionId: "card-1", progress: createTestCardProgress("card-1") },
        { positionId: "card-2", progress: createTestCardProgress("card-2") },
        { positionId: "card-3", progress: createTestCardProgress("card-3") },
        { positionId: "card-4", progress: createTestCardProgress("card-4") },
        { positionId: "card-5", progress: createTestCardProgress("card-5") },
      ];

      act(() => {
        result.current.syncBatch(statsUpdate, cardUpdates);
      });

      // Should split into 3 chunks: [2, 2, 1] cards
      expect(result.current.syncStatus.pendingCount).toBe(3);

      // Fast-forward debounce timer and wait for async operations
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(
          mockProgressService.updateProgressTransaction,
        ).toHaveBeenCalledTimes(3);
      });

      // First chunk should include stats update
      expect(
        mockProgressService.updateProgressTransaction,
      ).toHaveBeenNthCalledWith(
        1,
        userId,
        statsUpdate,
        cardUpdates.slice(0, 2),
      );

      // Other chunks should have empty stats update
      expect(
        mockProgressService.updateProgressTransaction,
      ).toHaveBeenNthCalledWith(2, userId, {}, cardUpdates.slice(2, 4));

      expect(
        mockProgressService.updateProgressTransaction,
      ).toHaveBeenNthCalledWith(3, userId, {}, cardUpdates.slice(4, 5));
    });
  });

  describe("Configuration options", () => {
    it("should respect custom debounce delay", async () => {
      const { result } = renderHook(() =>
        useProgressSync(userId, mockProgressService, { debounceMs: 5000 }),
      );

      act(() => {
        result.current.syncUserStats(createTestUserStats());
      });

      expect(result.current.syncStatus.isDebounced).toBe(true);

      // Should not sync before custom debounce time
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockProgressService.updateUserStats).not.toHaveBeenCalled();

      // Should sync after custom debounce time
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(mockProgressService.updateUserStats).toHaveBeenCalled();
      });
    });

    it("should disable optimistic updates when configured", () => {
      const { result } = renderHook(() =>
        useProgressSync(userId, mockProgressService, {
          enableOptimistic: false,
        }),
      );

      act(() => {
        result.current.syncUserStats(createTestUserStats());
      });

      // Should not perform optimistic updates
      expect(mockProgressActions.batchUpdateProgress).not.toHaveBeenCalled();
    });
  });

  describe("Force sync", () => {
    it("should bypass debounce and sync immediately", async () => {
      const { result } = renderHook(() =>
        useProgressSync(userId, mockProgressService),
      );

      act(() => {
        result.current.syncUserStats(createTestUserStats());
      });

      expect(result.current.syncStatus.isDebounced).toBe(true);

      // Force sync without waiting for debounce
      await act(async () => {
        await result.current.forceSync();
      });

      expect(result.current.syncStatus.isDebounced).toBe(false);
      expect(mockProgressService.updateUserStats).toHaveBeenCalled();
    });
  });

  describe("Concurrency protection", () => {
    it("should prevent concurrent queue processing", async () => {
      const { result } = renderHook(() =>
        useProgressSync(userId, mockProgressService),
      );

      // Make the first sync take time (longer than debounce)
      let resolveFirst: () => void;
      mockProgressService.updateUserStats.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      );

      // Queue first operation
      act(() => {
        result.current.syncUserStats(createTestUserStats());
      });

      expect(result.current.syncStatus.pendingCount).toBe(1);

      // Start first sync
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      // First sync should have started
      expect(mockProgressService.updateUserStats).toHaveBeenCalledTimes(1);

      // Queue second operation while first is still processing
      act(() => {
        result.current.syncUserStats(createTestUserStats());
      });

      // Both operations should be in the queue
      expect(result.current.syncStatus.pendingCount).toBe(2);

      // Try to trigger processing again (should be blocked because first is still processing)
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      // Should still only have one sync call (concurrent processing prevented)
      expect(mockProgressService.updateUserStats).toHaveBeenCalledTimes(1);

      // Now resolve the first operation to allow the second to process
      await act(async () => {
        resolveFirst!();
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle sync without userId gracefully", () => {
      const { result } = renderHook(() =>
        useProgressSync(null, mockProgressService),
      );

      act(() => {
        result.current.syncUserStats(createTestUserStats());
      });

      // Operation should not be queued without userId
      expect(result.current.syncStatus.pendingCount).toBe(0);
    });

    it("should handle localStorage errors gracefully", () => {
      // Mock localStorage to throw error
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = jest.fn(() => {
        throw new Error("Storage quota exceeded");
      });

      const { result } = renderHook(() =>
        useProgressSync(userId, mockProgressService),
      );

      act(() => {
        result.current.syncUserStats(createTestUserStats());
      });

      // Test should not crash and operation should still be queued in memory
      expect(result.current.syncStatus.pendingCount).toBe(1);

      // Restore original method
      mockLocalStorage.setItem = originalSetItem;
    });
  });
});
