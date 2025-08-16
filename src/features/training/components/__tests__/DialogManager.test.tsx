import { vi } from 'vitest';
/**
 * @file Tests for DialogManager component
 * @module src/features/training/components/__tests__/DialogManager
 *
 * @description
 * Comprehensive tests for the DialogManager component that handles
 * move error and success dialogs in the chess training interface.
 *
 * Tests cover:
 * - Dialog rendering based on state props
 * - Callback delegation to parent handlers
 * - Proper dialog component integration
 * - Accessibility and interaction patterns
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DialogManager } from '@shared/components/training/DialogManager';

// Mock the dialog components
vi.mock('@shared/components/ui/MoveErrorDialog', () => ({
  MoveErrorDialog: ({
    isOpen,
    onClose,
    onTakeBack,
    onRestart,
    onShowBestMove,
    wdlBefore,
    wdlAfter,
    bestMove,
  }: any) =>
    isOpen ? (
      <div data-testid="move-error-dialog">
        <button onClick={onClose} data-testid="error-close">
          Close
        </button>
        <button onClick={onTakeBack} data-testid="error-takeback">
          Take Back
        </button>
        <button onClick={onRestart} data-testid="error-restart">
          Restart
        </button>
        {onShowBestMove && (
          <button onClick={onShowBestMove} data-testid="error-show-best">
            Show Best: {bestMove}
          </button>
        )}
        <span data-testid="wdl-before">{wdlBefore}</span>
        <span data-testid="wdl-after">{wdlAfter}</span>
      </div>
    ) : null,
}));

vi.mock('@shared/components/ui/MoveSuccessDialog', () => ({
  MoveSuccessDialog: ({ isOpen, onClose, onContinue, promotionPiece, moveDescription }: any) =>
    isOpen ? (
      <div data-testid="move-success-dialog">
        <button onClick={onClose} data-testid="success-close">
          Close
        </button>
        <button onClick={onContinue} data-testid="success-continue">
          Continue
        </button>
        {promotionPiece && <span data-testid="promotion-piece">{promotionPiece}</span>}
        {moveDescription && <span data-testid="move-description">{moveDescription}</span>}
      </div>
    ) : null,
}));

describe('DialogManager', () => {
  const mockHandlers = {
    onErrorTakeBack: vi.fn(),
    onErrorRestart: vi.fn(),
    onErrorContinue: vi.fn(),
    onErrorShowBestMove: vi.fn(),
    onSuccessClose: vi.fn(),
    onSuccessContinue: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Dialog Handling', () => {
    it('renders error dialog when errorDialog.isOpen is true', () => {
      const errorDialog = {
        isOpen: true,
        wdlBefore: 1,
        wdlAfter: -1,
        bestMove: 'Kh1',
      };

      render(<DialogManager errorDialog={errorDialog} successDialog={null} {...mockHandlers} />);

      expect(screen.getByTestId('move-error-dialog')?.isConnected).toBe(true);
      expect(screen.getByTestId('wdl-before').textContent).toBe('1');
      expect(screen.getByTestId('wdl-after').textContent).toBe('-1');
    });

    it('does not render error dialog when errorDialog is null', () => {
      render(<DialogManager errorDialog={null} successDialog={null} {...mockHandlers} />);

      expect(screen.queryByTestId('move-error-dialog')?.isConnected).not.toBe(true);
    });

    it('does not render error dialog when errorDialog.isOpen is false', () => {
      const errorDialog = {
        isOpen: false,
        wdlBefore: 1,
        wdlAfter: -1,
      };

      render(<DialogManager errorDialog={errorDialog} successDialog={null} {...mockHandlers} />);

      expect(screen.queryByTestId('move-error-dialog')?.isConnected).not.toBe(true);
    });

    it('calls onErrorTakeBack when take back button is clicked', async () => {
      const user = userEvent.setup();
      const errorDialog = {
        isOpen: true,
        wdlBefore: 1,
        wdlAfter: -1,
      };

      render(<DialogManager errorDialog={errorDialog} successDialog={null} {...mockHandlers} />);

      await user.click(screen.getByTestId('error-takeback'));
      expect(mockHandlers.onErrorTakeBack).toHaveBeenCalledTimes(1);
    });

    it('calls onErrorRestart when restart button is clicked', async () => {
      const user = userEvent.setup();
      const errorDialog = {
        isOpen: true,
        wdlBefore: 1,
        wdlAfter: -1,
      };

      render(<DialogManager errorDialog={errorDialog} successDialog={null} {...mockHandlers} />);

      await user.click(screen.getByTestId('error-restart'));
      expect(mockHandlers.onErrorRestart).toHaveBeenCalledTimes(1);
    });

    it('calls onErrorContinue when close button is clicked', async () => {
      const user = userEvent.setup();
      const errorDialog = {
        isOpen: true,
        wdlBefore: 1,
        wdlAfter: -1,
      };

      render(<DialogManager errorDialog={errorDialog} successDialog={null} {...mockHandlers} />);

      await user.click(screen.getByTestId('error-close'));
      expect(mockHandlers.onErrorContinue).toHaveBeenCalledTimes(1);
    });

    it('shows and calls show best move handler when bestMove is provided', async () => {
      const user = userEvent.setup();
      const errorDialog = {
        isOpen: true,
        wdlBefore: 1,
        wdlAfter: -1,
        bestMove: 'Qh8+',
      };

      render(<DialogManager errorDialog={errorDialog} successDialog={null} {...mockHandlers} />);

      const showBestButton = screen.getByTestId('error-show-best');
      expect(showBestButton?.isConnected).toBe(true);
      expect(showBestButton.textContent).toBe('Show Best: Qh8+');

      await user.click(showBestButton);
      expect(mockHandlers.onErrorShowBestMove).toHaveBeenCalledTimes(1);
    });

    it('does not show best move button when bestMove is not provided', () => {
      const errorDialog = {
        isOpen: true,
        wdlBefore: 1,
        wdlAfter: -1,
      };

      render(<DialogManager errorDialog={errorDialog} successDialog={null} {...mockHandlers} />);

      expect(screen.queryByTestId('error-show-best')?.isConnected).not.toBe(true);
    });

    it('provides default wdl values when not specified', () => {
      const errorDialog = {
        isOpen: true,
      };

      render(<DialogManager errorDialog={errorDialog} successDialog={null} {...mockHandlers} />);

      expect(screen.getByTestId('wdl-before').textContent).toBe('0');
      expect(screen.getByTestId('wdl-after').textContent).toBe('0');
    });
  });

  describe('Success Dialog Handling', () => {
    it('renders success dialog when successDialog.isOpen is true', () => {
      const successDialog = {
        isOpen: true,
        promotionPiece: 'Q',
        moveDescription: 'Excellent move!',
      };

      render(<DialogManager errorDialog={null} successDialog={successDialog} {...mockHandlers} />);

      expect(screen.getByTestId('move-success-dialog')?.isConnected).toBe(true);
      expect(screen.getByTestId('promotion-piece').textContent).toBe('Q');
      expect(screen.getByTestId('move-description').textContent).toBe('Excellent move!');
    });

    it('does not render success dialog when successDialog is null', () => {
      render(<DialogManager errorDialog={null} successDialog={null} {...mockHandlers} />);

      expect(screen.queryByTestId('move-success-dialog')?.isConnected).not.toBe(true);
    });

    it('does not render success dialog when successDialog.isOpen is false', () => {
      const successDialog = {
        isOpen: false,
        promotionPiece: 'Q',
      };

      render(<DialogManager errorDialog={null} successDialog={successDialog} {...mockHandlers} />);

      expect(screen.queryByTestId('move-success-dialog')?.isConnected).not.toBe(true);
    });

    it('calls onSuccessClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const successDialog = {
        isOpen: true,
        moveDescription: 'Great job!',
      };

      render(<DialogManager errorDialog={null} successDialog={successDialog} {...mockHandlers} />);

      await user.click(screen.getByTestId('success-close'));
      expect(mockHandlers.onSuccessClose).toHaveBeenCalledTimes(1);
    });

    it('calls onSuccessContinue when continue button is clicked', async () => {
      const user = userEvent.setup();
      const successDialog = {
        isOpen: true,
        moveDescription: 'Perfect!',
      };

      render(<DialogManager errorDialog={null} successDialog={successDialog} {...mockHandlers} />);

      await user.click(screen.getByTestId('success-continue'));
      expect(mockHandlers.onSuccessContinue).toHaveBeenCalledTimes(1);
    });

    it('handles success dialog without optional props', () => {
      const successDialog = {
        isOpen: true,
      };

      render(<DialogManager errorDialog={null} successDialog={successDialog} {...mockHandlers} />);

      expect(screen.getByTestId('move-success-dialog')?.isConnected).toBe(true);
      expect(screen.queryByTestId('promotion-piece')?.isConnected).not.toBe(true);
      expect(screen.queryByTestId('move-description')?.isConnected).not.toBe(true);
    });
  });

  describe('Multiple Dialog States', () => {
    it('can render both dialogs simultaneously if both are open', () => {
      const errorDialog = {
        isOpen: true,
        wdlBefore: 1,
        wdlAfter: -1,
      };

      const successDialog = {
        isOpen: true,
        moveDescription: 'Well done!',
      };

      render(
        <DialogManager errorDialog={errorDialog} successDialog={successDialog} {...mockHandlers} />
      );

      expect(screen.getByTestId('move-error-dialog')?.isConnected).toBe(true);
      expect(screen.getByTestId('move-success-dialog')?.isConnected).toBe(true);
    });

    it('renders nothing when both dialogs are closed', () => {
      const errorDialog = {
        isOpen: false,
        wdlBefore: 1,
        wdlAfter: -1,
      };

      const successDialog = {
        isOpen: false,
        moveDescription: 'Test',
      };

      render(
        <DialogManager errorDialog={errorDialog} successDialog={successDialog} {...mockHandlers} />
      );

      expect(screen.queryByTestId('move-error-dialog')?.isConnected).not.toBe(true);
      expect(screen.queryByTestId('move-success-dialog')?.isConnected).not.toBe(true);
    });
  });

  describe('Component Props Validation', () => {
    it('passes all required props to error dialog component', () => {
      const errorDialog = {
        isOpen: true,
        wdlBefore: 2,
        wdlAfter: 0,
        bestMove: 'Rxd7',
      };

      render(<DialogManager errorDialog={errorDialog} successDialog={null} {...mockHandlers} />);

      const dialog = screen.getByTestId('move-error-dialog');
      expect(dialog?.isConnected).toBe(true);

      // Verify all buttons are present
      expect(screen.getByTestId('error-close')?.isConnected).toBe(true);
      expect(screen.getByTestId('error-takeback')?.isConnected).toBe(true);
      expect(screen.getByTestId('error-restart')?.isConnected).toBe(true);
      expect(screen.getByTestId('error-show-best')?.isConnected).toBe(true);
    });

    it('passes all required props to success dialog component', () => {
      const successDialog = {
        isOpen: true,
        promotionPiece: 'R',
        moveDescription: 'Brilliant sacrifice!',
      };

      render(<DialogManager errorDialog={null} successDialog={successDialog} {...mockHandlers} />);

      const dialog = screen.getByTestId('move-success-dialog');
      expect(dialog?.isConnected).toBe(true);

      // Verify all buttons are present
      expect(screen.getByTestId('success-close')?.isConnected).toBe(true);
      expect(screen.getByTestId('success-continue')?.isConnected).toBe(true);
    });
  });

  describe('Component Integration', () => {
    it('handles undefined callback gracefully for optional show best move', () => {
      const errorDialog = {
        isOpen: true,
        wdlBefore: 1,
        wdlAfter: -1,
        bestMove: 'Kg7',
      };

      const handlersWithoutShowBest = {
        ...mockHandlers,
        onErrorShowBestMove: undefined,
      };

      render(
        <DialogManager
          errorDialog={errorDialog}
          successDialog={null}
          {...handlersWithoutShowBest}
        />
      );

      // Should not render show best move button when callback is undefined
      expect(screen.queryByTestId('error-show-best')?.isConnected).not.toBe(true);
    });
  });
});
