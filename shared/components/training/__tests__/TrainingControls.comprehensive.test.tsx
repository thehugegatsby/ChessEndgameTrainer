import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TrainingControls } from '../TrainingControls';
import { EndgamePosition } from '@shared/data/endgames/index';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('TrainingControls - Comprehensive Coverage', () => {
  const mockPosition: EndgamePosition = {
    id: 1,
    title: 'Test Position',
    fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
    category: 'pawn',
    difficulty: 'beginner',
    description: 'Test description',
    goal: 'win',
    sideToMove: 'white',
    material: {
      white: 'K+P',
      black: 'K'
    },
    tags: ['test']
  };

  const mockPrevPosition: EndgamePosition = {
    id: 2,
    title: 'Previous Position',
    fen: '4k3/8/4K3/8/4P3/8/8/8 w - - 0 1',
    category: 'pawn',
    difficulty: 'beginner',
    description: 'Previous description',
    goal: 'win',
    sideToMove: 'white',
    material: {
      white: 'K+P',
      black: 'K'
    },
    tags: ['test']
  };

  const mockNextPosition: EndgamePosition = {
    id: 3,
    title: 'Next Position',
    fen: '4k3/8/4K3/3P4/8/8/8/8 w - - 0 1',
    category: 'pawn',
    difficulty: 'beginner',
    description: 'Next description',
    goal: 'win',
    sideToMove: 'white',
    material: {
      white: 'K+P',
      black: 'K'
    },
    tags: ['test']
  };

  const mockProps = {
    position: mockPosition,
    onReset: jest.fn(),
    getLichessUrl: jest.fn(() => 'https://lichess.org/test'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Desktop Layout', () => {
    it('should render desktop controls by default', () => {
      render(<TrainingControls {...mockProps} />);
      
      expect(screen.getByText('🔗 Lichess')).toBeInTheDocument();
      expect(screen.getByText('🔄 Reset')).toBeInTheDocument();
    });

    it('should render desktop controls when isMobile is false', () => {
      render(<TrainingControls {...mockProps} isMobile={false} />);
      
      expect(screen.getByText('🔗 Lichess')).toBeInTheDocument();
      expect(screen.getByText('🔄 Reset')).toBeInTheDocument();
    });

    it('should call onReset when reset button is clicked', () => {
      render(<TrainingControls {...mockProps} />);
      
      fireEvent.click(screen.getByText('🔄 Reset'));
      expect(mockProps.onReset).toHaveBeenCalledTimes(1);
    });

    it('should render Lichess link with correct URL', () => {
      render(<TrainingControls {...mockProps} />);
      
      const lichessLink = screen.getByText('🔗 Lichess').closest('a');
      expect(lichessLink).toHaveAttribute('href', 'https://lichess.org/test');
      expect(lichessLink).toHaveAttribute('target', '_blank');
      expect(lichessLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    describe('Navigation with both prev and next positions', () => {
      it('should render both navigation links', () => {
        render(
          <TrainingControls 
            {...mockProps} 
            prevPosition={mockPrevPosition}
            nextPosition={mockNextPosition}
          />
        );
        
        expect(screen.getByText('← #2')).toBeInTheDocument();
        expect(screen.getByText('#3 →')).toBeInTheDocument();
      });

      it('should have correct href attributes for navigation links', () => {
        render(
          <TrainingControls 
            {...mockProps} 
            prevPosition={mockPrevPosition}
            nextPosition={mockNextPosition}
          />
        );
        
        const prevLink = screen.getByText('← #2').closest('a');
        const nextLink = screen.getByText('#3 →').closest('a');
        
        expect(prevLink).toHaveAttribute('href', '/train/2');
        expect(nextLink).toHaveAttribute('href', '/train/3');
      });

      it('should have title attributes for navigation links', () => {
        render(
          <TrainingControls 
            {...mockProps} 
            prevPosition={mockPrevPosition}
            nextPosition={mockNextPosition}
          />
        );
        
        const prevLink = screen.getByText('← #2').closest('a');
        const nextLink = screen.getByText('#3 →').closest('a');
        
        expect(prevLink).toHaveAttribute('title', 'Previous Position');
        expect(nextLink).toHaveAttribute('title', 'Next Position');
      });
    });

    describe('Navigation edge cases', () => {
      it('should show disabled prev when no prev position', () => {
        render(
          <TrainingControls 
            {...mockProps} 
            nextPosition={mockNextPosition}
          />
        );
        
        expect(screen.getByText('← Start')).toBeInTheDocument();
        expect(screen.getByText('← Start').closest('div')).toHaveClass('opacity-50');
      });

      it('should show disabled next when no next position', () => {
        render(
          <TrainingControls 
            {...mockProps} 
            prevPosition={mockPrevPosition}
          />
        );
        
        expect(screen.getByText('Ende →')).toBeInTheDocument();
        expect(screen.getByText('Ende →').closest('div')).toHaveClass('opacity-50');
      });

      it('should show both disabled when no prev/next positions', () => {
        render(<TrainingControls {...mockProps} />);
        
        expect(screen.getByText('← Start')).toBeInTheDocument();
        expect(screen.getByText('Ende →')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Layout', () => {
    it('should render mobile controls when isMobile is true', () => {
      render(<TrainingControls {...mockProps} isMobile={true} />);
      
      expect(screen.getByText('🔄 Reset')).toBeInTheDocument();
      expect(screen.getByText('🔗 Lichess')).toBeInTheDocument();
    });

    it('should call onReset when mobile reset button is clicked', () => {
      render(<TrainingControls {...mockProps} isMobile={true} />);
      
      fireEvent.click(screen.getByText('🔄 Reset'));
      expect(mockProps.onReset).toHaveBeenCalledTimes(1);
    });

    it('should render mobile Lichess link with correct URL', () => {
      render(<TrainingControls {...mockProps} isMobile={true} />);
      
      const lichessLink = screen.getByText('🔗 Lichess').closest('a');
      expect(lichessLink).toHaveAttribute('href', 'https://lichess.org/test');
      expect(lichessLink).toHaveAttribute('target', '_blank');
      expect(lichessLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    describe('Mobile Navigation', () => {
      it('should render mobile navigation with both positions', () => {
        render(
          <TrainingControls 
            {...mockProps} 
            isMobile={true}
            prevPosition={mockPrevPosition}
            nextPosition={mockNextPosition}
          />
        );
        
        expect(screen.getByText('← Zurück')).toBeInTheDocument();
        expect(screen.getByText('Weiter →')).toBeInTheDocument();
      });

      it('should only render prev navigation when next is missing', () => {
        render(
          <TrainingControls 
            {...mockProps} 
            isMobile={true}
            prevPosition={mockPrevPosition}
          />
        );
        
        expect(screen.getByText('← Zurück')).toBeInTheDocument();
        expect(screen.queryByText('Weiter →')).not.toBeInTheDocument();
      });

      it('should only render next navigation when prev is missing', () => {
        render(
          <TrainingControls 
            {...mockProps} 
            isMobile={true}
            nextPosition={mockNextPosition}
          />
        );
        
        expect(screen.queryByText('← Zurück')).not.toBeInTheDocument();
        expect(screen.getByText('Weiter →')).toBeInTheDocument();
      });

      it('should not render navigation when both positions are missing', () => {
        render(<TrainingControls {...mockProps} isMobile={true} />);
        
        expect(screen.queryByText('← Zurück')).not.toBeInTheDocument();
        expect(screen.queryByText('Weiter →')).not.toBeInTheDocument();
      });
    });
  });

  describe('Callback Functions', () => {
    it('should call getLichessUrl when rendering', () => {
      render(<TrainingControls {...mockProps} />);
      
      expect(mockProps.getLichessUrl).toHaveBeenCalled();
    });

    it('should call getLichessUrl for mobile version', () => {
      const getLichessUrlSpy = jest.fn(() => 'https://lichess.org/mobile');
      render(
        <TrainingControls 
          {...mockProps} 
          isMobile={true}
          getLichessUrl={getLichessUrlSpy}
        />
      );
      
      expect(getLichessUrlSpy).toHaveBeenCalled();
      
      const lichessLink = screen.getByText('🔗 Lichess').closest('a');
      expect(lichessLink).toHaveAttribute('href', 'https://lichess.org/mobile');
    });

    it('should handle multiple reset clicks', () => {
      render(<TrainingControls {...mockProps} />);
      
      const resetButton = screen.getByText('🔄 Reset');
      fireEvent.click(resetButton);
      fireEvent.click(resetButton);
      fireEvent.click(resetButton);
      
      expect(mockProps.onReset).toHaveBeenCalledTimes(3);
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should have correct CSS classes for desktop layout', () => {
      render(<TrainingControls {...mockProps} />);
      
      const container = screen.getByText('🔄 Reset').closest('div')?.parentElement;
      expect(container).toHaveClass('flex-shrink-0', 'space-y-3');
    });

    it('should have correct CSS classes for mobile layout', () => {
      render(<TrainingControls {...mockProps} isMobile={true} />);
      
      const container = screen.getByText('🔄 Reset').closest('div')?.parentElement;
      expect(container).toHaveClass('lg:hidden', 'w-full', 'max-w-sm', 'mt-16', 'space-y-2');
    });

    it('should apply hover and transition classes', () => {
      render(<TrainingControls {...mockProps} />);
      
      const resetButton = screen.getByText('🔄 Reset');
      expect(resetButton).toHaveClass('hover:bg-gray-600', 'transition-colors');
      
      const lichessLink = screen.getByText('🔗 Lichess');
      expect(lichessLink).toHaveClass('hover:bg-blue-600', 'transition-colors');
    });
  });

  describe('Accessibility', () => {
    it('should have proper link attributes for external Lichess link', () => {
      render(<TrainingControls {...mockProps} />);
      
      const lichessLink = screen.getByText('🔗 Lichess').closest('a');
      expect(lichessLink).toHaveAttribute('target', '_blank');
      expect(lichessLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should have accessible button for reset action', () => {
      render(<TrainingControls {...mockProps} />);
      
      const resetButton = screen.getByText('🔄 Reset');
      expect(resetButton.tagName).toBe('BUTTON');
    });

    it('should provide title attributes for navigation links', () => {
      render(
        <TrainingControls 
          {...mockProps} 
          prevPosition={mockPrevPosition}
          nextPosition={mockNextPosition}
        />
      );
      
      const prevLink = screen.getByText('← #2').closest('a');
      const nextLink = screen.getByText('#3 →').closest('a');
      
      expect(prevLink).toHaveAttribute('title', 'Previous Position');
      expect(nextLink).toHaveAttribute('title', 'Next Position');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing position properties gracefully', () => {
      const incompletePosition: EndgamePosition = {
        id: 999,
        title: '',
        fen: '',
        category: 'pawn',
        difficulty: 'beginner',
        description: '',
        goal: 'win',
        sideToMove: 'white',
        material: {
          white: 'K',
          black: 'K'
        },
        tags: []
      };
      
      expect(() => {
        render(
          <TrainingControls 
            {...mockProps} 
            position={incompletePosition}
          />
        );
      }).not.toThrow();
    });

    it('should handle null/undefined prevPosition gracefully', () => {
      expect(() => {
        render(
          <TrainingControls 
            {...mockProps} 
            prevPosition={null}
            nextPosition={mockNextPosition}
          />
        );
      }).not.toThrow();
      
      expect(screen.getByText('← Start')).toBeInTheDocument();
    });

    it('should handle null/undefined nextPosition gracefully', () => {
      expect(() => {
        render(
          <TrainingControls 
            {...mockProps} 
            prevPosition={mockPrevPosition}
            nextPosition={null}
          />
        );
      }).not.toThrow();
      
      expect(screen.getByText('Ende →')).toBeInTheDocument();
    });

    it('should handle getLichessUrl returning empty string', () => {
      const emptyUrlMock = jest.fn(() => '');
      render(
        <TrainingControls 
          {...mockProps} 
          getLichessUrl={emptyUrlMock}
        />
      );
      
      const lichessLink = screen.getByText('🔗 Lichess').closest('a');
      expect(lichessLink).toHaveAttribute('href', '');
    });
  });
}); 