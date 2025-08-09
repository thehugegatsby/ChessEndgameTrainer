/**
 * @file Toast utilities using Sonner
 * @description Modern toast notifications with better UX than custom implementation
 */

import { toast } from 'sonner';

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
export const showSuccessToast = (message: string, options?: ToastOptions) => {
  return toast.success(message, {
    duration: options?.duration ?? 4000,
    description: options?.description,
    id: options?.id,
  });
};

/**
 * Show an error toast  
 */
export const showErrorToast = (message: string, options?: ToastOptions) => {
  return toast.error(message, {
    duration: options?.duration ?? 6000, // Longer for errors
    description: options?.description,
    id: options?.id,
  });
};

/**
 * Show an info toast
 */
export const showInfoToast = (message: string, options?: ToastOptions) => {
  return toast.info(message, {
    duration: options?.duration ?? 4000,
    description: options?.description,
    id: options?.id,
  });
};

/**
 * Show a warning toast
 */
export const showWarningToast = (message: string, options?: ToastOptions) => {
  return toast.warning(message, {
    duration: options?.duration ?? 5000,
    description: options?.description,
    id: options?.id,
  });
};

/**
 * Show a loading toast
 */
export const showLoadingToast = (message: string, options?: ToastOptions) => {
  return toast.loading(message, {
    description: options?.description,
    id: options?.id,
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
) => {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
    id: options?.id,
    description: options?.description,
  });
};

/**
 * Dismiss a specific toast
 */
export const dismissToast = (id: string | number) => {
  toast.dismiss(id);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

/**
 * Chess-specific toast variants with German text
 */
export const chessToasts = {
  moveSuccess: (move: string) => 
    showSuccessToast('Zug ausgeführt', { 
      description: `${move} gespielt`,
      duration: 2000 
    }),
    
  moveError: (error: string) =>
    showErrorToast('Ungültiger Zug', {
      description: error,
      duration: 4000
    }),
    
  analysisStarted: () =>
    showLoadingToast('Analysiere Position...', {
      id: 'analysis'
    }),
    
  analysisComplete: (evaluation: string) => {
    dismissToast('analysis');
    showSuccessToast('Analyse abgeschlossen', {
      description: evaluation,
      duration: 3000
    });
  },
  
  analysisFailed: (error: string) => {
    dismissToast('analysis');
    showErrorToast('Analyse fehlgeschlagen', {
      description: error,
      duration: 5000
    });
  },
  
  promotionSuccess: (piece: string) =>
    showSuccessToast('Bauernumwandlung', {
      description: `Umgewandelt in ${piece}`,
      duration: 2000
    }),
    
  trainingSessionComplete: (moves: number) =>
    showSuccessToast('Trainingssession abgeschlossen!', {
      description: `${moves} Züge gespielt`,
      duration: 4000
    }),
    
  positionSaved: () =>
    showSuccessToast('Position gespeichert', {
      duration: 2000
    }),
    
  positionLoaded: () =>
    showInfoToast('Position geladen', {
      duration: 2000  
    }),
};

// Legacy compatibility - can be gradually migrated away from
export const showToast = (type: ToastType, message: string, options?: ToastOptions) => {
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