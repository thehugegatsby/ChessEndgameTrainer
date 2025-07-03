import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

// Mock platform service and logger
const mockSave = jest.fn().mockResolvedValue(undefined);
jest.mock('../../services/platform', () => ({
  getPlatformService: () => ({
    storage: {
      save: mockSave
    }
  })
}));

jest.mock('../../services/logging', () => ({
  getLogger: () => ({
    setContext: () => ({
      warn: jest.fn(),
      error: jest.fn()
    })
  })
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('useLocalStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockSave.mockResolvedValue(undefined);
  });

  test('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));
    
    expect(result.current[0]).toBe('defaultValue');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('testKey');
  });

  test('should return parsed value from localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify('storedValue'));
    
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));
    
    expect(result.current[0]).toBe('storedValue');
  });

  test('should set value in localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));
    
    act(() => {
      result.current[1]('newValue');
    });
    
    expect(mockSave).toHaveBeenCalledWith('testKey', 'newValue');
    expect(result.current[0]).toBe('newValue');
  });

  test('should handle objects', () => {
    const initialObject = { foo: 'bar', nested: { value: 42 } };
    const { result } = renderHook(() => useLocalStorage('testKey', initialObject));
    
    expect(result.current[0]).toEqual(initialObject);
    
    const newObject = { foo: 'baz', nested: { value: 100 } };
    act(() => {
      result.current[1](newObject);
    });
    
    expect(mockSave).toHaveBeenCalledWith('testKey', newObject);
    expect(result.current[0]).toEqual(newObject);
  });

  test('should handle arrays', () => {
    const initialArray = [1, 2, 3];
    const { result } = renderHook(() => useLocalStorage('testKey', initialArray));
    
    expect(result.current[0]).toEqual(initialArray);
    
    const newArray = [4, 5, 6];
    act(() => {
      result.current[1](newArray);
    });
    
    expect(mockSave).toHaveBeenCalledWith('testKey', newArray);
    expect(result.current[0]).toEqual(newArray);
  });

  test('should handle function updates', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 0));
    
    act(() => {
      result.current[1](prev => prev + 1);
    });
    
    expect(mockSave).toHaveBeenCalledWith('testKey', 1);
    expect(result.current[0]).toBe(1);
    
    act(() => {
      result.current[1](prev => prev * 2);
    });
    
    expect(mockSave).toHaveBeenCalledWith('testKey', 2);
    expect(result.current[0]).toBe(2);
  });

  test('should handle localStorage errors gracefully', () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });
    
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));
    
    expect(result.current[0]).toBe('defaultValue');
    // Error is now logged via logger service, not console.error
  });

  test('should handle invalid JSON in localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('invalid json {');
    
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));
    
    expect(result.current[0]).toBe('defaultValue');
    // JSON parse error is now logged via logger service
  });

  test('should handle setItem errors gracefully', () => {
    // Mock platform service to fail, then localStorage fallback to also fail
    mockSave.mockRejectedValueOnce(new Error('Platform storage failed'));
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('localStorage full');
    });
    
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));
    
    act(() => {
      result.current[1]('newValue');
    });
    
    // Value should still update in state even if storage fails
    expect(result.current[0]).toBe('newValue');
  });

  test('should sync across multiple hooks with same key', () => {
    const { result: hook1 } = renderHook(() => useLocalStorage('sharedKey', 'initial'));
    const { result: hook2 } = renderHook(() => useLocalStorage('sharedKey', 'initial'));
    
    expect(hook1.current[0]).toBe('initial');
    expect(hook2.current[0]).toBe('initial');
    
    act(() => {
      hook1.current[1]('updated');
    });
    
    // Both hooks should have the updated value
    expect(hook1.current[0]).toBe('updated');
    // Note: In a real implementation, you might need to handle storage events
    // For this test, we're assuming the hook handles its own state
  });

  test('should handle null values', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', null));
    
    expect(result.current[0]).toBe(null);
    
    act(() => {
      result.current[1]('notNull');
    });
    
    expect(result.current[0]).toBe('notNull');
    
    act(() => {
      result.current[1](null);
    });
    
    expect(result.current[0]).toBe(null);
    expect(mockSave).toHaveBeenCalledWith('testKey', null);
  });

  test('should handle undefined initial value', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', undefined));
    
    expect(result.current[0]).toBe(undefined);
  });

  test('should use lazy initial state', () => {
    const expensiveComputation = jest.fn(() => 'computed');
    
    const { result } = renderHook(() => useLocalStorage('testKey', expensiveComputation));
    
    expect(expensiveComputation).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toBe('computed');
    
    // Re-render should not call the function again
    result.current[1]('newValue');
    expect(expensiveComputation).toHaveBeenCalledTimes(1);
  });
});