import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/shared/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    
    expect(result.current).toBe('initial');
  });

  test('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    expect(result.current).toBe('initial');
    
    // Change value
    rerender({ value: 'updated', delay: 500 });
    
    // Value should not change immediately
    expect(result.current).toBe('initial');
    
    // Advance time less than delay
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('initial');
    
    // Advance time to complete delay
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe('updated');
  });

  test('should cancel previous timeout on value change', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    // First update
    rerender({ value: 'first update', delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Second update before first completes
    rerender({ value: 'second update', delay: 500 });
    
    // Complete first timeout
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    // Should still be initial (first timeout was cancelled)
    expect(result.current).toBe('initial');
    
    // Complete second timeout
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(result.current).toBe('second update');
  });

  test('should handle delay change', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    // Update with different delay
    rerender({ value: 'updated', delay: 1000 });
    
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Should not update yet (new delay is 1000)
    expect(result.current).toBe('initial');
    
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    expect(result.current).toBe('updated');
  });

  test('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 0 } }
    );
    
    rerender({ value: 'updated', delay: 0 });
    
    // Should update immediately on next tick
    act(() => {
      jest.advanceTimersByTime(0);
    });
    
    expect(result.current).toBe('updated');
  });

  test('should handle multiple rapid updates', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    // Rapid updates
    rerender({ value: 'update1', delay: 500 });
    act(() => jest.advanceTimersByTime(100));
    
    rerender({ value: 'update2', delay: 500 });
    act(() => jest.advanceTimersByTime(100));
    
    rerender({ value: 'update3', delay: 500 });
    act(() => jest.advanceTimersByTime(100));
    
    rerender({ value: 'final', delay: 500 });
    
    // Advance past all previous timeouts
    act(() => jest.advanceTimersByTime(500));
    
    // Should only have the final value
    expect(result.current).toBe('final');
  });

  test('should handle different value types', () => {
    // Number
    const { result: numberResult } = renderHook(() => useDebounce(42, 100));
    expect(numberResult.current).toBe(42);
    
    // Object
    const obj = { foo: 'bar' };
    const { result: objectResult } = renderHook(() => useDebounce(obj, 100));
    expect(objectResult.current).toBe(obj);
    
    // Array
    const arr = [1, 2, 3];
    const { result: arrayResult } = renderHook(() => useDebounce(arr, 100));
    expect(arrayResult.current).toBe(arr);
    
    // Boolean
    const { result: boolResult } = renderHook(() => useDebounce(true, 100));
    expect(boolResult.current).toBe(true);
    
    // Null
    const { result: nullResult } = renderHook(() => useDebounce(null, 100));
    expect(nullResult.current).toBe(null);
  });

  test('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    const { unmount } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});