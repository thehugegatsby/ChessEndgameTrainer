import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TrainingPageZustand } from '@shared/pages/TrainingPageZustand';
import { useStore } from '@shared/store/store';
import { EndgamePosition } from '@shared/data/endgames/types';

// Mock hooks first (hoisting)
jest.mock('@shared/hooks/useToast', () => ({
  useToast: jest.fn(() => ({
    toasts: [],
    removeToast: jest.fn(),
    showSuccess: jest.fn(),
    showError: jest.fn()
  }))
}));

// Mock components
jest.mock('@shared/components/training', () => ({
  TrainingBoardZustand: ({ onComplete }: any) => (
    <div data-testid="training-board">
      <button onClick={() => onComplete(true)}>Complete Training</button>
    </div>
  ),
  MovePanelZustand: () => <div data-testid="move-panel">Move Panel</div>,
  DualEvaluationSidebar: () => <div data-testid="eval-sidebar">Eval Sidebar</div>,
  TrainingControls: () => <div data-testid="training-controls">Controls</div>,
  AnalysisPanel: () => <div data-testid="analysis-panel">Analysis</div>,
  EvaluationLegend: () => <div data-testid="eval-legend">Legend</div>
}));

jest.mock('@shared/components/navigation/AdvancedEndgameMenu', () => ({
  AdvancedEndgameMenu: () => <div data-testid="endgame-menu">Menu</div>
}));

jest.mock('@shared/components/ui/Toast', () => ({
  ToastContainer: () => null
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { id: 'test-position' },
    push: jest.fn()
  })
}));

// Mock endgames data
jest.mock('@shared/data/endgames/index', () => ({
  allEndgamePositions: [
    { id: 0 },
    { id: 1 },
    { id: 2 }
  ],
  getPositionById: jest.fn(),
  getChapterProgress: jest.fn(() => 'Test Chapter 1/3')
}));

// Mock getGameStatus
jest.mock('@shared/utils/chess/gameStatus', () => ({
  getGameStatus: jest.fn(() => ({
    status: 'in_progress',
    sideToMoveDisplay: 'White to move',
    objectiveDisplay: 'Draw'
  }))
}));

const mockPosition: EndgamePosition = {
  id: 1,
  title: 'Test Position',
  description: 'Test description',
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  category: 'pawn',
  difficulty: 'beginner',
  goal: 'draw',
  sideToMove: 'white',
  material: {
    white: 'K+P',
    black: 'K'
  },
  tags: ['basic']
};

describe('TrainingPageZustand', () => {
  beforeEach(() => {
    useStore.getState().reset();
  });

  it('should set position in Zustand store on mount', () => {
    render(<TrainingPageZustand position={mockPosition} />);

    const state = useStore.getState().training;
    expect(state.currentPosition).toEqual(mockPosition);
  });

  it('should handle training completion', () => {
    const showSuccessMock = jest.fn();
    const showErrorMock = jest.fn();
    const { useToast } = require('@shared/hooks/useToast');
    
    useToast.mockReturnValue({
      toasts: [],
      removeToast: jest.fn(),
      showSuccess: showSuccessMock,
      showError: showErrorMock
    });

    render(<TrainingPageZustand position={mockPosition} />);

    // Simulate successful completion
    fireEvent.click(screen.getByText('Complete Training'));

    expect(showSuccessMock).toHaveBeenCalledWith('Geschafft! Position erfolgreich gelöst!', 4000);
    
    const state = useStore.getState().training;
    expect(state.isGameFinished).toBe(true);
    expect(state.isSuccess).toBe(true);
  });

  it('should handle reset position', () => {
    render(<TrainingPageZustand position={mockPosition} />);

    // First make some moves
    act(() => {
      useStore.getState().makeMove({ 
        from: 'e2', 
        to: 'e4', 
        san: 'e4',
        flags: 'n',
        piece: 'p',
        color: 'w',
        captured: undefined,
        promotion: undefined,
        before: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        after: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        lan: 'e2e4',
        isCapture: () => false,
        isPromotion: () => false,
        isEnPassant: () => false,
        isKingsideCastle: () => false,
        isQueensideCastle: () => false,
        isBigPawn: () => true
      });
    });

    expect(useStore.getState().training.moveHistory).toHaveLength(1);

    // Find and click reset button
    const resetButton = screen.getByTitle('Position zurücksetzen');
    fireEvent.click(resetButton);

    const state = useStore.getState().training;
    expect(state.moveHistory).toHaveLength(0);
  });

  it('should toggle analysis panel', () => {
    render(<TrainingPageZustand position={mockPosition} />);

    const uiState = useStore.getState().ui;
    expect(uiState.analysisPanel.isOpen).toBe(false);

    // Find and click analysis toggle
    const analysisToggle = screen.getByTestId('toggle-analysis');
    fireEvent.click(analysisToggle);

    const updatedState = useStore.getState().ui;
    expect(updatedState.analysisPanel.isOpen).toBe(true);
  });

  it('should display move count', () => {
    render(<TrainingPageZustand position={mockPosition} />);

    // Add some moves
    act(() => {
      useStore.getState().makeMove({ 
        from: 'e2', to: 'e4', san: 'e4', flags: 'n', piece: 'p', color: 'w',
        captured: undefined, promotion: undefined, lan: 'e2e4',
        before: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        after: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        isCapture: () => false,
        isPromotion: () => false,
        isEnPassant: () => false,
        isKingsideCastle: () => false,
        isQueensideCastle: () => false,
        isBigPawn: () => true
      });
      useStore.getState().makeMove({ 
        from: 'e7', to: 'e5', san: 'e5', flags: 'n', piece: 'p', color: 'b',
        captured: undefined, promotion: undefined, lan: 'e7e5',
        before: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        after: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
        isCapture: () => false,
        isPromotion: () => false,
        isEnPassant: () => false,
        isKingsideCastle: () => false,
        isQueensideCastle: () => false,
        isBigPawn: () => true
      });
      useStore.getState().makeMove({ 
        from: 'g1', to: 'f3', san: 'Nf3', flags: 'n', piece: 'n', color: 'w',
        captured: undefined, promotion: undefined, lan: 'g1f3',
        before: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
        after: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
        isCapture: () => false,
        isPromotion: () => false,
        isEnPassant: () => false,
        isKingsideCastle: () => false,
        isQueensideCastle: () => false,
        isBigPawn: () => false
      });
      useStore.getState().makeMove({ 
        from: 'b8', to: 'c6', san: 'Nc6', flags: 'n', piece: 'n', color: 'b',
        captured: undefined, promotion: undefined, lan: 'b8c6',
        before: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
        after: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
        isCapture: () => false,
        isPromotion: () => false,
        isEnPassant: () => false,
        isKingsideCastle: () => false,
        isQueensideCastle: () => false,
        isBigPawn: () => false
      });
    });

    // Should show move count (4 half-moves = 2 full moves)
    expect(screen.getByText('🔥 2')).toBeInTheDocument();
  });

  it('should update navigation buttons based on position', () => {
    render(<TrainingPageZustand position={mockPosition} />);

    const prevButton = screen.getByTitle('Vorherige Position');
    const nextButton = screen.getByTitle('Nächste Position');

    expect(prevButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });
});