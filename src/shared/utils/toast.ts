/**
 * @file Toast utilities using Sonner
 * @description Modern toast notifications with better UX than custom implementation
 */

import { toast } from 'sonner';
import { TOAST_DURATIONS_MS } from '../../constants/time.constants';

/**
 * Toast message types
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

/**
 * Simplified toast options interface
 */
export interface ToastOptions {
  id?: string | number;
  duration?: number;
  description?: string;
}

/**
 * Show a success toast
 */
export const showSuccessToast = (message: string, options?: ToastOptions): string | number => {
  return toast.success(message, {
    duration: options?.duration ?? TOAST_DURATIONS_MS.INFO,
    ...(options?.description !== undefined && { description: options.description }),
    ...(options?.id !== undefined && { id: options.id }),
  });
};

/**
 * Show an error toast
 */
export const showErrorToast = (message: string, options?: ToastOptions): string | number => {
  return toast.error(message, {
    duration: options?.duration ?? TOAST_DURATIONS_MS.ERROR, // Longer for errors
    ...(options?.description !== undefined && { description: options.description }),
    ...(options?.id !== undefined && { id: options.id }),
  });
};

/**
 * Show an info toast
 */
export const showInfoToast = (message: string, options?: ToastOptions): string | number => {
  return toast.info(message, {
    duration: options?.duration ?? TOAST_DURATIONS_MS.INFO,
    ...(options?.description !== undefined && { description: options.description }),
    ...(options?.id !== undefined && { id: options.id }),
  });
};

/**
 * Show a warning toast
 */
export const showWarningToast = (message: string, options?: ToastOptions): string | number => {
  return toast.warning(message, {
    duration: options?.duration ?? TOAST_DURATIONS_MS.SUCCESS,
    ...(options?.description !== undefined && { description: options.description }),
    ...(options?.id !== undefined && { id: options.id }),
  });
};

/**
 * Show a loading toast
 */
export const showLoadingToast = (message: string, options?: ToastOptions): string | number => {
  return toast.loading(message, {
    ...(options?.description !== undefined && { description: options.description }),
    ...(options?.id !== undefined && { id: options.id }),
  });
};

/**
 * Show a promise toast (automatically handles loading/success/error states)
 */
export const showPromiseToast = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  },
  options?: ToastOptions
): ReturnType<typeof toast.promise> => {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
    ...(options?.id !== undefined && { id: options.id }),
    ...(options?.description !== undefined && { description: options.description }),
  });
};

/**
 * Dismiss a specific toast
 */
export const dismissToast = (id: string | number): void => {
  toast.dismiss(id);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = (): void => {
  toast.dismiss();
};

/**
 * Chess-specific toast variants with German text
 */
export const chessToasts = {
  moveSuccess: (move: string): string | number =>
    showSuccessToast('Zug ausgeführt', {
      description: `${move} gespielt`,
      duration: 2000,
    }),

  moveError: (error: string): string | number =>
    showErrorToast('Ungültiger Zug', {
      description: error,
      duration: 4000,
    }),

  analysisStarted: (): string | number =>
    showLoadingToast('Analysiere Position...', {
      id: 'analysis',
    }),

  analysisComplete: (evaluation: string): void => {
    dismissToast('analysis');
    showSuccessToast('Analyse abgeschlossen', {
      description: evaluation,
      duration: 3000,
    });
  },

  analysisFailed: (error: string): void => {
    dismissToast('analysis');
    showErrorToast('Analyse fehlgeschlagen', {
      description: error,
      duration: 5000,
    });
  },

  promotionSuccess: (piece: string): string | number =>
    showSuccessToast('Bauernumwandlung', {
      description: `Umgewandelt in ${piece}`,
      duration: 2000,
    }),

  trainingSessionComplete: (moves: number): string | number =>
    showSuccessToast('Trainingssession abgeschlossen!', {
      description: `${moves} Züge gespielt`,
      duration: 4000,
    }),

  positionSaved: (): string | number =>
    showSuccessToast('Position gespeichert', {
      duration: 2000,
    }),

  positionLoaded: (): string | number =>
    showInfoToast('Position geladen', {
      duration: 2000,
    }),
};

// Legacy compatibility - can be gradually migrated away from
export const showToast = (
  type: ToastType,
  message: string,
  options?: ToastOptions
): string | number => {
  switch (type) {
    case 'success':
      return showSuccessToast(message, options);
    case 'error':
      return showErrorToast(message, options);
    case 'info':
      return showInfoToast(message, options);
    case 'warning':
      return showWarningToast(message, options);
    case 'loading':
      return showLoadingToast(message, options);
    default:
      return showInfoToast(message, options);
  }
};
