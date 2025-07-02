import { renderHook, act } from '@testing-library/react';
import { useAnalysisData } from '../useAnalysisData';
import { AnalysisData } from '@shared/types/analysisTypes';

describe('useAnalysisData - Comprehensive Coverage', () => {
  it('sollte initial state korrekt setzen', () => {
    const { result } = renderHook(() => useAnalysisData());

    expect(result.current.analysisData).toBeNull();
    expect(result.current.setAnalysisData).toBeInstanceOf(Function);
  });

  it('sollte analysisData setzen können', () => {
    const { result } = renderHook(() => useAnalysisData());
    
    const mockAnalysisData: AnalysisData = {
      scenarioId: 'test-scenario-1',
      initialFEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      playedMoves: ['e2e4', 'e7e5']
    };

    act(() => {
      result.current.setAnalysisData(mockAnalysisData);
    });

    expect(result.current.analysisData).toEqual(mockAnalysisData);
  });

  it('sollte analysisData auf null zurücksetzen können', () => {
    const { result } = renderHook(() => useAnalysisData());
    
    const mockAnalysisData: AnalysisData = {
      scenarioId: 'test-scenario-2',
      initialFEN: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
      playedMoves: ['Kf6', 'Kf8']
    };

    // Erst setzen
    act(() => {
      result.current.setAnalysisData(mockAnalysisData);
    });

    expect(result.current.analysisData).toEqual(mockAnalysisData);

    // Dann zurücksetzen
    act(() => {
      result.current.setAnalysisData(null);
    });

    expect(result.current.analysisData).toBeNull();
  });

  it('sollte verschiedene AnalysisData Strukturen handhaben', () => {
    const { result } = renderHook(() => useAnalysisData());
    
    const complexAnalysisData: AnalysisData = {
      scenarioId: 'complex-scenario',
      initialFEN: '2K1k3/2P5/8/8/8/6R1/1r6/8 w - - 0 1',
      playedMoves: ['Rg4', 'Rb1+', 'Kd7', 'Rb7'],
      mistakeIndex: 2,
      correctLine: ['Rg4', 'Rb1+', 'Rc4', 'Rb7+'],
      evaluations: [150, -50, 300, 500]
    };

    act(() => {
      result.current.setAnalysisData(complexAnalysisData);
    });

    expect(result.current.analysisData).toEqual(complexAnalysisData);
    expect(result.current.analysisData?.mistakeIndex).toBe(2);
    expect(result.current.analysisData?.evaluations).toHaveLength(4);
  });

  it('sollte multiple updates handhaben', () => {
    const { result } = renderHook(() => useAnalysisData());
    
    const analysisData1: AnalysisData = {
      scenarioId: 'scenario-1',
      initialFEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      playedMoves: ['e2e4']
    };

    const analysisData2: AnalysisData = {
      scenarioId: 'scenario-2',
      initialFEN: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      playedMoves: ['e2e4', 'e7e5']
    };

    // Erstes Update
    act(() => {
      result.current.setAnalysisData(analysisData1);
    });

    expect(result.current.analysisData).toEqual(analysisData1);

    // Zweites Update
    act(() => {
      result.current.setAnalysisData(analysisData2);
    });

    expect(result.current.analysisData).toEqual(analysisData2);
    expect(result.current.analysisData?.scenarioId).toBe('scenario-2');
  });

  it('sollte return type korrekt typisiert sein', () => {
    const { result } = renderHook(() => useAnalysisData());
    
    // Type assertions to ensure correct TypeScript types
    expect(typeof result.current.setAnalysisData).toBe('function');
    expect(result.current.analysisData).toBeNull();
    
    const mockData: AnalysisData = {
      scenarioId: 'type-test',
      initialFEN: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1',
      playedMoves: ['d2d4']
    };

    act(() => {
      result.current.setAnalysisData(mockData);
    });

    expect(result.current.analysisData).not.toBeNull();
    expect(result.current.analysisData?.scenarioId).toBe('type-test');
  });
}); 