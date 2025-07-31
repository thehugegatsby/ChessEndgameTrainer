/**
 * Simplified Analysis Service
 * Combines engine and tablebase evaluation in a single service
 * Based on Gemini's architecture simplification recommendation
 */

import { getSimpleEngine } from './engine/simple/SimpleEngine';
import { tablebaseService } from '@shared/services/TablebaseService';
import { Logger } from '@shared/services/logging/Logger';
import { EVALUATION } from '@shared/constants';
import { Chess } from 'chess.js';
import type { 
  TablebaseData,
  SimplifiedMoveQualityResult,
  MoveQualityType
} from '@shared/types/evaluation';

const logger = new Logger();

export interface AnalysisResult {
  // Core evaluation data
  evaluation: number;
  mateInMoves?: number;
  
  // Engine data
  engineData?: {
    depth: number;
    pv?: string;
    pvString?: string;
    multiPvResults?: Array<{
      san: string;
      score: { type: 'cp' | 'mate'; value: number };
    }>;
  };
  
  // Tablebase data
  tablebase?: TablebaseData;
  
  // Formatted display
  displayText: string;
  className: string;
}

export class AnalysisService {
  private static instance: AnalysisService;
  
  private constructor() {}
  
  static getInstance(): AnalysisService {
    if (!AnalysisService.instance) {
      AnalysisService.instance = new AnalysisService();
    }
    return AnalysisService.instance;
  }
  
  /**
   * Main analysis method - checks tablebase first, then engine
   */
  async analyzePosition(fen: string): Promise<AnalysisResult> {
    logger.info('[AnalysisService] Analyzing position', { fen: fen.slice(0, 20) + '...' });
    
    try {
      // 1. Check tablebase first (priority for endgames)
      const tablebaseResult = await this.getTablebaseAnalysis(fen);
      if (tablebaseResult) {
        logger.info('[AnalysisService] Using tablebase result');
        return tablebaseResult;
      }
      
      // 2. Fall back to engine analysis
      logger.info('[AnalysisService] No tablebase data, using engine');
      return await this.getEngineAnalysis(fen);
      
    } catch (error) {
      logger.error('[AnalysisService] Analysis failed', error);
      throw error;
    }
  }
  
  /**
   * Get best move for computer - uses engine only
   */
  async getBestMove(fen: string): Promise<string | null> {
    logger.info('[AnalysisService] Getting best move', { fen });
    
    try {
      // Use engine directly - no tablebase calls to avoid rate limiting
      // Tablebase is only for position evaluation, not move selection
      const engine = getSimpleEngine();
      const bestMove = await engine.findBestMove(fen);
      logger.info('[AnalysisService] Using engine move', { move: bestMove });
      return bestMove;
      
    } catch (error) {
      logger.error('[AnalysisService] Failed to get best move', error);
      return null;
    }
  }
  
  /**
   * Get tablebase analysis
   */
  private async getTablebaseAnalysis(fen: string): Promise<AnalysisResult | null> {
    try {
      const tablebaseResult = await tablebaseService.getEvaluation(fen);
      
      if (!tablebaseResult.isAvailable || !tablebaseResult.result) {
        return null;
      }
      
      // Get top moves
      const topMoves = await tablebaseService.getTopMoves(fen, EVALUATION.MULTI_PV_COUNT);
      
      // Format display based on DTZ
      let displayText: string;
      let className: string;
      
      const dtz = tablebaseResult.result.dtz;
      const category = tablebaseResult.result.category;
      
      if (category === 'draw' || dtz === 0) {
        displayText = 'Draw';
        className = 'draw';
      } else if (category === 'win' || (dtz !== null && dtz > 0)) {
        displayText = dtz !== null ? `Win in ${dtz}` : 'Win';
        className = 'winning';
      } else {
        displayText = dtz !== null ? `Loss in ${Math.abs(dtz)}` : 'Loss';
        className = 'losing';
      }
      
      return {
        evaluation: 0, // Tablebase positions don't have numeric eval
        displayText,
        className,
        tablebase: {
          isTablebasePosition: true,
          wdlAfter: tablebaseResult.result.wdl,
          category: tablebaseResult.result.category as 'win' | 'draw' | 'loss',
          dtz: tablebaseResult.result.dtz ?? undefined,
          topMoves: topMoves.isAvailable && topMoves.moves ? topMoves.moves.map(move => ({
            move: move.uci,
            san: move.san,
            dtz: move.dtz || 0,
            dtm: move.dtm || 0,
            wdl: move.wdl,
            category: move.category as 'win' | 'draw' | 'loss'
          })) : []
        }
      };
      
    } catch (error) {
      logger.warn('[AnalysisService] Tablebase lookup failed', error);
      return null;
    }
  }
  
  /**
   * Get engine analysis with Multi-PV
   */
  private async getEngineAnalysis(fen: string): Promise<AnalysisResult> {
    const engine = getSimpleEngine();
    
    try {
      logger.info('[AnalysisService] Starting Multi-PV evaluation', { multiPv: EVALUATION.MULTI_PV_COUNT });
      
      // Try Multi-PV evaluation
      const multiPvResult = await engine.evaluatePositionMultiPV(fen, EVALUATION.MULTI_PV_COUNT);
      
      logger.info('[AnalysisService] Multi-PV result', { 
        hasResult: !!multiPvResult,
        lineCount: multiPvResult?.lines?.length || 0 
      });
      
      if (multiPvResult && multiPvResult.lines.length > 0) {
        const bestLine = multiPvResult.lines[0];
        
        // Convert Multi-PV lines to SAN format
        const multiPvResults = await this.convertMultiPvToSan(fen, multiPvResult.lines);
        
        logger.info('[AnalysisService] Converted to SAN', { 
          moveCount: multiPvResults.length,
          moves: multiPvResults.map(m => m.san)
        });
        
        // Format display
        const isMate = bestLine.score.type === 'mate';
        const displayText = isMate 
          ? `#${Math.abs(bestLine.score.value)}`
          : `${bestLine.score.value >= 0 ? '+' : ''}${(bestLine.score.value / 100).toFixed(2)}`;
          
        const className = this.getEvaluationClass(bestLine.score.value, isMate);
        
        return {
          evaluation: bestLine.score.value,
          mateInMoves: isMate ? Math.abs(bestLine.score.value) : undefined,
          displayText,
          className,
          engineData: {
            depth: bestLine.depth,
            pv: bestLine.pv,
            pvString: bestLine.pv,
            multiPvResults
          }
        };
      }
      
    } catch (error) {
      logger.warn('[AnalysisService] Multi-PV failed, falling back to single PV', error);
    }
    
    // Fallback to single PV
    const evaluation = await engine.evaluatePosition(fen);
    if (!evaluation) {
      throw new Error('Engine evaluation failed');
    }
    
    const isMate = evaluation.score.type === 'mate';
    const displayText = isMate 
      ? `#${Math.abs(evaluation.score.value)}`
      : `${evaluation.score.value >= 0 ? '+' : ''}${(evaluation.score.value / 100).toFixed(2)}`;
      
    const className = this.getEvaluationClass(evaluation.score.value, isMate);
    
    return {
      evaluation: evaluation.score.value,
      mateInMoves: isMate ? Math.abs(evaluation.score.value) : undefined,
      displayText,
      className,
      engineData: {
        depth: evaluation.depth,
        pv: evaluation.pv,
        pvString: evaluation.pv
      }
    };
  }
  
  /**
   * Convert Multi-PV UCI moves to SAN format
   */
  private async convertMultiPvToSan(
    fen: string, 
    lines: Array<{ pv: string; score: { type: 'cp' | 'mate'; value: number } }>
  ): Promise<Array<{ san: string; score: { type: 'cp' | 'mate'; value: number } }>> {
    const results = [];
    
    for (const line of lines) {
      try {
        const chess = new Chess(fen);
        const moves = line.pv.split(' ');
        const firstMove = moves[0];
        
        if (firstMove) {
          // Convert UCI to move object
          const from = firstMove.substring(0, 2);
          const to = firstMove.substring(2, 4);
          const promotion = firstMove.length > 4 ? firstMove[4] : undefined;
          
          const move = chess.move({ from, to, promotion });
          if (move) {
            results.push({
              san: move.san,
              score: line.score
            });
          }
        }
      } catch (error) {
        logger.warn('[AnalysisService] Failed to convert move to SAN', error);
      }
    }
    
    return results;
  }
  
  /**
   * Assess move quality by comparing positions
   */
  async assessMoveQuality(
    fenBefore: string,
    move: string,
    playerPerspective: 'w' | 'b'
  ): Promise<SimplifiedMoveQualityResult> {
    try {
      // Calculate FEN after the move
      const chess = new Chess(fenBefore);
      const moveResult = chess.move(move);
      if (!moveResult) {
        return {
          quality: 'unknown',
          reason: 'Invalid move',
          isTablebaseAnalysis: false
        };
      }
      const fenAfter = chess.fen();

      // Get evaluations for both positions
      const [resultBefore, resultAfter] = await Promise.all([
        this.analyzePosition(fenBefore),
        this.analyzePosition(fenAfter)
      ]);

      // Analyze based on data type priority (tablebase > engine)
      if (resultBefore.tablebase && resultAfter.tablebase) {
        return this.analyzeTablebaseMoveQuality(
          resultBefore.tablebase,
          resultAfter.tablebase
        );
      } else {
        return this.analyzeEngineMoveQuality(
          resultBefore.evaluation,
          resultAfter.evaluation,
          playerPerspective,
          resultBefore.mateInMoves,
          resultAfter.mateInMoves
        );
      }
    } catch (error) {
      logger.error('[AnalysisService] Error in assessMoveQuality', error);
      return {
        quality: 'unknown',
        reason: 'Analysis failed',
        isTablebaseAnalysis: false
      };
    }
  }

  /**
   * Analyzes move quality based on tablebase WDL values
   */
  private analyzeTablebaseMoveQuality(
    tablebaseBefore: TablebaseData,
    tablebaseAfter: TablebaseData
  ): SimplifiedMoveQualityResult {
    const wdlBefore = tablebaseBefore.wdlAfter || 0;
    const wdlAfter = tablebaseAfter.wdlAfter || 0;
    
    // Since we're analyzing from the player's perspective who made the move,
    // we need to negate the WDL for the position after (opponent's turn)
    const wdlChange = -wdlAfter - wdlBefore;

    let quality: MoveQualityType;
    let reason: string;

    if (wdlChange > 0) {
      quality = 'excellent';
      reason = 'Optimal tablebase move';
    } else if (wdlChange === 0) {
      quality = 'good';
      reason = 'Maintains tablebase evaluation';
    } else {
      quality = 'mistake';
      reason = 'Worsens tablebase position';
    }

    return {
      quality,
      reason,
      isTablebaseAnalysis: true,
      tablebaseInfo: {
        wdlBefore,
        wdlAfter: -wdlAfter
      }
    };
  }

  /**
   * Analyzes move quality based on engine evaluation
   */
  private analyzeEngineMoveQuality(
    evalBefore: number,
    evalAfter: number,
    player: 'w' | 'b',
    mateBefore?: number,
    mateAfter?: number
  ): SimplifiedMoveQualityResult {
    // Adjust evaluations for player perspective
    const adjustedBefore = player === 'w' ? evalBefore : -evalBefore;
    const adjustedAfter = player === 'w' ? evalAfter : -evalAfter;
    
    // Since after the move it's opponent's turn, negate the evaluation
    const evalChange = -adjustedAfter - adjustedBefore;

    let quality: MoveQualityType;
    let reason: string;

    // Handle mate situations
    if (mateBefore !== undefined || mateAfter !== undefined) {
      if (mateAfter !== undefined && mateBefore === undefined) {
        quality = player === 'w' ? 
          (mateAfter > 0 ? 'blunder' : 'excellent') :
          (mateAfter < 0 ? 'blunder' : 'excellent');
        reason = 'Creates forced mate';
      } else if (mateBefore !== undefined && mateAfter === undefined) {
        quality = 'blunder';
        reason = 'Loses forced mate';
      } else {
        quality = 'good';
        reason = 'Maintains mate sequence';
      }
    } else {
      // Normal evaluation
      if (evalChange > 200) {
        quality = 'excellent';
        reason = 'Significant improvement';
      } else if (evalChange > 50) {
        quality = 'good';
        reason = 'Good move';
      } else if (evalChange > -50) {
        quality = 'good';
        reason = 'Acceptable move';
      } else if (evalChange > -200) {
        quality = 'inaccuracy';
        reason = 'Slight inaccuracy';
      } else if (evalChange > -400) {
        quality = 'mistake';
        reason = 'Clear mistake';
      } else {
        quality = 'blunder';
        reason = 'Serious blunder';
      }
    }

    return {
      quality,
      reason,
      isTablebaseAnalysis: false,
      engineInfo: {
        evalBefore: adjustedBefore,
        evalAfter: -adjustedAfter
      }
    };
  }

  private getEvaluationClass(score: number, isMate: boolean): string {
    if (isMate) {
      return score > 0 ? 'winning' : 'losing';
    }
    
    const absScore = Math.abs(score);
    if (absScore >= 200) {
      return score > 0 ? 'winning' : 'losing';
    } else if (absScore >= 50) {
      return score > 0 ? 'advantage' : 'disadvantage';
    }
    return 'equal';
  }
}

// Export singleton instance
export const analysisService = AnalysisService.getInstance();