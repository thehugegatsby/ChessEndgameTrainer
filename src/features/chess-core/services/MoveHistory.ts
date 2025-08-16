/**
 * MoveHistory - Manages move history and navigation
 *
 * This class handles the storage and navigation of chess moves,
 * supporting undo/redo functionality and position tracking.
 * Part of the Clean Architecture refactoring.
 */

import { Chess } from 'chess.js';
import type { ValidatedMove } from '@shared/types/chess';
import type { IMoveHistory } from '../types/interfaces';

// Constants
const MAX_HISTORY_SIZE = 500; // Prevent memory issues in very long games
const HISTORY_RETENTION_RATIO = 0.9; // Keep 90% of max size when trimming

export default class MoveHistory implements IMoveHistory {
  private moves: ValidatedMove[] = [];
  private currentIndex: number = -1;
  private initialFen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  private static readonly MAX_HISTORY_SIZE = MAX_HISTORY_SIZE;

  /**
   * Add a move to history
   */
  public addMove(move: ValidatedMove): void {
    // If we're not at the end of history, truncate future moves
    if (this.currentIndex < this.moves.length - 1) {
      // Warning: This will discard future moves after current position
      const movesDiscarded = this.moves.length - 1 - this.currentIndex;
      if (movesDiscarded > 0) {
        console.warn(`Discarding ${movesDiscarded} future move(s) from history`);
      }
      this.truncateAfterCurrent();
    }

    // Enforce maximum history size to prevent memory issues
    if (this.moves.length >= MoveHistory.MAX_HISTORY_SIZE) {
      // Remove oldest moves, keeping 90% of max size
      const keepCount = Math.floor(MoveHistory.MAX_HISTORY_SIZE * HISTORY_RETENTION_RATIO);
      const removeCount = this.moves.length - keepCount;
      this.moves = this.moves.slice(removeCount);
      this.currentIndex = Math.max(-1, this.currentIndex - removeCount);
      console.warn(`History limit reached. Removed ${removeCount} oldest move(s)`);
    }

    this.moves.push(move);
    this.currentIndex++;
  }

  /**
   * Clear all history
   */
  public clear(): void {
    this.moves = [];
    this.currentIndex = -1;
  }

  /**
   * Check if undo is possible
   */
  public canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is possible
   */
  public canRedo(): boolean {
    return this.currentIndex < this.moves.length - 1;
  }

  /**
   * Get current position index
   */
  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Get move at specific index
   */
  public getMove(index: number): ValidatedMove | undefined {
    if (index < 0 || index >= this.moves.length) {
      return undefined;
    }
    return this.moves[index];
  }

  /**
   * Get all moves
   */
  public getMoves(): ValidatedMove[] {
    return [...this.moves];
  }

  /**
   * Set position to specific index
   */
  public setPosition(index: number): void {
    if (index < -1) {
      this.currentIndex = -1;
    } else if (index >= this.moves.length) {
      this.currentIndex = this.moves.length - 1;
    } else {
      this.currentIndex = index;
    }
  }

  /**
   * Remove all moves after current position
   */
  public truncateAfterCurrent(): void {
    this.moves = this.moves.slice(0, this.currentIndex + 1);
  }

  /**
   * Get FEN at specific index
   */
  public getFenAtIndex(index: number): string | undefined {
    // Validate index bounds more carefully
    if (!Number.isInteger(index) || index < -1 || index >= this.moves.length) {
      return undefined;
    }

    if (index === -1) {
      return this.initialFen;
    }

    const move = this.moves[index];
    return move?.fenAfter;
  }

  /**
   * Get initial FEN position
   */
  public getInitialFen(): string {
    return this.initialFen;
  }

  /**
   * Set initial FEN position
   */
  public setInitialFen(fen: string): void {
    // Validate FEN string using chess.js
    try {
      // Try to create a Chess instance - will throw if FEN is invalid
      new Chess(fen);
      // If we get here, FEN is valid
      this.initialFen = fen;
    } catch {
      console.error(`Invalid FEN string: ${fen}`);
      throw new Error(`Cannot set invalid FEN: ${fen}`);
    }
  }

  /**
   * Get the FEN before current position
   */
  public getFenBeforeCurrent(): string {
    if (this.currentIndex < 0) {
      return this.initialFen;
    }

    if (this.currentIndex === 0) {
      const firstMove = this.moves[0];
      return firstMove?.fenBefore || this.initialFen;
    }

    const previousMove = this.moves[this.currentIndex - 1];
    return previousMove?.fenAfter || this.initialFen;
  }

  /**
   * Get the FEN after current position
   */
  public getFenAfterCurrent(): string | undefined {
    if (this.currentIndex < 0 || this.currentIndex >= this.moves.length) {
      return undefined;
    }

    const currentMove = this.moves[this.currentIndex];
    return currentMove?.fenAfter;
  }

  /**
   * Move back one position
   */
  public goBack(): boolean {
    if (!this.canUndo()) {
      return false;
    }

    this.currentIndex--;
    return true;
  }

  /**
   * Move forward one position
   */
  public goForward(): boolean {
    if (!this.canRedo()) {
      return false;
    }

    this.currentIndex++;
    return true;
  }

  /**
   * Get total number of moves
   */
  public getLength(): number {
    return this.moves.length;
  }

  /**
   * Check if at start position
   */
  public isAtStart(): boolean {
    return this.currentIndex === -1;
  }

  /**
   * Check if at end position
   */
  public isAtEnd(): boolean {
    return this.currentIndex === this.moves.length - 1;
  }
}
