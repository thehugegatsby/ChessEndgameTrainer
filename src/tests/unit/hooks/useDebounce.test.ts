/**
 * @fileoverview Unit tests for useDebounce hook
 * @description Tests debouncing functionality for performance optimization
 */

import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@shared/hooks/useDebounce";

describe("useDebounce Hook", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Basic Functionality", () => {
    it("should return initial value immediately", () => {
      const { result } = renderHook(() => useDebounce("initial", 500));

      expect(result.current).toBe("initial");
    });

    it("should debounce string values", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }: { value: string; delay: number }) =>
          useDebounce(value, delay),
        {
          initialProps: { value: "initial", delay: 500 },
        },
      );

      expect(result.current).toBe("initial");

      // Change value
      rerender({ value: "changed", delay: 500 });

      // Should still show old value
      expect(result.current).toBe("initial");

      // Fast forward time but not enough
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe("initial");

      // Fast forward enough time
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe("changed");
    });

    it("should debounce number values", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }: { value: number; delay: number }) =>
          useDebounce(value, delay),
        {
          initialProps: { value: 0, delay: 300 },
        },
      );

      expect(result.current).toBe(0);

      rerender({ value: 42, delay: 300 });

      expect(result.current).toBe(0);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe(42);
    });

    it("should debounce object values", () => {
      const initialObject = { count: 0, name: "initial" };
      const changedObject = { count: 1, name: "changed" };

      const { result, rerender } = renderHook(
        ({ value, delay }: { value: object; delay: number }) =>
          useDebounce(value, delay),
        {
          initialProps: { value: initialObject, delay: 200 },
        },
      );

      expect(result.current).toBe(initialObject);

      rerender({ value: changedObject, delay: 200 });

      expect(result.current).toBe(initialObject);

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe(changedObject);
    });

    it("should debounce array values", () => {
      const initialArray = [1, 2, 3];
      const changedArray = [4, 5, 6];

      const { result, rerender } = renderHook(
        ({ value, delay }: { value: number[]; delay: number }) =>
          useDebounce(value, delay),
        {
          initialProps: { value: initialArray, delay: 150 },
        },
      );

      expect(result.current).toBe(initialArray);

      rerender({ value: changedArray, delay: 150 });

      act(() => {
        jest.advanceTimersByTime(150);
      });

      expect(result.current).toBe(changedArray);
    });
  });

  describe("Delay Changes", () => {
    it("should handle delay changes", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }: { value: string; delay: number }) =>
          useDebounce(value, delay),
        {
          initialProps: { value: "initial", delay: 500 },
        },
      );

      rerender({ value: "changed", delay: 200 });

      // Should use new delay
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe("changed");
    });

    it("should restart timer when delay changes", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }: { value: string; delay: number }) =>
          useDebounce(value, delay),
        {
          initialProps: { value: "initial", delay: 500 },
        },
      );

      rerender({ value: "changed", delay: 500 });

      // Advance partway
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Change delay - should restart timer
      rerender({ value: "changed", delay: 200 });

      // Old timer should be cleared, new timer starts
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe("initial"); // Still old value

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe("changed"); // Now updated
    });
  });

  describe("Rapid Value Changes", () => {
    it("should only update after final value when rapidly changed", () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string }) => useDebounce(value, 300),
        {
          initialProps: { value: "initial" },
        },
      );

      // Rapidly change values
      rerender({ value: "change1" });
      rerender({ value: "change2" });
      rerender({ value: "change3" });
      rerender({ value: "final" });

      // Should still show initial value
      expect(result.current).toBe("initial");

      // Fast forward
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should show final value only
      expect(result.current).toBe("final");
    });

    it("should clear previous timer on value change", () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string }) => useDebounce(value, 500),
        {
          initialProps: { value: "initial" },
        },
      );

      rerender({ value: "intermediate" });

      // Advance partway
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Change again before first timer completes
      rerender({ value: "final" });

      // Complete the original timer duration
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Should still be initial (intermediate update was cancelled)
      expect(result.current).toBe("initial");

      // Complete the new timer
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe("final");
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero delay", () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string }) => useDebounce(value, 0),
        {
          initialProps: { value: "initial" },
        },
      );

      rerender({ value: "changed" });

      // With zero delay, should update immediately after next tick
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current).toBe("changed");
    });

    it("should handle negative delay", () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string }) => useDebounce(value, -100),
        {
          initialProps: { value: "initial" },
        },
      );

      rerender({ value: "changed" });

      // Negative delay should still work (setTimeout handles it)
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current).toBe("changed");
    });

    it("should handle undefined values", () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string | undefined }) => useDebounce(value, 200),
        {
          initialProps: { value: "initial" as string | undefined },
        },
      );

      rerender({ value: undefined });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBeUndefined();
    });

    it("should handle null values", () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string | null }) => useDebounce(value, 200),
        {
          initialProps: { value: "initial" as string | null },
        },
      );

      rerender({ value: null });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBeNull();
    });

    it("should handle boolean values", () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: boolean }) => useDebounce(value, 100),
        {
          initialProps: { value: true },
        },
      );

      rerender({ value: false });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe(false);
    });
  });

  describe("Cleanup", () => {
    it("should clear timer on unmount", () => {
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      const { unmount } = renderHook(
        ({ value }: { value: string }) => useDebounce(value, 500),
        {
          initialProps: { value: "initial" },
        },
      );

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it("should not update after unmount", () => {
      const { result, rerender, unmount } = renderHook(
        ({ value }: { value: string }) => useDebounce(value, 300),
        {
          initialProps: { value: "initial" },
        },
      );

      rerender({ value: "changed" });

      const initialValue = result.current;

      unmount();

      // Timer should be cleared, no update should happen
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Value should remain the same as before unmount
      expect(result.current).toBe(initialValue);
    });
  });

  describe("Performance Scenarios", () => {
    it("should handle search input scenario", () => {
      const { result, rerender } = renderHook(
        ({ searchTerm }: { searchTerm: string }) =>
          useDebounce(searchTerm, 300),
        {
          initialProps: { searchTerm: "" },
        },
      );

      // Simulate typing "hello"
      rerender({ searchTerm: "h" });
      rerender({ searchTerm: "he" });
      rerender({ searchTerm: "hel" });
      rerender({ searchTerm: "hell" });
      rerender({ searchTerm: "hello" });

      // Should still show empty while typing
      expect(result.current).toBe("");

      // After debounce period
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe("hello");
    });

    it("should handle API call debouncing scenario", () => {
      const { result, rerender } = renderHook(
        ({ apiParam }: { apiParam: { endpoint: string; params: object } }) =>
          useDebounce(apiParam, 500),
        {
          initialProps: {
            apiParam: { endpoint: "/api/search", params: { q: "initial" } },
          },
        },
      );

      const newApiParam = {
        endpoint: "/api/search",
        params: { q: "updated", page: 1 },
      };

      rerender({ apiParam: newApiParam });

      expect(result.current.params).toEqual({ q: "initial" });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe(newApiParam);
    });

    it("should handle window resize debouncing scenario", () => {
      const { result, rerender } = renderHook(
        ({ windowSize }: { windowSize: { width: number; height: number } }) =>
          useDebounce(windowSize, 250),
        {
          initialProps: { windowSize: { width: 1024, height: 768 } },
        },
      );

      // Simulate multiple resize events
      rerender({ windowSize: { width: 1025, height: 768 } });
      rerender({ windowSize: { width: 1026, height: 769 } });
      rerender({ windowSize: { width: 1200, height: 800 } });

      expect(result.current).toEqual({ width: 1024, height: 768 });

      act(() => {
        jest.advanceTimersByTime(250);
      });

      expect(result.current).toEqual({ width: 1200, height: 800 });
    });
  });
});
