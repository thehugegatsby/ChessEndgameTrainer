import React from 'react';

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
