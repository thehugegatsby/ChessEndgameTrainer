import React from 'react';
import Link from 'next/link';
import { EndgamePosition } from '@shared/data/endgames/index';

interface TrainingControlsProps {
  position: EndgamePosition;
  prevPosition?: EndgamePosition | null;
  nextPosition?: EndgamePosition | null;
  onReset: () => void;
  getLichessUrl: () => string;
  isMobile?: boolean;
}

export const TrainingControls: React.FC<TrainingControlsProps> = ({
  position,
  prevPosition,
  nextPosition,
  onReset,
  getLichessUrl,
  isMobile = false
}) => {
  if (isMobile) {
    return (
      <div className="lg:hidden w-full max-w-sm mt-16 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onReset}
            className="dark-button-secondary rounded-lg py-2 text-sm font-medium hover:bg-gray-600 transition-colors"
          >
            🔄 Reset
          </button>
          <a 
            href={getLichessUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="dark-button-secondary rounded-lg py-2 text-sm font-medium hover:bg-gray-600 transition-colors text-center"
          >
            🔗 Lichess
          </a>
        </div>
        
        {/* Mobile Navigation */}
        <div className="flex gap-2">
          {prevPosition && (
            <Link 
              href={`/train/${prevPosition.id}`}
              className="flex-1 dark-button-primary rounded-lg py-2 text-sm font-medium hover:bg-blue-600 transition-colors text-center"
            >
              ← Zurück
            </Link>
          )}
          {nextPosition && (
            <Link 
              href={`/train/${nextPosition.id}`}
              className="flex-1 dark-button-primary rounded-lg py-2 text-sm font-medium hover:bg-blue-600 transition-colors text-center"
            >
              Weiter →
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Desktop controls
  return (
    <div className="flex-shrink-0 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <a 
          href={getLichessUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="dark-button-primary rounded-lg py-2 text-xs font-medium hover:bg-blue-600 transition-colors text-center"
        >
          🔗 Lichess
        </a>
        <button 
          onClick={onReset}
          className="dark-button-secondary rounded-lg py-2 text-xs font-medium hover:bg-gray-600 transition-colors"
        >
          🔄 Reset
        </button>
      </div>

      {/* Navigation - Always Visible */}
      <div className="flex gap-2">
        {prevPosition ? (
          <Link 
            href={`/train/${prevPosition.id}`}
            className="flex-1 dark-button-primary rounded-lg py-2 text-xs font-medium hover:bg-blue-600 transition-colors text-center"
            title={prevPosition.title}
          >
            ← #{prevPosition.id}
          </Link>
        ) : (
          <div className="flex-1 opacity-50 bg-gray-700 rounded-lg py-2 text-xs text-center">
            ← Start
          </div>
        )}
        {nextPosition ? (
          <Link 
            href={`/train/${nextPosition.id}`}
            className="flex-1 dark-button-primary rounded-lg py-2 text-xs font-medium hover:bg-blue-600 transition-colors text-center"
            title={nextPosition.title}
          >
            #{nextPosition.id} →
          </Link>
        ) : (
          <div className="flex-1 opacity-50 bg-gray-700 rounded-lg py-2 text-xs text-center">
            Ende →
          </div>
        )}
      </div>
    </div>
  );
}; 