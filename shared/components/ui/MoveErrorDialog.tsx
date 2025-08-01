import React from "react";
import { Button } from "./button";

/**
 *
 */
interface MoveErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTakeBack: () => void;
  onRestart: () => void;
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
  onRestart,
  onShowBestMove,
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <svg
              className="w-5 h-5"
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
            Fehler erkannt!
          </h3>
          <p className="mt-2 text-base text-gray-700">{getMessage()}</p>
          {bestMove && (
            <p className="mt-2 text-sm text-gray-600">
              Bester Zug war: <strong>{bestMove}</strong>
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={onClose} variant="secondary" className="flex-1">
            Weiterspielen
          </Button>
          <Button onClick={onTakeBack} variant="default" className="flex-1">
            Zug zurücknehmen
          </Button>
          {onShowBestMove && (
            <Button
              onClick={onShowBestMove}
              variant="default"
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              Besten Zug zeigen
            </Button>
          )}
          <Button onClick={onRestart} variant="secondary" className="flex-1">
            Neu starten
          </Button>
        </div>
      </div>
    </div>
  );
};
