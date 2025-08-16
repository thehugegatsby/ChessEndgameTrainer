/**
 * @file Settings icon button component
 * @module components/ui/SettingsIcon
 *
 * @description
 * Simple settings icon button component with gear icon and hover effects.
 * Provides a consistent settings interface element across the application
 * with customizable click handling and styling.
 *
 * @remarks
 * Key features:
 * - SVG gear icon with consistent sizing
 * - Hover effects with background color transition
 * - Customizable click handler for settings functionality
 * - Accessible button with proper title attribute
 * - Flexible styling through className prop
 * - Responsive design with proper touch targets
 *
 * The component uses a standard gear icon pattern that users
 * universally recognize as settings/configuration access.
 */

import React from 'react';

/**
 * Props for the SettingsIcon component
 *
 * @interface SettingsIconProps
 *
 * @property {() => void} [onClick] - Callback function when settings icon is clicked
 * @property {string} [className] - Additional CSS classes to apply to the button
 */
interface SettingsIconProps {
  onClick?: () => void;
  className?: string;
}

/**
 * Settings icon button component
 *
 * @component
 * @description
 * Displays a clickable settings gear icon with hover effects and
 * customizable functionality. Designed to provide access to application
 * settings or configuration options in a familiar, intuitive way.
 *
 * @remarks
 * Visual design:
 * - Standard gear/cog icon using SVG paths
 * - Hover background color change for feedback
 * - Consistent sizing (5x5 units) for uniform appearance
 * - Rounded corners for modern design language
 * - Smooth color transitions for polished interactions
 *
 * Accessibility:
 * - Proper button semantics for screen readers
 * - Title attribute for hover tooltips
 * - Adequate size for touch interactions
 * - High contrast stroke for visibility
 *
 * @example
 * ```tsx
 * // Basic settings button
 * <SettingsIcon onClick={() => openSettings()} />
 *
 * // With custom styling
 * <SettingsIcon
 *   onClick={handleSettingsClick}
 *   className="ml-2 text-blue-400"
 * />
 *
 * // In header or toolbar
 * <div className="toolbar">
 *   <SettingsIcon onClick={() => toggleSettingsModal()} />
 * </div>
 * ```
 *
 * @param {SettingsIconProps} props - Component configuration
 * @returns {JSX.Element} Clickable settings icon button
 */
export const SettingsIcon: React.FC<SettingsIconProps> = ({ onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`p-2 hover:bg-gray-700 rounded-lg transition-colors ${className}`}
      title="Settings"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </button>
  );
};
