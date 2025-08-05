/**
 * @file Toast notification components
 * @module components/ui/Toast
 *
 * @description
 * Provides toast notification components for displaying temporary messages
 * to users. Includes both individual Toast component and ToastContainer
 * for managing multiple toasts. Features auto-dismiss, manual close,
 * and smooth animations.
 *
 * @remarks
 * Key features:
 * - Four notification types: success, error, info, warning
 * - Auto-dismiss with configurable duration
 * - Manual dismiss via close button
 * - Smooth slide-in/fade-out animations
 * - Icon indicators for each type
 * - Stacking support for multiple toasts
 * - Backdrop blur for better visibility
 * - Responsive positioning
 *
 * Uses Tailwind CSS for styling with glassmorphism effects.
 */

import React, { useState, useEffect } from "react";
import { UI } from "@shared/constants";

/**
 * Props for individual Toast component
 *
 * @interface ToastProps
 *
 * @property {string} message - The notification message to display
 * @property {'success' | 'error' | 'info' | 'warning'} type - Toast type determines styling and icon
 * @property {number} [duration] - Auto-dismiss duration in milliseconds (default: UI.TOAST_DURATION)
 * @property {() => void} onClose - Callback when toast is dismissed
 */
export interface ToastProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
  onClose: () => void;
}

/**
 * Toast notification component
 *
 * @component
 * @description
 * Displays a temporary notification message with automatic dismissal.
 * Supports different types with unique colors and icons. Features
 * smooth animations for appearance and disappearance.
 *
 * @example
 * ```tsx
 * <Toast
 *   message="Move successful!"
 *   type="success"
 *   duration={3000}
 *   onClose={() => console.log('Toast closed')}
 * />
 * ```
 *
 * @param {ToastProps} props - Toast configuration
 * @returns {JSX.Element} Rendered toast notification
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = UI.TOAST_DURATION,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, UI.TOAST_FADE_DURATION); // Allow fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  /**
   * Generate dynamic styles based on toast type and visibility
   *
   * @private
   * @returns {string} Combined Tailwind classes
   */
  const getToastStyles = () => {
    const baseStyles =
      "fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 max-w-sm";

    const typeStyles = {
      success: "bg-green-500/90 text-white border border-green-400",
      error: "bg-red-500/90 text-white border border-red-400",
      info: "bg-blue-500/90 text-white border border-blue-400",
      warning: "bg-yellow-500/90 text-black border border-yellow-400",
    };

    const visibilityStyles = isVisible
      ? "opacity-100 translate-x-0"
      : "opacity-0 translate-x-full";

    return `${baseStyles} ${typeStyles[type]} ${visibilityStyles}`;
  };

  /**
   * Get emoji icon for toast type
   *
   * @private
   * @returns {string} Emoji icon
   */
  const getIcon = () => {
    switch (type) {
      case "success":
        return "🎉";
      case "error":
        return "❌";
      case "info":
        return "ℹ️";
      case "warning":
        return "⚠️";
      default:
        return "";
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{getIcon()}</span>
        <span className="font-medium">{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, UI.TOAST_FADE_DURATION);
          }}
          className="ml-2 text-xl opacity-70 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  );
};

/**
 * Props for ToastContainer component
 *
 * @interface ToastContainerProps
 *
 * @property {Array} toasts - Array of toast configurations
 * @property {string} toasts[].id - Unique identifier for the toast
 * @property {string} toasts[].message - Toast message
 * @property {'success' | 'error' | 'info' | 'warning'} toasts[].type - Toast type
 * @property {number} [toasts[].duration] - Optional custom duration
 * @property {(id: string) => void} onRemoveToast - Callback to remove a toast by ID
 */
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
    duration?: number;
  }>;
  onRemoveToast: (id: string) => void;
}

/**
 * Toast container component
 *
 * @component
 * @description
 * Manages and displays multiple toast notifications in a fixed position.
 * Handles stacking of toasts with proper spacing and ensures new toasts
 * appear smoothly without disrupting existing ones.
 *
 * @remarks
 * - Positioned at top-right of viewport
 * - Stacks toasts vertically with spacing
 * - Each toast maintains independent lifecycle
 * - High z-index ensures visibility over other content
 *
 * @example
 * ```tsx
 * const [toasts, setToasts] = useState([]);
 *
 * <ToastContainer
 *   toasts={toasts}
 *   onRemoveToast={(id) => {
 *     setToasts(prev => prev.filter(t => t.id !== id));
 *   }}
 * />
 * ```
 *
 * @param {ToastContainerProps} props - Container configuration
 * @returns {JSX.Element} Rendered toast container
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemoveToast,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onRemoveToast(toast.id)}
        />
      ))}
    </div>
  );
};
