/**
 * @file Move error dialog component for chess training
 * @module components/ui/MoveErrorDialog
 *
 * @description
 * Modal dialog that appears when a player makes a suboptimal move during
 * training. Provides feedback based on Win/Draw/Loss (WDL) evaluation changes
 * and offers options to take back the move or continue. Features a
 * visually striking gradient design to capture attention.
 *
 * @remarks
 * Key features:
 * - Dynamic error messages based on WDL changes
 * - Shows best move suggestion when available
 * - Gradient border design for visual impact
 * - Options to take back or continue playing
 * - German language interface
 * - Backdrop click to close
 * - Responsive design
 *
 * The component analyzes the WDL change to provide context-appropriate
 * feedback messages (e.g., "ruins winning position", "leads to loss").
 */

import React from "react";

/**
 * Props for the MoveErrorDialog component
 *
 * @interface MoveErrorDialogProps
 *
 * @property {boolean} isOpen - Controls dialog visibility
 * @property {() => void} onClose - Callback when dialog is closed
 * @property {() => void} onTakeBack - Callback to take back the move
 * @property {() => void} [onRestart] - Optional callback to restart (currently unused)
 * @property {() => void} [onShowBestMove] - Optional callback to show best move (currently unused)
 * @property {number} wdlBefore - Win/Draw/Loss value before the move (2=win, 0=draw, -2=loss)
 * @property {number} wdlAfter - Win/Draw/Loss value after the move
 * @property {string} [bestMove] - The best move that should have been played
 * @property {string} [playedMove] - The move that was actually played
 * @property {number} [moveNumber] - The current move number
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
  playedMove?: string;
  moveNumber?: number;
}

/**
 * Move error dialog component
 *
 * @component
 * @description
 * Displays a modal dialog when the player makes a suboptimal move.
 * Analyzes the Win/Draw/Loss (WDL) evaluation change to provide
 * appropriate feedback and coaching. The striking visual design
 * helps reinforce learning moments.
 *
 * @remarks
 * WDL value meanings:
 * - 2: Winning position
 * - 0: Draw
 * - -2: Losing position
 *
 * The component provides different messages based on the severity
 * of the error, helping players understand the impact of their moves.
 *
 * @example
 * ```tsx
 * <MoveErrorDialog
 *   isOpen={showError}
 *   onClose={() => setShowError(false)}
 *   onTakeBack={() => takeBackMove()}
 *   wdlBefore={2}
 *   wdlAfter={0}
 *   bestMove="Kg7"
 * />
 * ```
 *
 * @param {MoveErrorDialogProps} props - Dialog configuration
 * @returns {JSX.Element | null} Rendered dialog or null when closed
 */
export const MoveErrorDialog: React.FC<MoveErrorDialogProps> = ({
  isOpen,
  onClose,
  onTakeBack,
  wdlBefore,
  wdlAfter,
  bestMove,
  playedMove,
  moveNumber,
}) => {
  if (!isOpen) return null;

  /**
   * Convert English notation to German notation
   */
  const convertToGermanNotation = (move: string): string => {
    return move
      .replace(/Q/g, 'D')  // Queen -> Dame
      .replace(/R/g, 'T')  // Rook -> Turm
      .replace(/B/g, 'L')  // Bishop -> Läufer
      .replace(/N/g, 'S'); // Knight -> Springer
  };

  /**
   * Get formatted move notation with move number
   */
  const getFormattedMove = (move: string | undefined, _isPlayerMove: boolean): string => {
    if (!move || moveNumber === undefined) return move || "???";
    
    // Convert to German notation
    const germanMove = convertToGermanNotation(move);
    
    // Determine if it's a white or black move based on move number
    // moveNumber starts at 0: 0,2,4,6... = white moves, 1,3,5,7... = black moves
    const isWhiteMove = (moveNumber % 2 === 0);
    const displayMoveNumber = Math.floor(moveNumber / 2) + 1;
    
    if (isWhiteMove) {
      return `${displayMoveNumber}.${germanMove}`;
    } else {
      return `${displayMoveNumber}...${germanMove}`;
    }
  };

  /**
   * Determine error message based on WDL change
   *
   * @private
   * @returns {string} Localized error message in German
   *
   * @description
   * Analyzes the WDL values before and after the move to provide
   * context-appropriate feedback with specific move notation:
   * - Win to non-win: "Ruins the win"
   * - Draw to loss: "Leads to loss"
   * - Any deterioration: "Worsens the position"
   * - Default: "This move is an error"
   */
  const getMessage = () => {
    const formattedPlayedMove = getFormattedMove(playedMove, true);
    
    if (wdlBefore === 2 && wdlAfter < 2) {
      return `${formattedPlayedMove} verdirbt den Gewinn!`;
    } else if (wdlBefore === 0 && wdlAfter === -2) {
      return `${formattedPlayedMove} führt zum Verlust!`;
    } else if (wdlBefore > wdlAfter) {
      return `${formattedPlayedMove} verschlechtert die Stellung!`;
    }
    return `${formattedPlayedMove} ist ein Fehler!`;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
      onClick={onClose}
      data-testid="move-error-dialog"
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
              Besser war:{" "}
              <strong className="text-gray-200">{getFormattedMove(bestMove, false)}</strong>
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-white bg-white/10 backdrop-blur rounded-lg hover:bg-white/20 transition-all"
            >
              Weiterspielen
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
