import React from 'react';

interface DarkModeToggleProps {
  className?: string;
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = React.memo(({ className = '' }) => {
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
});

DarkModeToggle.displayName = 'DarkModeToggle'; 