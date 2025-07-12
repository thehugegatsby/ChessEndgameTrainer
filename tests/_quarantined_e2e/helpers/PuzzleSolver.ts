/**
 * @fileoverview PuzzleSolver implementation for E2E test puzzle interaction
 * @description Handles chess training puzzles with engine feedback
 */

import { Chess } from 'chess.js';
import { IPuzzleSolver } from './IPuzzleSolver';
import { PuzzleResult, PuzzleOptions } from './types';
import { PuzzleSolverDependencies } from '../interfaces/driver-dependencies';
import { validateFEN } from '../utils/chess-utils';

export class PuzzleSolver implements IPuzzleSolver {
  private chess: Chess;
  private puzzleFen: string = '';
  private solution: string[] = [];
  private description: string = '';
  private startTime: number = 0;

  constructor(
    private dependencies: PuzzleSolverDependencies,
    chessInstance?: Chess
  ) {
    this.chess = chessInstance || new Chess();
  }

  /**
   * Setup a puzzle position
   */
  async setupPuzzle(fen: string, solution: string[], description?: string): Promise<void> {
    // Validate FEN
    const fenResult = validateFEN(fen);
    if (!fenResult.isOk) {
      throw new Error(`Invalid puzzle FEN: ${fenResult.error.message}`);
    }

    // Store puzzle data
    this.puzzleFen = fenResult.value;
    this.solution = solution;
    this.description = description || 'Solve the puzzle';

    // Load position
    this.chess.load(this.puzzleFen);
    await this.dependencies.board.loadPosition({
      fen: this.puzzleFen,
      description: this.description
    });

    // Wait for board to update
    await this.dependencies.page.waitForTimeout(300);
    
    // Log puzzle setup
    this.dependencies.logger.info('Puzzle setup', {
      fen: this.puzzleFen,
      solution: this.solution.join(' '),
      description: this.description
    });
  }

  /**
   * Attempt to solve the current puzzle
   */
  async solvePuzzle(moves: string[], options?: PuzzleOptions): Promise<PuzzleResult> {
    this.startTime = Date.now();
    const movesPlayed: string[] = [];
    let goalAchieved = false;
    let feedback = '';

    try {
      // Check each move against the solution
      for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        const expectedMove = i < this.solution.length ? this.solution[i] : null;

        // Validate and make the move
        const moveResult = this.chess.move(move);
        if (!moveResult) {
          feedback = `Illegal move: ${move}`;
          break;
        }

        // Execute move on board
        await this.dependencies.board.makeMove(moveResult.from, moveResult.to);
        movesPlayed.push(moveResult.san);

        // Add delay if specified
        if (options?.delayBetweenMoves) {
          await this.dependencies.page.waitForTimeout(options.delayBetweenMoves);
        }

        // Check if move matches solution
        if (expectedMove && moveResult.san !== expectedMove) {
          // Allow alternatives if enabled
          if (!options?.allowAlternatives) {
            feedback = `Expected ${expectedMove}, but played ${moveResult.san}`;
            break;
          }
        }

        // Check if we're expecting checkmate
        if (options?.expectCheckmate && this.chess.isCheckmate()) {
          goalAchieved = true;
          feedback = 'Checkmate! Puzzle solved.';
          break;
        }
      }

      // Check if all solution moves were played
      if (movesPlayed.length === this.solution.length && !feedback) {
        goalAchieved = true;
        feedback = 'Puzzle solved correctly!';
      } else if (!feedback) {
        feedback = 'Incomplete solution';
      }

      // Check time limit
      const timeElapsed = Date.now() - this.startTime;
      if (options?.timeLimit && timeElapsed > options.timeLimit) {
        feedback = 'Time limit exceeded';
        goalAchieved = false;
      }

      return {
        success: goalAchieved,
        feedback,
        movesPlayed,
        finalPosition: this.chess.fen(),
        timeElapsed,
        goalAchieved
      };

    } catch (error) {
      await this.dependencies.errorHandler(
        'PuzzleSolver.solvePuzzle',
        error instanceof Error ? error : new Error(String(error))
      );

      return {
        success: false,
        feedback: `Error: ${error instanceof Error ? error.message : String(error)}`,
        movesPlayed,
        finalPosition: this.chess.fen(),
        timeElapsed: Date.now() - this.startTime,
        goalAchieved: false
      };
    }
  }

  /**
   * Get hint for current position
   */
  async getHint(): Promise<string> {
    try {
      // Get engine evaluation
      const engineData = await this.dependencies.evaluationPanel.getEvaluationInfo();
      
      if (engineData.bestMove) {
        return engineData.bestMove;
      }

      // Fallback to solution if available
      const moveCount = this.chess.moveNumber();
      const moveIndex = Math.floor((moveCount - 1) / 2);
      
      if (moveIndex < this.solution.length) {
        return this.solution[moveIndex];
      }

      return 'No hint available';
    } catch (error) {
      this.dependencies.logger.error('Failed to get hint', error);
      return 'Hint unavailable';
    }
  }

  /**
   * Check if current puzzle is solved
   */
  async isPuzzleSolved(): Promise<boolean> {
    // Simple check: all solution moves played
    const moveHistory = this.chess.history();
    
    if (moveHistory.length < this.solution.length) {
      return false;
    }

    // Check if moves match solution
    for (let i = 0; i < this.solution.length; i++) {
      if (moveHistory[i] !== this.solution[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Reset current puzzle to starting position
   */
  async resetPuzzle(): Promise<void> {
    if (!this.puzzleFen) {
      throw new Error('No puzzle loaded');
    }

    // Reset chess instance
    this.chess.load(this.puzzleFen);

    // Reset board
    await this.dependencies.board.loadPosition({
      fen: this.puzzleFen,
      description: this.description
    });

    // Wait for board update
    await this.dependencies.page.waitForTimeout(300);
  }

  /**
   * Get puzzle evaluation feedback
   */
  async getPuzzleFeedback(): Promise<{
    evaluation: number;
    bestMove: string;
    message: string;
  }> {
    try {
      // Get engine evaluation
      const engineData = await this.dependencies.evaluationPanel.getEvaluationInfo();
      
      // Generate feedback message based on evaluation
      let message = '';
      const absEval = Math.abs(engineData.evaluation);
      
      if (engineData.isMate && engineData.mateDistance) {
        message = `Mate in ${Math.abs(engineData.mateDistance)}`;
      } else if (absEval < 50) {
        message = 'Position is equal';
      } else if (absEval < 200) {
        message = 'Slight advantage';
      } else if (absEval < 500) {
        message = 'Clear advantage';
      } else {
        message = 'Winning position';
      }

      return {
        evaluation: engineData.evaluation,
        bestMove: engineData.bestMove || '',
        message
      };

    } catch (error) {
      this.dependencies.logger.error('Failed to get puzzle feedback', error);
      return {
        evaluation: 0,
        bestMove: '',
        message: 'Evaluation unavailable'
      };
    }
  }
}