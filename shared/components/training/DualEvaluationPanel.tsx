'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DualEvaluation } from '../../lib/chess/ScenarioEngine';

interface DualEvaluationPanelProps {
  fen: string;
  onEvaluationUpdate?: (evaluation: DualEvaluation) => void;
  isVisible: boolean;
}

export const DualEvaluationPanel: React.FC<DualEvaluationPanelProps> = ({ 
  fen, 
  onEvaluationUpdate,
  isVisible 
}) => {
  const [evaluation, setEvaluation] = useState<DualEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFenRef = useRef<string>('');
  const lastEvaluationTimeRef = useRef<number>(0);
  const evaluationCountRef = useRef(0);
  const engineRef = useRef<any>(null); // Reuse single engine instance

  useEffect(() => {
    if (!isVisible || !fen) return;

    // Only prevent infinite loops if it's the same FEN evaluated very recently
    const now = Date.now();
    const lastEvaluationTime = lastFenRef.current === fen ? (lastEvaluationTimeRef.current || 0) : 0;
    
    if (lastFenRef.current === fen && (now - lastEvaluationTime) < 1000) {
      console.log('[DualEvaluationPanel] 🔄 Skipping evaluation - same FEN evaluated recently');
      return;
    }

    evaluationCountRef.current++;
    if (evaluationCountRef.current === 1) {
      console.log('[DualEvaluationPanel] 🎯 Starting evaluation for FEN:', fen);
    }

    lastFenRef.current = fen;
    lastEvaluationTimeRef.current = now;

    const evaluatePosition = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Reuse existing engine instance or create new one
        if (!engineRef.current) {
          const { ScenarioEngine } = await import('../../lib/chess/ScenarioEngine');
          engineRef.current = new ScenarioEngine(fen);
        }
        
        const dualEval = await engineRef.current.getDualEvaluation(fen);
        
        setEvaluation(dualEval);
        onEvaluationUpdate?.(dualEval);
        
        if (evaluationCountRef.current <= 2) {
          console.log('[DualEvaluationPanel] ✅ Evaluation completed successfully');
        }
        
      } catch (err: any) {
        console.error('[DualEvaluationPanel] 💥 Evaluation failed:', err.message);
        setError(err.message || 'Bewertung fehlgeschlagen');
      } finally {
        setIsLoading(false);
      }
    };

    evaluatePosition();
  }, [fen, isVisible, onEvaluationUpdate]);

  // Cleanup engine on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        try {
          engineRef.current.quit();
        } catch (error) {
          // Ignore cleanup errors
        }
        engineRef.current = null;
      }
    };
  }, []);

  if (!isVisible) return null;

  if (isLoading) {
    return (
      <div className="dark-card rounded-lg p-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Analysiere Position...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dark-card rounded-lg p-4">
        <div className="text-center py-4">
          <span className="text-2xl mb-2 block">⚠️</span>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!evaluation) return null;

  return (
    <div className="space-y-3">
      {/* Engine Evaluation Card - Compact */}
      <div className="dark-card rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">🤖</span>
            <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              Stockfish
            </h3>
          </div>
          <span className={`text-xs font-mono font-medium ${
            evaluation.engine.score > 50 ? 'text-green-400' :
            evaluation.engine.score < -50 ? 'text-red-400' :
            'text-gray-400'
          }`}>
            {evaluation.engine.evaluation}
          </span>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--text-secondary)' }}>CP:</span>
            <span className="font-mono">
              {evaluation.engine.score > 0 ? '+' : ''}{evaluation.engine.score}
            </span>
          </div>
          
          {evaluation.engine.mate && (
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--text-secondary)' }}>Matt:</span>
              <span className={`font-mono font-medium ${
                evaluation.engine.mate > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {evaluation.engine.mate > 0 ? '+' : ''}{evaluation.engine.mate}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tablebase Evaluation Card - Compact */}
      {evaluation.tablebase ? (
        <div className="dark-card rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">📊</span>
              <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                Tablebase
              </h3>
              {evaluation.tablebase.isAvailable && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Präzise
                </span>
              )}
            </div>
          </div>
          
          {evaluation.tablebase.isAvailable ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Ergebnis:</span>
                <span className={`font-medium ${
                  evaluation.tablebase.result.category === 'win' ? 'text-green-400' :
                  evaluation.tablebase.result.category === 'loss' ? 'text-red-400' :
                  'text-gray-400'
                }`}>
                  {evaluation.tablebase.evaluation}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>WDL:</span>
                <span className="font-mono">
                  {evaluation.tablebase.result.wdl > 0 ? '+' : ''}{evaluation.tablebase.result.wdl}
                </span>
              </div>
              
              {evaluation.tablebase.result.dtz && (
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--text-secondary)' }}>DTZ:</span>
                  <span className="font-mono">
                    {evaluation.tablebase.result.dtz}
                  </span>
                </div>
              )}
              
              {evaluation.tablebase.result.precise && (
                <div className="text-xs mt-2 px-2 py-1 rounded bg-green-900/30 text-green-200">
                  ✓ Theoretisch präzise
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {evaluation.tablebase.evaluation}
            </div>
          )}
        </div>
      ) : (
        <div className="dark-card rounded-lg p-3 opacity-50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">📊</span>
            <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              Tablebase
            </h3>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Nicht verfügbar für diese Position
          </div>
        </div>
      )}

      {/* Compact comparison note */}
      <div className="text-xs p-2 rounded bg-blue-900/20 text-blue-200 border border-blue-800">
        💡 <strong>Engine vs. Theorie:</strong> Stockfish zeigt praktische Bewertung, Tablebase zeigt theoretisch perfektes Ergebnis. Bei Endspiel-Training ist die Tablebase-Bewertung maßgebend.
      </div>
    </div>
  );
}; 