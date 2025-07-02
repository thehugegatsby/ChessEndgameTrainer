import React from 'react';

interface ErrorDisplayProps {
  warning: string | null;
  engineError: string | null;
  moveError: { move: string; message: string; engineResponded: boolean } | null;
  showMoveErrorDialog: boolean;
  onDismissMoveError: () => void;
  onClearWarning: () => void;
  onClearEngineError: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = React.memo(({
  warning,
  engineError,
  moveError,
  showMoveErrorDialog,
  onDismissMoveError,
  onClearWarning,
  onClearEngineError
}) => {
  return (
    <>
      {/* Warning Display */}
      {warning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center justify-between">
            <span className="text-sm">{warning}</span>
            <button
              onClick={onClearWarning}
              className="ml-2 text-yellow-600 hover:text-yellow-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Engine Error Display */}
      {engineError && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-800 px-4 py-2 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center justify-between">
            <span className="text-sm">{engineError}</span>
            <button
              onClick={onClearEngineError}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Move Error Dialog */}
      {showMoveErrorDialog && moveError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Zug-Fehler
              </h3>
            </div>
            
            <div className="mb-4">
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                <strong>Zug:</strong> {moveError.move}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <strong>Problem:</strong> {moveError.message}
              </p>
            </div>
            
            <button
              onClick={onDismissMoveError}
              className="w-full py-2 px-4 dark-button-primary rounded-lg font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
});

ErrorDisplay.displayName = 'ErrorDisplay'; 