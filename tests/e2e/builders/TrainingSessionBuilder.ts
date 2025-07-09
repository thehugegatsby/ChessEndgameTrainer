/**
 * @fileoverview TrainingSessionBuilder - Fluent builder for training sessions
 * @description Creates training session configurations with positions and settings
 */

import { BaseBuilder } from './BaseBuilder';
import {
  TrainingSession,
  Position,
  DEFAULT_VALUES,
} from './types';
import { PositionBuilder } from './PositionBuilder';

/**
 * Builder for creating TrainingSession objects
 * Handles complex training scenarios with multiple positions
 */
export class TrainingSessionBuilder extends BaseBuilder<TrainingSession, TrainingSessionBuilder> {
  
  /**
   * Set session ID
   */
  withId(id: string): TrainingSessionBuilder {
    return this.with('id', id);
  }

  /**
   * Set session name
   */
  withName(name: string): TrainingSessionBuilder {
    return this.with('name', name);
  }

  /**
   * Set positions for the session
   */
  withPositions(positions: Position[]): TrainingSessionBuilder {
    return this.with('positions', positions);
  }

  /**
   * Add a single position
   */
  addPosition(position: Position): TrainingSessionBuilder {
    const currentData = this.getCurrentData();
    const positions = currentData.positions || [];
    return this.withPositions([...positions, position]);
  }

  /**
   * Add multiple positions
   */
  addPositions(positions: Position[]): TrainingSessionBuilder {
    const currentData = this.getCurrentData();
    const existingPositions = currentData.positions || [];
    return this.withPositions([...existingPositions, ...positions]);
  }

  /**
   * Set current position index
   */
  withCurrentPositionIndex(index: number): TrainingSessionBuilder {
    return this.with('currentPositionIndex', index);
  }

  /**
   * Navigate to specific position
   */
  atPosition(index: number): TrainingSessionBuilder {
    return this.withCurrentPositionIndex(index);
  }

  /**
   * Configure time per move (in milliseconds)
   */
  withTimePerMove(timeMs: number): TrainingSessionBuilder {
    const currentData = this.getCurrentData();
    return this.withMany({
      settings: {
        ...currentData.settings,
        timePerMove: timeMs,
      },
    });
  }

  /**
   * Configure evaluation visibility
   */
  withShowEvaluation(show: boolean): TrainingSessionBuilder {
    const currentData = this.getCurrentData();
    return this.withMany({
      settings: {
        ...currentData.settings,
        showEvaluation: show,
      },
    });
  }

  /**
   * Configure best move visibility
   */
  withShowBestMove(show: boolean): TrainingSessionBuilder {
    const currentData = this.getCurrentData();
    return this.withMany({
      settings: {
        ...currentData.settings,
        showBestMove: show,
      },
    });
  }

  /**
   * Configure takeback allowance
   */
  withAllowTakebacks(allow: boolean): TrainingSessionBuilder {
    const currentData = this.getCurrentData();
    return this.withMany({
      settings: {
        ...currentData.settings,
        allowTakebacks: allow,
      },
    });
  }

  /**
   * Set all settings at once
   */
  withSettings(settings: TrainingSession['settings']): TrainingSessionBuilder {
    return this.with('settings', settings);
  }

  /**
   * Set statistics
   */
  withStatistics(stats: TrainingSession['statistics']): TrainingSessionBuilder {
    return this.with('statistics', stats);
  }

  /**
   * High-level: Create opposition training session
   */
  oppositionTraining(): TrainingSessionBuilder {
    const positions = [
      new PositionBuilder().kingOpposition().withDescription('Basic opposition').build(),
      new PositionBuilder().kingOpposition(true).withDescription('Advanced opposition').build(),
      new PositionBuilder()
        .withFen('8/8/8/3k4/8/3K4/8/8 w - - 0 1')
        .withDescription('Distant opposition')
        .withBestMove('Kd2')
        .build(),
      new PositionBuilder()
        .withFen('8/8/2k5/8/2K5/8/8/8 w - - 0 1')
        .withDescription('Diagonal opposition')
        .withEvaluation(0)
        .build(),
    ];
    
    return this
      .withId('opposition-training')
      .withName('King Opposition Training')
      .withPositions(positions)
      .withCurrentPositionIndex(0)
      .withSettings({
        showEvaluation: false,
        showBestMove: true,
        allowTakebacks: true,
      });
  }

  /**
   * High-level: Create pawn endgame training
   */
  pawnEndgameTraining(): TrainingSessionBuilder {
    const positions = [
      new PositionBuilder().pawnEndgame('basic').build(),
      new PositionBuilder().pawnEndgame('race').build(),
      new PositionBuilder().pawnEndgame('breakthrough').build(),
      new PositionBuilder()
        .withFen('8/8/1p6/pPp5/P1P5/8/8/8 w - - 0 1')
        .withDescription('Complex pawn structure')
        .withBestMove('cxb6')
        .withEvaluation(150)
        .build(),
    ];
    
    return this
      .withId('pawn-endgame-training')
      .withName('Pawn Endgame Mastery')
      .withPositions(positions)
      .withCurrentPositionIndex(0)
      .withSettings({
        showEvaluation: true,
        showBestMove: false,
        allowTakebacks: true,
        timePerMove: 30000, // 30 seconds
      });
  }

  /**
   * High-level: Create theoretical positions training
   */
  theoreticalEndgames(): TrainingSessionBuilder {
    const positions = [
      new PositionBuilder().theoreticalPosition('lucena').build(),
      new PositionBuilder().theoreticalPosition('philidor').build(),
      new PositionBuilder().theoreticalPosition('vancura').build(),
      new PositionBuilder().bridgeBuilding().build(),
    ];
    
    return this
      .withId('theoretical-endgames')
      .withName('Theoretical Endgame Positions')
      .withPositions(positions)
      .withCurrentPositionIndex(0)
      .withSettings({
        showEvaluation: true,
        showBestMove: true,
        allowTakebacks: false,
      })
      .withStatistics({
        correctMoves: 0,
        totalMoves: 0,
        averageTimePerMove: 0,
      });
  }

  /**
   * High-level: Create custom difficulty session
   */
  withDifficulty(level: 'beginner' | 'intermediate' | 'advanced'): TrainingSessionBuilder {
    const settings = {
      beginner: {
        showEvaluation: true,
        showBestMove: true,
        allowTakebacks: true,
        timePerMove: undefined, // No time limit
      },
      intermediate: {
        showEvaluation: true,
        showBestMove: false,
        allowTakebacks: true,
        timePerMove: 60000, // 1 minute
      },
      advanced: {
        showEvaluation: false,
        showBestMove: false,
        allowTakebacks: false,
        timePerMove: 30000, // 30 seconds
      },
    };
    
    return this.withSettings(settings[level]);
  }

  /**
   * High-level: Create a quick test session
   */
  quickTest(): TrainingSessionBuilder {
    const position = new PositionBuilder()
      .withFen(DEFAULT_VALUES.OPPOSITION_FEN)
      .withBestMove('Kf6')
      .withEvaluation(0)
      .withDescription('Quick test position')
      .build();
    
    return this
      .withId('quick-test')
      .withName('Quick Test Session')
      .withPositions([position])
      .withCurrentPositionIndex(0)
      .withSettings({
        showEvaluation: true,
        showBestMove: true,
        allowTakebacks: true,
      });
  }

  /**
   * Provide default values
   */
  protected getDefaults(): TrainingSession {
    return {
      id: `session-${Date.now()}`,
      name: 'Unnamed Session',
      positions: [],
      currentPositionIndex: 0,
      settings: {
        showEvaluation: true,
        showBestMove: false,
        allowTakebacks: true,
      },
    };
  }

  /**
   * Validate the training session
   */
  protected validate(data: TrainingSession): void {
    // Validate ID
    if (!data.id || data.id.trim() === '') {
      throw new Error('Training session must have an ID');
    }
    
    // Validate name
    if (!data.name || data.name.trim() === '') {
      throw new Error('Training session must have a name');
    }
    
    // Validate positions
    if (data.positions.length === 0) {
      throw new Error('Training session must have at least one position');
    }
    
    // Validate current position index
    if (data.currentPositionIndex < 0 || data.currentPositionIndex >= data.positions.length) {
      throw new Error(`Invalid currentPositionIndex: ${data.currentPositionIndex}`);
    }
    
    // Validate time per move if set
    if (data.settings.timePerMove !== undefined && data.settings.timePerMove <= 0) {
      throw new Error('Time per move must be positive');
    }
    
    // Validate statistics if present
    if (data.statistics) {
      if (data.statistics.correctMoves < 0 || data.statistics.totalMoves < 0) {
        throw new Error('Statistics values cannot be negative');
      }
      if (data.statistics.correctMoves > data.statistics.totalMoves) {
        throw new Error('Correct moves cannot exceed total moves');
      }
    }
  }
}