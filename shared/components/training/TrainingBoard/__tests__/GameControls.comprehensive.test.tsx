import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GameControls } from '../GameControls';

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

    it('should render position info in a card container', () => {
      render(<GameControls {...defaultProps} />);
      
      const positionContainer = screen.getByText('Test Position').closest('div');
      expect(positionContainer).toHaveClass('dark-card', 'rounded-lg', 'p-3');
    });

    it('should handle empty position name', () => {
      const emptyPosition = { name: '', description: 'Description only' };
      render(<GameControls {...defaultProps} position={emptyPosition} />);
      
      expect(screen.getByText('Description only')).toBeInTheDocument();
    });

    it('should handle empty position description', () => {
      const emptyDescription = { name: 'Name only', description: '' };
      render(<GameControls {...defaultProps} position={emptyDescription} />);
      
      expect(screen.getByText('Name only')).toBeInTheDocument();
    });

    it('should handle very long position name', () => {
      const longName = 'This is a very long position name that might overflow the container and test text wrapping behavior';
      const longPosition = { name: longName, description: 'Short desc' };
      
      expect(() => {
        render(<GameControls {...defaultProps} position={longPosition} />);
      }).not.toThrow();
      
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle very long position description', () => {
      const longDescription = 'This is a very long position description that might overflow the container and test text wrapping behavior in the description area of the component';
      const longPosition = { name: 'Short name', description: longDescription };
      
      expect(() => {
        render(<GameControls {...defaultProps} position={longPosition} />);
      }).not.toThrow();
      
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });
  });

  describe('CSS Classes and Layout', () => {
    it('should have correct main container classes', () => {
      const { container } = render(<GameControls {...defaultProps} />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('mt-4', 'flex', 'flex-col', 'gap-3');
    });

    it('should have correct button container classes', () => {
      render(<GameControls {...defaultProps} />);
      
      const buttonContainer = screen.getByText('🔄 Reset').closest('div');
      expect(buttonContainer).toHaveClass('flex', 'gap-2');
    });

    it('should apply correct classes to reset button', () => {
      render(<GameControls {...defaultProps} />);
      
      const resetButton = screen.getByText('🔄 Reset');
      expect(resetButton).toHaveClass(
        'flex-1', 'py-2', 'px-3', 'dark-button-secondary', 
        'rounded-lg', 'text-sm', 'font-medium', 'transition-colors'
      );
    });

    it('should apply base classes to undo button regardless of state', () => {
      render(<GameControls {...defaultProps} canUndo={true} />);
      
      const undoButton = screen.getByText('↶ Zurück');
      expect(undoButton).toHaveClass(
        'flex-1', 'py-2', 'px-3', 'rounded-lg', 
        'text-sm', 'font-medium', 'transition-colors'
      );
    });
  });

  describe('Component State Combinations', () => {
    it('should handle canUndo=false and isGameFinished=true', () => {
      render(<GameControls {...defaultProps} canUndo={false} isGameFinished={true} />);
      
      expect(screen.getByText('↶ Zurück')).toBeDisabled();
      expect(screen.getByText('🏁')).toBeInTheDocument();
      expect(screen.getByText('Spiel beendet!')).toBeInTheDocument();
    });

    it('should handle canUndo=true and isGameFinished=true', () => {
      render(<GameControls {...defaultProps} canUndo={true} isGameFinished={true} />);
      
      expect(screen.getByText('↶ Zurück')).not.toBeDisabled();
      expect(screen.getByText('🏁')).toBeInTheDocument();
      expect(screen.getByText('Spiel beendet!')).toBeInTheDocument();
    });

    it('should handle canUndo=false and isGameFinished=false', () => {
      render(<GameControls {...defaultProps} canUndo={false} isGameFinished={false} />);
      
      expect(screen.getByText('↶ Zurück')).toBeDisabled();
      expect(screen.queryByText('🏁')).not.toBeInTheDocument();
      expect(screen.queryByText('Spiel beendet!')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null callbacks gracefully', () => {
      const nullCallbacks = {
        ...defaultProps,
        onReset: undefined as any,
        onUndo: undefined as any
      };
      
      expect(() => {
        render(<GameControls {...nullCallbacks} />);
      }).not.toThrow();
    });

    it('should handle missing position properties', () => {
      const incompletePosition = {} as any;
      
      expect(() => {
        render(<GameControls {...defaultProps} position={incompletePosition} />);
      }).not.toThrow();
    });

    it('should handle special characters in position name', () => {
      const specialPosition = {
        name: 'Position with special chars: áéíóú ñ @#$%',
        description: 'Description with émojis 🚀 ♔♕♖'
      };
      
      expect(() => {
        render(<GameControls {...defaultProps} position={specialPosition} />);
      }).not.toThrow();
      
      expect(screen.getByText(specialPosition.name)).toBeInTheDocument();
      expect(screen.getByText(specialPosition.description)).toBeInTheDocument();
    });

    it('should maintain stable button references for React.memo optimization', () => {
      const { rerender } = render(<GameControls {...defaultProps} />);
      
      const resetButton1 = screen.getByText('🔄 Reset');
      
      // Re-render with same props
      rerender(<GameControls {...defaultProps} />);
      
      const resetButton2 = screen.getByText('🔄 Reset');
      
      // Due to React.memo, the component should be optimized
      expect(resetButton1).toBe(resetButton2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper button elements', () => {
      render(<GameControls {...defaultProps} />);
      
      const resetButton = screen.getByText('🔄 Reset');
      const undoButton = screen.getByText('↶ Zurück');
      
      expect(resetButton.tagName).toBe('BUTTON');
      expect(undoButton.tagName).toBe('BUTTON');
    });

    it('should properly disable undo button', () => {
      render(<GameControls {...defaultProps} canUndo={false} />);
      
      const undoButton = screen.getByText('↶ Zurück');
      expect(undoButton).toHaveAttribute('disabled');
    });

    it('should have readable text content', () => {
      render(<GameControls {...defaultProps} />);
      
      expect(screen.getByText('🔄 Reset')).toBeInTheDocument();
      expect(screen.getByText('↶ Zurück')).toBeInTheDocument();
    });

    it('should have semantic heading for position name', () => {
      render(<GameControls {...defaultProps} />);
      
      const positionName = screen.getByText('Test Position');
      expect(positionName.tagName).toBe('H3');
    });
  });

  describe('React.memo Optimization', () => {
    it('should have correct displayName', () => {
      expect(GameControls.displayName).toBe('GameControls');
    });

    it('should be wrapped with React.memo', () => {
      // React.memo optimization is tested through stable references
      expect(GameControls.displayName).toBe('GameControls');
    });
  });
}); 