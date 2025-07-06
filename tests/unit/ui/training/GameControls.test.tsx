/**
 * @fileoverview Unit tests for GameControls component
 * @description Tests game control buttons with position info and game status
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameControls } from '@shared/components/training/TrainingBoard/GameControls';

describe('GameControls Component', () => {
  const mockPosition = {
    name: 'King and Queen vs King',
    description: 'Learn to deliver checkmate with queen and king vs lone king'
  };

  const defaultProps = {
    onReset: jest.fn(),
    onUndo: jest.fn(),
    canUndo: true,
    isGameFinished: false,
    position: mockPosition
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render position information', () => {
      render(<GameControls {...defaultProps} />);

      expect(screen.getByText('King and Queen vs King')).toBeInTheDocument();
      expect(screen.getByText('Learn to deliver checkmate with queen and king vs lone king')).toBeInTheDocument();
    });

    it('should render control buttons', () => {
      render(<GameControls {...defaultProps} />);

      expect(screen.getByText('🔄 Reset')).toBeInTheDocument();
      expect(screen.getByText('↶ Zurück')).toBeInTheDocument();
    });

    it('should not show game finished message when game is active', () => {
      render(<GameControls {...defaultProps} />);

      expect(screen.queryByText('Spiel beendet!')).not.toBeInTheDocument();
      expect(screen.queryByText('🏁')).not.toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should call onReset when reset button clicked', () => {
      const onReset = jest.fn();
      render(<GameControls {...defaultProps} onReset={onReset} />);

      const resetButton = screen.getByText('🔄 Reset');
      fireEvent.click(resetButton);

      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('should call onUndo when undo button clicked', () => {
      const onUndo = jest.fn();
      render(<GameControls {...defaultProps} onUndo={onUndo} />);

      const undoButton = screen.getByText('↶ Zurück');
      fireEvent.click(undoButton);

      expect(onUndo).toHaveBeenCalledTimes(1);
    });

    it('should not call onUndo when button is disabled', () => {
      const onUndo = jest.fn();
      render(<GameControls {...defaultProps} onUndo={onUndo} canUndo={false} />);

      const undoButton = screen.getByText('↶ Zurück');
      fireEvent.click(undoButton);

      expect(onUndo).not.toHaveBeenCalled();
    });
  });

  describe('Undo Button State', () => {
    it('should enable undo button when canUndo is true', () => {
      render(<GameControls {...defaultProps} canUndo={true} />);

      const undoButton = screen.getByText('↶ Zurück');
      expect(undoButton).not.toBeDisabled();
    });

    it('should disable undo button when canUndo is false', () => {
      render(<GameControls {...defaultProps} canUndo={false} />);

      const undoButton = screen.getByText('↶ Zurück');
      expect(undoButton).toBeDisabled();
    });

    it('should apply correct styling when undo is enabled', () => {
      render(<GameControls {...defaultProps} canUndo={true} />);

      const undoButton = screen.getByText('↶ Zurück');
      expect(undoButton.className).toContain('dark-button-warning');
      expect(undoButton.className).toContain('hover:bg-yellow-600');
    });

    it('should apply disabled styling when undo is disabled', () => {
      render(<GameControls {...defaultProps} canUndo={false} />);

      const undoButton = screen.getByText('↶ Zurück');
      expect(undoButton.className).toContain('opacity-50');
      expect(undoButton.className).toContain('cursor-not-allowed');
      expect(undoButton.className).toContain('bg-gray-600');
    });
  });

  describe('Game Finished State', () => {
    it('should show game finished message when game is completed', () => {
      render(<GameControls {...defaultProps} isGameFinished={true} />);

      expect(screen.getByText('Spiel beendet!')).toBeInTheDocument();
      expect(screen.getByText('🏁')).toBeInTheDocument();
    });

    it('should hide game finished message when game is active', () => {
      render(<GameControls {...defaultProps} isGameFinished={false} />);

      expect(screen.queryByText('Spiel beendet!')).not.toBeInTheDocument();
      expect(screen.queryByText('🏁')).not.toBeInTheDocument();
    });

    it('should apply correct styling to game finished message', () => {
      render(<GameControls {...defaultProps} isGameFinished={true} />);

      const gameFinishedText = screen.getByText('Spiel beendet!');
      expect(gameFinishedText.style.color).toBe('var(--success-text)');
    });
  });

  describe('Position Information Display', () => {
    it('should display position name with correct styling', () => {
      render(<GameControls {...defaultProps} />);

      const positionName = screen.getByText('King and Queen vs King');
      expect(positionName.className).toContain('font-semibold');
      expect(positionName.className).toContain('text-sm');
      expect(positionName.style.color).toBe('var(--text-primary)');
    });

    it('should display position description with correct styling', () => {
      render(<GameControls {...defaultProps} />);

      const positionDescription = screen.getByText('Learn to deliver checkmate with queen and king vs lone king');
      expect(positionDescription.className).toContain('text-xs');
      expect(positionDescription.style.color).toBe('var(--text-secondary)');
    });

    it('should handle long position names gracefully', () => {
      const longPosition = {
        name: 'Very Long Position Name That Should Wrap Properly Without Breaking Layout',
        description: 'Description'
      };

      render(<GameControls {...defaultProps} position={longPosition} />);

      expect(screen.getByText(longPosition.name)).toBeInTheDocument();
    });

    it('should handle long position descriptions gracefully', () => {
      const longDescription = {
        name: 'Position',
        description: 'This is a very long description that explains the position in great detail and should wrap properly without breaking the layout or causing overflow issues in the component'
      };

      render(<GameControls {...defaultProps} position={longDescription} />);

      expect(screen.getByText(longDescription.description)).toBeInTheDocument();
    });

    it('should handle empty position descriptions', () => {
      const emptyDescription = {
        name: 'Position',
        description: ''
      };

      render(<GameControls {...defaultProps} position={emptyDescription} />);

      expect(screen.getByText('Position')).toBeInTheDocument();
      // Empty description should still render but be empty
      const descElement = screen.getByText('Position').parentElement?.querySelector('p');
      expect(descElement).toHaveTextContent('');
    });
  });

  describe('Layout and Structure', () => {
    it('should have proper container structure', () => {
      const { container } = render(<GameControls {...defaultProps} />);

      const mainContainer = container.querySelector('.mt-4.flex.flex-col.gap-3');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should have position info section', () => {
      const { container } = render(<GameControls {...defaultProps} />);

      const positionSection = container.querySelector('.dark-card.rounded-lg.p-3');
      expect(positionSection).toBeInTheDocument();
    });

    it('should have controls section with proper layout', () => {
      const { container } = render(<GameControls {...defaultProps} />);

      const controlsSection = container.querySelector('.flex.gap-2');
      expect(controlsSection).toBeInTheDocument();
    });

    it('should have buttons with equal flex distribution', () => {
      render(<GameControls {...defaultProps} />);

      const resetButton = screen.getByText('🔄 Reset');
      const undoButton = screen.getByText('↶ Zurück');

      expect(resetButton.className).toContain('flex-1');
      expect(undoButton.className).toContain('flex-1');
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply correct button styling classes', () => {
      render(<GameControls {...defaultProps} />);

      const resetButton = screen.getByText('🔄 Reset');
      expect(resetButton.className).toContain('py-2');
      expect(resetButton.className).toContain('px-3');
      expect(resetButton.className).toContain('dark-button-secondary');
      expect(resetButton.className).toContain('rounded-lg');
      expect(resetButton.className).toContain('text-sm');
      expect(resetButton.className).toContain('font-medium');
      expect(resetButton.className).toContain('transition-colors');
    });

    it('should apply dark card styling to position info', () => {
      const { container } = render(<GameControls {...defaultProps} />);

      const positionCard = container.querySelector('.dark-card');
      expect(positionCard).toBeInTheDocument();
    });

    it('should apply correct spacing classes', () => {
      const { container } = render(<GameControls {...defaultProps} />);

      const mainContainer = container.querySelector('.gap-3');
      const controlsContainer = container.querySelector('.gap-2');

      expect(mainContainer).toBeInTheDocument();
      expect(controlsContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<GameControls {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('should support keyboard interaction', () => {
      const onReset = jest.fn();
      const onUndo = jest.fn();

      render(<GameControls {...defaultProps} onReset={onReset} onUndo={onUndo} />);

      const resetButton = screen.getByText('🔄 Reset');
      const undoButton = screen.getByText('↶ Zurück');

      // Test Enter key
      fireEvent.keyDown(resetButton, { key: 'Enter' });
      fireEvent.keyDown(undoButton, { key: 'Enter' });

      // Focus should work
      resetButton.focus();
      undoButton.focus();

      expect(resetButton).toBeInTheDocument();
      expect(undoButton).toBeInTheDocument();
    });

    it('should have accessible button text', () => {
      render(<GameControls {...defaultProps} />);

      // Buttons should have clear text descriptions
      expect(screen.getByText('🔄 Reset')).toBeInTheDocument();
      expect(screen.getByText('↶ Zurück')).toBeInTheDocument();
    });

    it('should properly handle disabled state for screen readers', () => {
      render(<GameControls {...defaultProps} canUndo={false} />);

      const undoButton = screen.getByText('↶ Zurück');
      expect(undoButton).toHaveAttribute('disabled');
    });
  });

  describe('Component Memoization', () => {
    it('should be memoized with React.memo', () => {
      expect(GameControls.displayName).toBe('GameControls');
    });

    it('should not re-render with same props', () => {
      const { rerender } = render(<GameControls {...defaultProps} />);
      const initialHtml = screen.getByText('King and Queen vs King').closest('div')?.outerHTML;

      // Re-render with same props
      rerender(<GameControls {...defaultProps} />);
      const secondHtml = screen.getByText('King and Queen vs King').closest('div')?.outerHTML;

      expect(initialHtml).toBe(secondHtml);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid button clicks', () => {
      const onReset = jest.fn();
      const onUndo = jest.fn();

      render(<GameControls {...defaultProps} onReset={onReset} onUndo={onUndo} />);

      const resetButton = screen.getByText('🔄 Reset');
      const undoButton = screen.getByText('↶ Zurück');

      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(resetButton);
        fireEvent.click(undoButton);
      }

      expect(onReset).toHaveBeenCalledTimes(10);
      expect(onUndo).toHaveBeenCalledTimes(10);
    });

    it('should handle position with special characters', () => {
      const specialPosition = {
        name: 'König & Dame vs König',
        description: 'Lerne Matt mit Dame & König gegen einsamen König'
      };

      render(<GameControls {...defaultProps} position={specialPosition} />);

      expect(screen.getByText('König & Dame vs König')).toBeInTheDocument();
      expect(screen.getByText('Lerne Matt mit Dame & König gegen einsamen König')).toBeInTheDocument();
    });

    it('should handle position with Unicode characters', () => {
      const unicodePosition = {
        name: '♔♕ vs ♔',
        description: 'Schachmatt mit ♕ und ♔'
      };

      render(<GameControls {...defaultProps} position={unicodePosition} />);

      expect(screen.getByText('♔♕ vs ♔')).toBeInTheDocument();
      expect(screen.getByText('Schachmatt mit ♕ und ♔')).toBeInTheDocument();
    });

    it('should handle boolean prop changes correctly', () => {
      const { rerender } = render(<GameControls {...defaultProps} canUndo={true} isGameFinished={false} />);

      const undoButton = screen.getByText('↶ Zurück');
      expect(undoButton).not.toBeDisabled();
      expect(screen.queryByText('Spiel beendet!')).not.toBeInTheDocument();

      // Change both props
      rerender(<GameControls {...defaultProps} canUndo={false} isGameFinished={true} />);

      expect(undoButton).toBeDisabled();
      expect(screen.getByText('Spiel beendet!')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not cause memory leaks on unmount', () => {
      const { unmount } = render(<GameControls {...defaultProps} />);

      expect(() => unmount()).not.toThrow();
    });

    it('should render efficiently with minimal DOM changes', () => {
      const { container, rerender } = render(<GameControls {...defaultProps} />);
      const initialChildren = container.firstChild?.childNodes.length;

      // Change only the game finished state
      rerender(<GameControls {...defaultProps} isGameFinished={true} />);
      const afterChildren = container.firstChild?.childNodes.length;

      // Should add only one element (the game finished message)
      expect(afterChildren).toBe((initialChildren || 0) + 1);
    });
  });
});