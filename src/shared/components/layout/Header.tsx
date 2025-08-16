/**
 * @file Application header component
 * @module components/layout/Header
 *
 * @description
 * Fixed header component displaying the application title and tagline.
 * Features a chess king icon and German language branding. Uses CSS
 * custom properties for theme-aware styling.
 *
 * @remarks
 * Key features:
 * - Fixed positioning at top of viewport (z-index 50)
 * - Responsive design with max-width container
 * - Chess-themed branding with king icon (♔)
 * - German language interface
 * - Dark mode support via CSS custom properties
 * - Clean typography hierarchy
 *
 * The header serves as the primary branding element and remains
 * visible across all pages for consistent navigation context.
 */

import React from 'react';

/**
 * Application header component
 *
 * @component
 * @description
 * Displays the main application header with title, chess king icon,
 * and motivational tagline. Positioned fixed at the top of the screen
 * to provide consistent branding and navigation context.
 *
 * @remarks
 * Visual design:
 * - Chess king icon (♔) for immediate chess context
 * - "Schach Endspiel Training" as main title
 * - "Verbessere dein Endspiel" as tagline
 * - Flexbox layout with space-between for balanced composition
 * - Responsive padding and typography scaling
 *
 * The component uses CSS custom properties (--text-primary, --text-secondary)
 * to ensure proper color adaptation in both light and dark themes.
 *
 * @example
 * ```tsx
 * // Used in main layout
 * <Header />
 *
 * // Provides consistent branding across all pages
 * <div className="app">
 *   <Header />
 *   <main className="pt-16">
 *     <!-- Page content with top padding for fixed header -->
 *   </main>
 * </div>
 * ```
 *
 * @returns {JSX.Element} Fixed header with branding and tagline
 */
export const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 dark-card-elevated">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">♔</span>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Schach Endspiel Training
            </h1>
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Verbessere dein Endspiel
          </div>
        </div>
      </div>
    </header>
  );
};
