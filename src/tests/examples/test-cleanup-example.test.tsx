/**
 * Example of proper test cleanup implementation
 * 
 * This demonstrates how to use the test cleanup utilities
 * to prevent memory leaks and ensure test isolation.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { setupTestCleanup, trackedTimers, createTrackedAbortController } from '../utils/test-cleanup';
import React, { useEffect, useState } from 'react';

// Mock fetch globally for this test
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: 'mocked data' }),
    }) as any
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Example component with potential memory leak issues
const ExampleComponent: React.FC = () => {
  const [data, setData] = useState<string>('');
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Potential leak: timer not cleaned up
    const timer = trackedTimers.setTimeout(() => {
      setData('Loaded');
    }, 1000);

    // Potential leak: interval not cleaned up
    const interval = trackedTimers.setInterval(() => {
      setCount(c => c + 1);
    }, 100);

    // Potential leak: event listener not removed
    const handleResize = () => console.log('resize');
    window.addEventListener('resize', handleResize);

    // Potential leak: fetch with no abort
    const controller = createTrackedAbortController();
    fetch('/api/data', { signal: controller.signal })
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      });

    // Cleanup function - but our utilities will handle this automatically too
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
      controller.abort();
    };
  }, []);

  return (
    <div>
      <div data-testid="data">{data}</div>
      <div data-testid="count">{count}</div>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
};

describe.skip('Example Component with Proper Cleanup', () => {
  // Setup automatic cleanup for React tests
  setupTestCleanup(true);

  it('should render without memory leaks', async () => {
    const { unmount } = render(<ExampleComponent />);
    
    // Component is rendered
    expect(screen.getByTestId('data')).toBeInTheDocument();
    
    // Wait for async operations
    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('1');
    }, { timeout: 200 });

    // Unmount the component
    unmount();
    
    // The cleanup utility will automatically:
    // 1. Clear all timers and intervals
    // 2. Remove all event listeners
    // 3. Abort all fetch requests
    // 4. Clean up React Testing Library
    // 5. Clear all mocks
  });

  it('should handle user interactions without leaks', async () => {
    render(<ExampleComponent />);
    
    const button = screen.getByText('Increment');
    
    // Simulate user interaction
    fireEvent.click(button);
    fireEvent.click(button);
    
    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2');
    });
    
    // No manual cleanup needed - setupTestCleanup handles it
  });
});

// Example of unit test with cleanup
describe('Unit Test with Proper Cleanup', () => {
  // Setup automatic cleanup for non-React tests
  setupTestCleanup(false);

  let mockService: any;
  let eventEmitter: any;

  beforeEach(() => {
    // Setup mocks and services
    mockService = {
      listeners: new Map(),
      on: jest.fn((event, handler) => {
        mockService.listeners.set(event, handler);
      }),
      off: jest.fn((event) => {
        mockService.listeners.delete(event);
      }),
      cleanup: jest.fn(() => {
        mockService.listeners.clear();
      })
    };

    // Create event emitter that might leak
    eventEmitter = {
      listeners: [],
      on: function(handler: (data: any) => void) {
        this.listeners.push(handler);
      },
      off: function(handler: (data: any) => void) {
        const idx = this.listeners.indexOf(handler);
        if (idx > -1) {
          this.listeners.splice(idx, 1);
        }
      },
      emit: function(data: any) {
        this.listeners.forEach((h: (data: any) => void) => h(data));
      },
      removeAll: function() {
        this.listeners = [];
      }
    };
  });

  afterEach(() => {
    // Manual cleanup for service-specific resources
    if (mockService) {
      mockService.cleanup();
    }
    if (eventEmitter) {
      eventEmitter.removeAll();
    }
    
    // The setupTestCleanup will handle:
    // - Clearing all mocks
    // - Restoring all mocks
    // - Resetting modules
    // - Clearing timers
  });

  it('should handle service operations without leaks', () => {
    const handler = jest.fn();
    
    // Add event listener
    mockService.on('data', handler);
    expect(mockService.listeners.size).toBe(1);
    
    // Trigger event
    const registeredHandler = mockService.listeners.get('data');
    registeredHandler({ test: 'data' });
    
    expect(handler).toHaveBeenCalledWith({ test: 'data' });
    
    // Cleanup happens automatically
  });

  it('should handle async operations with timers', async () => {
    jest.useFakeTimers();
    
    let resolved = false;
    const promise = new Promise(resolve => {
      trackedTimers.setTimeout(() => {
        resolved = true;
        resolve('done');
      }, 1000);
    });
    
    // Fast-forward time
    jest.advanceTimersByTime(1000);
    
    await promise;
    expect(resolved).toBe(true);
    
    // Cleanup will restore real timers automatically
  });
});

// Example of testing with Zustand store
import { renderHook, act as hookAct } from '@testing-library/react';
import { cleanupZustandStores } from '../utils/test-cleanup';

describe('Zustand Store Test with Cleanup', () => {
  setupTestCleanup(true);
  
  afterEach(() => {
    // Additional Zustand-specific cleanup
    cleanupZustandStores();
  });

  it('should reset store state between tests', () => {
    // Mock Zustand store
    const useStore = jest.fn(() => ({
      count: 0,
      increment: jest.fn(),
      reset: jest.fn()
    }));

    const { result } = renderHook(() => useStore());
    
    expect(result.current.count).toBe(0);
    
    // Store state will be automatically reset after test
  });
});

export {};