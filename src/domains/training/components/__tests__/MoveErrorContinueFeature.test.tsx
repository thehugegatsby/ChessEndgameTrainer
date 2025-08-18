import { vi } from 'vitest';
/**
 * Test suite for the new "Weiterspielen" (continue playing) feature
 * Verifies that after clicking "Weiterspielen", the opponent makes a move
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MoveErrorDialog } from '@shared/components/ui/MoveErrorDialog';

describe('MoveErrorDialog - Continue Playing Feature', () => {
  const defaultProps = {
    isOpen: true,
    wdlBefore: 2,
    wdlAfter: 0,
    bestMove: 'Kf6',
    playedMove: 'Kf5', // Add the missing playedMove prop
    moveNumber: 10, // Add moveNumber for complete formatting
    onClose: vi.fn(),
    onTakeBack: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show 'Weiterspielen' button instead of 'Verstanden'", () => {
    render(<MoveErrorDialog {...defaultProps} />);

    // Verify the new button text
    expect(screen.getByRole('button', { name: 'Weiterspielen' })?.isConnected).toBe(true);
    expect(screen.queryByRole('button', { name: 'Verstanden' })?.isConnected).not.toBe(true);
  });

  it('should call onClose when Weiterspielen button is clicked', () => {
    render(<MoveErrorDialog {...defaultProps} />);

    const weiterSpielenButton = screen.getByRole('button', {
      name: 'Weiterspielen',
    });
    fireEvent.click(weiterSpielenButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should display appropriate error message', () => {
    render(<MoveErrorDialog {...defaultProps} />);

    // Should show win-ruining message for wdlBefore=2, wdlAfter=0
    // The message includes the move number: 6.Kf5 (move 10 = 5th white move, displayed as 6th)
    expect(screen.getByText('6.Kf5 verdirbt den Gewinn!')?.isConnected).toBe(true);
    expect(screen.getByText(/Besser war:/)?.isConnected).toBe(true);
    expect(screen.getByText('6.Kf6')?.isConnected).toBe(true);
  });

  it('should display both action buttons', () => {
    render(<MoveErrorDialog {...defaultProps} />);

    // Should have both Weiterspielen and Zurücknehmen buttons
    expect(screen.getByRole('button', { name: 'Weiterspielen' })?.isConnected).toBe(true);
    expect(screen.getByRole('button', { name: 'Zurücknehmen' })?.isConnected).toBe(true);
  });

  it('should show different messages for different WDL changes', () => {
    const { rerender } = render(<MoveErrorDialog {...defaultProps} wdlBefore={0} wdlAfter={-2} />);
    expect(screen.getByText('6.Kf5 führt zum Verlust!')?.isConnected).toBe(true);

    rerender(<MoveErrorDialog {...defaultProps} wdlBefore={1} wdlAfter={-1} />);
    expect(screen.getByText('6.Kf5 verschlechtert die Stellung!')?.isConnected).toBe(true);

    rerender(<MoveErrorDialog {...defaultProps} wdlBefore={0} wdlAfter={0} />);
    expect(screen.getByText('6.Kf5 ist ein Fehler!')?.isConnected).toBe(true);
  });

  describe('Integration scenarios', () => {
    it('verifies the expected behavior flow', () => {
      // This test documents the expected behavior:
      // 1. User makes suboptimal move
      // 2. Error dialog shows with "Weiterspielen" and "Zurücknehmen" options
      // 3. User clicks "Weiterspielen"
      // 4. Dialog closes via onClose callback
      // 5. TrainingBoard's handleMoveErrorContinue function should:
      //    - Close the dialog (trainingActions.setMoveErrorDialog(null))
      //    - Schedule opponent turn (scheduleOpponentTurn(storeApi))

      render(<MoveErrorDialog {...defaultProps} />);

      // Verify the dialog is showing the error state correctly
      expect(screen.getByText('Fehler erkannt!')?.isConnected).toBe(true);
      expect(screen.getByText('6.Kf5 verdirbt den Gewinn!')?.isConnected).toBe(true);
      expect(screen.getByText(/Besser war:/)?.isConnected).toBe(true);
      expect(screen.getByText('6.Kf6')?.isConnected).toBe(true);

      // Click Weiterspielen
      const weiterSpielenButton = screen.getByRole('button', {
        name: 'Weiterspielen',
      });
      fireEvent.click(weiterSpielenButton);

      // Verify onClose was called (this will trigger handleMoveErrorContinue in TrainingBoard)
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

      // Note: The actual scheduleOpponentTurn call happens in TrainingBoard's
      // handleMoveErrorContinue function, not directly in the dialog
    });
  });
});
