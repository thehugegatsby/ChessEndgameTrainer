import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TablebaseIntegration, SimpleTablebaseIntegration } from '../TablebaseIntegration';

// Use vi.hoisted to define mocks before module evaluation
const mockUseTablebase = vi.hoisted(() => vi.fn());
const mockUseTrainingStore = vi.hoisted(() => vi.fn());

// Mock the tablebase hooks
vi.mock('../../hooks/useTablebase', () => ({
  useTablebase: mockUseTablebase,
}));

// Mock training store hooks
vi.mock('@shared/store/hooks', () => ({
  useTrainingStore: mockUseTrainingStore,
  // Add other exports if needed to prevent breaking imports
  useGameStore: vi.fn(() => [{}, {}]),
  useTablebaseStore: vi.fn(() => [{}, {}]),
  useUIStore: vi.fn(() => [{}, {}]),
}));

// Mock store
vi.mock('@shared/store/rootStore', () => ({
  useStore: vi.fn(() => ({ ui: { tablebaseData: null } })),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
};

const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('TablebaseIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseTablebase.mockReturnValue({
      evaluation: { outcome: 'win', dtm: 5, dtz: 12 },
      moves: [
        { uci: 'e2e4', san: 'e4', outcome: 'win', dtm: 4 },
        { uci: 'd2d4', san: 'd4', outcome: 'draw' },
      ],
      isLoading: false,
      isEvaluationLoading: false,
      isMovesLoading: false,
      error: null,
    });

    mockUseTrainingStore.mockReturnValue([null, { handlePlayerMove: vi.fn() }]);
  });

  describe('basic rendering', () => {
    it('should render tablebase panel with analysis', () => {
      const Wrapper = createWrapper();

      render(
        <Wrapper>
          <TablebaseIntegration fen={testFen} showAnalysis={true} />
        </Wrapper>
      );

      expect(screen.getByText('Tablebase Analysis')).toBeTruthy();
      expect(screen.getByText('WIN')).toBeTruthy();
      expect(screen.getByText('Best Moves')).toBeTruthy();
    });

    it('should not render when showAnalysis is false', () => {
      const Wrapper = createWrapper();

      const { container } = render(
        <Wrapper>
          <TablebaseIntegration fen={testFen} showAnalysis={false} />
        </Wrapper>
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render with stacked layout by default', () => {
      const Wrapper = createWrapper();

      render(
        <Wrapper>
          <TablebaseIntegration fen={testFen} showAnalysis={true} />
        </Wrapper>
      );

      const container = document.querySelector('.tablebase-integration.space-y-4');
      expect(container).toBeTruthy();
    });
  });

  describe('layout variants', () => {
    it('should render side-by-side layout', () => {
      const Wrapper = createWrapper();

      render(
        <Wrapper>
          <TablebaseIntegration fen={testFen} layout="side-by-side" showAnalysis={true} />
        </Wrapper>
      );

      const container = document.querySelector('.tablebase-integration.flex.gap-4');
      expect(container).toBeTruthy();
    });

    it('should render tabbed layout with navigation', () => {
      const Wrapper = createWrapper();

      render(
        <Wrapper>
          <TablebaseIntegration
            fen={testFen}
            layout="tabs"
            showAnalysis={true}
            showFeedback={true}
          />
        </Wrapper>
      );

      expect(screen.getByText('Analysis')).toBeTruthy();
      expect(screen.getByText('Feedback')).toBeTruthy();
    });

    it('should switch tabs correctly', () => {
      const Wrapper = createWrapper();

      render(
        <Wrapper>
          <TablebaseIntegration
            fen={testFen}
            layout="tabs"
            showAnalysis={true}
            showFeedback={true}
          />
        </Wrapper>
      );

      const feedbackTab = screen.getByText('Feedback');
      fireEvent.click(feedbackTab);

      expect(feedbackTab.closest('button').classList.contains('border-blue-500')).toBe(true);
    });
  });

  describe('move handling', () => {
    it('should call training store action for move selection', () => {
      const mockHandlePlayerMove = vi.fn();
      mockUseTrainingStore.mockReturnValue([null, { handlePlayerMove: mockHandlePlayerMove }]);

      const Wrapper = createWrapper();

      render(
        <Wrapper>
          <TablebaseIntegration fen={testFen} showAnalysis={true} />
        </Wrapper>
      );

      const moveButton = screen.getByRole('button', { name: 'e4 + 4' });
      fireEvent.click(moveButton);

      expect(mockHandlePlayerMove).toHaveBeenCalledWith({
        from: 'e2',
        to: 'e4',
      });
    });

    it('should handle promotion moves correctly', () => {
      const mockHandlePlayerMove = vi.fn();
      mockUseTrainingStore.mockReturnValue([null, { handlePlayerMove: mockHandlePlayerMove }]);

      // Mock promotion move
      mockUseTablebase.mockReturnValue({
        evaluation: { outcome: 'win', dtm: 1 },
        moves: [{ uci: 'e7e8q', san: 'e8=Q+', outcome: 'win', dtm: 1 }],
        isLoading: false,
        isEvaluationLoading: false,
        isMovesLoading: false,
        error: null,
      });

      const Wrapper = createWrapper();

      render(
        <Wrapper>
          <TablebaseIntegration fen={testFen} showAnalysis={true} />
        </Wrapper>
      );

      const moveButton = screen.getByRole('button', { name: 'e8=Q+ + 1' });
      fireEvent.click(moveButton);

      expect(mockHandlePlayerMove).toHaveBeenCalledWith({
        from: 'e7',
        to: 'e8',
        promotion: 'q',
      });
    });
  });

  describe('SimpleTablebaseIntegration', () => {
    it('should render with default props', () => {
      const Wrapper = createWrapper();

      render(
        <Wrapper>
          <SimpleTablebaseIntegration fen={testFen} />
        </Wrapper>
      );

      expect(screen.getByText('Tablebase Analysis')).toBeTruthy();
    });
  });
});
