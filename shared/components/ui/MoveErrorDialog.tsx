import React from "react";

/**
 *
 */
interface MoveErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTakeBack: () => void;
  onRestart?: () => void;
  onShowBestMove?: () => void;
  wdlBefore: number;
  wdlAfter: number;
  bestMove?: string;
}

/**
 *
 * @param root0
 * @param root0.isOpen
 * @param root0.onClose
 * @param root0.onTakeBack
 * @param root0.onRestart
 * @param root0.onShowBestMove
 * @param root0.wdlBefore
 * @param root0.wdlAfter
 * @param root0.bestMove
 */
export /**
 *
 */
const MoveErrorDialog: React.FC<MoveErrorDialogProps> = ({
  isOpen,
  onClose,
  onTakeBack,
  wdlBefore,
  wdlAfter,
  bestMove,
}) => {
  if (!isOpen) return null;

  // Determine the error message based on WDL change
  /**
   *
   */
  const getMessage = () => {
    if (wdlBefore === 2 && wdlAfter < 2) {
      return "Dieser Zug verdirbt den Gewinn!";
    } else if (wdlBefore === 0 && wdlAfter === -2) {
      return "Dieser Zug führt zum Verlust!";
    } else if (wdlBefore > wdlAfter) {
      return "Dieser Zug verschlechtert die Stellung!";
    }
    return "Dieser Zug ist ein Fehler!";
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative bg-gradient-to-br from-red-500 to-pink-600 p-1 rounded-2xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[var(--bg-primary)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-red-400 to-pink-500">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">Fehler erkannt!</h3>
          </div>
          <p className="text-gray-300 mb-2">{getMessage()}</p>
          {bestMove && (
            <p className="text-gray-400 text-sm mb-4">
              Bester Zug war:{" "}
              <strong className="text-gray-200">{bestMove}</strong>
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-white bg-white/10 backdrop-blur rounded-lg hover:bg-white/20 transition-all"
            >
              Verstanden
            </button>
            <button
              onClick={onTakeBack}
              className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-red-500 to-pink-600 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
            >
              Zurücknehmen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
