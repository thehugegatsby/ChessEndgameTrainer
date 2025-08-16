import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
// Vitest matchers are available through the setup file
import { MoveErrorDialog } from '@shared/components/ui/MoveErrorDialog';

describe('MoveErrorDialog', () => {
  const defaultProps = {
    isOpen: true,
    wdlBefore: 2,
    wdlAfter: -1,
    bestMove: 'Kb1',
    playedMove: 'Ka2',
    moveNumber: 0,
    onClose: vi.fn(),
    onTakeBack: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders dialog when open', () => {
      render(<MoveErrorDialog {...defaultProps} />);

      // Check for German error message header
      expect(screen.getByText('Fehler erkannt!')?.isConnected).toBe(true);
    });

    it('does not render when closed', () => {
      render(<MoveErrorDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Fehler erkannt!')?.isConnected).not.toBe(true);
    });

    it('displays the best move', () => {
      render(<MoveErrorDialog {...defaultProps} />);

      // Best move is shown with move number (1.Kb1)
      expect(screen.getByText(/1\.Kb1/)?.isConnected).toBe(true);
      expect(screen.getByText(/Besser war:/)?.isConnected).toBe(true);
    });

    it('shows correct message for win to loss', () => {
      render(<MoveErrorDialog {...defaultProps} wdlBefore={2} wdlAfter={0} />);

      // Should show that the move ruins the win (with move number)
      expect(screen.getByText('1.Ka2 verdirbt den Gewinn!')?.isConnected).toBe(true);
    });

    it('shows correct message for draw to loss', () => {
      render(<MoveErrorDialog {...defaultProps} wdlBefore={0} wdlAfter={-2} />);

      // Should show that the move leads to loss (with move number)
      expect(screen.getByText('1.Ka2 führt zum Verlust!')?.isConnected).toBe(true);
    });

    it('shows correct message for position deterioration', () => {
      render(<MoveErrorDialog {...defaultProps} wdlBefore={2} wdlAfter={0} />);

      // Should show that the position worsens (with move number)
      expect(screen.getByText('1.Ka2 verdirbt den Gewinn!')?.isConnected).toBe(true);
    });

    it('shows default error message', () => {
      render(<MoveErrorDialog {...defaultProps} wdlBefore={-2} wdlAfter={-2} />);

      // Should show default error message (with move number)
      expect(screen.getByText('1.Ka2 ist ein Fehler!')?.isConnected).toBe(true);
    });

    it('hides best move when not provided', () => {
      render(<MoveErrorDialog {...defaultProps} bestMove={undefined} />);

      expect(screen.queryByText('Bester Zug war:')?.isConnected).not.toBe(true);
    });
  });

  describe('Interactions', () => {
    it('calls onTakeBack when take back button is clicked', () => {
      render(<MoveErrorDialog {...defaultProps} />);

      const takeBackButton = screen.getByRole('button', {
        name: 'Zurücknehmen',
      });
      fireEvent.click(takeBackButton);

      expect(defaultProps.onTakeBack).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when continue playing button is clicked', () => {
      render(<MoveErrorDialog {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: 'Weiterspielen' });
      fireEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      expect(defaultProps.onTakeBack).not.toHaveBeenCalled();
    });

    it('calls onClose when clicking outside the dialog', () => {
      render(<MoveErrorDialog {...defaultProps} />);

      // Click on the backdrop/overlay - it's the outermost div
      const backdrop = screen.getByText('Fehler erkannt!').closest('.fixed');
      fireEvent.click(backdrop!);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking inside the dialog content', () => {
      render(<MoveErrorDialog {...defaultProps} />);

      // Click on the inner dialog content
      const dialogTitle = screen.getByText('Fehler erkannt!');
      fireEvent.click(dialogTitle);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('prevents event propagation when clicking dialog content', () => {
      const mockOnClick = vi.fn();

      render(
        <div onClick={mockOnClick}>
          <MoveErrorDialog {...defaultProps} />
        </div>
      );

      // Click on dialog content should not propagate to parent
      const dialogTitle = screen.getByText('Fehler erkannt!');
      fireEvent.click(dialogTitle);

      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<MoveErrorDialog {...defaultProps} />);

      const heading = screen.getByRole('heading', { name: 'Fehler erkannt!' });
      expect(heading?.isConnected).toBe(true);
    });

    it('has interactive buttons', () => {
      render(<MoveErrorDialog {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);

      const weiterspielen = screen.getByRole('button', {
        name: 'Weiterspielen',
      });
      const zurücknehmen = screen.getByRole('button', { name: 'Zurücknehmen' });

      expect(weiterspielen?.isConnected).toBe(true);
      expect(zurücknehmen?.isConnected).toBe(true);
    });

    it('renders semantic structure', () => {
      render(<MoveErrorDialog {...defaultProps} />);

      // Check for proper text structure
      expect(screen.getByText('Fehler erkannt!')?.isConnected).toBe(true);
      expect(screen.getByText(/1\.Ka2/)?.isConnected).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing bestMove gracefully', () => {
      render(<MoveErrorDialog {...defaultProps} bestMove={undefined} />);

      expect(screen.getByText('Fehler erkannt!')?.isConnected).toBe(true);
      expect(screen.queryByText('Bester Zug war:')?.isConnected).not.toBe(true);
    });

    it('handles equal WDL values', () => {
      render(<MoveErrorDialog {...defaultProps} wdlBefore={0} wdlAfter={0} />);

      // Should show default error message (with move number)
      expect(screen.getByText('1.Ka2 ist ein Fehler!')?.isConnected).toBe(true);
    });

    it('shows correct message for position worsening', () => {
      render(<MoveErrorDialog {...defaultProps} wdlBefore={1} wdlAfter={-1} />);

      // Should show that position worsens (wdlBefore > wdlAfter, with move number)
      expect(screen.getByText('1.Ka2 verschlechtert die Stellung!')?.isConnected).toBe(true);
    });
  });

  describe('Visual Elements', () => {
    it('displays warning icon', () => {
      render(<MoveErrorDialog {...defaultProps} />);

      // Check for SVG warning icon by looking for the path element
      const svgElements = document.querySelectorAll('svg');
      expect(svgElements.length).toBe(1);

      // Check the warning triangle path is present
      const pathElement = document.querySelector('path[d*="M12 9v2m0 4h.01"]');
      expect(pathElement?.isConnected).toBe(true);
    });

    it('has proper styling classes', () => {
      render(<MoveErrorDialog {...defaultProps} />);

      const backdrop = screen.getByText('Fehler erkannt!').closest('.fixed');
      expect(backdrop.classList.contains('fixed', 'inset-0', 'bg-black', 'bg-opacity-80')).toBe(
        true
      );
    });
  });
});
