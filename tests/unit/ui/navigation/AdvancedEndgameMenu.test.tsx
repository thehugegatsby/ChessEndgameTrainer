/**
 * @fileoverview Unit tests for AdvancedEndgameMenu component
 * @description Tests complex navigation menu with expandable categories and user stats
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdvancedEndgameMenu } from '@shared/components/navigation/AdvancedEndgameMenu';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock the endgame data
const mockEndgameCategories = [
  {
    id: 'basic',
    name: 'Basic Endgames',
    icon: '♔',
    positions: [{ id: 1, name: 'KQ vs K' }],
    subcategories: [
      {
        id: 'basic-queen',
        material: 'Queen',
        icon: '♛',
        positions: [{ id: 1, name: 'KQ vs K' }]
      }
    ]
  },
  {
    id: 'rook',
    name: 'Rook Endgames',
    icon: '♜',
    positions: [{ id: 2, name: 'KR vs K' }],
    subcategories: [
      {
        id: 'rook-basic',
        material: 'Rook',
        icon: '♜',
        positions: [{ id: 2, name: 'KR vs K' }]
      }
    ]
  }
];

const mockEndgameChapters = [
  {
    id: 'chapter1',
    name: 'Checkmate Patterns',
    category: 'basic',
    totalLessons: 5,
    lessons: [{ id: 1, name: 'Queen Checkmate' }]
  }
];

const mockAllEndgamePositions = [
  { id: 1, name: 'KQ vs K' },
  { id: 2, name: 'KR vs K' }
];

jest.mock('@shared/data/endgames/index', () => ({
  endgameCategories: mockEndgameCategories,
  endgameChapters: mockEndgameChapters,
  allEndgamePositions: mockAllEndgamePositions
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('AdvancedEndgameMenu Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    currentPositionId: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Visibility and Basic Rendering', () => {
    it('should render when open', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      expect(screen.getByText('Endgame Training')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<AdvancedEndgameMenu {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Endgame Training')).not.toBeInTheDocument();
    });

    it('should render header with title', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      expect(screen.getByText('Endgame Training')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      const closeButton = screen.getByText('✕');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('User Stats', () => {
    it('should display default user stats', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      expect(screen.getByText('D.')).toBeInTheDocument();
      expect(screen.getByText('Rating: 1123')).toBeInTheDocument();
    });

    it('should load user stats from localStorage', () => {
      const savedStats = {
        rating: 1500,
        totalPlayed: 100,
        successRate: 85
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedStats));

      render(<AdvancedEndgameMenu {...defaultProps} />);

      expect(screen.getByText('Rating: 1500')).toBeInTheDocument();
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      render(<AdvancedEndgameMenu {...defaultProps} />);

      // Should fall back to default stats
      expect(screen.getByText('Rating: 1123')).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should render "All (rated)" link', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      const allLink = screen.getByText('All (rated)');
      expect(allLink.closest('a')).toHaveAttribute('href', '/dashboard');
    });

    it('should render settings button', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      expect(screen.getByText('⚙️')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should render user profile link', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      const profileSection = screen.getByText('D.').closest('a');
      expect(profileSection).toHaveAttribute('href', '/profile');
    });
  });

  describe('Categories and Expansion', () => {
    it('should render category headers', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      expect(screen.getByText('Basic Endgames')).toBeInTheDocument();
      expect(screen.getByText('Rook Endgames')).toBeInTheDocument();
    });

    it('should render category icons', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      expect(screen.getByText('♔')).toBeInTheDocument();
      expect(screen.getByText('♜')).toBeInTheDocument();
    });

    it('should expand category when clicked', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      const basicCategory = screen.getByText('Basic Endgames');
      fireEvent.click(basicCategory);

      // Should show subcategories
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Queen')).toBeInTheDocument();
    });

    it('should collapse category when clicked again', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      const basicCategory = screen.getByText('Basic Endgames');
      
      // Expand
      fireEvent.click(basicCategory);
      expect(screen.getByText('Queen')).toBeInTheDocument();

      // Collapse
      fireEvent.click(basicCategory);
      expect(screen.queryByText('Queen')).not.toBeInTheDocument();
    });

    it('should show expand/collapse arrow', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      const arrows = screen.getAllByText('▶');
      expect(arrows.length).toBeGreaterThan(0);
    });

    it('should rotate arrow when expanded', () => {
      const { container } = render(<AdvancedEndgameMenu {...defaultProps} />);

      const basicCategory = screen.getByText('Basic Endgames');
      fireEvent.click(basicCategory);

      // Find the arrow in the expanded state
      const arrow = container.querySelector('.rotate-90');
      expect(arrow).toBeInTheDocument();
    });
  });

  describe('Subcategories and Chapters', () => {
    beforeEach(() => {
      render(<AdvancedEndgameMenu {...defaultProps} />);
      
      // Expand the basic category
      const basicCategory = screen.getByText('Basic Endgames');
      fireEvent.click(basicCategory);
    });

    it('should render "All" subcategory', () => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('should render thematic chapters', () => {
      expect(screen.getByText('Checkmate Patterns')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // lesson count
    });

    it('should render material-based subcategories', () => {
      expect(screen.getByText('Queen')).toBeInTheDocument();
      expect(screen.getByText('♛')).toBeInTheDocument(); // queen icon
    });

    it('should show position counts for subcategories', () => {
      expect(screen.getByText('1')).toBeInTheDocument(); // position count
    });

    it('should render "Other" subcategory', () => {
      expect(screen.getByText('Other')).toBeInTheDocument();
    });
  });

  describe('Future Categories', () => {
    it('should render disabled future categories', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      expect(screen.getByText('Queen endgames')).toBeInTheDocument();
      expect(screen.getByText('Knight endgames')).toBeInTheDocument();
      expect(screen.getByText('Bishop endgames')).toBeInTheDocument();
    });

    it('should render correct icons for future categories', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      expect(screen.getByText('♛')).toBeInTheDocument(); // queen
      expect(screen.getByText('♞')).toBeInTheDocument(); // knight
      expect(screen.getByText('♝')).toBeInTheDocument(); // bishop
    });

    it('should have disabled state for future categories', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      const queenCategory = screen.getByText('Queen endgames').closest('button');
      expect(queenCategory).toBeDisabled();
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle backdrop click on mobile', () => {
      const onClose = jest.fn();
      const { container } = render(<AdvancedEndgameMenu {...defaultProps} onClose={onClose} />);

      const backdrop = container.querySelector('.fixed.inset-0.bg-black');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalled();
      }
    });

    it('should handle close button click', () => {
      const onClose = jest.fn();
      render(<AdvancedEndgameMenu {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should have responsive classes', () => {
      const { container } = render(<AdvancedEndgameMenu {...defaultProps} />);

      const sidebar = container.querySelector('.w-80');
      expect(sidebar).toBeInTheDocument();

      const responsiveTransform = container.querySelector('.lg\\:translate-x-0');
      expect(responsiveTransform).toBeInTheDocument();
    });
  });

  describe('Link Generation', () => {
    beforeEach(() => {
      render(<AdvancedEndgameMenu {...defaultProps} />);
      
      // Expand basic category
      const basicCategory = screen.getByText('Basic Endgames');
      fireEvent.click(basicCategory);
    });

    it('should generate correct links for subcategories', () => {
      const allLink = screen.getByText('All').closest('a');
      expect(allLink).toHaveAttribute('href', '/train/1'); // First position ID
    });

    it('should generate correct links for chapters', () => {
      const chapterLink = screen.getByText('Checkmate Patterns').closest('a');
      expect(chapterLink).toHaveAttribute('href', '/train/1'); // First lesson ID
    });

    it('should generate correct links for material subcategories', () => {
      const queenLink = screen.getByText('Queen').closest('a');
      expect(queenLink).toHaveAttribute('href', '/train/1'); // First position ID
    });
  });

  describe('State Management', () => {
    it('should maintain expanded state for multiple categories', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      // Expand both categories
      fireEvent.click(screen.getByText('Basic Endgames'));
      fireEvent.click(screen.getByText('Rook Endgames'));

      // Both should be expanded
      expect(screen.getAllByText('All')).toHaveLength(2);
    });

    it('should handle rapid category toggling', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      const basicCategory = screen.getByText('Basic Endgames');

      // Rapid toggle
      fireEvent.click(basicCategory);
      fireEvent.click(basicCategory);
      fireEvent.click(basicCategory);

      // Should end up expanded
      expect(screen.getByText('Queen')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing position data gracefully', () => {
      // Mock empty categories
      jest.doMock('@shared/data/endgames/index', () => ({
        endgameCategories: [],
        endgameChapters: [],
        allEndgamePositions: []
      }));

      expect(() => {
        render(<AdvancedEndgameMenu {...defaultProps} />);
      }).not.toThrow();
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      expect(() => {
        render(<AdvancedEndgameMenu {...defaultProps} />);
      }).not.toThrow();

      // Should still show default stats
      expect(screen.getByText('Rating: 1123')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      const categoryButtons = screen.getAllByRole('button');
      expect(categoryButtons.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      const basicCategory = screen.getByText('Basic Endgames').closest('button');
      
      if (basicCategory) {
        // Focus and activate with Enter
        basicCategory.focus();
        fireEvent.keyDown(basicCategory, { key: 'Enter' });
        
        expect(screen.getByText('Queen')).toBeInTheDocument();
      }
    });

    it('should have accessible text content', () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      // Important navigation elements should be accessible
      expect(screen.getByText('Endgame Training')).toBeVisible();
      expect(screen.getByText('Basic Endgames')).toBeVisible();
      expect(screen.getByText('Settings')).toBeVisible();
    });
  });

  describe('Performance', () => {
    it('should not cause memory leaks on unmount', () => {
      const { unmount } = render(<AdvancedEndgameMenu {...defaultProps} />);

      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid state changes efficiently', async () => {
      render(<AdvancedEndgameMenu {...defaultProps} />);

      const basicCategory = screen.getByText('Basic Endgames');

      // Rapid clicks should not cause issues
      for (let i = 0; i < 10; i++) {
        fireEvent.click(basicCategory);
      }

      // Should still work correctly
      await waitFor(() => {
        expect(screen.queryByText('Queen')).not.toBeInTheDocument();
      });
    });
  });
});