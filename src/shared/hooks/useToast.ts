import { useState, useCallback } from 'react';
import { ENCODING_BASES, RANDOM_GENERATION } from '@shared/constants';

/**
 * Toast type definitions
 */
type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast notification object
 * @interface Toast
 * @property {string} id - Unique identifier for the toast
 * @property {string} message - Message to display
 * @property {ToastType} type - Toast type for styling
 * @property {number} [duration] - Auto-dismiss duration in milliseconds
 */
interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

/**
 * Hook for managing toast notifications
 *
 * @description
 * Provides a centralized way to display toast notifications throughout the application.
 * Supports multiple toast types (success, error, info, warning) with optional auto-dismiss.
 *
 * @example
 * ```tsx
 * const { toasts, showSuccess, showError, removeToast } = useToast();
 *
 * // Show a success toast that auto-dismisses after 3 seconds
 * showSuccess('Operation completed!', 3000);
 *
 * // Show an error toast that stays until manually dismissed
 * showError('Something went wrong');
 *
 * // Render toasts
 * {toasts.map(toast => (
 *   <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
 * ))}
 * ```
 *
 * @returns {Object} Toast management functions and state
 * @returns {Toast[]} returns.toasts - Array of active toast notifications
 * @returns {Function} returns.addToast - Add a custom toast
 * @returns {Function} returns.removeToast - Remove a specific toast by ID
 * @returns {Function} returns.showSuccess - Show a success toast
 * @returns {Function} returns.showError - Show an error toast
 * @returns {Function} returns.showInfo - Show an info toast
 * @returns {Function} returns.showWarning - Show a warning toast
 * @returns {Function} returns.clearAllToasts - Remove all active toasts
 */
export const useToast = (): {
  toasts: Toast[];
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  clearAllToasts: () => void;
} => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' | 'warning' = 'info',
      duration?: number
    ) => {
      const id = Math.random()
        .toString(ENCODING_BASES.BASE36)
        .substr(2, RANDOM_GENERATION.UUID_RANDOM_MULTIPLIER);
      const newToast: Toast = {
        id,
        message,
        type,
        ...(duration !== undefined && { duration }),
      };

      setToasts(prev => [...prev, newToast]);

      // Auto-dismiss if duration is provided
      if (duration) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      addToast(message, 'success', duration);
    },
    [addToast]
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      addToast(message, 'error', duration);
    },
    [addToast]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      addToast(message, 'info', duration);
    },
    [addToast]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      addToast(message, 'warning', duration);
    },
    [addToast]
  );

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearAllToasts,
  };
};
