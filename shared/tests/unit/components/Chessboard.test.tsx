import React from 'react';
import { render, screen } from '@testing-library/react';
import { Chessboard } from '@shared/components/chess/Chessboard';

// Mock react-chessboard, um zu prüfen, ob es mit den richtigen Props aufgerufen wird
jest.mock('react-chessboard', () => ({
  Chessboard: (props: any) => {
    return (
      <div data-testid="react-chessboard-mock" data-props={JSON.stringify(props)} />
    );
  },
}));

describe('Chessboard Component', () => {
  it('sollte react-chessboard mit der korrekten FEN-Position rendern', () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    render(<Chessboard fen={testFen} />);
    
    const mock = screen.getByTestId('react-chessboard-mock');
    const props = JSON.parse(mock.getAttribute('data-props') || '{}');
    
    expect(props.position).toBe(testFen);
  });

  it('sollte die boardWidth korrekt an react-chessboard weitergeben', () => {
    const testFen = 'start';
    const width = 500;
    render(<Chessboard fen={testFen} boardWidth={width} />);
    
    const mock = screen.getByTestId('react-chessboard-mock');
    const props = JSON.parse(mock.getAttribute('data-props') || '{}');
    
    expect(props.boardWidth).toBe(width);
  });
}); 