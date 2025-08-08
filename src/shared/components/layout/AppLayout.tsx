/**
 * @file Main application layout component
 * @module components/layout/AppLayout
 * 
 * @description
 * Root layout component that provides the main application structure
 * including navigation, header, and responsive layout management.
 * Handles both desktop and mobile layouts with adaptive navigation
 * and theme controls.
 * 
 * @remarks
 * Key features:
 * - Fixed header with app title and settings
 * - Responsive sidebar navigation with collapse functionality
 * - Desktop floating action buttons (Dashboard, Dark Mode)
 * - Mobile bottom navigation bar
 * - Adaptive menu visibility (shown by default on desktop)
 * - Integration with AdvancedEndgameMenu for position navigation
 * - Dark mode support throughout
 * 
 * The layout uses CSS Grid and Flexbox for responsive behavior
 * and provides consistent spacing and navigation patterns.
 */

"use client";

import React, { useState, ReactNode } from "react";
import { AdvancedEndgameMenu } from "../navigation/AdvancedEndgameMenu";
import { DarkModeToggle } from "../ui/DarkModeToggle";
import { SettingsIcon } from "../ui/SettingsIcon";
import Link from "next/link";

/**
 * Props for the AppLayout component
 * 
 * @interface AppLayoutProps
 * 
 * @property {ReactNode} children - Main page content to render
 * @property {number} [currentPositionId] - Current training position ID for navigation highlighting
 * @property {boolean} [showMobileBottomNav=true] - Whether to show mobile bottom navigation bar
 */
interface AppLayoutProps {
  children: ReactNode;
  currentPositionId?: number;
  showMobileBottomNav?: boolean;
}

/**
 * Main application layout component
 * 
 * @component
 * @description
 * Provides the complete application shell with responsive navigation,
 * header, and content areas. Manages navigation state and provides
 * consistent layout patterns across all pages.
 * 
 * @remarks
 * Layout structure:
 * - Fixed header (64px height) with title and settings
 * - Collapsible sidebar navigation (AdvancedEndgameMenu)
 * - Main content area with container constraints
 * - Desktop: Floating buttons in bottom-right
 * - Mobile: Bottom navigation bar with key actions
 * 
 * Navigation behavior:
 * - Desktop: Menu shown by default, can be collapsed
 * - Mobile: Menu hidden by default, toggle button provided
 * - Mobile toggle shows emoji-based UI for better touch experience
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <AppLayout>
 *   <YourPageContent />
 * </AppLayout>
 * 
 * // With position highlighting
 * <AppLayout currentPositionId={5}>
 *   <TrainingPage />
 * </AppLayout>
 * 
 * // Without mobile bottom nav
 * <AppLayout showMobileBottomNav={false}>
 *   <FullScreenPage />
 * </AppLayout>
 * ```
 * 
 * @param {AppLayoutProps} props - Layout configuration
 * @returns {JSX.Element} Complete application layout shell
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentPositionId,
  showMobileBottomNav = true,
}) => {
  // Show menu by default on desktop, hidden on mobile
  const [showMenu, setShowMenu] = useState<boolean>(true);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-xl font-bold text-white">Endgame Training</h2>
          <SettingsIcon />
        </div>
      </header>

      <div className="flex pt-14">
        {" "}
        {/* Add padding-top for fixed header */}
        {/* Advanced Endgame Menu */}
        <AdvancedEndgameMenu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          currentPositionId={currentPositionId}
        />
        {/* Main Content */}
        <div className="flex-1">
          {/* Mobile Menu Toggle Button */}
          <div className="lg:hidden p-4">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showMenu ? "❌ Menü schließen" : "📖 Navigation"}
            </button>
          </div>

          {/* Page Content */}
          <main className="container mx-auto p-4">{children}</main>
        </div>
      </div>

      {/* Desktop Floating Action Button */}
      <div className="hidden lg:flex fixed bottom-6 right-6 flex-col gap-3">
        <Link
          href="/dashboard"
          className="p-3 dark-button-primary rounded-full shadow-xl hover:bg-blue-600 transition-all duration-200 hover:scale-105"
          title="Dashboard"
        >
          📊
        </Link>
        <div className="p-2">
          <DarkModeToggle />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {showMobileBottomNav && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 dark-card-elevated border-t p-3">
          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 dark-button-primary rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              📊 Dashboard
            </Link>
            <Link
              href="/"
              className="px-4 py-2 dark-button-secondary rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              🏠 Home
            </Link>
            <div className="p-1">
              <DarkModeToggle />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
