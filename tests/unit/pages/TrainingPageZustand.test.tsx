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

// Import chess.js for game simulation
import { Chess } from 'chess.js';

// Mock components
jest.mock('@shared/components/training', () => ({
  TrainingBoardZustand: ({ onComplete }: any) => {
    return (
      <div data-testid="training-board">
        <button onClick={() => onComplete(true)}>Complete Training</button>
      </div>
    );
  },
  MovePanelZustand: () => <div data-testid="move-panel">Move Panel</div>,
  DualEvaluationSidebar: () => <div data-testid="eval-sidebar">Eval Sidebar</div>,
  TrainingControls: () => <div data-testid="training-controls">Controls</div>,
  AnalysisPanel: () => <div data-testid="analysis-panel">Analysis</div>,
  EvaluationLegend: () => <div data-testid="eval-legend">Legend</div>,
  NavigationControls: () => <div data-testid="navigation-controls">Navigation</div>
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
      useStore.getState().makeMove({ from: 'e2', to: 'e4' });
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
      useStore.getState().makeMove({ from: 'e2', to: 'e4' });
      useStore.getState().makeMove({ from: 'e7', to: 'e5' });
      useStore.getState().makeMove({ from: 'g1', to: 'f3' });
      useStore.getState().makeMove({ from: 'b8', to: 'c6' });
    });

    // Should show move count (4 half-moves = 2 full moves)
    expect(screen.getByText('🔥 2')).toBeInTheDocument();
  });

  it('should update navigation buttons based on position', () => {
    render(<TrainingPageZustand position={mockPosition} />);

    const prevButton = screen.getByTitle('Vorherige Stellung');
    const nextButton = screen.getByTitle('Nächste Stellung');

    expect(prevButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  describe('Lichess URL generation', () => {
    it('should generate Lichess URL with FEN for initial position', () => {
      render(<TrainingPageZustand position={mockPosition} />);
      
      const lichessLink = screen.getByText('Auf Lichess analysieren →') as HTMLAnchorElement;
      const expectedUrl = 'https://lichess.org/analysis/rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR_w_KQkq_-_0_1';
      
      expect(lichessLink.href).toBe(expectedUrl);
    });

    it('should generate Lichess URL with PGN including all moves after moves are made', () => {
      render(<TrainingPageZustand position={mockPosition} />);
      
      // Make multiple moves
      act(() => {
        // 1. e4
        useStore.getState().makeMove({ from: 'e2', to: 'e4' });
        
        // 1... e5
        useStore.getState().makeMove({ from: 'e7', to: 'e5' });
      });
      
      // The URL should now include the PGN with moves
      const lichessLink = screen.getByText('Auf Lichess analysieren →') as HTMLAnchorElement;
      
      // First check if it includes the analysis/pgn path
      expect(lichessLink.href).toContain('https://lichess.org/analysis/pgn/');
      
      // Then verify the PGN is URL encoded and contains the moves
      const decodedUrl = decodeURIComponent(lichessLink.href);
      expect(decodedUrl).toContain('1. e4');
      expect(decodedUrl).toContain('e5');
    });

    it('should include complete move history in PGN, not just current position', () => {
      render(<TrainingPageZustand position={mockPosition} />);
      
      // Make 4 moves to create a move history
      act(() => {
        // Make 4 half-moves
        const moves = [
          { from: 'e2' as const, to: 'e4' as const, san: 'e4', piece: 'p' as const, color: 'w' as const },
          { from: 'e7' as const, to: 'e5' as const, san: 'e5', piece: 'p' as const, color: 'b' as const },
          { from: 'g1' as const, to: 'f3' as const, san: 'Nf3', piece: 'n' as const, color: 'w' as const },
          { from: 'b8' as const, to: 'c6' as const, san: 'Nc6', piece: 'n' as const, color: 'b' as const }
        ];
        
        moves.forEach((move) => {
          // Update store - clean move object
          useStore.getState().makeMove({
            from: move.from,
            to: move.to
          });
        });
      });
      
      const lichessLink = screen.getByText('Auf Lichess analysieren →') as HTMLAnchorElement;
      const decodedUrl = decodeURIComponent(lichessLink.href);
      
      // Should contain all moves in PGN format
      expect(decodedUrl).toContain('1. e4 e5');
      expect(decodedUrl).toContain('2. Nf3 Nc6');
    });
  });
});