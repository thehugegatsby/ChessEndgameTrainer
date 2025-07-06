import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GameControls } from '../../../../shared/components/training/TrainingBoard/GameControls';

describe('GameControls - Comprehensive Coverage', () => {
  const mockPosition = {
    name: 'Test Position',
    description: 'A test chess endgame position'
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

  describe('Basic Rendering', () => {
    it('should render position information', () => {
      render(<GameControls {...defaultProps} />);
      
      expect(screen.getByText('Test Position')).toBeInTheDocument();
      expect(screen.getByText('A test chess endgame position')).toBeInTheDocument();
    });

    it('should render control buttons', () => {
      render(<GameControls {...defaultProps} />);
      
      expect(screen.getByText('🔄 Reset')).toBeInTheDocument();
      expect(screen.getByText('↶ Zurück')).toBeInTheDocument();
    });

    it('should render without game finished status by default', () => {
      render(<GameControls {...defaultProps} />);
      
      expect(screen.queryByText('🏁')).not.toBeInTheDocument();
      expect(screen.queryByText('Spiel beendet!')).not.toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should call onReset when reset button is clicked', () => {
      render(<GameControls {...defaultProps} />);
      
      fireEvent.click(screen.getByText('🔄 Reset'));
      expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
    });

    it('should call onUndo when undo button is clicked and canUndo is true', () => {
      render(<GameControls {...defaultProps} canUndo={true} />);
      
      fireEvent.click(screen.getByText('↶ Zurück'));
      expect(defaultProps.onUndo).toHaveBeenCalledTimes(1);
    });

    it('should not call onUndo when undo button is clicked and canUndo is false', () => {
      render(<GameControls {...defaultProps} canUndo={false} />);
      
      fireEvent.click(screen.getByText('↶ Zurück'));
      expect(defaultProps.onUndo).not.toHaveBeenCalled();
    });

    it('should handle multiple reset clicks', () => {
      render(<GameControls {...defaultProps} />);
      
      const resetButton = screen.getByText('🔄 Reset');
      fireEvent.click(resetButton);
      fireEvent.click(resetButton);
      fireEvent.click(resetButton);
      
      expect(defaultProps.onReset).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple undo clicks when canUndo is true', () => {
      render(<GameControls {...defaultProps} canUndo={true} />);
      
      const undoButton = screen.getByText('↶ Zurück');
      fireEvent.click(undoButton);
      fireEvent.click(undoButton);
      
      expect(defaultProps.onUndo).toHaveBeenCalledTimes(2);
    });
  });

  describe('Undo Button States', () => {
    it('should enable undo button when canUndo is true', () => {
      render(<GameControls {...defaultProps} canUndo={true} />);
      
      const undoButton = screen.getByText('↶ Zurück');
      expect(undoButton).not.toBeDisabled();
      expect(undoButton).not.toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('should disable undo button when canUndo is false', () => {
      render(<GameControls {...defaultProps} canUndo={false} />);
      
      const undoButton = screen.getByText('↶ Zurück');
      expect(undoButton).toBeDisabled();
      expect(undoButton).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('should apply correct CSS classes for enabled undo button', () => {
      render(<GameControls {...defaultProps} canUndo={true} />);
      
      const undoButton = screen.getByText('↶ Zurück');
      expect(undoButton).toHaveClass('dark-button-warning', 'hover:bg-yellow-600');
      expect(undoButton).not.toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('should apply correct CSS classes for disabled undo button', () => {
      render(<GameControls {...defaultProps} canUndo={false} />);
      
      const undoButton = screen.getByText('↶ Zurück');
      expect(undoButton).toHaveClass('opacity-50', 'cursor-not-allowed', 'bg-gray-600');
      expect(undoButton).not.toHaveClass('dark-button-warning', 'hover:bg-yellow-600');
    });
  });

  describe('Game Finished State', () => {
    it('should display game finished status when isGameFinished is true', () => {
      render(<GameControls {...defaultProps} isGameFinished={true} />);
      
      expect(screen.getByText('🏁')).toBeInTheDocument();
      expect(screen.getByText('Spiel beendet!')).toBeInTheDocument();
    });

    it('should not display game finished status when isGameFinished is false', () => {
      render(<GameControls {...defaultProps} isGameFinished={false} />);
      
      expect(screen.queryByText('🏁')).not.toBeInTheDocument();
      expect(screen.queryByText('Spiel beendet!')).not.toBeInTheDocument();
    });

    it('should have correct styling for game finished status', () => {
      render(<GameControls {...defaultProps} isGameFinished={true} />);
      
      const finishedContainer = screen.getByText('🏁').closest('div');
      expect(finishedContainer).toHaveClass('dark-card', 'rounded-lg', 'p-3', 'text-center');
    });
  });

  describe('Position Information Display', () => {
    it('should display position name with correct styling', () => {
      render(<GameControls {...defaultProps} />);
      
      const positionName = screen.getByText('Test Position');
      expect(positionName).toHaveClass('font-semibold', 'text-sm', 'mb-1');
    });

    it('should display position description with correct styling', () => {
      render(<GameControls {...defaultProps} />);
      
      const positionDescription = screen.getByText('A test chess endgame position');
      expect(positionDescription).toHaveClass('text-xs');
    });

    it('should handle missing position name', () => {
      const propsWithoutName = {
        ...defaultProps,
        position: { ...mockPosition, name: undefined }
      };
      
      render(<GameControls {...propsWithoutName} />);
      expect(screen.queryByText('Test Position')).not.toBeInTheDocument();
    });

    it('should handle missing position description', () => {
      const propsWithoutDescription = {
        ...defaultProps,
        position: { ...mockPosition, description: undefined }
      };
      
      render(<GameControls {...propsWithoutDescription} />);
      expect(screen.queryByText('A test chess endgame position')).not.toBeInTheDocument();
    });

    it('should handle empty position name', () => {
      const propsWithEmptyName = {
        ...defaultProps,
        position: { ...mockPosition, name: '' }
      };
      
      const { container } = render(<GameControls {...propsWithEmptyName} />);
      const nameElement = container.querySelector('h3');
      expect(nameElement).toHaveTextContent('');
    });

    it('should handle very long position name', () => {
      const longName = 'This is a very long position name that should still display properly without breaking the layout or causing issues';
      const propsWithLongName = {
        ...defaultProps,
        position: { ...mockPosition, name: longName }
      };
      
      render(<GameControls {...propsWithLongName} />);
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle position with special characters', () => {
      const specialName = 'Position ♔♕♖♗♘♙ with émojis & spëcial chars';
      const propsWithSpecialChars = {
        ...defaultProps,
        position: { ...mockPosition, name: specialName }
      };
      
      render(<GameControls {...propsWithSpecialChars} />);
      expect(screen.getByText(specialName)).toBeInTheDocument();
    });
  });

  describe('Layout and Container', () => {
    it('should have correct container styling', () => {
      const { container } = render(<GameControls {...defaultProps} />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('mt-4', 'flex', 'flex-col', 'gap-3');
    });

    it('should have correct button container styling', () => {
      const { container } = render(<GameControls {...defaultProps} />);
      
      const buttonContainer = container.querySelector('.flex.gap-2');
      expect(buttonContainer).toBeInTheDocument();
      expect(buttonContainer).toHaveClass('flex', 'gap-2');
    });

    it('should maintain layout consistency across different states', () => {
      const { rerender, container } = render(<GameControls {...defaultProps} />);
      
      const initialLayout = container.innerHTML;
      
      rerender(<GameControls {...defaultProps} canUndo={false} isGameFinished={true} />);
      
      // Container structure should remain consistent
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('mt-4', 'flex', 'flex-col', 'gap-3');
    });
  });

  describe('Button Styling', () => {
    it('should apply correct styling to reset button', () => {
      render(<GameControls {...defaultProps} />);
      
      const resetButton = screen.getByText('🔄 Reset');
      expect(resetButton).toHaveClass('flex-1', 'py-2', 'px-3', 'dark-button-secondary', 'rounded-lg', 'text-sm', 'font-medium', 'transition-colors');
    });

    it('should apply correct base styling to undo button', () => {
      render(<GameControls {...defaultProps} />);
      
      const undoButton = screen.getByText('↶ Zurück');
      expect(undoButton).toHaveClass('flex-1', 'py-2', 'px-3', 'rounded-lg', 'text-sm', 'font-medium', 'transition-colors');
    });

    it('should maintain button styling consistency', () => {
      render(<GameControls {...defaultProps} />);
      
      const resetButton = screen.getByText('🔄 Reset');
      const undoButton = screen.getByText('↶ Zurück');
      
      // Both should have common button styling
      const commonClasses = ['flex-1', 'py-2', 'px-3', 'rounded-lg', 'text-sm', 'font-medium', 'transition-colors'];
      commonClasses.forEach(className => {
        expect(resetButton).toHaveClass(className);
        expect(undoButton).toHaveClass(className);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<GameControls {...defaultProps} />);
      
      const resetButton = screen.getByText('🔄 Reset');
      const undoButton = screen.getByText('↶ Zurück');
      
      expect(resetButton.tagName).toBe('BUTTON');
      expect(undoButton.tagName).toBe('BUTTON');
    });

    it('should indicate disabled state for screen readers', () => {
      render(<GameControls {...defaultProps} canUndo={false} />);
      
      const undoButton = screen.getByText('↶ Zurück');
      expect(undoButton).toBeDisabled();
      expect(undoButton).toHaveAttribute('disabled');
    });

    it('should maintain proper focus order', () => {
      render(<GameControls {...defaultProps} />);
      
      const resetButton = screen.getByText('🔄 Reset');
      const undoButton = screen.getByText('↶ Zurück');
      
      // Both buttons should be focusable
      expect(resetButton).not.toHaveAttribute('tabindex', '-1');
      expect(undoButton).not.toHaveAttribute('tabindex', '-1');
    });

    it('should prevent focus on disabled undo button', () => {
      render(<GameControls {...defaultProps} canUndo={false} />);
      
      const undoButton = screen.getByText('↶ Zurück');
      expect(undoButton).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle position with empty strings', () => {
      const propsWithEmptyPosition = {
        ...defaultProps,
        position: { name: '', description: '' }
      };
      
      render(<GameControls {...propsWithEmptyPosition} />);
      
      // Should still render buttons
      expect(screen.getByText('🔄 Reset')).toBeInTheDocument();
      expect(screen.getByText('↶ Zurück')).toBeInTheDocument();
    });

    it('should handle rapid button clicks', () => {
      render(<GameControls {...defaultProps} />);
      
      const resetButton = screen.getByText('🔄 Reset');
      
      // Simulate rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(resetButton);
      }
      
      expect(defaultProps.onReset).toHaveBeenCalledTimes(10);
    });

    it('should handle button clicks during state transitions', () => {
      const { rerender } = render(<GameControls {...defaultProps} canUndo={true} />);
      
      const undoButton = screen.getByText('↶ Zurück');
      fireEvent.click(undoButton);
      
      // Change state
      rerender(<GameControls {...defaultProps} canUndo={false} />);
      
      // Button should now be disabled
      expect(undoButton).toBeDisabled();
      
      // Clicking disabled button should not call handler
      fireEvent.click(undoButton);
      expect(defaultProps.onUndo).toHaveBeenCalledTimes(1); // Only the first click
    });
  });
});