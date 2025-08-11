/**
 * @file Dialog Manager for Training Board
 * @module components/training/DialogManager
 * 
 * @description
 * Presentational component that renders move error and success dialogs.
 * Extracted from TrainingBoard to separate UI concerns from business logic.
 * 
 * @remarks
 * Key design decisions:
 * - Pure presentational component (no store access)
 * - All state passed via props from parent
 * - All callbacks delegated to parent business logic
 * - No over-engineering - direct dialog rendering only
 * 
 * @example
 * ```tsx
 * <DialogManager
 *   errorDialog={moveErrorDialog}
 *   successDialog={moveSuccessDialog}
 *   onErrorTakeBack={handleMoveErrorTakeBack}
 *   onErrorRestart={handleMoveErrorRestart}
 *   onErrorContinue={handleMoveErrorContinue}
 *   onErrorShowBestMove={handleShowBestMove}
 *   onSuccessClose={handleMoveSuccessClose}
 *   onSuccessContinue={handleMoveSuccessContinue}
 * />
 * ```
 */

import React from 'react';
import { MoveErrorDialog } from '@shared/components/ui/MoveErrorDialog';
import { MoveSuccessDialog } from '@shared/components/ui/MoveSuccessDialog';

/**
 * Move error dialog state structure
 */
interface ErrorDialogState {
  isOpen: boolean;
  wdlBefore?: number;
  wdlAfter?: number;
  bestMove?: string;
  playedMove?: string;
  moveNumber?: number;
}

/**
 * Move success dialog state structure
 */
interface SuccessDialogState {
  isOpen: boolean;
  promotionPiece?: string;
  moveDescription?: string;
}

/**
 * Props for DialogManager component
 */
interface DialogManagerProps {
  /** Move error dialog state from training store */
  errorDialog: ErrorDialogState | null;
  /** Move success dialog state from training store */
  successDialog: SuccessDialogState | null;
  
  /** Callback for error dialog - take back move (undo) */
  onErrorTakeBack: () => void;
  /** Callback for error dialog - restart game */
  onErrorRestart: () => void;
  /** Callback for error dialog - continue playing */
  onErrorContinue: () => void;
  /** Callback for error dialog - show best move */
  onErrorShowBestMove?: () => void;
  
  /** Callback for success dialog - close dialog */
  onSuccessClose: () => void;
  /** Callback for success dialog - continue to next */
  onSuccessContinue: () => void;
}

/**
 * Dialog Manager Component
 * 
 * Renders training dialogs based on state passed from parent component.
 * Maintains separation between UI rendering and business logic.
 * 
 * @param props Dialog state and callback functions
 * @returns Dialog components or null if no dialogs are active
 * 
 * @remarks
 * This component:
 * - Renders MoveErrorDialog when error state is open
 * - Renders MoveSuccessDialog when success state is open  
 * - Delegates all actions to parent component callbacks
 * - Has no direct store access (presentational pattern)
 * - Provides clean separation between UI and business logic
 * 
 * Design Pattern: Presentational Component
 * - State comes from props (lifted up to parent)
 * - Actions delegated via callbacks
 * - No side effects or store subscriptions
 * - Easy to test in isolation
 */
export const DialogManager: React.FC<DialogManagerProps> = ({
  errorDialog,
  successDialog,
  onErrorTakeBack,
  onErrorRestart, 
  onErrorContinue,
  onErrorShowBestMove,
  onSuccessClose,
  onSuccessContinue,
}) => {
  return (
    <>
      {/* Move Error Dialog */}
      {errorDialog?.isOpen && (
        <MoveErrorDialog
          isOpen={errorDialog.isOpen}
          onClose={onErrorContinue}
          onTakeBack={onErrorTakeBack}
          onRestart={onErrorRestart}
          {...(errorDialog.bestMove && { onShowBestMove: onErrorShowBestMove })}
          wdlBefore={errorDialog.wdlBefore || 0}
          wdlAfter={errorDialog.wdlAfter || 0}
          {...(errorDialog.bestMove !== undefined && { bestMove: errorDialog.bestMove })}
          {...(errorDialog.playedMove !== undefined && { playedMove: errorDialog.playedMove })}
          {...(errorDialog.moveNumber !== undefined && { moveNumber: errorDialog.moveNumber })}
        />
      )}

      {/* Move Success Dialog */}
      {successDialog?.isOpen && (
        <MoveSuccessDialog
          isOpen={successDialog.isOpen}
          onClose={onSuccessClose}
          onContinue={onSuccessContinue}
          {...(successDialog.promotionPiece !== undefined && { promotionPiece: successDialog.promotionPiece })}
          {...(successDialog.moveDescription !== undefined && { moveDescription: successDialog.moveDescription })}
        />
      )}
    </>
  );
};

DialogManager.displayName = 'DialogManager';