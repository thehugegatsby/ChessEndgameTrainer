import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
/**
 * @file Unit tests for ErrorBoundary component
 * @module tests/unit/components/common/ErrorBoundary.test
 *
 * @description
 * Comprehensive test suite for the ErrorBoundary component and useErrorBoundary hook.
 * Tests error catching, logging, custom fallback UI, environment-specific behavior,
 * and error recovery functionality.
 *
 * @see {@link ErrorBoundary} - Component being tested
 * @see {@link useErrorBoundary} - Hook being tested
 */

import React from 'react';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';

// Use vi.hoisted to ensure mock is available before module imports
const { mockLoggerInstance } = vi.hoisted(() => {
  const loggerInstance = {
    error: vi.fn(),
    setContext: vi.fn(),
  };
  // Setup setContext to return the logger instance
  loggerInstance.setContext.mockReturnValue(loggerInstance);
  return { mockLoggerInstance: loggerInstance };
});

// Mock logging module before importing ErrorBoundary
vi.mock('@shared/services/logging', () => ({
  getLogger: vi.fn(() => mockLoggerInstance),
}));

import { ErrorBoundary, useErrorBoundary } from '@shared/components/common/ErrorBoundary';

/**
 * Test component that conditionally throws an error
 *
 * @description Helper component for testing error boundary behavior.
 * Throws an error when shouldThrow prop is true, otherwise renders normally.
 *
 * @param props - Component props
 * @param props.shouldThrow - Whether to throw an error
 * @returns Rendered component or throws error
 *
 * @example
 * ```tsx
 * <ThrowError shouldThrow={true} /> // Throws error
 * <ThrowError shouldThrow={false} /> // Renders "No error"
 * ```
 */
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoggerInstance.error.mockClear();
    mockLoggerInstance.setContext.mockClear();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')?.isConnected).toBe(true);
  });

  it('renders fallback UI when error occurs', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/etwas ist schiefgelaufen/i)?.isConnected).toBe(true);

    consoleSpy.mockRestore();
  });

  it('renders custom fallback when provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')?.isConnected).toBe(true);

    consoleSpy.mockRestore();
  });

  it('logs error when componentDidCatch is called', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Component error caught by boundary',
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );

    consoleSpy.mockRestore();
  });

  it('calls custom onError handler when provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );

    consoleSpy.mockRestore();
  });

  it('displays error details in development mode', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Fehlerdetails/)?.isConnected).toBe(true);
    expect(screen.getByText(/Test error/)?.isConnected).toBe(true);

    consoleSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('does not display error details in production mode', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText(/Fehlerdetails/)?.isConnected).not.toBe(true);

    consoleSpy.mockRestore();
    vi.unstubAllEnvs();
  });
});

describe('useErrorBoundary hook', () => {
  it('provides resetKey and resetErrorBoundary function', () => {
    const { result } = renderHook(() => useErrorBoundary());

    expect(result.current.resetKey).toBe(0);
    expect(typeof result.current.resetErrorBoundary).toBe('function');
  });

  it('increments resetKey when resetErrorBoundary is called', () => {
    const { result } = renderHook(() => useErrorBoundary());

    expect(result.current.resetKey).toBe(0);

    act(() => {
      result.current.resetErrorBoundary();
    });

    expect(result.current.resetKey).toBe(1);

    act(() => {
      result.current.resetErrorBoundary();
    });

    expect(result.current.resetKey).toBe(2);
  });

  it('allows error recovery through key reset', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

    /**
     * Test component demonstrating error recovery pattern
     *
     * @description
     * Demonstrates how to use useErrorBoundary hook for error recovery.
     * Uses resetKey to force ErrorBoundary remount and hasError state
     * to control when the child component throws.
     *
     * @returns Component with error boundary and reset button
     */
    const TestComponent = (): JSX.Element => {
      const { resetKey, resetErrorBoundary } = useErrorBoundary();
      const [hasError, setHasError] = React.useState(true);

      return (
        <>
          <ErrorBoundary key={resetKey}>
            <ThrowError shouldThrow={hasError} />
          </ErrorBoundary>
          <button
            onClick={() => {
              setHasError(false);
              resetErrorBoundary();
            }}
          >
            Reset
          </button>
        </>
      );
    };

    render(<TestComponent />);

    // Initially shows error
    expect(screen.getByText(/etwas ist schiefgelaufen/i)?.isConnected).toBe(true);

    // Click reset
    fireEvent.click(screen.getByText('Reset'));

    // Now shows normal content
    expect(screen.getByText('No error')?.isConnected).toBe(true);
    expect(screen.queryByText(/etwas ist schiefgelaufen/i)?.isConnected).not.toBe(true);

    consoleSpy.mockRestore();
  });
});
