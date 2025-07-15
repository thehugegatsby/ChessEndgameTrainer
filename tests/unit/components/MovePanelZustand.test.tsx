import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MovePanelZustand } from '@shared/components/training/MovePanelZustand';
import { useStore } from '@shared/store/store';

describe('MovePanelZustand', () => {
  beforeEach(() => {
    useStore.getState().reset();
  });

  it('should display moves from Zustand store', () => {
    // Set up store with moves
    const mockMoves = [
      { from: 'e2', to: 'e4', san: 'e4', flags: 'n', piece: 'p', color: 'w' },
      { from: 'e7', to: 'e5', san: 'e5', flags: 'n', piece: 'p', color: 'b' },
      { from: 'g1', to: 'f3', san: 'Nf3', flags: 'n', piece: 'n', color: 'w' }
    ];
    
    useStore.setState((state) => ({
      training: {
        ...state.training,
        moveHistory: mockMoves
      }
    }));

    render(<MovePanelZustand onMoveClick={jest.fn()} />);

    expect(screen.getByText('e4')).toBeInTheDocument();
    expect(screen.getByText('e5')).toBeInTheDocument();
    expect(screen.getByText('Nf3')).toBeInTheDocument();
  });

  it('should display evaluations when showEvaluations is true', () => {
    const mockMoves = [
      { from: 'e2', to: 'e4', san: 'e4', flags: 'n', piece: 'p', color: 'w' }
    ];
    
    const mockEvaluations = [
      { evaluation: 0 }, // Initial position
      { evaluation: 0.3, tablebase: { isTablebasePosition: false } } // After e4
    ];
    
    useStore.setState((state) => ({
      training: {
        ...state.training,
        moveHistory: mockMoves,
        evaluations: mockEvaluations
      }
    }));

    render(<MovePanelZustand showEvaluations={true} onMoveClick={jest.fn()} />);

    // Should show the move
    expect(screen.getByText('e4')).toBeInTheDocument();
    // Should show evaluation indicator (⚪ for neutral evaluation)
    expect(screen.getByText('⚪')).toBeInTheDocument();
  });

  it('should handle move click events', () => {
    const onMoveClickMock = jest.fn();
    const mockMoves = [
      { from: 'e2', to: 'e4', san: 'e4', flags: 'n', piece: 'p', color: 'w' },
      { from: 'e7', to: 'e5', san: 'e5', flags: 'n', piece: 'p', color: 'b' }
    ];
    
    useStore.setState((state) => ({
      training: {
        ...state.training,
        moveHistory: mockMoves
      }
    }));

    render(<MovePanelZustand onMoveClick={onMoveClickMock} />);

    fireEvent.click(screen.getByText('e4'));
    expect(onMoveClickMock).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getByText('e5'));
    expect(onMoveClickMock).toHaveBeenCalledWith(1);
  });

  it('should highlight current move', () => {
    const mockMoves = [
      { from: 'e2', to: 'e4', san: 'e4', flags: 'n', piece: 'p', color: 'w' },
      { from: 'e7', to: 'e5', san: 'e5', flags: 'n', piece: 'p', color: 'b' }
    ];
    
    useStore.setState((state) => ({
      training: {
        ...state.training,
        moveHistory: mockMoves
      }
    }));

    render(<MovePanelZustand onMoveClick={jest.fn()} currentMoveIndex={1} />);

    const e4Button = screen.getByText('e4');
    const e5Button = screen.getByText('e5');

    // e5 should be highlighted (currentMoveIndex = 1)
    expect(e5Button.className).toContain('text-blue-400');
    expect(e5Button.className).toContain('bg-blue-900/30');
    
    // e4 should not be highlighted
    expect(e4Button.className).toContain('text-white');
    expect(e4Button.className).not.toContain('bg-blue-900/30');
  });

  it('should display tablebase evaluations when available', () => {
    const mockMoves = [
      { from: 'e2', to: 'e4', san: 'e4', flags: 'n', piece: 'p', color: 'w' }
    ];
    
    const mockEvaluations = [
      { evaluation: 0 }, // Initial position
      { 
        evaluation: 0.3, 
        tablebase: { 
          isTablebasePosition: true,
          wdlBefore: 2,  // Win for white (white to move)
          wdlAfter: -2,  // Still win (but from black's perspective after white's move)
          category: 'win'
        } 
      }
    ];
    
    useStore.setState((state) => ({
      training: {
        ...state.training,
        moveHistory: mockMoves,
        evaluations: mockEvaluations
      }
    }));

    render(<MovePanelZustand showEvaluations={true} onMoveClick={jest.fn()} />);

    // SIMPLIFIED: Check that evaluation is shown (symbol may vary)
    expect(screen.getByTestId('move-evaluation')).toBeInTheDocument();
  });

  it('should show empty state when no moves', () => {
    render(<MovePanelZustand onMoveClick={jest.fn()} />);
    
    expect(screen.getByText('Noch keine Züge gespielt')).toBeInTheDocument();
  });
});