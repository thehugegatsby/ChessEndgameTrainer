/**
 * @file Move success dialog component for chess training
 * @module components/ui/MoveSuccessDialog
 *
 * @description
 * Modal dialog that appears when a player makes a successful pawn promotion
 * that leads to a winning position. Provides congratulatory feedback
 * with a visually striking green gradient design to celebrate success.
 *
 * @remarks
 * Key features:
 * - Dynamic success messages based on promotion piece
 * - Green gradient border design for positive reinforcement
 * - Options to continue or replay
 * - German language interface
 * - Backdrop click to close
 * - Responsive design
 *
 * The component shows different messages based on the promotion piece
 * (Dame, Turm, Läufer, Springer) to provide appropriate feedback.
 */

import React from "react";

/**
 * Props for the MoveSuccessDialog component
 *
 * @interface MoveSuccessDialogProps
 *
 * @property {boolean} isOpen - Controls dialog visibility
 * @property {() => void} onClose - Callback when dialog is closed
 * @property {() => void} onContinue - Callback to continue to next position
 * @property {() => void} [onReplay] - Optional callback to replay the training
 * @property {string} [promotionPiece] - The piece that was promoted to (Dame, Turm, etc.)
 * @property {string} [moveDescription] - Description of the winning move
 */
interface MoveSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onReplay?: () => void;
  promotionPiece?: string;
  moveDescription?: string;
}

/**
 * Move success dialog component
 *
 * @component
 * @description
 * Displays a modal dialog when the player makes a successful pawn promotion
 * that leads to a winning position. Uses green gradient design to celebrate
 * the achievement and motivate continued learning.
 *
 * @example
 * ```tsx
 * <MoveSuccessDialog
 *   isOpen={showSuccess}
 *   onClose={() => setShowSuccess(false)}
 *   onContinue={() => goToNextPosition()}
 *   promotionPiece="Dame"
 *   moveDescription="e8=Q+"
 * />
 * ```
 *
 * @param {MoveSuccessDialogProps} props - Dialog configuration
 * @returns {JSX.Element | null} Rendered dialog or null when closed
 */
export const MoveSuccessDialog: React.FC<MoveSuccessDialogProps> = ({
  isOpen,
  onClose,
  onContinue,
  onReplay: _onReplay, // Currently unused but part of the interface
  promotionPiece,
  moveDescription,
}) => {
  if (!isOpen) return null;

  /**
   * Generate congratulatory message based on promotion piece
   *
   * @private
   * @returns {string} Localized success message in German
   *
   * @description
   * Creates context-appropriate success messages based on the promotion piece:
   * - Dame: "Excellent queen promotion!"
   * - Turm: "Great rook promotion!"
   * - Läufer: "Smart bishop promotion!"
   * - Springer: "Clever knight promotion!"
   * - Default: "Great promotion leads to victory!"
   */
  const getMessage = (): string => {
    if (promotionPiece) {
      switch (promotionPiece.toLowerCase()) {
        case "dame":
        case "queen":
          return `Ausgezeichnet! Umwandlung in ${promotionPiece} führt zum Sieg!`;
        case "turm":
        case "rook":
          return `Großartig! Umwandlung in ${promotionPiece} führt zum Sieg!`;
        case "läufer":
        case "bishop":
          return `Klug! Umwandlung in ${promotionPiece} führt zum Sieg!`;
        case "springer":
        case "knight":
          return `Clever! Umwandlung in ${promotionPiece} führt zum Sieg!`;
        default:
          return `Perfekt! Umwandlung in ${promotionPiece} führt zum Sieg!`;
      }
    }
    return "Glückwunsch! Die Umwandlung führt zum Sieg!";
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-1 rounded-2xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[var(--bg-primary)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-green-400 to-emerald-500">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">Erfolg!</h3>
          </div>
          <p className="text-gray-300 mb-2">{getMessage()}</p>
          {moveDescription && (
            <p className="text-gray-400 text-sm mb-4">
              Gewinnzug:{" "}
              <strong className="text-gray-200">{moveDescription}</strong>
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
              onClick={onContinue}
              className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
            >
              Weiter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
