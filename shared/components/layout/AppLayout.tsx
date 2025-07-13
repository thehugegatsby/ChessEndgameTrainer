import React, { useState, ReactNode } from 'react';
import { AdvancedEndgameMenu } from '../navigation/AdvancedEndgameMenu';
import { DarkModeToggle } from '../ui/DarkModeToggle';
import { SettingsIcon } from '../ui/SettingsIcon';
import Link from 'next/link';

interface AppLayoutProps {
  children: ReactNode;
  currentPositionId?: number;
  showMobileBottomNav?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  currentPositionId,
  showMobileBottomNav = true 
}) => {
  // Show menu by default on desktop, hidden on mobile
  const [showMenu, setShowMenu] = useState<boolean>(true);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-xl font-bold text-white">Endgame Training</h2>
          <SettingsIcon />
        </div>
      </header>
      
      <div className="flex pt-14"> {/* Add padding-top for fixed header */}
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
              {showMenu ? '❌ Menü schließen' : '📖 Navigation'}
            </button>
          </div>

          {/* Page Content */}
          <main className="container mx-auto p-4">
            {children}
          </main>
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