import { renderHook, act } from '@testing-library/react';
import { useToast } from '../useToast';

describe('useToast', () => {
  test('should initialize with empty toasts array', () => {
    const { result } = renderHook(() => useToast());
    
    expect(result.current.toasts).toEqual([]);
  });

  test('should add success toast', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showSuccess('Success message', 3000);
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'success',
      message: 'Success message',
      duration: 3000
    });
    expect(result.current.toasts[0].id).toBeDefined();
  });

  test('should add error toast', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showError('Error message', 5000);
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'error',
      message: 'Error message',
      duration: 5000
    });
  });

  test('should add info toast', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showInfo('Info message', 3000);
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'info',
      message: 'Info message',
      duration: 3000
    });
  });

  test('should add warning toast', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showWarning('Warning message', 4000);
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'warning',
      message: 'Warning message',
      duration: 4000
    });
  });

  test('should add multiple toasts', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showSuccess('First');
      result.current.showError('Second');
      result.current.showInfo('Third');
    });
    
    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.toasts[0].message).toBe('First');
    expect(result.current.toasts[1].message).toBe('Second');
    expect(result.current.toasts[2].message).toBe('Third');
  });

  test('should dismiss specific toast', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showSuccess('Toast 1');
      result.current.showError('Toast 2');
    });
    
    const toastId = result.current.toasts[0].id;
    
    act(() => {
      result.current.dismissToast(toastId);
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Toast 2');
  });

  test('should clear all toasts', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showSuccess('Toast 1');
      result.current.showError('Toast 2');
      result.current.showInfo('Toast 3');
    });
    
    expect(result.current.toasts).toHaveLength(3);
    
    act(() => {
      result.current.clearToasts();
    });
    
    expect(result.current.toasts).toEqual([]);
  });

  test('should generate unique IDs for toasts', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showSuccess('Toast 1');
      result.current.showSuccess('Toast 2');
    });
    
    const id1 = result.current.toasts[0].id;
    const id2 = result.current.toasts[1].id;
    
    expect(id1).not.toBe(id2);
  });

  test('should use custom duration when provided', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showSuccess('Custom duration', 10000);
    });
    
    expect(result.current.toasts[0].duration).toBe(10000);
  });

  test('should handle dismissing non-existent toast', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showSuccess('Toast');
    });
    
    act(() => {
      result.current.dismissToast('non-existent-id');
    });
    
    // Should not throw and toast should remain
    expect(result.current.toasts).toHaveLength(1);
  });

  test('should auto-dismiss toast after duration', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showSuccess('Auto dismiss', 1000);
    });
    
    expect(result.current.toasts).toHaveLength(1);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(result.current.toasts).toHaveLength(0);
    
    jest.useRealTimers();
  });

  test('should not auto-dismiss if duration is null', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showSuccess('No auto dismiss', undefined);
    });
    
    expect(result.current.toasts).toHaveLength(1);
    
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    
    // Toast should still be there
    expect(result.current.toasts).toHaveLength(1);
    
    jest.useRealTimers();
  });
});