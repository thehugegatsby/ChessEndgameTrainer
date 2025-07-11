/**
 * @fileoverview Evaluation Service for Chess Analysis
 * @version 1.0.0
 * @description Handles position evaluation, mistake detection, and analysis
 * Optimized for mobile performance and Android compatibility
 */

import type { Engine } from '../engine/index';
import { tablebaseService } from '../tablebase';
import { getLogger } from '@shared/services/logging';
import type { 
  EngineEvaluation, 
  DeepAnalysisResult, 
  DualEvaluation,
  SCENARIO_CONFIG
} from './types';

const { CRITICAL_MISTAKE_THRESHOLD, TABLEBASE_LIMIT_CP } = require('./types').SCENARIO_CONFIG;

/**
 * Service for handling chess position evaluation and analysis
 * Designed with mobile performance in mind
 */
export class EvaluationService {
  private engine: Engine;

  constructor(engine: Engine) {
    this.engine = engine;
  }

  /**
   * Determines if a move is a critical mistake
   * Optimized algorithm for mobile devices
   */
  async isCriticalMistake(fenBefore: string, fenAfter: string): Promise<boolean> {
    try {
      const [evalBefore, evalAfter] = await Promise.all([
        this.engine.evaluatePosition(fenBefore),
        this.engine.evaluatePosition(fenAfter)
      ]);

      // Perspective correction for move evaluation
      const evalAfterCorrected = this.correctPerspective(
        evalBefore, evalAfter, fenBefore, fenAfter
      );

      // Special handling for tablebase positions
      if (this.areBothTablebaseScores(evalBefore, evalAfterCorrected)) {
        return await this.analyzeTablebaseTransition(fenBefore, fenAfter);
      }

      // Check for sign flip (winning → losing)
      if (this.hasSignFlip(evalBefore, evalAfterCorrected)) {
        return true;
      }

      // Mate analysis
      const mateAnalysis = this.analyzeMateTransition(evalBefore, evalAfterCorrected);
      if (mateAnalysis !== null) {
        return mateAnalysis;
      }

      // Score drop analysis
      return this.hasSignificantScoreDrop(evalBefore, evalAfterCorrected);

    } catch (error) {
      const logger = getLogger();
      logger.warn('[EvaluationService] Mistake analysis failed:', error);
      return false;
    }
  }

  /**
   * Corrects evaluation perspective based on side to move
   * IMPORTANT: Engine returns evaluations from the perspective of the side to move!
   * Based on CHESS_ENGINE_EVALUATION_LEARNINGS.md
   */
  private correctPerspective(
    evalBefore: EngineEvaluation,
    evalAfter: EngineEvaluation,
    fenBefore: string,
    fenAfter: string
  ): EngineEvaluation {
    const sideToMoveAfter = fenAfter.split(' ')[1]; // 'w' or 'b'
    
    // Engine gives evaluation from perspective of side to move
    // If Black is to move, negate to get White's perspective
    if (sideToMoveAfter === 'b') {
      return {
        score: -evalAfter.score,
        mate: evalAfter.mate ? -evalAfter.mate : null
      };
    }
    
    // White to move - evaluation already from White's perspective
    return evalAfter;
  }

  /**
   * Checks if both evaluations are tablebase scores
   */
  private areBothTablebaseScores(evalBefore: EngineEvaluation, evalAfter: EngineEvaluation): boolean {
    return Math.abs(evalBefore.score) >= TABLEBASE_LIMIT_CP && 
           Math.abs(evalAfter.score) >= TABLEBASE_LIMIT_CP;
  }

  /**
   * Analyzes transitions between tablebase positions
   */
  private async analyzeTablebaseTransition(fenBefore: string, fenAfter: string): Promise<boolean> {
    try {
      const deeperAnalysis = await Promise.race([
        this.analyzePositionDeeply(fenBefore, fenAfter),
        new Promise<DeepAnalysisResult>((_, reject) => 
          setTimeout(() => reject(new Error('Deep analysis timeout')), 3000)
        )
      ]);
      
      return deeperAnalysis.isBlunder;
    } catch (error) {
      const logger = getLogger();
      logger.warn('[EvaluationService] Deep analysis timed out:', error);
      return false;
    }
  }

  /**
   * Checks for evaluation sign flip (winning to losing)
   */
  private hasSignFlip(evalBefore: EngineEvaluation, evalAfter: EngineEvaluation): boolean {
    return evalBefore.score * evalAfter.score < 0;
  }

  /**
   * Analyzes mate transitions
   * Returns: true = mistake, false = not mistake, null = continue analysis
   */
  private analyzeMateTransition(evalBefore: EngineEvaluation, evalAfter: EngineEvaluation): boolean | null {
    // Both have mate for player - not a blunder
    if (evalBefore.mate && evalBefore.mate > 0 && 
        evalAfter.mate && evalAfter.mate > 0) {
      return false;
    }

    // Lost mate advantage
    if (evalBefore.mate && evalBefore.mate > 0 && 
        (!evalAfter.mate || evalAfter.mate <= 0)) {
      return true;
    }

    // Now facing mate
    if ((!evalBefore.mate || evalBefore.mate >= 0) && 
        (evalAfter.mate && evalAfter.mate < 0)) {
      return true;
    }

    // Mate involved but not critical
    if (evalBefore.mate || evalAfter.mate) {
      return false;
    }

    // Continue with score analysis
    return null;
  }

  /**
   * Checks for significant score drop
   */
  private hasSignificantScoreDrop(evalBefore: EngineEvaluation, evalAfter: EngineEvaluation): boolean {
    const evalDrop = evalBefore.score - evalAfter.score;
    return evalDrop > CRITICAL_MISTAKE_THRESHOLD;
  }

  /**
   * Deep position analysis for complex cases
   */
  private async analyzePositionDeeply(fenBefore: string, fenAfter: string): Promise<DeepAnalysisResult> {
    // Placeholder for deep analysis implementation
    // This would involve more sophisticated evaluation techniques
    return {
      isBlunder: false,
      reason: 'Deep analysis not yet implemented'
    };
  }

  /**
   * Gets dual evaluation (engine + tablebase)
   * FIXED: Now applies perspective correction for consistent White's perspective
   */
  async getDualEvaluation(fen: string): Promise<DualEvaluation> {
    try {
      // Get engine evaluation
      const rawEngineEval = await this.engine.evaluatePosition(fen);
      
      // Apply perspective correction for engine evaluation
      const sideToMove = fen.split(' ')[1]; // 'w' or 'b'
      let correctedEngineEval = rawEngineEval;
      
      if (sideToMove === 'b') {
        // Black to move - negate score to get White's perspective
        correctedEngineEval = {
          score: -rawEngineEval.score,
          mate: rawEngineEval.mate ? -rawEngineEval.mate : null
        };
      }
      
      const engineEvaluation = this.formatEngineEvaluation(correctedEngineEval.score, correctedEngineEval.mate);

      // Get tablebase evaluation if available
      let tablebaseEval = undefined;
      try {
        const tbResult = await tablebaseService.queryPosition(fen);
        if (tbResult && tbResult.isTablebasePosition && tbResult.result) {
          let correctedTbResult = { ...tbResult.result };
          
          // Apply perspective correction for tablebase WDL
          if (sideToMove === 'b') {
            // Black to move - correct WDL and DTZ to White's perspective
            correctedTbResult.wdl = -(tbResult.result.wdl || 0);
            correctedTbResult.dtz = tbResult.result.dtz ? -tbResult.result.dtz : null;
            
            // Correct category for Black to move
            const categoryMap: Record<string, string> = {
              'win': 'loss',
              'loss': 'win',
              'cursed-win': 'blessed-loss',
              'blessed-loss': 'cursed-win',
              'draw': 'draw'
            };
            
            if (categoryMap[tbResult.result.category]) {
              correctedTbResult.category = categoryMap[tbResult.result.category] as any;
            }
          }
          
          tablebaseEval = {
            isAvailable: true,
            result: {
              wdl: correctedTbResult.wdl || 0,
              dtz: correctedTbResult.dtz || undefined,
              category: correctedTbResult.category || 'draw',
              precise: correctedTbResult.precise || false
            },
            evaluation: this.formatTablebaseEvaluation(correctedTbResult)
          };
        }
      } catch (error) {
        const logger = getLogger();
        logger.warn('[EvaluationService] Tablebase probe failed:', error);
      }


      return {
        engine: {
          score: correctedEngineEval.score,
          mate: correctedEngineEval.mate,
          evaluation: engineEvaluation
        },
        tablebase: tablebaseEval
      };

    } catch (error) {
      const logger = getLogger();
      logger.warn('[EvaluationService] Dual evaluation failed:', error);
      
      // Return fallback evaluation
      return {
        engine: {
          score: 0,
          mate: null,
          evaluation: 'Evaluation unavailable'
        }
      };
    }
  }

  /**
   * Formats engine evaluation for display
   * Mobile-optimized formatting
   */
  private formatEngineEvaluation(score: number, mate: number | null): string {
    if (mate !== null) {
      return mate > 0 ? `M${mate}` : `M${mate}`;
    }
    
    const value = score / 100;
    return value >= 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
  }

  /**
   * Formats tablebase evaluation for display
   */
  private formatTablebaseEvaluation(result: any): string {
    switch (result.category) {
      case 'win':
        return result.dtz ? `Win in ${result.dtz}` : 'Win';
      case 'loss':
        return result.dtz ? `Loss in ${result.dtz}` : 'Loss';
      case 'draw':
        return 'Draw';
      case 'cursed-win':
        return 'Cursed Win';
      case 'blessed-loss':
        return 'Blessed Loss';
      default:
        return 'Unknown';
    }
  }
} 