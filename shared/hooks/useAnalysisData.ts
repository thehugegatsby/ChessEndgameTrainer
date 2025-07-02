import { useState } from 'react';
import { AnalysisData } from '@shared/types/analysisTypes';

export function useAnalysisData() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  return { analysisData, setAnalysisData } as const;
} 