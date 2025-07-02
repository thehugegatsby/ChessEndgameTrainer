import React from 'react';

interface GameControlsProps {
  onReset: () => void;
  onUndo: () => void;
  canUndo: boolean;
  isGameFinished: boolean;
  position: { name: string; description: string };
}

export const GameControls: React.FC<GameControlsProps> = React.memo(({
  onReset,
  onUndo,
  canUndo,
  isGameFinished,
  position
}) => {
  return (
    <div className="mt-4 flex flex-col gap-3">
      {/* Position Info */}
      <div className="dark-card rounded-lg p-3">
        <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
          {position.name}
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {position.description}
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={onReset}
          className="flex-1 py-2 px-3 dark-button-secondary rounded-lg text-sm font-medium transition-colors"
        >
          🔄 Reset
        </button>
        
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            canUndo 
              ? 'dark-button-warning hover:bg-yellow-600' 
              : 'opacity-50 cursor-not-allowed bg-gray-600'
          }`}
        >
          ↶ Zurück
        </button>
      </div>

      {/* Game Status */}
      {isGameFinished && (
        <div className="dark-card rounded-lg p-3 text-center">
          <span className="text-2xl mb-2 block">🏁</span>
          <p className="text-sm font-medium" style={{ color: 'var(--success-text)' }}>
            Spiel beendet!
          </p>
        </div>
      )}
    </div>
  );
});

GameControls.displayName = 'GameControls'; 