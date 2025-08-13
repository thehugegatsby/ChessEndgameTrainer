import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TablebaseIntegration, SimpleTablebaseIntegration } from '../TablebaseIntegration';
import { trainingEvents } from '../../../training/events/EventEmitter';

// Mock the tablebase hooks
vi.mock('../../hooks/useTablebase', () => ({
  useTablebase: vi.fn(() => ({
    evaluation: {
      outcome: 'win',
      dtm: 5,
      dtz: 12,
    },
    moves: [
      {
        uci: 'e2e4',
        san: 'e4',
        outcome: 'win',
        dtm: 4,
      },
      {
        uci: 'd2d4',
        san: 'd4',
        outcome: 'draw',
        dtm: undefined,
      },
    ],
    isLoading: false,
    isEvaluationLoading: false,
    isMovesLoading: false,
    error: null,
  })),
}));

// Mock training hooks
const mockUseEventDrivenTraining = vi.fn(() => true);
vi.mock('../../../training/hooks/useEventDrivenTraining', () => ({
  useEventDrivenTraining: mockUseEventDrivenTraining,
}));

const mockUseTrainingStore = vi.fn(() => [
  null,
  {
    handlePlayerMove: vi.fn(),
  },
]);
vi.mock('@shared/store/hooks', () => ({
  useTrainingStore: mockUseTrainingStore,
}));

// Mock training event listener
const mockUseTrainingEvent = vi.fn();
vi.mock('../../../training/components/TrainingEventListener', () => ({
  useTrainingEvent: mockUseTrainingEvent,
}));

// Mock store
vi.mock('@shared/store/rootStore', () => ({
  useStore: vi.fn(() => ({ ui: { tablebaseData: null } })),
}));

// Mock training events
vi.mock('../../../training/events/EventEmitter', () => ({
  trainingEvents: {
    emit: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
};

describe.skip('TablebaseIntegration', () => {
  const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('stacked layout', () => {
    it('should render both analysis and feedback panels', () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <TablebaseIntegration
            fen={testFen}
            layout="stacked"
            showAnalysis={true}
            showFeedback={true}
          />
        </Wrapper>
      );

      expect(screen.getByText('Tablebase Analysis')).toBeInTheDocument();
    });

    it('should only show analysis when feedback disabled', () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <TablebaseIntegration
            fen={testFen}
            layout="stacked"
            showAnalysis={true}
            showFeedback={false}
          />
        </Wrapper>
      );

      expect(screen.getByText('Tablebase Analysis')).toBeInTheDocument();
      // Feedback panel is not visible without feedback data
    });
  });

  describe('side-by-side layout', () => {
    it('should render with flex layout', () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <TablebaseIntegration
            fen={testFen}
            layout="side-by-side"
            showAnalysis={true}
            showFeedback={true}
          />
        </Wrapper>
      );

      const container = screen.getByText('Tablebase Analysis').closest('.tablebase-integration');
      expect(container).toHaveClass('flex');
    });
  });

  describe('tabs layout', () => {
    it('should render tab navigation', () => {
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

      expect(screen.getByText('Analysis')).toBeInTheDocument();
      expect(screen.getByText('Feedback')).toBeInTheDocument();
    });

    it('should switch tabs on click', () => {
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

      expect(feedbackTab.closest('button')).toHaveClass('border-blue-500');
    });
  });

  describe('move handling', () => {
    it('should emit move attempted event when event-driven', () => {
      mockUseEventDrivenTraining.mockReturnValue(true);
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <TablebaseIntegration
            fen={testFen}
            showAnalysis={true}
          />
        </Wrapper>
      );

      const moveButton = screen.getByRole('button', { name: 'e4 + 4' });
      fireEvent.click(moveButton);

      expect(trainingEvents.emit).toHaveBeenCalledWith('move:attempted', {
        from: 'e2',
        to: 'e4',
        promotion: undefined,
      });
    });

    it('should use store action when not event-driven', () => {
      const mockHandlePlayerMove = vi.fn();
      mockUseEventDrivenTraining.mockReturnValue(false);
      mockUseTrainingStore.mockReturnValue([
        null,
        { handlePlayerMove: mockHandlePlayerMove },
      ]);
      
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <TablebaseIntegration
            fen={testFen}
            showAnalysis={true}
          />
        </Wrapper>
      );

      const moveButton = screen.getByRole('button', { name: 'e4 + 4' });
      fireEvent.click(moveButton);

      expect(mockHandlePlayerMove).toHaveBeenCalledWith({
        from: 'e2',
        to: 'e4',
        promotion: undefined,
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

      expect(screen.getByText('Tablebase Analysis')).toBeInTheDocument();
    });
  });

  describe('conditional rendering', () => {
    it('should not render when not event-driven and no analysis', () => {
      mockUseEventDrivenTraining.mockReturnValue(false);
      const Wrapper = createWrapper();
      
      const { container } = render(
        <Wrapper>
          <TablebaseIntegration
            fen={testFen}
            showAnalysis={false}
          />
        </Wrapper>
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when event-driven even without analysis', () => {
      mockUseEventDrivenTraining.mockReturnValue(true);
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <TablebaseIntegration
            fen={testFen}
            showAnalysis={false}
            showFeedback={true}
          />
        </Wrapper>
      );

      // Should render container even if analysis is disabled
      const container = document.querySelector('.tablebase-integration');
      expect(container).toBeInTheDocument();
    });
  });
});