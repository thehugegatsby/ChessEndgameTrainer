import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toast, ToastContainer } from '../Toast';

describe('Toast', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic rendering', () => {
    test('renders success toast with message', () => {
      render(
        <Toast 
          message="Success message" 
          type="success" 
          onClose={mockOnClose} 
        />
      );

      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    test('renders error toast with message', () => {
      render(
        <Toast 
          message="Error message" 
          type="error" 
          onClose={mockOnClose} 
        />
      );

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('❌')).toBeInTheDocument();
    });

    test('renders info toast with message', () => {
      render(
        <Toast 
          message="Info message" 
          type="info" 
          onClose={mockOnClose} 
        />
      );

      expect(screen.getByText('Info message')).toBeInTheDocument();
      expect(screen.getByText('ℹ️')).toBeInTheDocument();
    });

    test('renders warning toast with message', () => {
      render(
        <Toast 
          message="Warning message" 
          type="warning" 
          onClose={mockOnClose} 
        />
      );

      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    test('applies correct styles for success toast', () => {
      const { container } = render(
        <Toast 
          message="Success" 
          type="success" 
          onClose={mockOnClose} 
        />
      );

      const toastElement = container.firstChild as HTMLElement;
      expect(toastElement.className).toContain('bg-green-500/90');
      expect(toastElement.className).toContain('text-white');
      expect(toastElement.className).toContain('border-green-400');
    });

    test('applies correct styles for error toast', () => {
      const { container } = render(
        <Toast 
          message="Error" 
          type="error" 
          onClose={mockOnClose} 
        />
      );

      const toastElement = container.firstChild as HTMLElement;
      expect(toastElement.className).toContain('bg-red-500/90');
      expect(toastElement.className).toContain('text-white');
      expect(toastElement.className).toContain('border-red-400');
    });

    test('applies correct styles for info toast', () => {
      const { container } = render(
        <Toast 
          message="Info" 
          type="info" 
          onClose={mockOnClose} 
        />
      );

      const toastElement = container.firstChild as HTMLElement;
      expect(toastElement.className).toContain('bg-blue-500/90');
      expect(toastElement.className).toContain('text-white');
      expect(toastElement.className).toContain('border-blue-400');
    });

    test('applies correct styles for warning toast', () => {
      const { container } = render(
        <Toast 
          message="Warning" 
          type="warning" 
          onClose={mockOnClose} 
        />
      );

      const toastElement = container.firstChild as HTMLElement;
      expect(toastElement.className).toContain('bg-yellow-500/90');
      expect(toastElement.className).toContain('text-black');
      expect(toastElement.className).toContain('border-yellow-400');
    });

    test('starts with visible styles', () => {
      const { container } = render(
        <Toast 
          message="Test" 
          type="info" 
          onClose={mockOnClose} 
        />
      );

      const toastElement = container.firstChild as HTMLElement;
      expect(toastElement.className).toContain('opacity-100');
      expect(toastElement.className).toContain('translate-x-0');
    });
  });

  describe('Auto-dismiss behavior', () => {
    test('auto-dismisses after default duration', () => {
      render(
        <Toast 
          message="Test" 
          type="info" 
          onClose={mockOnClose} 
        />
      );

      expect(mockOnClose).not.toHaveBeenCalled();

      // Default duration is 3000ms
      jest.advanceTimersByTime(3000);
      expect(mockOnClose).not.toHaveBeenCalled();

      // Additional 300ms for fade out animation
      jest.advanceTimersByTime(300);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('auto-dismisses after custom duration', () => {
      render(
        <Toast 
          message="Test" 
          type="info" 
          duration={5000}
          onClose={mockOnClose} 
        />
      );

      expect(mockOnClose).not.toHaveBeenCalled();

      jest.advanceTimersByTime(5000);
      expect(mockOnClose).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('applies fade out styles before closing', () => {
      const { container } = render(
        <Toast 
          message="Test" 
          type="info" 
          duration={1000}
          onClose={mockOnClose} 
        />
      );

      const toastElement = container.firstChild as HTMLElement;
      
      // Initially visible
      expect(toastElement.className).toContain('opacity-100');
      expect(toastElement.className).toContain('translate-x-0');

      // After duration, should start fading
      jest.advanceTimersByTime(1000);
      expect(toastElement.className).toContain('opacity-0');
      expect(toastElement.className).toContain('translate-x-full');

      // After animation, should close
      jest.advanceTimersByTime(300);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Manual dismiss', () => {
    test('close button dismisses toast', () => {
      const { container } = render(
        <Toast 
          message="Test" 
          type="info" 
          onClose={mockOnClose} 
        />
      );

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      const toastElement = container.firstChild as HTMLElement;
      expect(toastElement.className).toContain('opacity-0');
      expect(toastElement.className).toContain('translate-x-full');

      // Should call onClose after animation
      jest.advanceTimersByTime(300);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('manual dismiss cancels auto-dismiss', () => {
      render(
        <Toast 
          message="Test" 
          type="info" 
          onClose={mockOnClose} 
        />
      );

      // Click close button before auto-dismiss
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      jest.advanceTimersByTime(300);
      expect(mockOnClose).toHaveBeenCalledTimes(1);

      // Advance past the original auto-dismiss time
      jest.advanceTimersByTime(3000);
      // Should not call onClose again
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cleanup', () => {
    test('cleans up timer on unmount', () => {
      const { unmount } = render(
        <Toast 
          message="Test" 
          type="info" 
          onClose={mockOnClose} 
        />
      );

      unmount();

      // Timer should be cleared, so onClose should not be called
      jest.advanceTimersByTime(5000);
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});

describe('ToastContainer', () => {
  const mockOnRemoveToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders no toasts when array is empty', () => {
    const { container } = render(
      <ToastContainer 
        toasts={[]} 
        onRemoveToast={mockOnRemoveToast} 
      />
    );

    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement.children).toHaveLength(0);
  });

  test('renders single toast', () => {
    render(
      <ToastContainer 
        toasts={[
          {
            id: 'toast-1',
            message: 'Test message',
            type: 'success'
          }
        ]} 
        onRemoveToast={mockOnRemoveToast} 
      />
    );

    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  test('renders multiple toasts', () => {
    render(
      <ToastContainer 
        toasts={[
          {
            id: 'toast-1',
            message: 'First toast',
            type: 'success'
          },
          {
            id: 'toast-2',
            message: 'Second toast',
            type: 'error'
          },
          {
            id: 'toast-3',
            message: 'Third toast',
            type: 'info'
          }
        ]} 
        onRemoveToast={mockOnRemoveToast} 
      />
    );

    expect(screen.getByText('First toast')).toBeInTheDocument();
    expect(screen.getByText('Second toast')).toBeInTheDocument();
    expect(screen.getByText('Third toast')).toBeInTheDocument();
  });

  test('calls onRemoveToast with correct id when toast closes', () => {
    jest.useFakeTimers();

    render(
      <ToastContainer 
        toasts={[
          {
            id: 'toast-1',
            message: 'Test toast',
            type: 'success',
            duration: 1000
          }
        ]} 
        onRemoveToast={mockOnRemoveToast} 
      />
    );

    // Wait for auto-dismiss
    jest.advanceTimersByTime(1300);
    expect(mockOnRemoveToast).toHaveBeenCalledWith('toast-1');

    jest.useRealTimers();
  });

  test('passes custom duration to toasts', () => {
    jest.useFakeTimers();

    render(
      <ToastContainer 
        toasts={[
          {
            id: 'toast-1',
            message: 'Test toast',
            type: 'info',
            duration: 5000
          }
        ]} 
        onRemoveToast={mockOnRemoveToast} 
      />
    );

    // Should not close at default duration
    jest.advanceTimersByTime(3300);
    expect(mockOnRemoveToast).not.toHaveBeenCalled();

    // Should close at custom duration
    jest.advanceTimersByTime(2000);
    expect(mockOnRemoveToast).toHaveBeenCalledWith('toast-1');

    jest.useRealTimers();
  });

  test('applies correct container styles', () => {
    const { container } = render(
      <ToastContainer 
        toasts={[
          {
            id: 'toast-1',
            message: 'Test',
            type: 'info'
          }
        ]} 
        onRemoveToast={mockOnRemoveToast} 
      />
    );

    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement.className).toContain('fixed');
    expect(containerElement.className).toContain('top-4');
    expect(containerElement.className).toContain('right-4');
    expect(containerElement.className).toContain('z-50');
    expect(containerElement.className).toContain('space-y-2');
  });
});