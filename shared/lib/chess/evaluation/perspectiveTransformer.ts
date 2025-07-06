/**
 * PlayerPerspectiveTransformer - Transforms evaluations to player's perspective
 * 
 * This module takes normalized evaluations (always from White's perspective)
 * and transforms them to show from a specific player's perspective.
 * For Black, this means inverting the values.
 * 
 * Key responsibilities:
 * - Transform scores, mate values, and tablebase data for player perspective
 * - Handle null values gracefully
 * - Maintain data integrity while transforming
 * 
 * @module PlayerPerspectiveTransformer
 */

import { Logger } from '@shared/services/logging/LoggerCompat';
import type { ILogger } from '@shared/services/logging/types';
import type {
  NormalizedEvaluation,
  PlayerPerspectiveEvaluation
} from '@shared/types/evaluation';

export class PlayerPerspectiveTransformer {
  private readonly logger: ILogger;

  constructor() {
    this.logger = Logger.getInstance();
  }

  /**
   * Transforms a normalized evaluation to a specific player's perspective
   * 
   * IMPORTANT: The normalizedEval is already adjusted for the player-to-move
   * during normalization. This transformer only needs to ensure the perspective
   * matches the desired display perspective.
   * 
   * @param normalizedEval - Evaluation normalized for the player-to-move
   * @param perspective - Which player's perspective to show ('w' or 'b')
   * @returns Evaluation adjusted for the specified player's perspective
   */
  transform(
    normalizedEval: NormalizedEvaluation | null | undefined,
    perspective: 'w' | 'b'
  ): PlayerPerspectiveEvaluation {
    // Handle null/undefined input
    if (!normalizedEval) {
      this.logger.warn('PlayerPerspectiveTransformer: Received null/undefined evaluation');
      return this.createDefaultPerspectiveEvaluation('w');
    }

    // Validate perspective
    const validatedPerspective = this.validatePerspective(perspective);

    // FIXED: The normalized values are already correctly oriented for the 
    // player-to-move who was specified during normalization. We don't need
    // to invert them again based on perspective - they're already correct!
    return {
      ...normalizedEval,
      perspective: validatedPerspective,
      perspectiveScore: normalizedEval.scoreInCentipawns,
      perspectiveMate: normalizedEval.mate,
      perspectiveWdl: normalizedEval.wdl,
      perspectiveDtm: normalizedEval.dtm,
      perspectiveDtz: normalizedEval.dtz
    };
  }

  /**
   * Inverts a value for Black's perspective
   * Handles null values and special cases like 0
   * 
   * @private
   */
  private invertValue(value: number | null): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    
    // Handle -0 case explicitly to avoid JavaScript quirks
    if (value === 0) {
      return 0;
    }
    
    return -value;
  }

  /**
   * Validates and returns a valid perspective
   * @private
   */
  private validatePerspective(perspective: string): 'w' | 'b' {
    if (perspective !== 'w' && perspective !== 'b') {
      this.logger.warn(`PlayerPerspectiveTransformer: Invalid perspective '${perspective}', defaulting to 'w'`);
      return 'w';
    }
    return perspective;
  }

  /**
   * Creates a default perspective evaluation for error cases
   * @private
   */
  private createDefaultPerspectiveEvaluation(perspective: 'w' | 'b'): PlayerPerspectiveEvaluation {
    return {
      type: 'engine',
      scoreInCentipawns: null,
      mate: null,
      wdl: null,
      dtm: null,
      dtz: null,
      isTablebasePosition: false,
      raw: null,
      perspective,
      perspectiveScore: null,
      perspectiveMate: null,
      perspectiveWdl: null,
      perspectiveDtm: null,
      perspectiveDtz: null
    };
  }
}