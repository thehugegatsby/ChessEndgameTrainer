/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { EngineEvaluationCard } from '@shared/components/training/DualEvaluationPanel/EngineEvaluationCard';

// Mock the useEvaluation hook
jest.mock('@shared/hooks/useEvaluation', () => ({
  useEvaluation: jest.fn()
}));

const mockUseEvaluation = require('@shared/hooks/useEvaluation').useEvaluation;

describe('EngineEvaluationCard', () => {
  const defaultProps = {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when evaluation is in progress', () => {
    mockUseEvaluation.mockReturnValue({
      lastEvaluation: null,
      isEvaluating: true,
      error: null
    });

    render(<EngineEvaluationCard {...defaultProps} />);
    
    expect(screen.getByText('Engine startet...')).toBeInTheDocument();
    expect(screen.getByText('Analysiert...')).toBeInTheDocument();
  });

  it('renders error state when evaluation fails', () => {
    mockUseEvaluation.mockReturnValue({
      lastEvaluation: null,
      isEvaluating: false,
      error: 'Engine connection failed'
    });

    render(<EngineEvaluationCard {...defaultProps} />);
    
    expect(screen.getByText(/Fehler bei der Engine-Analyse/)).toBeInTheDocument();
    expect(screen.getByText(/Engine connection failed/)).toBeInTheDocument();
  });

  it('renders evaluation results correctly', () => {
    const mockEvaluation = {
      evaluation: 150, // +1.50
      depth: 15,
      nps: 500000,
      time: 2000,
      pv: ['e2e4', 'e7e5', 'g1f3'],
      pvString: 'e2e4 e7e5 g1f3'
    };

    mockUseEvaluation.mockReturnValue({
      lastEvaluation: mockEvaluation,
      isEvaluating: false,
      error: null
    });

    render(<EngineEvaluationCard {...defaultProps} />);
    
    expect(screen.getByText('+1.50')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // depth
    expect(screen.getByText('500')).toBeInTheDocument(); // kN/s
    expect(screen.getByText('2.0s')).toBeInTheDocument(); // time
  });

  it('renders mate evaluation correctly', () => {
    const mockEvaluation = {
      evaluation: 10000,
      mateInMoves: 3,
      depth: 20,
      pv: ['Qh5+', 'g6', 'Qxf7#'],
      pvString: 'Qh5+ g6 Qxf7#'
    };

    mockUseEvaluation.mockReturnValue({
      lastEvaluation: mockEvaluation,
      isEvaluating: false,
      error: null
    });

    render(<EngineEvaluationCard {...defaultProps} />);
    
    expect(screen.getByText('M3')).toBeInTheDocument();
    expect(screen.getByText('Matt in 3')).toBeInTheDocument();
  });

  it('renders tablebase information when available', () => {
    const mockEvaluation = {
      evaluation: 0,
      depth: 10,
      tablebase: {
        isTablebasePosition: true,
        category: 'win' as const,
        dtz: 15
      },
      pv: [],
      pvString: ''
    };

    mockUseEvaluation.mockReturnValue({
      lastEvaluation: mockEvaluation,
      isEvaluating: false,
      error: null
    });

    render(<EngineEvaluationCard {...defaultProps} />);
    
    expect(screen.getByText('Tablebase-Position')).toBeInTheDocument();
    expect(screen.getByText('Gewonnen (DTZ: 15)')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    mockUseEvaluation.mockReturnValue({
      lastEvaluation: null,
      isEvaluating: false,
      error: null
    });

    const { container } = render(<EngineEvaluationCard {...defaultProps} isVisible={false} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('renders principal variation when showPrincipalVariation is true', () => {
    const mockEvaluation = {
      evaluation: 50,
      depth: 12,
      pv: ['e2e4', 'e7e5', 'g1f3'],
      pvString: 'e2e4 e7e5 g1f3'
    };

    mockUseEvaluation.mockReturnValue({
      lastEvaluation: mockEvaluation,
      isEvaluating: false,
      error: null
    });

    render(<EngineEvaluationCard {...defaultProps} showPrincipalVariation={true} />);
    
    expect(screen.getByText('Hauptvariante')).toBeInTheDocument();
  });
});