import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PositionAnalysis } from '@shared/types';

// Mock dependencies - must be defined before imports
vi.mock('../TablebaseService', () => ({
  tablebaseService: {
    getEvaluation: vi.fn(),
    getTopMoves: vi.fn(),
  },
}));

vi.mock('../../utils/positionAnalysisFormatter', () => ({
  formatPositionAnalysis: vi.fn(),
}));

// Import after mocks are set up
import { analysisService } from '../AnalysisService';
import { tablebaseService } from '../../../domains/evaluation';
import { formatPositionAnalysis } from '../../utils/positionAnalysisFormatter';

// Mock logger to prevent console output during tests
vi.mock('../logging', () => ({
  getLogger: () => ({
    setContext: () => ({
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    }),
  }),
}));

describe('AnalysisService', () => {
  const TEST_FEN = '8/8/8/8/k7/8/8/K5R1 w - - 0 1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPositionAnalysis', () => {
    it('should return complete analysis for a winning position', async () => {
      // Arrange
      const rawTablebaseResult = {
        wdl: 2,
        dtz: 15,
        dtm: 8,
        category: 'win',
      };
      const topMovesResult = {
        isAvailable: true,
        moves: [
          { uci: 'g1a1', san: 'Ra1+', dtz: -14, dtm: -7, wdl: -2, category: 'loss' },
          { uci: 'g1b1', san: 'Rb1+', dtz: -12, dtm: -5, wdl: -2, category: 'loss' },
        ],
      };
      
      vi.mocked(tablebaseService).getEvaluation.mockResolvedValue({
        isAvailable: true,
        result: rawTablebaseResult,
      });
      vi.mocked(tablebaseService).getTopMoves.mockResolvedValue(topMovesResult);
      vi.mocked(formatPositionAnalysis).mockReturnValue({ 
        score: 9985, 
        isWin: true,
        displayText: 'Win in 15',
        className: 'winning' 
      });

      // Act
      const result = await analysisService.getPositionAnalysis(TEST_FEN, 5);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.evaluation).toEqual({
        fen: TEST_FEN,
        evaluation: 9985,
        mateInMoves: 15, // Math.abs(dtz)
        tablebase: {
          isTablebasePosition: true,
          wdlAfter: 2,
          category: 'win',
          dtz: 15,
          topMoves: [
            { move: 'g1a1', san: 'Ra1+', dtz: -14, dtm: -7, wdl: -2, category: 'loss' },
            { move: 'g1b1', san: 'Rb1+', dtz: -12, dtm: -5, wdl: -2, category: 'loss' },
          ],
        },
      });
      expect(result?.rawTablebaseResult).toEqual(rawTablebaseResult);

      // Verify method calls
      expect(vi.mocked(tablebaseService).getEvaluation).toHaveBeenCalledWith(TEST_FEN);
      expect(vi.mocked(tablebaseService).getTopMoves).toHaveBeenCalledWith(TEST_FEN, 5);
      expect(vi.mocked(formatPositionAnalysis)).toHaveBeenCalledWith(rawTablebaseResult);
    });

    it('should return null if tablebase data is not available', async () => {
      // Arrange
      vi.mocked(tablebaseService).getEvaluation.mockResolvedValue({ 
        isAvailable: false 
      });

      // Act
      const result = await analysisService.getPositionAnalysis(TEST_FEN);

      // Assert
      expect(result).toBeNull();
      expect(vi.mocked(tablebaseService).getTopMoves).not.toHaveBeenCalled();
      expect(vi.mocked(formatPositionAnalysis)).not.toHaveBeenCalled();
    });

    it('should return null if tablebase result is null', async () => {
      // Arrange
      vi.mocked(tablebaseService).getEvaluation.mockResolvedValue({
        isAvailable: true,
        result: null,
      });

      // Act
      const result = await analysisService.getPositionAnalysis(TEST_FEN);

      // Assert
      expect(result).toBeNull();
      expect(vi.mocked(tablebaseService).getTopMoves).not.toHaveBeenCalled();
    });

    it('should handle draw position without dtz/dtm', async () => {
      // Arrange
      const rawTablebaseResult = {
        wdl: 0,
        dtz: null,
        dtm: null,
        category: 'draw',
      };
      
      vi.mocked(tablebaseService).getEvaluation.mockResolvedValue({
        isAvailable: true,
        result: rawTablebaseResult,
      });
      vi.mocked(tablebaseService).getTopMoves.mockResolvedValue({ 
        isAvailable: true, 
        moves: [] 
      });
      vi.mocked(formatPositionAnalysis).mockReturnValue({ 
        score: 0, 
        isWin: false,
        displayText: 'Draw',
        className: 'draw'
      });

      // Act
      const result = await analysisService.getPositionAnalysis(TEST_FEN);

      // Assert
      expect(result?.evaluation.mateInMoves).toBeUndefined();
      expect(result?.evaluation.tablebase?.dtz).toBeUndefined();
      expect(result?.evaluation.tablebase?.category).toBe('draw');
      expect(result?.evaluation.tablebase?.topMoves).toEqual([]);
    });

    it('should handle unavailable top moves gracefully', async () => {
      // Arrange
      const rawTablebaseResult = { 
        wdl: 2, 
        dtz: 1, 
        dtm: 1, 
        category: 'win' 
      };
      
      vi.mocked(tablebaseService).getEvaluation.mockResolvedValue({
        isAvailable: true,
        result: rawTablebaseResult,
      });
      vi.mocked(tablebaseService).getTopMoves.mockResolvedValue({ 
        isAvailable: false, 
        moves: null 
      });
      vi.mocked(formatPositionAnalysis).mockReturnValue({ 
        score: 9999, 
        isWin: true,
        displayText: 'Win in 1',
        className: 'winning'
      });

      // Act
      const result = await analysisService.getPositionAnalysis(TEST_FEN);

      // Assert
      expect(result?.evaluation.tablebase?.topMoves).toEqual([]);
    });

    it('should calculate mateInMoves from negative DTZ value', async () => {
      // Arrange
      const rawTablebaseResult = { 
        wdl: 2, 
        dtz: -10, 
        dtm: 5, 
        category: 'win' 
      };
      
      vi.mocked(tablebaseService).getEvaluation.mockResolvedValue({
        isAvailable: true,
        result: rawTablebaseResult,
      });
      vi.mocked(tablebaseService).getTopMoves.mockResolvedValue({ 
        isAvailable: true, 
        moves: [] 
      });
      vi.mocked(formatPositionAnalysis).mockReturnValue({ 
        score: 9990, 
        isWin: true,
        displayText: 'Win in 10',
        className: 'winning'
      });

      // Act
      const result = await analysisService.getPositionAnalysis(TEST_FEN);

      // Assert
      // LINE 75: `mateInMoves: Math.abs(tablebaseResult.result.dtz)`
      expect(result?.evaluation.mateInMoves).toBe(10);
    });

    it('should not add mateInMoves when position is not winning', async () => {
      // Arrange
      const rawTablebaseResult = { 
        wdl: 0, 
        dtz: 5, 
        dtm: 5, 
        category: 'draw' 
      };
      
      vi.mocked(tablebaseService).getEvaluation.mockResolvedValue({
        isAvailable: true,
        result: rawTablebaseResult,
      });
      vi.mocked(tablebaseService).getTopMoves.mockResolvedValue({ 
        isAvailable: true, 
        moves: [] 
      });
      vi.mocked(formatPositionAnalysis).mockReturnValue({ 
        score: 0, 
        isWin: false,
        displayText: 'Draw',
        className: 'draw'
      });

      // Act
      const result = await analysisService.getPositionAnalysis(TEST_FEN);

      // Assert
      expect(result?.evaluation.mateInMoves).toBeUndefined();
    });

    it('should handle zero DTZ value', async () => {
      // Arrange
      const rawTablebaseResult = { 
        wdl: 2, 
        dtz: 0, 
        dtm: 0, 
        category: 'win' 
      };
      
      vi.mocked(tablebaseService).getEvaluation.mockResolvedValue({
        isAvailable: true,
        result: rawTablebaseResult,
      });
      vi.mocked(tablebaseService).getTopMoves.mockResolvedValue({ 
        isAvailable: true, 
        moves: [] 
      });
      vi.mocked(formatPositionAnalysis).mockReturnValue({ 
        score: 10000, 
        isWin: true,
        displayText: 'Win in 0',
        className: 'winning'
      });

      // Act
      const result = await analysisService.getPositionAnalysis(TEST_FEN);

      // Assert
      // When DTZ is 0, mateInMoves should not be set because dtz is falsy (line 74: displayData.isWin && tablebaseResult.result.dtz)
      expect(result?.evaluation.mateInMoves).toBeUndefined();
    });

    it('should use default moveLimit of 5 when not specified', async () => {
      // Arrange
      const rawTablebaseResult = { 
        wdl: 0, 
        dtz: null, 
        dtm: null, 
        category: 'draw' 
      };
      
      vi.mocked(tablebaseService).getEvaluation.mockResolvedValue({
        isAvailable: true,
        result: rawTablebaseResult,
      });
      vi.mocked(tablebaseService).getTopMoves.mockResolvedValue({ 
        isAvailable: true, 
        moves: [] 
      });
      vi.mocked(formatPositionAnalysis).mockReturnValue({ 
        score: 0, 
        isWin: false 
      });

      // Act
      await analysisService.getPositionAnalysis(TEST_FEN);

      // Assert
      expect(vi.mocked(tablebaseService).getTopMoves).toHaveBeenCalledWith(TEST_FEN, 5);
    });

    it('should propagate errors from getEvaluation', async () => {
      // Arrange
      const error = new Error('Network Error');
      vi.mocked(tablebaseService).getEvaluation.mockRejectedValue(error);

      // Act & Assert
      await expect(analysisService.getPositionAnalysis(TEST_FEN)).rejects.toThrow('Network Error');
      expect(vi.mocked(tablebaseService).getTopMoves).not.toHaveBeenCalled();
    });

    it('should propagate errors from getTopMoves', async () => {
      // Arrange
      const error = new Error('API Error');
      const rawTablebaseResult = { 
        wdl: 0, 
        dtz: 0, 
        dtm: 0, 
        category: 'draw' 
      };
      
      vi.mocked(tablebaseService).getEvaluation.mockResolvedValue({
        isAvailable: true,
        result: rawTablebaseResult,
      });
      vi.mocked(tablebaseService).getTopMoves.mockRejectedValue(error);
      vi.mocked(formatPositionAnalysis).mockReturnValue({ 
        score: 0, 
        isWin: false 
      });

      // Act & Assert
      await expect(analysisService.getPositionAnalysis(TEST_FEN)).rejects.toThrow('API Error');
    });

    it('should handle complex move transformation correctly', async () => {
      // Arrange
      const rawTablebaseResult = { 
        wdl: -2, 
        dtz: -25, 
        dtm: -20, 
        category: 'loss' 
      };
      const topMovesResult = {
        isAvailable: true,
        moves: [
          { uci: 'e2e4', san: 'e4', dtz: 24, dtm: 19, wdl: 2, category: 'win' },
          { uci: 'd2d4', san: 'd4', dtz: 22, dtm: 18, wdl: 2, category: 'win' },
        ],
      };
      
      vi.mocked(tablebaseService).getEvaluation.mockResolvedValue({
        isAvailable: true,
        result: rawTablebaseResult,
      });
      vi.mocked(tablebaseService).getTopMoves.mockResolvedValue(topMovesResult);
      vi.mocked(formatPositionAnalysis).mockReturnValue({ 
        score: -9975, 
        isWin: false,
        displayText: 'Loss in 25',
        className: 'losing'
      });

      // Act
      const result = await analysisService.getPositionAnalysis(TEST_FEN, 3);

      // Assert
      expect(result?.evaluation.tablebase?.topMoves).toEqual([
        { move: 'e2e4', san: 'e4', dtz: 24, dtm: 19, wdl: 2, category: 'win' },
        { move: 'd2d4', san: 'd4', dtz: 22, dtm: 18, wdl: 2, category: 'win' },
      ]);
    });
  });

  describe('getPositionAnalysisOrEmpty', () => {
    it('should return the evaluation when analysis is successful', async () => {
      // Arrange
      const mockAnalysisResult = {
        evaluation: { 
          fen: TEST_FEN, 
          evaluation: 9985,
          mateInMoves: 8,
          tablebase: {
            isTablebasePosition: true,
            wdlAfter: 2,
            category: 'win' as const,
            dtz: 15,
            topMoves: [],
          }
        } as PositionAnalysis,
        rawTablebaseResult: { wdl: 2, dtz: 15, dtm: 8, category: 'win' },
      };
      
      const spy = vi
        .spyOn(analysisService, 'getPositionAnalysis')
        .mockResolvedValue(mockAnalysisResult);

      // Act
      const result = await analysisService.getPositionAnalysisOrEmpty(TEST_FEN, 3);

      // Assert
      expect(result).toEqual(mockAnalysisResult.evaluation);
      expect(spy).toHaveBeenCalledWith(TEST_FEN, 3);
      
      spy.mockRestore();
    });

    it('should return empty evaluation when analysis returns null', async () => {
      // Arrange
      const spy = vi
        .spyOn(analysisService, 'getPositionAnalysis')
        .mockResolvedValue(null);

      // Act
      const result = await analysisService.getPositionAnalysisOrEmpty(TEST_FEN, 2);

      // Assert
      expect(result).toEqual({
        fen: TEST_FEN,
        evaluation: 0,
      });
      expect(result.tablebase).toBeUndefined();
      expect(spy).toHaveBeenCalledWith(TEST_FEN, 2);
      
      spy.mockRestore();
    });

    it('should use default moveLimit of 5 when not specified', async () => {
      // Arrange
      const spy = vi
        .spyOn(analysisService, 'getPositionAnalysis')
        .mockResolvedValue(null);

      // Act
      await analysisService.getPositionAnalysisOrEmpty(TEST_FEN);

      // Assert
      expect(spy).toHaveBeenCalledWith(TEST_FEN, 5);
      
      spy.mockRestore();
    });

    it('should propagate errors from getPositionAnalysis', async () => {
      // Arrange
      const error = new Error('Internal Server Error');
      const spy = vi
        .spyOn(analysisService, 'getPositionAnalysis')
        .mockRejectedValue(error);

      // Act & Assert
      await expect(analysisService.getPositionAnalysisOrEmpty(TEST_FEN)).rejects.toThrow(
        'Internal Server Error'
      );
      
      spy.mockRestore();
    });

    it('should handle async errors gracefully', async () => {
      // Arrange
      const error = new Error('Timeout Error');
      const spy = vi
        .spyOn(analysisService, 'getPositionAnalysis')
        .mockRejectedValue(error);

      // Act & Assert
      await expect(analysisService.getPositionAnalysisOrEmpty(TEST_FEN, 1)).rejects.toThrow(
        'Timeout Error'
      );
      
      spy.mockRestore();
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle empty FEN string gracefully', async () => {
      // Arrange
      const error = new Error('Invalid FEN');
      vi.mocked(tablebaseService).getEvaluation.mockRejectedValue(error);

      // Act & Assert
      await expect(analysisService.getPositionAnalysis('')).rejects.toThrow('Invalid FEN');
    });

    it('should handle moveLimit edge cases', async () => {
      // Arrange
      const rawTablebaseResult = { wdl: 0, dtz: null, dtm: null, category: 'draw' };
      vi.mocked(tablebaseService).getEvaluation.mockResolvedValue({
        isAvailable: true,
        result: rawTablebaseResult,
      });
      vi.mocked(tablebaseService).getTopMoves.mockResolvedValue({ isAvailable: true, moves: [] });
      vi.mocked(formatPositionAnalysis).mockReturnValue({ score: 0, isWin: false });

      // Act
      await analysisService.getPositionAnalysis(TEST_FEN, 0);

      // Assert
      expect(vi.mocked(tablebaseService).getTopMoves).toHaveBeenCalledWith(TEST_FEN, 0);
    });

    it('should handle missing optional fields in tablebase result', async () => {
      // Arrange
      const rawTablebaseResult = { 
        wdl: 1, 
        dtz: null,  // Missing DTZ
        category: 'cursed-win' 
        // Missing DTM field entirely
      };
      
      vi.mocked(tablebaseService).getEvaluation.mockResolvedValue({
        isAvailable: true,
        result: rawTablebaseResult,
      });
      vi.mocked(tablebaseService).getTopMoves.mockResolvedValue({ isAvailable: true, moves: [] });
      vi.mocked(formatPositionAnalysis).mockReturnValue({ 
        score: 8000, 
        isWin: true,
        displayText: 'Cursed win',
        className: 'winning'
      });

      // Act
      const result = await analysisService.getPositionAnalysis(TEST_FEN);

      // Assert
      expect(result?.evaluation.tablebase?.dtz).toBeUndefined();
      expect(result?.evaluation.mateInMoves).toBeUndefined(); // No mateInMoves when DTZ is null
      expect(result?.evaluation.tablebase?.category).toBe('cursed-win');
    });
  });
});