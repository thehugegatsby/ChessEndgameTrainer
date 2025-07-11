import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/router';
import TrainingPage from '../../../../pages/train/[id]';
import { createMockRouter, createMockRouterScenarios } from '../../../helpers/createMockRouter';
import { TEST_MESSAGES } from '../../../constants/testMessages';
import { EndgamePosition } from '@shared/types';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@shared/pages/TrainingPageZustand', () => ({
  TrainingPageZustand: ({ position }: { position: EndgamePosition }) => (
    <div data-testid="training-page">
      <h1>{position.name}</h1>
      <p>ID: {position.id}</p>
      <p>FEN: {position.fen}</p>
    </div>
  ),
}));

const mockUseRouter = useRouter as jest.Mock;

/**
 * TrainingPage Component Tests (SSG-aware)
 * 
 * These tests verify the component's rendering behavior by passing props directly,
 * simulating how Next.js SSG would provide props from getStaticProps.
 */
describe('TrainingPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering with position prop', () => {
    it('should render the TrainingPageZustand component with position data', () => {
      const mockPosition: EndgamePosition = {
        id: 1,
        name: 'Opposition Grundlagen',
        fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
        category: 'basic',
        difficulty: 'beginner',
        description: 'Learn the basics of opposition',
        requiredMoves: 4,
        allowedMoves: 6,
        hint: 'Keep the opposition',
        solution: 'Ke5',
        targetSquares: ['e5'],
        order: 1
      };

      const mockRouter = createMockRouterScenarios.trainingPage('1');
      mockUseRouter.mockReturnValue(mockRouter);

      render(<TrainingPage position={mockPosition} />);

      // Verify the component renders with the correct data
      expect(screen.getByTestId('training-page')).toBeInTheDocument();
      expect(screen.getByText('Opposition Grundlagen')).toBeInTheDocument();
      expect(screen.getByText('ID: 1')).toBeInTheDocument();
      expect(screen.getByText('FEN: 4k3/8/4K3/4P3/8/8/8/8 w - - 0 1')).toBeInTheDocument();
    });

    it('should handle positions with different properties', () => {
      const mockPosition: EndgamePosition = {
        id: 42,
        name: 'Advanced Rook Endgame',
        fen: 'R7/8/8/8/8/8/8/r6k w - - 0 1',
        category: 'rook',
        difficulty: 'advanced',
        description: 'Master the Lucena position',
        requiredMoves: 10,
        allowedMoves: 15,
        hint: 'Build a bridge',
        solution: 'Ra4',
        targetSquares: ['a4', 'h1'],
        order: 42
      };

      const mockRouter = createMockRouterScenarios.trainingPage('42');
      mockUseRouter.mockReturnValue(mockRouter);

      render(<TrainingPage position={mockPosition} />);

      expect(screen.getByText('Advanced Rook Endgame')).toBeInTheDocument();
      expect(screen.getByText('ID: 42')).toBeInTheDocument();
    });
  });

  describe('Fallback states', () => {
    it('should show loading state when router.isFallback is true', () => {
      const mockRouter = createMockRouterScenarios.loading();
      mockUseRouter.mockReturnValue(mockRouter);

      render(<TrainingPage position={null} />);

      expect(screen.getByText('Loading training position...')).toBeInTheDocument();
      expect(screen.queryByTestId('training-page')).not.toBeInTheDocument();
    });

    it('should show "Position not found" when position is null', () => {
      const mockRouter = createMockRouter({
        isFallback: false,
        isReady: true,
      });
      mockUseRouter.mockReturnValue(mockRouter);

      render(<TrainingPage position={null} />);

      expect(screen.getByText('Position not found')).toBeInTheDocument();
      expect(screen.queryByTestId('training-page')).not.toBeInTheDocument();
    });
  });

  describe('Router integration', () => {
    it('should not render content during fallback', () => {
      const mockPosition: EndgamePosition = {
        id: 1,
        name: 'Test Position',
        fen: '8/8/8/8/8/8/8/8 w - - 0 1',
        category: 'basic',
        difficulty: 'beginner',
        description: 'Test',
        requiredMoves: 1,
        allowedMoves: 1,
        hint: 'Test',
        solution: 'Test',
        targetSquares: [],
        order: 1
      };

      // Even with a position, fallback should show loading
      const mockRouter = createMockRouterScenarios.loading();
      mockUseRouter.mockReturnValue(mockRouter);

      render(<TrainingPage position={mockPosition} />);

      expect(screen.getByText('Loading training position...')).toBeInTheDocument();
      expect(screen.queryByText('Test Position')).not.toBeInTheDocument();
    });
  });
});