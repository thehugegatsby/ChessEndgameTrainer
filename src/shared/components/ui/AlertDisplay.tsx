/**
 * @file Alert display component for training board notifications
 * @module components/ui/AlertDisplay
 * 
 * @description
 * Reusable component for displaying warnings and error messages in training interfaces.
 * Provides consistent styling and dismiss functionality for different alert types.
 */

import React from 'react';

/**
 * Props for the AlertDisplay component
 * 
 * @interface AlertDisplayProps
 * @description Configuration options for alert display
 */
export interface AlertDisplayProps {
  /** Type of alert to display */
  type: 'warning' | 'error';
  /** Message content to display */
  message: string;
  /** Callback when dismiss button is clicked */
  onDismiss: () => void;
}

/**
 * Alert display component for training notifications
 * 
 * @component
 * @description
 * Displays warning and error messages with appropriate styling and
 * dismiss functionality. Used in training interfaces for user feedback.
 * 
 * @example
 * ```tsx
 * // Warning alert
 * <AlertDisplay
 *   type="warning"
 *   message="Please check your move"
 *   onDismiss={() => clearWarning()}
 * />
 * 
 * // Error alert
 * <AlertDisplay
 *   type="error" 
 *   message="Analysis failed"
 *   onDismiss={() => clearError()}
 * />
 * ```
 * 
 * @param {AlertDisplayProps} props - Component configuration
 * @returns {JSX.Element} Rendered alert display
 */
export const AlertDisplay: React.FC<AlertDisplayProps> = ({
  type,
  message,
  onDismiss,
}) => {
  const baseClasses = "mt-2 p-2 border rounded";
  const typeClasses = type === 'warning' 
    ? "bg-yellow-100 border-yellow-400 text-yellow-700"
    : "bg-red-100 border-red-400 text-red-700";
  
  const buttonClasses = type === 'warning'
    ? "ml-2 text-yellow-700 hover:text-yellow-900"
    : "ml-2 text-red-700 hover:text-red-900";

  return (
    <div className={`${baseClasses} ${typeClasses}`}>
      {message}
      <button
        onClick={onDismiss}
        className={buttonClasses}
        aria-label={`Dismiss ${type}`}
      >
        ×
      </button>
    </div>
  );
};