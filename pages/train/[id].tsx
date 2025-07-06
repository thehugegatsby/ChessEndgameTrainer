import React, { useState, useCallback } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { Move } from 'chess.js';
import { 
  TrainingBoard, 
  MovePanel, 
  DualEvaluationSidebar,
  TrainingControls, 
  AnalysisPanel,
  EvaluationLegend 
} from '@shared/components/training';
import { AdvancedEndgameMenu } from '@shared/components/navigation/AdvancedEndgameMenu';
import { TrainingProvider, useTraining } from '@shared/contexts/TrainingContext';
import { EndgamePosition, allEndgamePositions, getPositionById, getChapterProgress } from '@shared/data/endgames/index';
import { useToast } from '@shared/hooks/useToast';
import { ToastContainer } from '@shared/components/ui/Toast';
import { getGameStatus } from '@shared/utils/chess/gameStatus';

interface TrainingPageProps {
  position: EndgamePosition;
}

// Main training component that uses the context
const TrainingContent: React.FC<{ position: EndgamePosition }> = React.memo(({ position }) => {
  const { state, dispatch } = useTraining();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  
  // Local UI state
  const [resetKey, setResetKey] = useState<number>(0);
  const [jumpToMoveFunc, setJumpToMoveFunc] = useState<((moveIndex: number) => void) | null>(null);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState<boolean>(false);

  // Navigation helpers
  const allPositions = allEndgamePositions;
  const currentIndex = allPositions.findIndex(p => p.id === position.id);
  const prevPosition = currentIndex > 0 ? allPositions[currentIndex - 1] : null;
  const nextPosition = currentIndex < allPositions.length - 1 ? allPositions[currentIndex + 1] : null;

  // Chapter progress and game status
  const chapterProgress = getChapterProgress(position.id);
  const gameStatus = React.useMemo(() => 
    getGameStatus(state.currentFen, position.goal), 
    [state.currentFen, position.goal]
  );

  // Initialize position in context when component mounts
  React.useEffect(() => {
    dispatch({ type: 'SET_POSITION', payload: position });
  }, [position, dispatch]);

  const handleComplete = useCallback((isSuccess: boolean) => {
    if (isSuccess) {
      showSuccess('Geschafft! Position erfolgreich gelöst!', 4000);
    } else {
      showError('Versuch es erneut', 3000);
    }
    dispatch({ type: 'SET_GAME_FINISHED', payload: isSuccess });
  }, [dispatch, showSuccess, showError]);

  const handleEvaluationsChange = useCallback((evaluations: Array<{ 
    evaluation: number; 
    mateInMoves?: number;
    tablebase?: {
      isTablebasePosition: boolean;
      wdlBefore?: number;
      wdlAfter?: number;
      category?: string;
      dtz?: number;
    };
  }>) => {
    console.log('🔍 [id].tsx - handleEvaluationsChange called with', evaluations.length, 'evaluations');
    if (evaluations.length > 0) {
      const lastEval = evaluations[evaluations.length - 1];
      console.log('🔍 [id].tsx - Last evaluation has tablebase?', !!lastEval.tablebase);
      if (lastEval.tablebase) {
        console.log('🔍 [id].tsx - Tablebase data:', JSON.stringify(lastEval.tablebase, null, 2));
      }
    }
    dispatch({ type: 'SET_EVALUATIONS', payload: evaluations });
  }, [dispatch]);

  const handlePositionChange = useCallback((fen: string, pgn: string) => {
    dispatch({ type: 'UPDATE_POSITION', payload: { fen, pgn } });
  }, [dispatch]);

  const handleResetPosition = useCallback(() => {
    console.log('🔄 Resetting position to:', position.fen);
    dispatch({ type: 'RESET_TRAINING' });
    setResetKey(prev => prev + 1);
  }, [position.fen, dispatch]);

  const handleTrainingBoardReady = useCallback((func: (moveIndex: number) => void) => {
    setJumpToMoveFunc(() => func);
    dispatch({ type: 'SET_JUMP_TO_MOVE_FUNC', payload: func });
  }, [dispatch]);

  const handleMoveClick = useCallback((moveIndex: number) => {
    if (jumpToMoveFunc) {
      jumpToMoveFunc(moveIndex);
      dispatch({ type: 'SET_CURRENT_MOVE_INDEX', payload: moveIndex });
    }
  }, [jumpToMoveFunc, dispatch]);

  const handleMovesChange = useCallback((newMoves: Move[]) => {
    dispatch({ type: 'SET_MOVES', payload: newMoves });
  }, [dispatch]);

  const handleToggleAnalysis = useCallback(() => {
    dispatch({ type: 'TOGGLE_ANALYSIS' });
  }, [dispatch]);

  const handleToggleEvaluationPanel = useCallback(() => {
    dispatch({ type: 'TOGGLE_EVALUATION_PANEL' });
  }, [dispatch]);

  const handleToggleEngine = useCallback(() => {
    dispatch({ type: 'TOGGLE_ENGINE_EVALUATION' });
  }, [dispatch]);

  const handleToggleTablebase = useCallback(() => {
    dispatch({ type: 'TOGGLE_TABLEBASE_EVALUATION' });
  }, [dispatch]);

  const getLichessUrl = useCallback(() => {
    if (state.currentPgn && state.moves.length > 0) {
      return `https://lichess.org/analysis/pgn/${encodeURIComponent(state.currentPgn)}`;
    } else {
      return `https://lichess.org/analysis/${state.currentFen.replace(/ /g, '_')}`;
    }
  }, [state.currentPgn, state.moves.length, state.currentFen]);

  return (
    <div className="trainer-container h-screen flex bg-slate-800 text-white">
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      
      {/* Left Menu */}
      <AdvancedEndgameMenu 
        isOpen={true}
        onClose={() => {}}
        currentPositionId={position.id}
      />
      
      {/* Main Content - Horizontal Layout like Lichess - Full Screen */}
      <div className="main-content flex-1 flex h-full mr-80">
        {/* Chessboard Area - Brett nimmt Platz */}
        <div className="chessboard-wrapper flex-[5] h-full relative">
          {/* Progress Header centered above board */}
          <div className="absolute top-8 left-0 right-0 z-10 text-center">
            <h2 className="text-3xl font-bold">
              {chapterProgress}
              {state.moves.length > 3 && <span className="ml-3 text-orange-400">🔥 {Math.floor(state.moves.length / 2)}</span>}
            </h2>
          </div>
          
          <div className="w-full h-full flex items-start justify-center pt-32 pb-4">
            <TrainingBoard 
              key={`${position.id}-${resetKey}`}
              fen={position.fen}
              onComplete={handleComplete}
              onHistoryChange={handleMovesChange}
              onEvaluationsChange={handleEvaluationsChange}
              onPositionChange={handlePositionChange}
              onJumpToMove={handleTrainingBoardReady}
              currentMoveIndex={state.currentMoveIndex}
            />
          </div>
        </div>
        
        {/* Floating Sidebar - similar to left menu */}
        <div className="sidebar fixed right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-gray-700 flex flex-col z-20 overflow-y-auto">
          {/* Navigation - Clean wie linke Sidebar */}
          <div className="nav-section p-4 border-b border-gray-700">
            <div className="flex items-center justify-center gap-8">
              <button 
                onClick={() => prevPosition && (window.location.href = `/train/${prevPosition.id}`)}
                disabled={!prevPosition}
                className="p-2 hover:bg-gray-800 rounded disabled:opacity-30 transition-colors"
                title="Vorherige Position"
              >
                <span className="text-lg">←</span>
              </button>
              <button 
                onClick={handleResetPosition}
                className="p-2 hover:bg-gray-800 rounded transition-colors"
                title="Position zurücksetzen"
              >
                <span className="text-lg">↻</span>
              </button>
              <button 
                onClick={() => nextPosition && (window.location.href = `/train/${nextPosition.id}`)}
                disabled={!nextPosition}
                className="p-2 hover:bg-gray-800 rounded disabled:opacity-30 transition-colors"
                title="Nächste Position"
              >
                <span className="text-lg">→</span>
              </button>
            </div>
          </div>

          {/* Game Status - Wer am Zug */}
          <div className="game-status p-4 border-b border-gray-700">
            <div className="text-sm font-medium flex items-center gap-2">
              <span className="text-base">♔</span>
              {gameStatus.sideToMoveDisplay}
            </div>
            <div className="text-xs text-gray-300 mt-1">{gameStatus.objectiveDisplay}</div>
          </div>

          {/* Engine & Tablebase Toggles */}
          <div className="sidebar-header p-4">
            <div className="flex items-center justify-between">
                {/* Engine Toggle */}
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-gray-400">Engine</span>
                  <button 
                    onClick={handleToggleEngine}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      state.showEngineEvaluation ? 'bg-green-600' : 'bg-gray-600'
                    } hover:opacity-80`}
                    title={state.showEngineEvaluation ? 'Engine deaktivieren' : 'Engine aktivieren'}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      state.showEngineEvaluation ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                {/* Tablebase Toggle - moved to the right */}
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-gray-400">Tablebase</span>
                  <button 
                    onClick={handleToggleTablebase}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      state.showTablebaseEvaluation ? 'bg-blue-600' : 'bg-gray-600'
                    } hover:opacity-80`}
                    title={state.showTablebaseEvaluation ? 'Tablebase deaktivieren' : 'Tablebase aktivieren'}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      state.showTablebaseEvaluation ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
            </div>
          </div>
          
          {/* Engine Panel - Direkt unter Header, kompakt */}
          {(state.showEngineEvaluation || state.showTablebaseEvaluation) && (
            <div className="engine-section px-4 pb-4 border-b border-gray-700">
              <DualEvaluationSidebar
                fen={state.currentFen}
                isVisible={state.showEngineEvaluation || state.showTablebaseEvaluation}
                showEngine={state.showEngineEvaluation}
                showTablebase={state.showTablebaseEvaluation}
                onEvaluationUpdate={(evaluation) => {
                  console.log('📊 Dual evaluation update:', evaluation);
                }}
              />
            </div>
          )}
          

          {/* Move Panel - centered */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
            <div className="w-full max-w-sm">
              {state.moves.length > 0 ? (
                <MovePanel 
                  moves={state.moves} 
                  showEvaluations={state.showAnalysis}
                  evaluations={state.evaluations}
                  onMoveClick={handleMoveClick}
                  currentMoveIndex={state.currentMoveIndex}
                />
              ) : (
                <div className="text-gray-400 text-center">Noch keine Züge gespielt</div>
              )}
            </div>
            
            {/* Brückenbau-Hinweise - Immer anzeigen wenn vorhanden */}
            {position.bridgeHints && position.bridgeHints.length > 0 && (
              <div className="bridge-hints-panel mt-6 pt-4 w-full max-w-sm">
                <div className="text-sm text-gray-400 mb-3 font-normal">Brückenbau-Technik</div>
                <div className="space-y-2">
                  {position.bridgeHints.map((hint, index) => (
                    <div key={index} className="text-sm text-gray-200 flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span>{hint}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Evaluation Legend - Under Brückenbau hints */}
            <div className="mt-6 w-full max-w-sm">
              <EvaluationLegend />
            </div>
            
            {/* Lichess Analysis Link */}
            <div className="mt-4 pt-4 border-t border-gray-700 w-full max-w-sm">
              <a
                href={getLichessUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2 text-sm rounded hover:bg-gray-800 transition-colors text-blue-400 hover:text-blue-300"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.75c-5.376 0-9.75-4.374-9.75-9.75S6.624 2.25 12 2.25s9.75 4.374 9.75 9.75-4.374 9.75-9.75 9.75zm-1.969-4.922c0 .414.336.75.75.75s.75-.336.75-.75-.336-.75-.75-.75-.75.336-.75.75zm1.5-10.313h2.625l-2.25 9h-1.5l2.25-9h-2.625l-.375 1.5h-1.5l.75-3h4.125l-.375 1.5z"/>
                </svg>
                Auf Lichess analysieren
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

TrainingContent.displayName = 'TrainingContent';

// Main page component with context provider
export default function TrainingPage({ position }: TrainingPageProps) {
  return (
    <TrainingProvider>
      <TrainingContent position={position} />
    </TrainingProvider>
  );
}

// Static props generation
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const id = Number(params?.id);
  const position = getPositionById(id);

  if (!position) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      position,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = allEndgamePositions.map((position) => ({
    params: { id: position.id.toString() },
  }));

  return {
    paths,
    fallback: false,
  };
};