/**
 * TEMPORARILY COMMENTED OUT - Needs refactoring for clean architecture
 * 
 * DualEvaluationSidebar - Optimized version for sidebar integration
 * Compact display that fits the chess.com-style sidebar
 * 
 * TODO: Refactor to use new IChessEngine interface and types
 * This component needs to be rewritten to work with the clean architecture.
 */

/*
// TODO: Refactor entire component for clean architecture
// This component uses old ScenarioEngine types and tablebase helpers

'use client';

import React, { useState, useEffect } from 'react';
import { useEngine } from '@shared/hooks';
import { EvaluationResult } from '@shared/lib/chess/IChessEngine';
import { EngineErrorBoundary } from '@shared/components/ui';

// ... rest of implementation needs to be refactored for clean architecture
*/

// Temporary placeholder component
export const DualEvaluationSidebar: React.FC<{ fen: string; isVisible: boolean }> = () => {
  return (
    <div className="p-4 text-sm text-gray-500">
      <p>Evaluation panel temporarily disabled during architecture refactoring.</p>
      <p>TODO: Reimplement with clean IChessEngine interface.</p>
    </div>
  );
};