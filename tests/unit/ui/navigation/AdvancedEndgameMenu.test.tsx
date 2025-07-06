import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdvancedEndgameMenu } from '../../../../shared/components/navigation/AdvancedEndgameMenu';
import '@testing-library/jest-dom';
import { endgameCategories, endgameChapters } from '../../../../shared/components/navigation/../../../shared/data/endgames/index';

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => 
    <a href={href}>{children}</a>
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('AdvancedEndgameMenu', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('should not render when isOpen is false', () => {
      const { container } = render(
        <AdvancedEndgameMenu isOpen={false} onClose={jest.fn()} />
      );
      
      expect(container.firstChild).toBeNull();
    });

    test('should render menu when isOpen is true', () => {
      render(
        <AdvancedEndgameMenu isOpen={true} onClose={jest.fn()} />
      );
      
      expect(screen.getByText('Endgame Training')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('All (rated)')).toBeInTheDocument();
    });

    test('should render all endgame categories', () => {
      render(
        <AdvancedEndgameMenu isOpen={true} onClose={jest.fn()} />
      );
      
      endgameCategories.forEach(category => {
        expect(screen.getByText(category.name)).toBeInTheDocument();
      });
    });

    test('should render future categories as disabled', () => {
      render(
        <AdvancedEndgameMenu isOpen={true} onClose={jest.fn()} />
      );
      
      const futureCategories = ['Queen endgames', 'Knight endgames', 'Bishop endgames'];
      futureCategories.forEach(name => {
        const button = screen.getByText(name).closest('button');
        expect(button).toBeDisabled();
      });
    });
  });

  describe('User Stats', () => {
    test('should display default user stats', () => {
      render(
        <AdvancedEndgameMenu isOpen={true} onClose={jest.fn()} />
      );
      
      expect(screen.getByText('Rating: 1123')).toBeInTheDocument();
    });

    test('should load user stats from localStorage', async () => {
      const savedStats = {
        rating: 1500,
        totalPlayed: 100,
        successRate: 85
      };
      
      localStorageMock.setItem('endgame-user-stats', JSON.stringify(savedStats));
      
      render(
        <AdvancedEndgameMenu isOpen={true} onClose={jest.fn()} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Rating: 1500')).toBeInTheDocument();
      });
    });
  });

  describe('Category Expansion', () => {
    test('should toggle category expansion on click', () => {
      render(
        <AdvancedEndgameMenu isOpen={true} onClose={jest.fn()} />
      );
      
      const firstCategory = endgameCategories[0];
      const categoryButton = screen.getByText(firstCategory.name).closest('button');
      
      // Initially collapsed
      expect(screen.queryByText('All')).not.toBeInTheDocument();
      
      // Click to expand
      fireEvent.click(categoryButton!);
      
      // Should show subcategories
      expect(screen.getByText('All')).toBeInTheDocument();
      
      // Click to collapse
      fireEvent.click(categoryButton!);
      
      // Should hide subcategories
      expect(screen.queryByText('All')).not.toBeInTheDocument();
    });

    test('should show chapters when category is expanded', () => {
      render(
        <AdvancedEndgameMenu isOpen={true} onClose={jest.fn()} />
      );
      
      const firstCategory = endgameCategories[0];
      const categoryButton = screen.getByText(firstCategory.name).closest('button');
      
      fireEvent.click(categoryButton!);
      
      const categoryChapters = endgameChapters.filter(
        chapter => chapter.category === firstCategory.id
      );
      
      categoryChapters.forEach(chapter => {
        expect(screen.getByText(chapter.name)).toBeInTheDocument();
      });
    });

    test('should rotate arrow icon when expanded', () => {
      render(
        <AdvancedEndgameMenu isOpen={true} onClose={jest.fn()} />
      );
      
      const firstCategory = endgameCategories[0];
      const categoryButton = screen.getByText(firstCategory.name).closest('button');
      // Find the span containing the arrow (▶)
      const arrow = Array.from(categoryButton?.querySelectorAll('span') || [])
        .find(span => span.textContent?.trim() === '▶');
      
      expect(arrow).toHaveClass('transform');
      expect(arrow).toHaveClass('transition-transform');
      expect(arrow).not.toHaveClass('rotate-90');
      
      fireEvent.click(categoryButton!);
      
      expect(arrow).toHaveClass('transform');
      expect(arrow).toHaveClass('rotate-90');
    });
  });

  describe('Navigation Links', () => {
    test('should link to dashboard from "All (rated)" button', () => {
      render(
        <AdvancedEndgameMenu isOpen={true} onClose={jest.fn()} />
      );
      
      const allRatedLink = screen.getByText('All (rated)').closest('a');
      expect(allRatedLink).toHaveAttribute('href', '/dashboard');
    });

    test('should link to profile from user section', () => {
      render(
        <AdvancedEndgameMenu isOpen={true} onClose={jest.fn()} />
      );
      
      const profileLink = screen.getByText('D.').closest('a');
      expect(profileLink).toHaveAttribute('href', '/profile');
    });

    test('should link to correct training position for categories', () => {
      render(
        <AdvancedEndgameMenu isOpen={true} onClose={jest.fn()} />
      );
      
      const firstCategory = endgameCategories[0];
      const categoryButton = screen.getByText(firstCategory.name).closest('button');
      
      fireEvent.click(categoryButton!);
      
      const allLink = screen.getByText('All').closest('a');
      const expectedId = firstCategory.positions[0]?.id || 1;
      expect(allLink).toHaveAttribute('href', `/train/${expectedId}`);
    });
  });

  describe('Close Functionality', () => {
    test('should call onClose when close button is clicked', () => {
      const onClose = jest.fn();
      render(
        <AdvancedEndgameMenu isOpen={true} onClose={onClose} />
      );
      
      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('should call onClose when backdrop is clicked', () => {
      const onClose = jest.fn();
      const { container } = render(
        <AdvancedEndgameMenu isOpen={true} onClose={onClose} />
      );
      
      const backdrop = container.querySelector('.bg-opacity-50');
      fireEvent.click(backdrop!);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Behavior', () => {
    test('should have correct classes for mobile/desktop', () => {
      const { container } = render(
        <AdvancedEndgameMenu isOpen={true} onClose={jest.fn()} />
      );
      
      const menuElement = container.querySelector('.bg-gray-900');
      expect(menuElement).toHaveClass('fixed', 'transform', 'transition-transform');
      expect(menuElement).toHaveClass('translate-x-0'); // open state
    });

    test('should hide close button on large screens', () => {
      render(
        <AdvancedEndgameMenu isOpen={true} onClose={jest.fn()} />
      );
      
      const closeButton = screen.getByText('✕').closest('button');
      expect(closeButton).toHaveClass('lg:hidden');
    });
  });

  describe('Subcategory Rendering', () => {
    test('should render material-based subcategories', () => {
      render(
        <AdvancedEndgameMenu isOpen={true} onClose={jest.fn()} />
      );
      
      const firstCategory = endgameCategories[0];
      const categoryButton = screen.getByText(firstCategory.name).closest('button');
      
      fireEvent.click(categoryButton!);
      
      firstCategory.subcategories.forEach(subcategory => {
        expect(screen.getByText(subcategory.material)).toBeInTheDocument();
        // Should show position count - use getAllByText since there might be duplicates
        const positionCounts = screen.getAllByText(subcategory.positions.length.toString());
        expect(positionCounts.length).toBeGreaterThan(0);
      });
    });

    test('should show "Other" subcategory', () => {
      render(
        <AdvancedEndgameMenu isOpen={true} onClose={jest.fn()} />
      );
      
      const firstCategory = endgameCategories[0];
      const categoryButton = screen.getByText(firstCategory.name).closest('button');
      
      fireEvent.click(categoryButton!);
      
      expect(screen.getByText('Other')).toBeInTheDocument();
    });
  });

  describe('Current Position Highlighting', () => {
    test('should accept currentPositionId prop', () => {
      render(
        <AdvancedEndgameMenu isOpen={true} onClose={jest.fn()} currentPositionId={5} />
      );
      
      // Component renders without error
      expect(screen.getByText('Endgame Training')).toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    test('should render category icons', () => {
      render(
        <AdvancedEndgameMenu isOpen={true} onClose={jest.fn()} />
      );
      
      endgameCategories.forEach(category => {
        const categoryElement = screen.getByText(category.name).closest('button');
        const icon = categoryElement?.querySelector('.text-lg');
        expect(icon?.textContent).toBe(category.icon);
      });
    });

    test('should render settings icon', () => {
      render(
        <AdvancedEndgameMenu isOpen={true} onClose={jest.fn()} />
      );
      
      const settingsButton = screen.getByText('Settings').closest('button');
      const icon = settingsButton?.querySelector('.text-lg');
      expect(icon?.textContent).toBe('⚙️');
    });
  });
});