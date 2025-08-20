/**
 * @file Move validation and evaluation processing hook
 * @module hooks/useMoveValidation
 *
 * @description
 * Custom hook that encapsulates evaluation processing and analysis status
 * management for chess training. Extracted from TrainingBoard to separate
 * evaluation concerns from UI rendering.
 *
 * @remarks
 * Key responsibilities:
 * - Evaluation deduplication using processedEvaluationsRef
 * - Analysis status synchronization with tablebase store
 * - Safe handling of tablebase actions availability
 * - Evaluation update coordination
 *
 * This hook maintains evaluation processing logic while providing
 * a clean interface for move validation and analysis management.
 *
 * @example
 * ```tsx
 * const moveValidation = useMoveValidation({
 *   lastEvaluation,
 *   currentFen,
 *   evaluations,
 *   isEvaluating,
 *   tablebaseState,
 *   tablebaseActions
 * });
 *
 * // Hook handles evaluation processing and status updates internally
 * ```
 */

import { useEffect, useRef, useState } from 'react';
import { type PositionAnalysis } from '@shared/types';
import { getLogger } from '@shared/services/logging';
import { STRING_CONSTANTS } from '@shared/constants/multipliers';

/**
 * Configuration options for move validation hook
 *
 * @interface UseMoveValidationOptions
 * @description Options for configuring move validation behavior
 */
export interface UseMoveValidationOptions {
  /** Last evaluation from position analysis */
  lastEvaluation: PositionAnalysis | null | undefined;
  /** Current FEN position */
  currentFen: string | undefined;
  /** Array of evaluations */
  evaluations: PositionAnalysis[] | undefined;
  /** Whether evaluation is in progress */
  isEvaluating: boolean;
  /** Tablebase store state */
  tablebaseState: {
    analysisStatus: 'idle' | 'loading' | 'success' | 'error';
  };
  /** Tablebase store actions */
  tablebaseActions:
    | {
        setEvaluations?: (evaluations: PositionAnalysis[]) => void;
        setAnalysisStatus?: (status: 'idle' | 'loading' | 'success' | 'error') => void;
      }
    | undefined;
}

/**
 * Move validation state and utilities
 *
 * @interface MoveValidationResult
 * @description Result object containing validation state
 */
export interface MoveValidationResult {
  /** Number of processed evaluations */
  processedCount: number;
  /** Whether evaluation processing is active */
  isProcessing: boolean;
}

/**
 * Move validation and evaluation processing hook
 *
 * @description
 * Manages evaluation processing with deduplication and analysis
 * status synchronization. Handles safe interaction with tablebase
 * store actions and maintains evaluation state consistency.
 *
 * @param {UseMoveValidationOptions} options - Validation configuration
 * @returns {MoveValidationResult} Validation state and utilities
 *
 * @example
 * ```tsx
 * const moveValidation = useMoveValidation({
 *   lastEvaluation: evaluationData,
 *   currentFen: position,
 *   evaluations: evaluationList,
 *   isEvaluating: loading,
 *   tablebaseState: state,
 *   tablebaseActions: actions
 * });
 *
 * // Access processing state
 * if (moveValidation.isProcessing) {
 *   // console.log('Processing evaluation...');
 * }
 * ```
 */
export const useMoveValidation = ({
  lastEvaluation,
  currentFen,
  evaluations,
  isEvaluating,
  tablebaseState,
  tablebaseActions,
}: UseMoveValidationOptions): MoveValidationResult => {
  // Track processed evaluations to prevent duplicates
  const processedEvaluationsRef = useRef(new Set<string>());
  const [processedCount, setProcessedCount] = useState(0);

  // Update Zustand with current evaluation
  useEffect(() => {
    if (!lastEvaluation) return;

    // Create unique key for this evaluation using current FEN and evaluation data
    const evalKey = `${currentFen}_${lastEvaluation.evaluation}_${lastEvaluation.mateInMoves ?? 'null'}`;

    if (processedEvaluationsRef.current.has(evalKey)) {
      return; // Skip if already processed
    }

    processedEvaluationsRef.current.add(evalKey);
    setProcessedCount(processedEvaluationsRef.current.size);

    const currentEvaluations = evaluations || [];
    const updatedEvaluations = [...currentEvaluations, lastEvaluation];

    // Check if setEvaluations exists before calling
    if (tablebaseActions?.setEvaluations) {
      tablebaseActions.setEvaluations(updatedEvaluations);
    } else {
      const logger = getLogger().setContext('useMoveValidation');
      logger.error('tablebaseActions.setEvaluations is not available', {
        hasTablebaseActions: Boolean(tablebaseActions),
        availableMethods: tablebaseActions ? Object.keys(tablebaseActions) : [],
      });
    }
  }, [lastEvaluation, currentFen, evaluations, tablebaseActions]);

  // Update analysis status based on evaluation state
  useEffect(() => {
    getLogger().debug('🔍 TablebaseActions debug', {
      hasTablebaseActions: Boolean(tablebaseActions),
      hasSetAnalysisStatus: Boolean(tablebaseActions?.setAnalysisStatus),
      tablebaseActionsKeys: Object.keys(tablebaseActions || {}),
      isEvaluating,
    });

    // CRITICAL: Safe-guard to prevent crashes
    if (!tablebaseActions?.setAnalysisStatus) {
      const logger = getLogger().setContext('useMoveValidation');
      logger.warn(
        'tablebaseActions.setAnalysisStatus not available, skipping analysis status update',
        {
          hasTablebaseActions: Boolean(tablebaseActions),
          isEvaluating,
          currentFen: `${currentFen?.substring(0, STRING_CONSTANTS.FEN_TRUNCATE_LENGTH)}...`,
        }
      );
      return;
    }

    if (isEvaluating) {
      tablebaseActions.setAnalysisStatus('loading');
    } else if (tablebaseState.analysisStatus === 'loading') {
      // Only update to success if we were loading
      tablebaseActions.setAnalysisStatus('success');
    }
  }, [isEvaluating, tablebaseState, tablebaseActions, currentFen]);

  // Return validation state
  return {
    processedCount,
    isProcessing: isEvaluating,
  };
};
