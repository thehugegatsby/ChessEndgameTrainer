/**
 * @file Dark mode toggle display component
 * @module components/ui/DarkModeToggle
 * 
 * @description
 * Visual indicator component that displays the current dark mode state
 * as a toggle switch. This is a display-only component that shows dark
 * mode as active - it doesn't handle the actual theme switching logic.
 * 
 * @remarks
 * Key features:
 * - Visual toggle switch design with gradient background
 * - Moon and sun icons for clear mode indication
 * - Always shows dark mode as active state
 * - Responsive design with proper ARIA labeling
 * - Memoized for performance optimization
 * 
 * The component uses a purple-to-blue gradient background with a white
 * toggle circle positioned on the right (dark mode active position).
 * Icons provide intuitive visual feedback about the current state.
 */

import React from "react";

/**
 * Props for the DarkModeToggle component
 * 
 * @interface DarkModeToggleProps
 * 
 * @property {string} [className] - Additional CSS classes to apply to the toggle container
 */
interface DarkModeToggleProps {
  className?: string;
}

/**
 * Dark mode toggle display component
 * 
 * @component
 * @description
 * A visual toggle switch that indicates dark mode is currently active.
 * Features a gradient background with moon/sun icons and a sliding toggle
 * circle. This is purely a display component and doesn't include interaction
 * logic - it simply shows the dark mode state visually.
 * 
 * @remarks
 * Visual design:
 * - Purple-to-blue gradient background
 * - White toggle circle positioned right (active)
 * - Moon emoji visible, sun emoji hidden (dark mode)
 * - Rounded toggle switch appearance
 * - Subtle shadow effects for depth
 * 
 * The component is memoized to prevent unnecessary re-renders when
 * parent components update.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <DarkModeToggle />
 * 
 * // With custom styling
 * <DarkModeToggle className="ml-4 my-2" />
 * 
 * // In a settings panel
 * <div className="flex items-center gap-3">
 *   <span>Dark Mode</span>
 *   <DarkModeToggle />
 * </div>
 * ```
 * 
 * @param {DarkModeToggleProps} props - Component configuration
 * @returns {JSX.Element} Rendered dark mode toggle display
 */
export const DarkModeToggle: React.FC<DarkModeToggleProps> = React.memo(
  ({ className = "" }) => {
    return (
      <div
        className={`relative w-14 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 ${className}`}
        aria-label="Dark mode active"
      >
        {/* Toggle Circle */}
        <div className="absolute top-1 translate-x-7 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center">
          {/* Dark Mode Icon */}
          <span className="text-xs">🌙</span>
        </div>

        {/* Background Icons */}
        <div className="absolute inset-0 flex items-center justify-between px-2 text-white text-xs">
          <span className="opacity-0">☀️</span>
          <span className="opacity-100">🌙</span>
        </div>
      </div>
    );
  },
);

DarkModeToggle.displayName = "DarkModeToggle";
