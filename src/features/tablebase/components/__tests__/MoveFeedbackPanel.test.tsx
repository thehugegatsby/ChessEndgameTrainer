import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MoveFeedbackPanel } from '../MoveFeedbackPanel';
import { trainingEvents } from '../../../training/events/EventEmitter';

// Mock store - must be hoisted before imports
vi.mock('@shared/store/rootStore', () => ({
  useStore: vi.fn(() => ({ 
    ui: { 
      tablebaseData: {
        fen: 'test-fen',
        evaluation: { outcome: 'win', dtm: 5 },
        moves: [
          { uci: 'e2e4', san: 'e4', outcome: 'win', dtm: 4 },
          { uci: 'd2d4', san: 'd4', outcome: 'draw' },
          { uci: 'g1f3', san: 'Nf3', outcome: 'loss', dtm: -8 },
        ],
        isLoading: false,
        lastUpdated: Date.now(),
      }
    } 
  })),
}));

// Mock training hooks
vi.mock('../../../training/hooks/useEventDrivenTraining', () => ({
  useEventDrivenTraining: vi.fn(() => true),
}));

// Mock the useTrainingEvent hook
vi.mock('../../../training/components/TrainingEventListener', () => ({
  useTrainingEvent: vi.fn(),
}));

describe('MoveFeedbackPanel', () => {
  const mockOnMoveSelect = vi.fn();
  const mockOnShowSuggestions = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when no feedback data', () => {
    render(
      <MoveFeedbackPanel
        isVisible={true}
        onMoveSelect={mockOnMoveSelect}
      />
    );

    expect(screen.queryByText('Move Feedback')).not.toBeInTheDocument();
  });

  it('should render success feedback correctly', async () => {
    render(
      <MoveFeedbackPanel
        isVisible={true}
        onMoveSelect={mockOnMoveSelect}
      />
    );

    // Trigger a success event
    triggerMoveEvent({
      type: 'success',
      wasOptimal: true,
      wdlBefore: 1,
      wdlAfter: 1,
      playedMove: 'e4',
    });

    await waitFor(() => {
      expect(screen.getByText('Move Feedback')).toBeInTheDocument();
      expect(screen.getByText('Perfect move!')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });

  it('should render warning feedback with alternatives', async () => {
    render(
      <MoveFeedbackPanel
        isVisible={true}
        onMoveSelect={mockOnMoveSelect}
        onShowSuggestions={mockOnShowSuggestions}
      />
    );

    // Trigger a warning event
    triggerMoveEvent({
      type: 'warning',
      wasOptimal: false,
      wdlBefore: 1,
      wdlAfter: 0,
      playedMove: 'Nf3',
      bestMove: 'e4',
    });

    await waitFor(() => {
      expect(screen.getByText('Suboptimal move. There was a better option.')).toBeInTheDocument();
      expect(screen.getByText('⚠')).toBeInTheDocument();
      expect(screen.getByText('Alternative moves:')).toBeInTheDocument();
      expect(screen.getByText('Show all')).toBeInTheDocument();
    });
  });

  it('should render error feedback', async () => {
    render(
      <MoveFeedbackPanel
        isVisible={true}
        onMoveSelect={mockOnMoveSelect}
      />
    );

    // Trigger an error event
    triggerMoveEvent({
      type: 'error',
      wasOptimal: false,
      wdlBefore: 1,
      wdlAfter: -1,
      playedMove: 'Nf3',
      bestMove: 'e4',
    });

    await waitFor(() => {
      expect(screen.getByText('This move loses the position!')).toBeInTheDocument();
      expect(screen.getByText('✗')).toBeInTheDocument();
    });
  });

  it('should show evaluation change', async () => {
    render(
      <MoveFeedbackPanel
        isVisible={true}
        onMoveSelect={mockOnMoveSelect}
      />
    );

    // Trigger event with evaluation change
    triggerMoveEvent({
      type: 'warning',
      wasOptimal: false,
      wdlBefore: 1,
      wdlAfter: 0,
      playedMove: 'Nf3',
    });

    await waitFor(() => {
      expect(screen.getByText('Position evaluation:')).toBeInTheDocument();
      expect(screen.getByText('Win')).toBeInTheDocument();
      expect(screen.getByText('Draw')).toBeInTheDocument();
      expect(screen.getByText('→')).toBeInTheDocument();
    });
  });

  it('should display played and best moves', async () => {
    render(
      <MoveFeedbackPanel
        isVisible={true}
        onMoveSelect={mockOnMoveSelect}
      />
    );

    triggerMoveEvent({
      type: 'warning',
      wasOptimal: false,
      playedMove: 'Nf3',
      bestMove: 'e4',
    });

    await waitFor(() => {
      expect(screen.getByText('Played:')).toBeInTheDocument();
      expect(screen.getByText('Nf3')).toBeInTheDocument();
      expect(screen.getByText('Best:')).toBeInTheDocument();
      expect(screen.getByText('e4')).toBeInTheDocument();
    });
  });

  it('should handle move selection from suggestions', async () => {
    render(
      <MoveFeedbackPanel
        isVisible={true}
        onMoveSelect={mockOnMoveSelect}
      />
    );

    triggerMoveEvent({
      type: 'warning',
      wasOptimal: false,
      playedMove: 'Nf3',
    });

    await waitFor(() => {
      const suggestionButton = screen.getByRole('button', { name: /e4 leads to win/ });
      fireEvent.click(suggestionButton);
    });

    expect(mockOnMoveSelect).toHaveBeenCalledWith({
      uci: 'e2e4',
      san: 'e4',
      outcome: 'win',
      dtm: 4,
    });
  });

  it('should handle show suggestions callback', async () => {
    render(
      <MoveFeedbackPanel
        isVisible={true}
        onShowSuggestions={mockOnShowSuggestions}
      />
    );

    triggerMoveEvent({
      type: 'warning',
      wasOptimal: false,
      playedMove: 'Nf3',
    });

    await waitFor(() => {
      const showAllButton = screen.getByText('Show all');
      fireEvent.click(showAllButton);
    });

    expect(mockOnShowSuggestions).toHaveBeenCalled();
  });

  it('should allow closing feedback panel', async () => {
    render(
      <MoveFeedbackPanel
        isVisible={true}
        onMoveSelect={mockOnMoveSelect}
      />
    );

    triggerMoveEvent({
      type: 'success',
      wasOptimal: true,
    });

    await waitFor(() => {
      expect(screen.getByText('Move Feedback')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('Close feedback');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Move Feedback')).not.toBeInTheDocument();
    });
  });

  it('should not render when not visible', async () => {
    render(
      <MoveFeedbackPanel
        isVisible={false}
        onMoveSelect={mockOnMoveSelect}
      />
    );

    triggerMoveEvent({
      type: 'success',
      wasOptimal: true,
    });

    // Wait a bit to ensure it doesn't appear
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(screen.queryByText('Move Feedback')).not.toBeInTheDocument();
  });
});