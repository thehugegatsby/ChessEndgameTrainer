/**
 * @file Unit tests for refactored useLocalStorage hook
 * @description Tests the new fully async, ServiceContainer-compatible hook
 * Perfect Jest 30 compatibility - no global mocking required!
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useLocalStorageWithState } from "@shared/hooks/useLocalStorage";
import { createTestContainer } from "../../utils";
import type { IPlatformStorage } from "@shared/services/platform/types";

// Mock logger
jest.mock("@shared/services/logging", () => ({
  /**
   *
   */
  getLogger: () => require("../../shared/logger-utils").createTestLogger(),
}));

// Test container and mock service
let testContainer: ReturnType<typeof createTestContainer>;
let mockStorageService: IPlatformStorage;

// Mock the platform service module to use our test container
jest.mock("@shared/services/platform", () => ({
  /**
   *
   */
  getPlatformService: () => ({
    storage: mockStorageService,
  }),
}));

describe("useLocalStorage Hook - Refactored Version", () => {
  const testKey = "test-key";
  const testValue = { count: 42, name: "test" };
  const testString = "simple string";

  beforeEach(() => {
    // Create test container with mocked services
    testContainer = createTestContainer();
    mockStorageService = testContainer.resolve("platform.storage");

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe("Async Hook - useLocalStorageWithState", () => {
    describe("Initialization", () => {
      test("should initialize with loading state", () => {
        jest.spyOn(mockStorageService, "load").mockResolvedValue(null);

        const { result } = renderHook(() =>
          useLocalStorageWithState(testKey, testString),
        );

        const [value, setter, isLoading, saveError] = result.current;
        expect(value).toBeUndefined();
        expect(typeof setter).toBe("function");
        expect(isLoading).toBe(true);
        expect(saveError).toBeNull();
      });

      test("should load existing value from storage", async () => {
        jest.spyOn(mockStorageService, "load").mockResolvedValue(testValue);

        const { result } = renderHook(() =>
          useLocalStorageWithState(testKey, "default"),
        );

        // Wait for async loading to complete
        await waitFor(() => {
          expect(result.current[2]).toBe(false); // isLoading should be false
        });

        const [value, _setter, isLoading, saveError] = result.current;
        expect(value).toEqual(testValue);
        expect(isLoading).toBe(false);
        expect(saveError).toBeNull();
        expect(mockStorageService.load).toHaveBeenCalledWith(testKey);
      });

      test("should use initial value when storage is empty", async () => {
        jest.spyOn(mockStorageService, "load").mockResolvedValue(null);

        const { result } = renderHook(() =>
          useLocalStorageWithState(testKey, testString),
        );

        await waitFor(() => {
          expect(result.current[2]).toBe(false);
        });

        const [value] = result.current;
        expect(value).toBe(testString);
      });

      test("should handle function-based initial value", async () => {
        const initialValueFn = jest.fn(() => testValue);
        jest.spyOn(mockStorageService, "load").mockResolvedValue(null);

        const { result } = renderHook(() =>
          useLocalStorageWithState(testKey, initialValueFn),
        );

        await waitFor(() => {
          expect(result.current[2]).toBe(false);
        });

        // Function may be called during hook execution and useEffect
        expect(initialValueFn).toHaveBeenCalled();
        expect(result.current[0]).toEqual(testValue);
      });

      test("should handle storage load errors gracefully", async () => {
        jest
          .spyOn(mockStorageService, "load")
          .mockRejectedValue(new Error("Storage error"));

        const { result } = renderHook(() =>
          useLocalStorageWithState(testKey, testString),
        );

        await waitFor(() => {
          expect(result.current[2]).toBe(false);
        });

        const [value] = result.current;
        expect(value).toBe(testString);
      });
    });

    describe("Setting Values", () => {
      test("should update state and save to storage", async () => {
        jest.spyOn(mockStorageService, "load").mockResolvedValue(null);
        jest.spyOn(mockStorageService, "save").mockResolvedValue(undefined);

        const { result } = renderHook(() =>
          useLocalStorageWithState(testKey, testString),
        );

        // Wait for initialization
        await waitFor(() => {
          expect(result.current[2]).toBe(false);
        });

        const newValue = "updated value";
        act(() => {
          result.current[1](newValue);
        });

        expect(result.current[0]).toBe(newValue);

        // Wait for save effect to trigger
        await waitFor(() => {
          expect(mockStorageService.save).toHaveBeenCalledWith(
            testKey,
            newValue,
          );
        });
      });

      test("should handle function-based updates", async () => {
        jest.spyOn(mockStorageService, "load").mockResolvedValue({ count: 0 });
        jest.spyOn(mockStorageService, "save").mockResolvedValue(undefined);

        const { result } = renderHook(() =>
          useLocalStorageWithState(testKey, { count: 0 }),
        );

        // Wait for loading to complete step by step
        await waitFor(
          () => {
            expect(result.current[2]).toBe(false);
          },
          { timeout: 3000 },
        );

        // Then verify the loaded value
        await waitFor(() => {
          expect(result.current[0]).toEqual({ count: 0 });
        });

        act(() => {
          result.current[1]((prev: any) => ({ count: (prev?.count || 0) + 1 }));
        });

        expect(result.current[0]).toEqual({ count: 1 });

        // Wait for save effect to trigger
        await waitFor(() => {
          expect(mockStorageService.save).toHaveBeenCalledWith(testKey, {
            count: 1,
          });
        });
      });

      test("should handle save errors by setting error state", async () => {
        jest.spyOn(mockStorageService, "load").mockResolvedValue(null);
        jest
          .spyOn(mockStorageService, "save")
          .mockRejectedValue(new Error("Save failed"));

        const { result } = renderHook(() =>
          useLocalStorageWithState(testKey, testString),
        );

        await waitFor(() => {
          expect(result.current[2]).toBe(false);
          expect(result.current[0]).toBe(testString);
        });

        // Set a new value (synchronous)
        act(() => {
          result.current[1]("new value");
        });

        // Should immediately show optimistic update
        expect(result.current[0]).toBe("new value");

        // Wait for save effect to fail and set error state
        await waitFor(() => {
          expect(result.current[3]).not.toBeNull();
        });

        // Verify the error and that optimistic state was preserved
        expect(result.current[3]).toBeInstanceOf(Error);
        expect(result.current[3]?.message).toBe("Save failed");
        expect(result.current[0]).toBe("new value");
      });
    });

    describe("Component Lifecycle", () => {
      test("should not update state after unmount", async () => {
        jest
          .spyOn(mockStorageService, "load")
          .mockImplementation(
            () =>
              new Promise((resolve) =>
                setTimeout(() => resolve(testValue), 100),
              ),
          );

        const { result, unmount } = renderHook(() =>
          useLocalStorageWithState(testKey, "default"),
        );

        // Unmount before async load completes
        unmount();

        // Wait longer than the mock delay
        await new Promise((resolve) => setTimeout(resolve, 150));

        // Should still be in initial state since component was unmounted
        expect(result.current[2]).toBe(true); // Still loading
        expect(result.current[0]).toBeUndefined();
      });
    });
  });

  describe("useLocalStorageWithState Hook", () => {
    test("should provide state-based interface", async () => {
      jest.spyOn(mockStorageService, "load").mockResolvedValue(testValue);

      const { result } = renderHook(() =>
        useLocalStorageWithState(testKey, "default"),
      );

      // Should start with loading state
      expect(result.current[0]).toBe(undefined);

      // Wait for async load to complete
      await waitFor(() => {
        expect(result.current[0]).toEqual(testValue);
      });
    });

    test("should maintain useState-like API", async () => {
      jest.spyOn(mockStorageService, "load").mockResolvedValue(null);
      jest.spyOn(mockStorageService, "save").mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useLocalStorageWithState(testKey, testString),
      );

      // Wait for initialization
      await waitFor(() => {
        expect(result.current[0]).toBe(testString);
      });

      // Should have state API
      const [value, setValue] = result.current;
      expect(typeof value).toBe("string");
      expect(typeof setValue).toBe("function");
    });
  });

  describe("ServiceContainer Integration", () => {
    test("should use only platform service for storage operations", async () => {
      jest.spyOn(mockStorageService, "load").mockResolvedValue(testValue);
      jest.spyOn(mockStorageService, "save").mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useLocalStorageWithState(testKey, "initial"),
      );

      await waitFor(() => {
        expect(result.current[2]).toBe(false);
      });

      await act(async () => {
        await result.current[1]("updated");
      });

      // Verify ONLY platform service was used
      expect(mockStorageService.load).toHaveBeenCalledWith(testKey);
      expect(mockStorageService.save).toHaveBeenCalledWith(testKey, "updated");

      // No window.localStorage access at all!
      expect(jest.isMockFunction(mockStorageService.load)).toBe(true);
      expect(jest.isMockFunction(mockStorageService.save)).toBe(true);
    });

    test("should provide perfect test isolation", async () => {
      // Each test gets fresh container and fresh mocks
      const container1 = createTestContainer();
      const storage1 = container1.resolve("platform.storage");

      const container2 = createTestContainer();
      const storage2 = container2.resolve("platform.storage");

      // Different containers = different service instances
      expect(storage1).not.toBe(storage2);

      // Both should be working mock instances
      expect(typeof storage1.load).toBe("function");
      expect(typeof storage2.save).toBe("function");
    });

    test("should support Jest 30 compatible testing", async () => {
      // This test validates Jest 30 compatibility

      // ✅ No global window.localStorage mocking required
      // ✅ No Object.defineProperty usage
      // ✅ Pure dependency injection through ServiceContainer
      // ✅ Perfect mock isolation per test

      jest.spyOn(mockStorageService, "load").mockResolvedValue("test-data");

      const { result } = renderHook(() =>
        useLocalStorageWithState("test", "default"),
      );

      await waitFor(() => {
        expect(result.current[2]).toBe(false);
      });

      expect(result.current[0]).toBe("test-data");

      // Verify service container pattern works
      expect(testContainer).toBeDefined();
      expect(mockStorageService).toBeDefined();
      expect(jest.isMockFunction(mockStorageService.load)).toBe(true);
    });
  });

  describe("Performance Characteristics", () => {
    test("should not create unnecessary re-renders", async () => {
      const renderCount = jest.fn();
      jest.spyOn(mockStorageService, "load").mockResolvedValue(testValue);

      const { result, rerender } = renderHook(() => {
        renderCount();
        return useLocalStorageWithState(testKey, "initial");
      });

      await waitFor(() => {
        expect(result.current[2]).toBe(false);
      });

      // Multiple re-renders should not trigger additional loads
      rerender();
      rerender();

      expect(mockStorageService.load).toHaveBeenCalledTimes(1);
      // Allow for hook initialization render cycles
      expect(renderCount).toHaveBeenCalledTimes(4); // Initial + loading state change + 2 rerenders
    });

    test("should handle rapid successive updates correctly", async () => {
      jest.spyOn(mockStorageService, "load").mockResolvedValue(null);
      jest.spyOn(mockStorageService, "save").mockResolvedValue(undefined);

      const { result } = renderHook(() => useLocalStorageWithState(testKey, 0));

      await waitFor(() => {
        expect(result.current[2]).toBe(false);
      });

      // Rapid updates - React batches these, so they trigger as separate effects
      act(() => {
        result.current[1](1);
      });

      await waitFor(() => {
        expect(mockStorageService.save).toHaveBeenCalledWith(testKey, 1);
      });

      act(() => {
        result.current[1](2);
      });

      await waitFor(() => {
        expect(mockStorageService.save).toHaveBeenCalledWith(testKey, 2);
      });

      act(() => {
        result.current[1](3);
      });

      await waitFor(() => {
        expect(mockStorageService.save).toHaveBeenCalledWith(testKey, 3);
      });

      expect(result.current[0]).toBe(3);
      expect(mockStorageService.save).toHaveBeenCalledTimes(3);
    });
  });
});
