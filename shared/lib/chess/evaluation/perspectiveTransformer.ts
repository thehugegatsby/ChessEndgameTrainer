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

import type {
  NormalizedEvaluation,
  PlayerPerspectiveEvaluation
} from '../../../types/evaluation';

export class PlayerPerspectiveTransformer {

  constructor() {
  }

  /**
   * Transforms a normalized evaluation to a specific player's perspective
   * 
   * IMPORTANT: NormalizedEvaluation values are always from White's perspective
   * (as documented in the type definition). For Black's perspective, we must
   * invert all values to show the position from Black's point of view.
   * 
   * @param normalizedEval - Evaluation normalized to White's perspective
   * @param perspective - Which player's perspective to show ('w' or 'b')
   * @returns Evaluation adjusted for the specified player's perspective
   */
  transform(
    normalizedEval: NormalizedEvaluation | null | undefined,
    perspective: 'w' | 'b'
  ): PlayerPerspectiveEvaluation {
    // Handle null/undefined input
    if (!normalizedEval) {
      return this.createDefaultPerspectiveEvaluation('w');
    }

    // Validate perspective
    const validatedPerspective = this.validatePerspective(perspective);

    // Check if we need to invert values for Black's perspective
    const shouldInvert = validatedPerspective === 'b';

    // Transform values based on perspective
    return {
      ...normalizedEval,
      perspective: validatedPerspective,
      perspectiveScore: shouldInvert 
        ? this.invertValue(normalizedEval.scoreInCentipawns)
        : normalizedEval.scoreInCentipawns,
      perspectiveMate: shouldInvert 
        ? this.invertValue(normalizedEval.mate)
        : normalizedEval.mate,
      perspectiveWdl: shouldInvert 
        ? this.invertValue(normalizedEval.wdl)
        : normalizedEval.wdl,
      perspectiveDtm: shouldInvert 
        ? this.invertValue(normalizedEval.dtm)
        : normalizedEval.dtm,
      perspectiveDtz: shouldInvert 
        ? this.invertValue(normalizedEval.dtz)
        : normalizedEval.dtz
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