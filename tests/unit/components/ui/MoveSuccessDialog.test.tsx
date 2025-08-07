import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MoveSuccessDialog } from '@shared/components/ui/MoveSuccessDialog';

describe('MoveSuccessDialog', () => {
  const defaultProps = {
    isOpen: true,
    promotionPiece: 'Dame',
    moveDescription: 'e8=Q+',
    onClose: jest.fn(),
    onContinue: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders dialog when open', () => {
      render(<MoveSuccessDialog {...defaultProps} />);
      
      // Check for German success message header
      expect(screen.getByText('Erfolg!')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<MoveSuccessDialog {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Erfolg!')).not.toBeInTheDocument();
    });

    it('displays the move description', () => {
      render(<MoveSuccessDialog {...defaultProps} />);
      
      expect(screen.getByText(defaultProps.moveDescription)).toBeInTheDocument();
      expect(screen.getByText('Gewinnzug:')).toBeInTheDocument();
    });

    it('hides move description when not provided', () => {
      render(<MoveSuccessDialog {...defaultProps} moveDescription={undefined} />);
      
      expect(screen.queryByText('Gewinnzug:')).not.toBeInTheDocument();
    });

    it('shows correct message for Dame promotion', () => {
      render(<MoveSuccessDialog {...defaultProps} promotionPiece="Dame" />);
      
      expect(screen.getByText('Ausgezeichnet! Umwandlung in Dame führt zum Sieg!')).toBeInTheDocument();
    });

    it('shows correct message for Queen promotion (English)', () => {
      render(<MoveSuccessDialog {...defaultProps} promotionPiece="Queen" />);
      
      expect(screen.getByText('Ausgezeichnet! Umwandlung in Queen führt zum Sieg!')).toBeInTheDocument();
    });

    it('shows correct message for Turm promotion', () => {
      render(<MoveSuccessDialog {...defaultProps} promotionPiece="Turm" />);
      
      expect(screen.getByText('Großartig! Umwandlung in Turm führt zum Sieg!')).toBeInTheDocument();
    });

    it('shows correct message for Rook promotion (English)', () => {
      render(<MoveSuccessDialog {...defaultProps} promotionPiece="Rook" />);
      
      expect(screen.getByText('Großartig! Umwandlung in Rook führt zum Sieg!')).toBeInTheDocument();
    });

    it('shows correct message for Läufer promotion', () => {
      render(<MoveSuccessDialog {...defaultProps} promotionPiece="Läufer" />);
      
      expect(screen.getByText('Klug! Umwandlung in Läufer führt zum Sieg!')).toBeInTheDocument();
    });

    it('shows correct message for Bishop promotion (English)', () => {
      render(<MoveSuccessDialog {...defaultProps} promotionPiece="Bishop" />);
      
      expect(screen.getByText('Klug! Umwandlung in Bishop führt zum Sieg!')).toBeInTheDocument();
    });

    it('shows correct message for Springer promotion', () => {
      render(<MoveSuccessDialog {...defaultProps} promotionPiece="Springer" />);
      
      expect(screen.getByText('Clever! Umwandlung in Springer führt zum Sieg!')).toBeInTheDocument();
    });

    it('shows correct message for Knight promotion (English)', () => {
      render(<MoveSuccessDialog {...defaultProps} promotionPiece="Knight" />);
      
      expect(screen.getByText('Clever! Umwandlung in Knight führt zum Sieg!')).toBeInTheDocument();
    });

    it('shows default message for unknown promotion piece', () => {
      render(<MoveSuccessDialog {...defaultProps} promotionPiece="Unknown" />);
      
      expect(screen.getByText('Perfekt! Umwandlung in Unknown führt zum Sieg!')).toBeInTheDocument();
    });

    it('shows default message when no promotion piece provided', () => {
      render(<MoveSuccessDialog {...defaultProps} promotionPiece={undefined} />);
      
      expect(screen.getByText('Glückwunsch! Die Umwandlung führt zum Sieg!')).toBeInTheDocument();
    });

    it('handles case-insensitive promotion piece names', () => {
      render(<MoveSuccessDialog {...defaultProps} promotionPiece="DAME" />);
      
      // Should still match despite uppercase
      expect(screen.getByText('Ausgezeichnet! Umwandlung in DAME führt zum Sieg!')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onContinue when continue button is clicked', () => {
      render(<MoveSuccessDialog {...defaultProps} />);
      
      const continueButton = screen.getByRole('button', { name: 'Weiter' });
      fireEvent.click(continueButton);
      
      expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when understood button is clicked', () => {
      render(<MoveSuccessDialog {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: 'Verstanden' });
      fireEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      expect(defaultProps.onContinue).not.toHaveBeenCalled();
    });

    it('calls onClose when clicking outside the dialog', () => {
      render(<MoveSuccessDialog {...defaultProps} />);
      
      // Click on the backdrop/overlay - it's the outermost div
      const backdrop = screen.getByText('Erfolg!').closest('.fixed');
      fireEvent.click(backdrop!);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking inside the dialog content', () => {
      render(<MoveSuccessDialog {...defaultProps} />);
      
      // Click on the inner dialog content
      const dialogTitle = screen.getByText('Erfolg!');
      fireEvent.click(dialogTitle);
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('prevents event propagation when clicking dialog content', () => {
      const mockOnClick = jest.fn();
      
      render(
        <div onClick={mockOnClick}>
          <MoveSuccessDialog {...defaultProps} />
        </div>
      );
      
      // Click on dialog content should not propagate to parent
      const dialogTitle = screen.getByText('Erfolg!');
      fireEvent.click(dialogTitle);
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<MoveSuccessDialog {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { name: 'Erfolg!' });
      expect(heading).toBeInTheDocument();
    });

    it('has interactive buttons', () => {
      render(<MoveSuccessDialog {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      
      const verstanden = screen.getByRole('button', { name: 'Verstanden' });
      const weiter = screen.getByRole('button', { name: 'Weiter' });
      
      expect(verstanden).toBeInTheDocument();
      expect(weiter).toBeInTheDocument();
    });

    it('renders semantic structure', () => {
      render(<MoveSuccessDialog {...defaultProps} />);
      
      // Check for proper text structure
      expect(screen.getByText('Erfolg!')).toBeInTheDocument();
      expect(screen.getByText(/Umwandlung/)).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('displays success icon', () => {
      render(<MoveSuccessDialog {...defaultProps} />);
      
      // Check for SVG success icon by looking for the checkmark path
      const svgElements = document.querySelectorAll('svg');
      expect(svgElements.length).toBe(1);
      
      // Check the checkmark circle path is present
      const pathElement = document.querySelector('path[d*="M9 12l2 2 4-4m6 2a9 9 0"]');
      expect(pathElement).toBeInTheDocument();
    });

    it('has proper styling classes for success theme', () => {
      render(<MoveSuccessDialog {...defaultProps} />);
      
      const backdrop = screen.getByText('Erfolg!').closest('.fixed');
      expect(backdrop).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-80');
      
      // Check for green gradient (success theme)
      const gradientContainer = document.querySelector('.bg-gradient-to-br.from-green-500.to-emerald-600');
      expect(gradientContainer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty promotion piece', () => {
      render(<MoveSuccessDialog {...defaultProps} promotionPiece="" />);
      
      // Should show default message when promotion piece is empty string
      expect(screen.getByText('Glückwunsch! Die Umwandlung führt zum Sieg!')).toBeInTheDocument();
    });

    it('handles empty move description', () => {
      render(<MoveSuccessDialog {...defaultProps} moveDescription="" />);
      
      // Should not display the move description section
      expect(screen.queryByText('Gewinnzug:')).not.toBeInTheDocument();
    });

    it('handles all props being undefined', () => {
      render(
        <MoveSuccessDialog 
          isOpen={true} 
          onClose={jest.fn()} 
          onContinue={jest.fn()} 
          promotionPiece={undefined} 
          moveDescription={undefined} 
        />
      );
      
      expect(screen.getByText('Erfolg!')).toBeInTheDocument();
      expect(screen.getByText('Glückwunsch! Die Umwandlung führt zum Sieg!')).toBeInTheDocument();
    });

    it('maintains button functionality with minimal props', () => {
      const minimalProps = {
        isOpen: true,
        onClose: jest.fn(),
        onContinue: jest.fn(),
      };
      
      render(<MoveSuccessDialog {...minimalProps} />);
      
      // Both buttons should still work
      const continueButton = screen.getByRole('button', { name: 'Weiter' });
      const closeButton = screen.getByRole('button', { name: 'Verstanden' });
      
      fireEvent.click(continueButton);
      expect(minimalProps.onContinue).toHaveBeenCalledTimes(1);
      
      fireEvent.click(closeButton);
      expect(minimalProps.onClose).toHaveBeenCalledTimes(1);
    });
  });
});