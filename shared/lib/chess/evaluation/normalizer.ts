/**
 * EvaluationNormalizer - Converts raw evaluation data to unified format
 * 
 * This module is responsible for normalizing evaluation data from different sources
 * (engine, tablebase) into a consistent, player-agnostic format. All values are
 * normalized to White's perspective for consistency across the application.
 * 
 * Key responsibilities:
 * - Standardize centipawn scores (always from White's perspective)
 * - Normalize mate values (positive = White wins, negative = Black wins)
 * - Convert tablebase data to consistent format
 * - Handle edge cases and invalid data gracefully
 * 
 * @module EvaluationNormalizer
 */

import type {
  EngineEvaluation,
  TablebaseResult,
  NormalizedEvaluation
} from '@shared/types/evaluation';

export class EvaluationNormalizer {

  constructor() {
  }

  /**
   * Normalizes engine evaluation data to a unified format
   * All values are normalized to White's perspective
   * 
   * @param engineData - Raw engine evaluation data
   * @param playerToMove - Which player is to move ('w' or 'b')
   * @returns Normalized evaluation from White's perspective
   */
  normalizeEngineData(
    engineData: EngineEvaluation | null | undefined,
    playerToMove: 'w' | 'b'
  ): NormalizedEvaluation {
    // Handle null/undefined data gracefully
    if (!engineData) {
      return this.createDefaultEngineEvaluation(null);
    }

    // Validate player side
    const validatedPlayer = this.validatePlayerSide(playerToMove);

    // Calculate perspective multiplier for normalization
    const perspectiveMultiplier = validatedPlayer === 'b' ? -1 : 1;

    // Determine if this is a mate position
    const isMatePosition = this.isMatePosition(engineData);

    // Create normalized evaluation
    return {
      type: 'engine',
      scoreInCentipawns: isMatePosition ? null : (engineData.score * perspectiveMultiplier),
      mate: isMatePosition ? (engineData.mate! * perspectiveMultiplier) : null,
      wdl: null,
      dtm: null,
      dtz: null,
      isTablebasePosition: false,
      raw: engineData
    };
  }

  /**
   * Normalizes tablebase result data to a unified format
   * All values are normalized to White's perspective
   * 
   * @param tablebaseData - Raw tablebase result data
   * @param playerToMove - Which player is to move ('w' or 'b')
   * @returns Normalized evaluation from White's perspective
   */
  normalizeTablebaseData(
    tablebaseData: TablebaseResult | null | undefined,
    playerToMove: 'w' | 'b'
  ): NormalizedEvaluation {
    // Handle null/undefined data gracefully
    if (!tablebaseData) {
      return this.createDefaultTablebaseEvaluation(undefined);
    }

    // Validate player side
    const validatedPlayer = this.validatePlayerSide(playerToMove);

    // Calculate perspective multiplier for normalization
    const perspectiveMultiplier = validatedPlayer === 'b' ? -1 : 1;

    // Create normalized evaluation
    return {
      type: 'tablebase',
      scoreInCentipawns: null, // Tablebase doesn't use centipawn scores
      mate: null, // Use DTM instead
      wdl: tablebaseData.wdl === 0 ? 0 : (tablebaseData.wdl * perspectiveMultiplier), // Handle -0 case
      dtm: tablebaseData.dtm === null ? null : (tablebaseData.dtm * perspectiveMultiplier),
      dtz: tablebaseData.dtz === null ? null : (tablebaseData.dtz === 0 ? 0 : tablebaseData.dtz * perspectiveMultiplier),
      isTablebasePosition: true,
      raw: tablebaseData
    };
  }

  /**
   * Validates and returns a valid player side
   * @private
   */
  private validatePlayerSide(playerSide: string): 'w' | 'b' {
    if (playerSide !== 'w' && playerSide !== 'b') {
      return 'w';
    }
    return playerSide;
  }

  /**
   * Checks if the engine evaluation represents a mate position
   * @private
   */
  private isMatePosition(engineData: EngineEvaluation): boolean {
    return engineData.mate !== null && engineData.mate !== undefined;
  }

  /**
   * Creates a default engine evaluation for error cases
   */
  private createDefaultEngineEvaluation(raw: any): NormalizedEvaluation {
    return {
      type: 'engine',
      scoreInCentipawns: 0,
      mate: null,
      wdl: null,
      dtm: null,
      dtz: null,
      isTablebasePosition: false,
      raw
    };
  }

  /**
   * Creates a default tablebase evaluation for error cases
   */
  private createDefaultTablebaseEvaluation(raw: any): NormalizedEvaluation {
    return {
      type: 'tablebase',
      scoreInCentipawns: null,
      mate: null,
      wdl: 0, // Default to draw
      dtm: null,
      dtz: null,
      isTablebasePosition: true,
      raw
    };
  }
}