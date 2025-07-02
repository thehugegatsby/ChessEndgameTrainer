import React, { useState, useCallback } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { Move } from 'chess.js';
import { AppLayout } from '@shared/components/layout/AppLayout';
import { 
  TrainingBoard, 
  MovePanel, 
  DualEvaluationPanel, 
  TrainingControls, 
  AnalysisPanel 
} from '@shared/components/training';
import { TrainingProvider, useTraining } from '@shared/contexts/TrainingContext';
import { EndgamePosition, allEndgamePositions, getPositionById } from '@shared/data/endgames/index';

interface TrainingPageProps {
  position: EndgamePosition;
}

// Main training component that uses the context
const TrainingContent: React.FC<{ position: EndgamePosition }> = React.memo(({ position }) => {
  const { state, dispatch } = useTraining();
  
  // Local UI state
  const [resetKey, setResetKey] = useState<number>(0);
  const [jumpToMoveFunc, setJumpToMoveFunc] = useState<((moveIndex: number) => void) | null>(null);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState<boolean>(false);

  // Navigation helpers
  const allPositions = allEndgamePositions;
  const currentIndex = allPositions.findIndex(p => p.id === position.id);
  const prevPosition = currentIndex > 0 ? allPositions[currentIndex - 1] : null;
  const nextPosition = currentIndex < allPositions.length - 1 ? allPositions[currentIndex + 1] : null;

  // Initialize position in context when component mounts
  React.useEffect(() => {
    dispatch({ type: 'SET_POSITION', payload: position });
  }, [position, dispatch]);

  const handleComplete = useCallback((isSuccess: boolean) => {
    if (isSuccess) {
      alert('🎉 Geschafft! Position erfolgreich gelöst!');
    } else {
      alert('❌ Versuch es erneut');
    }
    dispatch({ type: 'SET_GAME_FINISHED', payload: isSuccess });
  }, [dispatch]);

  const handleEvaluationsChange = useCallback((evaluations: Array<{ evaluation: number; mateInMoves?: number }>) => {
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

  const getLichessUrl = useCallback(() => {
    if (state.currentPgn && state.moves.length > 0) {
      return `https://lichess.org/analysis/pgn/${encodeURIComponent(state.currentPgn)}`;
    } else {
      return `https://lichess.org/analysis/${state.currentFen.replace(/ /g, '_')}`;
    }
  }, [state.currentPgn, state.moves.length, state.currentFen]);

  return (
    <main className="px-4 md:px-6 max-w-[1200px] mx-auto">
      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 lg:gap-6 h-[calc(100vh-8rem)]">
        
        {/* Center - Board Area */}
        <div className="relative flex flex-col items-center justify-center min-h-full py-4 lg:py-8 px-2 lg:px-8">
          
          {/* Mobile-First Floating Buttons */}
          <div className="absolute top-2 left-2 z-10 flex gap-2">
            {state.moves.length > 0 && (
              <button
                onClick={handleToggleAnalysis}
                className={`px-3 py-1 text-sm rounded-lg font-medium transition-all duration-200 shadow-lg backdrop-blur-sm ${
                  state.showAnalysis
                    ? 'dark-button-primary hover:bg-blue-600'
                    : 'dark-button-success hover:bg-green-600'
                }`}
              >
                📊
              </button>
            )}
          </div>

          {/* Main Board Container */}
          <div className="chessboard-container mx-auto">
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

          {/* Mobile Controls */}
          <TrainingControls
            position={position}
            prevPosition={prevPosition}
            nextPosition={nextPosition}
            onReset={handleResetPosition}
            getLichessUrl={getLichessUrl}
            isMobile={true}
          />
        </div>

        {/* Desktop Right Sidebar - Moves & Analysis */}
        <div className="hidden lg:flex lg:flex-col lg:space-y-4 lg:h-full lg:overflow-hidden">
          
          {/* Desktop Controls */}
          <TrainingControls
            position={position}
            prevPosition={prevPosition}
            nextPosition={nextPosition}
            onReset={handleResetPosition}
            getLichessUrl={getLichessUrl}
            isMobile={false}
          />

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto space-y-4">
            
            {/* Move Panel */}
            <MovePanel 
              moves={state.moves} 
              showEvaluations={state.showAnalysis}
              evaluations={state.evaluations}
              onMoveClick={handleMoveClick}
              currentMoveIndex={state.currentMoveIndex}
            />

            {/* Analysis Panel Toggle */}
            {state.moves.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowAnalysisPanel(!showAnalysisPanel)}
                  className={`w-full rounded-lg py-2 text-xs font-medium transition-colors ${
                    showAnalysisPanel
                      ? 'dark-button-primary hover:bg-blue-600'
                      : 'dark-button-secondary hover:bg-gray-600'
                  }`}
                >
                  {showAnalysisPanel ? '📊 Analyse verstecken' : '📊 Detailanalyse'}
                </button>
                
                {showAnalysisPanel && (
                  <AnalysisPanel
                    history={state.moves}
                    initialFen={position.fen}
                    onClose={() => setShowAnalysisPanel(false)}
                    isVisible={showAnalysisPanel}
                  />
                )}
              </div>
            )}

            {/* Compact Evaluation Toggle */}
            <div className="space-y-2">
              <button
                onClick={handleToggleEvaluationPanel}
                className={`w-full rounded-lg py-2 text-xs font-medium transition-colors ${
                  state.showEvaluationPanel
                    ? 'dark-button-primary hover:bg-blue-600'
                    : 'dark-button-secondary hover:bg-gray-600'
                }`}
              >
                {state.showEvaluationPanel ? '📊 Engine verstecken' : '📊 Engine + Tablebase'}
              </button>
              
              {state.showEvaluationPanel && (
                <DualEvaluationPanel
                  fen={state.currentFen}
                  isVisible={state.showEvaluationPanel}
                  onEvaluationUpdate={(evaluation) => {
                    console.log('📊 Dual evaluation update:', evaluation);
                  }}
                />
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
});

TrainingContent.displayName = 'TrainingContent';

// Main page component with context provider
export default function TrainingPage({ position }: TrainingPageProps) {
  return (
    <TrainingProvider>
      <AppLayout currentPositionId={position.id}>
        <TrainingContent position={position} />
      </AppLayout>
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