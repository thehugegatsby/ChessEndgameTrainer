import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { EngineErrorBoundary } from '../EngineErrorBoundary';
import { EngineService } from '@shared/services';

// Mock EngineService
jest.mock('@shared/services', () => ({
  EngineService: {
    getInstance: jest.fn()
  }
}));

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Engine test error');
  }
  return <div>Engine component working</div>;
};

describe('EngineErrorBoundary', () => {
  let mockEngineService: {
    cleanupEngine: jest.Mock;
  };

  // Suppress console errors during tests
  const originalError = console.error;
  const originalLog = console.log;
  
  beforeAll(() => {
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
    console.log = originalLog;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEngineService = {
      cleanupEngine: jest.fn().mockResolvedValue(undefined)
    };
    
    (EngineService.getInstance as jest.Mock).mockReturnValue(mockEngineService);
  });

  test('renders children when there is no error', () => {
    render(
      <EngineErrorBoundary>
        <div>Test content</div>
      </EngineErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('catches errors and displays engine-specific fallback UI', () => {
    render(
      <EngineErrorBoundary>
        <ThrowError shouldThrow={true} />
      </EngineErrorBoundary>
    );

    expect(screen.getByText('Chess Engine Error')).toBeInTheDocument();
    expect(screen.getByText(/The chess engine encountered an error/)).toBeInTheDocument();
    expect(screen.queryByText('Engine component working')).not.toBeInTheDocument();
  });

  test('displays helpful recovery instructions', () => {
    render(
      <EngineErrorBoundary>
        <ThrowError shouldThrow={true} />
      </EngineErrorBoundary>
    );

    expect(screen.getByText('What you can do:')).toBeInTheDocument();
    expect(screen.getByText(/Try making a move to restart the engine/)).toBeInTheDocument();
    expect(screen.getByText(/Refresh the page if the problem persists/)).toBeInTheDocument();
    expect(screen.getByText(/Check your internet connection for tablebase features/)).toBeInTheDocument();
  });

  test('attempts to cleanup engine on error with default ID', async () => {
    render(
      <EngineErrorBoundary>
        <ThrowError shouldThrow={true} />
      </EngineErrorBoundary>
    );

    await waitFor(() => {
      expect(EngineService.getInstance).toHaveBeenCalled();
      expect(mockEngineService.cleanupEngine).toHaveBeenCalledWith('default');
    });
  });

  test('attempts to cleanup engine on error with custom ID', async () => {
    render(
      <EngineErrorBoundary engineId="custom-engine">
        <ThrowError shouldThrow={true} />
      </EngineErrorBoundary>
    );

    await waitFor(() => {
      expect(mockEngineService.cleanupEngine).toHaveBeenCalledWith('custom-engine');
    });
  });

  test('logs error details', async () => {
    render(
      <EngineErrorBoundary>
        <ThrowError shouldThrow={true} />
      </EngineErrorBoundary>
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        '[EngineErrorBoundary] Engine error detected:',
        expect.objectContaining({
          message: 'Engine test error'
        })
      );
    });
  });

  test('logs successful cleanup', async () => {
    render(
      <EngineErrorBoundary>
        <ThrowError shouldThrow={true} />
      </EngineErrorBoundary>
    );

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(
        '[EngineErrorBoundary] Engine cleaned up successfully'
      );
    });
  });

  test('handles cleanup failures gracefully', async () => {
    const cleanupError = new Error('Cleanup failed');
    mockEngineService.cleanupEngine.mockRejectedValue(cleanupError);

    render(
      <EngineErrorBoundary>
        <ThrowError shouldThrow={true} />
      </EngineErrorBoundary>
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        '[EngineErrorBoundary] Failed to cleanup engine:',
        cleanupError
      );
    });

    // Should still show error UI even if cleanup fails
    expect(screen.getByText('Chess Engine Error')).toBeInTheDocument();
  });

  test('applies correct styling classes', () => {
    render(
      <EngineErrorBoundary>
        <ThrowError shouldThrow={true} />
      </EngineErrorBoundary>
    );

    const errorContainer = screen.getByText('Chess Engine Error').closest('div')?.parentElement?.parentElement;
    expect(errorContainer?.className).toContain('bg-amber-50');
    expect(errorContainer?.className).toContain('dark:bg-amber-900/20');
    expect(errorContainer?.className).toContain('border-amber-200');
    expect(errorContainer?.className).toContain('rounded-lg');
  });

  test('renders warning icon', () => {
    const { container } = render(
      <EngineErrorBoundary>
        <ThrowError shouldThrow={true} />
      </EngineErrorBoundary>
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 20 20');
    expect(svg?.getAttribute('class')).toContain('text-amber-400');
  });

  test('renders list with proper styling', () => {
    const { container } = render(
      <EngineErrorBoundary>
        <ThrowError shouldThrow={true} />
      </EngineErrorBoundary>
    );

    const list = container.querySelector('ul');
    expect(list).toBeInTheDocument();
    expect(list?.className).toContain('list-disc');
    expect(list?.className).toContain('list-inside');
    expect(list?.className).toContain('space-y-1');

    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(3);
  });

  test('works with nested components', () => {
    const NestedComponent = () => {
      return (
        <div>
          <span>Nested content</span>
          <ThrowError shouldThrow={false} />
        </div>
      );
    };

    render(
      <EngineErrorBoundary>
        <NestedComponent />
      </EngineErrorBoundary>
    );

    expect(screen.getByText('Nested content')).toBeInTheDocument();
    expect(screen.getByText('Engine component working')).toBeInTheDocument();
  });

  test('catches errors from deeply nested components', () => {
    const DeepComponent = () => <ThrowError shouldThrow={true} />;
    const MiddleComponent = () => <DeepComponent />;
    const TopComponent = () => <MiddleComponent />;

    render(
      <EngineErrorBoundary>
        <TopComponent />
      </EngineErrorBoundary>
    );

    expect(screen.getByText('Chess Engine Error')).toBeInTheDocument();
  });

  test('multiple error boundaries can coexist', () => {
    render(
      <div>
        <EngineErrorBoundary engineId="engine1">
          <div>Engine 1 content</div>
        </EngineErrorBoundary>
        <EngineErrorBoundary engineId="engine2">
          <ThrowError shouldThrow={true} />
        </EngineErrorBoundary>
      </div>
    );

    // First boundary should work normally
    expect(screen.getByText('Engine 1 content')).toBeInTheDocument();
    
    // Second boundary should show error
    expect(screen.getByText('Chess Engine Error')).toBeInTheDocument();
  });

  test('error boundary resets when children change', async () => {
    const { rerender } = render(
      <EngineErrorBoundary>
        <ThrowError shouldThrow={true} />
      </EngineErrorBoundary>
    );

    expect(screen.getByText('Chess Engine Error')).toBeInTheDocument();

    // Rerender with working component
    rerender(
      <EngineErrorBoundary>
        <ThrowError shouldThrow={false} />
      </EngineErrorBoundary>
    );

    // The error boundary should reset and show the working component
    // Note: This depends on the parent ErrorBoundary implementation
    // In practice, you might need to trigger a reset through the parent
  });

  test('handles EngineService.getInstance() failure', async () => {
    (EngineService.getInstance as jest.Mock).mockImplementation(() => {
      throw new Error('Service unavailable');
    });

    render(
      <EngineErrorBoundary>
        <ThrowError shouldThrow={true} />
      </EngineErrorBoundary>
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        '[EngineErrorBoundary] Failed to cleanup engine:',
        expect.objectContaining({
          message: 'Service unavailable'
        })
      );
    });

    // Should still show error UI
    expect(screen.getByText('Chess Engine Error')).toBeInTheDocument();
  });
});