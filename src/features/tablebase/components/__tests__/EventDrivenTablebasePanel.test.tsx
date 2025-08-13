import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EventDrivenTablebasePanel } from '../EventDrivenTablebasePanel';
import { trainingEvents } from '../../../training/events/EventEmitter';
import { useTablebase } from '../../hooks/useTablebase';

// Mock the tablebase hooks - must be hoisted before imports
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

// Mock the training hooks
vi.mock('../../../training/hooks/useEventDrivenTraining', () => ({
  useEventDrivenTraining: vi.fn(() => true),
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

describe('EventDrivenTablebasePanel', () => {
  const mockOnMoveSelect = vi.fn();
  const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render tablebase analysis', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <EventDrivenTablebasePanel
          fen={testFen}
          isVisible={true}
          onMoveSelect={mockOnMoveSelect}
        />
      </Wrapper>
    );

    expect(screen.getByText('Tablebase Analysis')).toBeInTheDocument();
    expect(screen.getByText('WIN')).toBeInTheDocument();
    expect(screen.getByText('Best Moves')).toBeInTheDocument();
  });

  it('should display evaluation outcome correctly', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <EventDrivenTablebasePanel
          fen={testFen}
          isVisible={true}
        />
      </Wrapper>
    );

    const outcomeElement = screen.getByText('WIN');
    expect(outcomeElement).toHaveClass('tablebase-evaluation__outcome--win');
  });

  it('should display moves with correct outcomes', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <EventDrivenTablebasePanel
          fen={testFen}
          isVisible={true}
          onMoveSelect={mockOnMoveSelect}
        />
      </Wrapper>
    );

    expect(screen.getByText('e4')).toBeInTheDocument();
    expect(screen.getByText('d4')).toBeInTheDocument();
    
    const winMove = screen.getByText('+');
    const drawMove = screen.getByText('=');
    
    expect(winMove).toBeInTheDocument();
    expect(drawMove).toBeInTheDocument();
  });

  it('should call onMoveSelect when move is clicked', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <EventDrivenTablebasePanel
          fen={testFen}
          isVisible={true}
          onMoveSelect={mockOnMoveSelect}
        />
      </Wrapper>
    );

    // Find the move button by its accessible name
    const moveButton = screen.getByRole('button', { name: 'e4 + 4' });
    fireEvent.click(moveButton);

    expect(mockOnMoveSelect).toHaveBeenCalledWith({
      uci: 'e2e4',
      san: 'e4',
      outcome: 'win',
      dtm: 4,
    });
  });

  it('should emit tablebase events when event-driven', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <EventDrivenTablebasePanel
          fen={testFen}
          isVisible={true}
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(trainingEvents.emit).toHaveBeenCalledWith('tablebase:evaluation', {
        fen: testFen,
        outcome: 'win',
        dtm: 5,
        dtz: 12,
        isLoading: false,
      });

      expect(trainingEvents.emit).toHaveBeenCalledWith('tablebase:moves', {
        fen: testFen,
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
      });
    });
  });

  it('should not render when not visible', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <EventDrivenTablebasePanel
          fen={testFen}
          isVisible={false}
        />
      </Wrapper>
    );

    expect(screen.queryByText('Tablebase Analysis')).not.toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mocked(useTablebase).mockReturnValueOnce({
      evaluation: null,
      moves: null,
      isLoading: true,
      isEvaluationLoading: true,
      isMovesLoading: true,
      error: null,
    });

    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <EventDrivenTablebasePanel
          fen={testFen}
          isVisible={true}
        />
      </Wrapper>
    );

    expect(screen.getByText('Loading analysis...')).toBeInTheDocument();
    expect(screen.getByText('Tablebase Analysis')).toBeInTheDocument();
  });

  it('should show error state', () => {
    vi.mocked(useTablebase).mockReturnValueOnce({
      evaluation: null,
      moves: null,
      isLoading: false,
      isEvaluationLoading: false,
      isMovesLoading: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Position not in tablebase',
      },
    });

    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <EventDrivenTablebasePanel
          fen={testFen}
          isVisible={true}
        />
      </Wrapper>
    );

    expect(screen.getByText('Position not in tablebase')).toBeInTheDocument();
  });
});