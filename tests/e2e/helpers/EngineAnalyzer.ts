/**
 * @fileoverview EngineAnalyzer implementation for E2E test engine interaction
 * @description Provides high-level chess engine analysis capabilities
 */

import { IEngineAnalyzer } from './IEngineAnalyzer';
import { AnalysisResult, AnalysisOptions } from './types';
import { EngineAnalyzerDependencies } from '../interfaces/driver-dependencies';
import { validateFEN } from '../utils/chess-utils';

export class EngineAnalyzer implements IEngineAnalyzer {
  private analysisCache = new Map<string, AnalysisResult>();

  constructor(private dependencies: EngineAnalyzerDependencies) {}

  /**
   * Analyze a position
   */
  async analyzePosition(fen: string, options?: AnalysisOptions): Promise<AnalysisResult> {
    // Validate FEN
    const fenResult = validateFEN(fen);
    if (!fenResult.isOk) {
      throw new Error(`Invalid FEN for analysis: ${fenResult.error.message}`);
    }

    // Check cache
    const cacheKey = `${fenResult.value}-${JSON.stringify(options)}`;
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    try {
      // Wait for any ongoing analysis to complete
      await this.waitForEngine();

      // Get engine evaluation
      const engineData = await this.dependencies.evaluationPanel.getEvaluationInfo();

      // Convert to AnalysisResult format
      const result: AnalysisResult = {
        bestMove: engineData.bestMove || '',
        evaluation: engineData.evaluation,
        depth: engineData.depth,
        lines: [{
          move: engineData.bestMove || '',
          evaluation: engineData.evaluation,
          continuation: [] // Would need more engine integration for full lines
        }],
        isBookMove: false, // Would need opening book integration
        isMate: engineData.isMate || false,
        mateIn: engineData.mateDistance
      };

      // Cache result
      this.analysisCache.set(cacheKey, result);

      return result;
    } catch (error) {
      await this.dependencies.errorHandler(
        'EngineAnalyzer.analyzePosition',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Compare two positions
   */
  async comparePositions(fen1: string, fen2: string): Promise<{
    evalDifference: number;
    betterPosition: 'first' | 'second' | 'equal';
    reason: string;
  }> {
    try {
      // Analyze both positions
      const [eval1, eval2] = await Promise.all([
        this.analyzePosition(fen1),
        this.analyzePosition(fen2)
      ]);

      const evalDifference = eval2.evaluation - eval1.evaluation;
      
      let betterPosition: 'first' | 'second' | 'equal';
      let reason: string;

      if (Math.abs(evalDifference) < 10) { // Less than 0.1 pawn
        betterPosition = 'equal';
        reason = 'Positions are approximately equal';
      } else if (evalDifference > 0) {
        betterPosition = 'second';
        reason = `Second position is better by ${(evalDifference / 100).toFixed(2)} pawns`;
      } else {
        betterPosition = 'first';
        reason = `First position is better by ${(Math.abs(evalDifference) / 100).toFixed(2)} pawns`;
      }

      // Check for mate situations
      if (eval1.isMate && eval1.mateIn) {
        if (eval1.mateIn > 0) {
          betterPosition = 'first';
          reason = `First position has mate in ${eval1.mateIn}`;
        } else {
          betterPosition = 'second';
          reason = `First position is getting mated in ${Math.abs(eval1.mateIn)}`;
        }
      } else if (eval2.isMate && eval2.mateIn) {
        if (eval2.mateIn > 0) {
          betterPosition = 'second';
          reason = `Second position has mate in ${eval2.mateIn}`;
        } else {
          betterPosition = 'first';
          reason = `Second position is getting mated in ${Math.abs(eval2.mateIn)}`;
        }
      }

      return { evalDifference, betterPosition, reason };
    } catch (error) {
      await this.dependencies.errorHandler(
        'EngineAnalyzer.comparePositions',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Find best move sequence
   */
  async findBestLine(fen: string, depth: number): Promise<string[]> {
    try {
      const analysis = await this.analyzePosition(fen, { depth });
      
      // For now, return just the best move
      // Full implementation would require multi-PV analysis
      if (analysis.bestMove) {
        return [analysis.bestMove];
      }
      
      return [];
    } catch (error) {
      await this.dependencies.errorHandler(
        'EngineAnalyzer.findBestLine',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Assess position from a player's perspective
   */
  async assessPosition(fen: string, forWhite: boolean): Promise<{
    assessment: 'winning' | 'better' | 'equal' | 'worse' | 'losing';
    evaluation: number;
    confidence: 'low' | 'medium' | 'high';
  }> {
    try {
      const analysis = await this.analyzePosition(fen);
      
      // Adjust evaluation based on perspective
      const evalValue = forWhite ? analysis.evaluation : -analysis.evaluation;
      
      let assessment: 'winning' | 'better' | 'equal' | 'worse' | 'losing';
      let confidence: 'low' | 'medium' | 'high';

      // Determine assessment based on evaluation
      if (analysis.isMate && analysis.mateIn) {
        assessment = analysis.mateIn > 0 ? 'winning' : 'losing';
        confidence = 'high';
      } else if (evalValue > 500) {
        assessment = 'winning';
        confidence = evalValue > 1000 ? 'high' : 'medium';
      } else if (evalValue > 150) {
        assessment = 'better';
        confidence = evalValue > 300 ? 'high' : 'medium';
      } else if (evalValue > -150) {
        assessment = 'equal';
        confidence = Math.abs(evalValue) < 50 ? 'high' : 'medium';
      } else if (evalValue > -500) {
        assessment = 'worse';
        confidence = evalValue < -300 ? 'high' : 'medium';
      } else {
        assessment = 'losing';
        confidence = evalValue < -1000 ? 'high' : 'medium';
      }

      // Lower confidence for shallow analysis
      if (analysis.depth < 10) {
        confidence = 'low';
      } else if (analysis.depth < 15 && confidence === 'high') {
        confidence = 'medium';
      }

      return {
        assessment,
        evaluation: analysis.evaluation,
        confidence
      };
    } catch (error) {
      await this.dependencies.errorHandler(
        'EngineAnalyzer.assessPosition',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Wait for engine to be ready
   */
  async waitForEngine(timeout: number = 5000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const isThinking = await this.isAnalyzing();
      if (!isThinking) {
        return;
      }
      
      // Wait a bit before checking again
      await this.dependencies.page.waitForTimeout(100);
    }
    
    throw new Error(`Engine did not become ready within ${timeout}ms`);
  }

  /**
   * Check if engine is currently analyzing
   */
  async isAnalyzing(): Promise<boolean> {
    try {
      return await this.dependencies.evaluationPanel.isThinking();
    } catch (error) {
      this.dependencies.logger.warn('Failed to check engine status', error);
      return false;
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    // Clear the analysis cache
    this.analysisCache.clear();
  }
}