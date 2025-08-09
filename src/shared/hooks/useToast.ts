import { useState, useCallback } from "react";

/**
 * Toast notification object
 * @interface Toast
 * @property {string} id - Unique identifier for the toast
 * @property {string} message - Message to display
 * @property {'success' | 'error' | 'info' | 'warning'} type - Toast type for styling
 * @property {number} [duration] - Auto-dismiss duration in milliseconds
 */
interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
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
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (
      message: string,
      type: "success" | "error" | "info" | "warning" = "info",
      duration?: number,
    ) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = {
        id,
        message,
        type,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss if duration is provided
      if (duration) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      addToast(message, "success", duration);
    },
    [addToast],
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      addToast(message, "error", duration);
    },
    [addToast],
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      addToast(message, "info", duration);
    },
    [addToast],
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      addToast(message, "warning", duration);
    },
    [addToast],
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
