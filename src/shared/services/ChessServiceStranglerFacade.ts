/**
 * ChessServiceStranglerFacade - Strangler Fig Pattern Implementation
 * 
 * This facade switches between the legacy ChessService and the new ChessServiceFacade
 * based on feature flags, enabling gradual migration from Phase 1.
 */

import type { Move as ChessJsMove } from "chess.js";
import type { ValidatedMove } from "@shared/types/chess";
import { FeatureFlag, featureFlags } from "./FeatureFlagService";
import { createServiceFacade } from "@shared/components/StranglerFacade";

// Legacy service
import { ChessService as LegacyChessService } from "./ChessService";
import type { ChessServiceListener, ChessServiceEvent, GameStatePayload } from "./ChessService";

// New service  
import ChessServiceFacade from "../../features/chess-core/facades/ChessServiceFacade";
import type { IChessServiceFacade } from "../../features/chess-core/types/interfaces";

/**
 * Common interface that both legacy and new services must implement
 * This ensures compatibility during the migration
 */
interface ChessServiceCommon {
  // Event system
  subscribe(listener: ChessServiceListener): () => void;
  
  // Game initialization
  initialize(fen?: string): boolean;
  reset(): void;
  
  // Move operations
  move(move: ChessJsMove | { from: string; to: string; promotion?: string } | string): ValidatedMove | null;
  undo(): boolean;
  redo(): boolean;
  validateMove(move: ChessJsMove | { from: string; to: string; promotion?: string } | string): boolean;
  
  // Game state
  getFen(): string;
  getPgn(): string;
  getMoveHistory(): ValidatedMove[];
  getCurrentMoveIndex(): number;
  isGameOver(): boolean;
  isCheck(): boolean;
  isCheckmate(): boolean;
  isStalemate(): boolean;
  isDraw(): boolean;
  turn(): "w" | "b";
  getGameResult(): string | null;
  
  // Move generation
  moves(options?: { square?: string; verbose?: boolean }): string[] | ChessJsMove[];
  
  // PGN operations
  loadPgn(pgn: string): boolean;
  
  // Navigation
  goToMove(moveIndex: number): boolean;
}

/**
 * Adapter to make the new ChessServiceFacade compatible with legacy ChessService interface
 */
class NewChessServiceAdapter implements ChessServiceCommon {
  private facade: IChessServiceFacade;
  private listeners = new Set<ChessServiceListener>();

  constructor() {
    this.facade = new ChessServiceFacade();
    
    // Subscribe to new facade events and convert to legacy format
    this.facade.subscribe((event: unknown) => {
      const legacyEvent = this.convertToLegacyEvent(event);
      if (legacyEvent) {
        this.notifyListeners(legacyEvent);
      }
    });
  }

  // Event system compatibility
  subscribe(listener: ChessServiceListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(event: ChessServiceEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in legacy listener:', error);
      }
    });
  }

  private convertToLegacyEvent(newEvent: unknown): ChessServiceEvent | null {
    const event = newEvent as { type: string; payload: Record<string, unknown> };
    if (event.type === "stateUpdate" || event.type === "move") {
      return {
        type: "stateUpdate",
        payload: {
          fen: event.payload['fen'] as string,
          pgn: (event.payload['pgn'] as string) ?? this.facade.getPgn(),
          moveHistory: (event.payload['moveHistory'] as ValidatedMove[]) || this.facade.getMoveHistory(),
          currentMoveIndex: (event.payload['currentMoveIndex'] as number) ?? this.facade.getCurrentMoveIndex(),
          isGameOver: (event.payload['isGameOver'] as boolean) ?? this.facade.isGameOver(),
          gameResult: (event.payload['gameResult'] as string | null) ?? this.facade.getGameResult(),
        },
        source: (event.payload['source'] as "move" | "reset" | "undo" | "redo" | "load") || "move"
      };
    }
    return null;
  }

  // Delegate all methods to the new facade
  initialize(fen?: string): boolean {
    return this.facade.initialize(fen ?? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  }

  reset(): void {
    return this.facade.reset();
  }

  move(move: ChessJsMove | { from: string; to: string; promotion?: string } | string): ValidatedMove | null {
    return this.facade.move(move);
  }

  undo(): boolean {
    return this.facade.undo();
  }

  redo(): boolean {
    return this.facade.redo();
  }

  validateMove(move: ChessJsMove | { from: string; to: string; promotion?: string } | string): boolean {
    return this.facade.validateMove(move);
  }

  getFen(): string {
    return this.facade.getFen();
  }

  getPgn(): string {
    return this.facade.getPgn();
  }

  getMoveHistory(): ValidatedMove[] {
    return this.facade.getMoveHistory();
  }

  getCurrentMoveIndex(): number {
    return this.facade.getCurrentMoveIndex();
  }

  isGameOver(): boolean {
    return this.facade.isGameOver();
  }

  isCheck(): boolean {
    return this.facade.isCheck();
  }

  isCheckmate(): boolean {
    return this.facade.isCheckmate();
  }

  isStalemate(): boolean {
    return this.facade.isStalemate();
  }

  isDraw(): boolean {
    return this.facade.isDraw();
  }

  turn(): "w" | "b" {
    return this.facade.turn();
  }

  getGameResult(): string | null {
    return this.facade.getGameResult();
  }

  moves(options?: { square?: string; verbose?: boolean }): string[] | ChessJsMove[] {
    return this.facade.moves(options);
  }

  loadPgn(pgn: string): boolean {
    return this.facade.loadPgn(pgn);
  }

  goToMove(moveIndex: number): boolean {
    return this.facade.goToMove(moveIndex);
  }
}

/**
 * Legacy service singleton instance
 */
const legacyChessService = new LegacyChessService();

/**
 * New service adapter instance
 */
const newChessServiceAdapter = new NewChessServiceAdapter();

/**
 * Create the strangler facade that switches between implementations
 */
const chessServiceStranglerFacade = createServiceFacade(
  FeatureFlag.USE_NEW_CHESS_CORE,
  legacyChessService as unknown as Record<string, unknown>,
  newChessServiceAdapter as unknown as Record<string, unknown>,
  (flag: FeatureFlag) => featureFlags.isEnabled(flag)
);

// Export the strangler facade as the main ChessService
export { chessServiceStranglerFacade as ChessService };

// Export types for compatibility
export type { ChessServiceEvent, ChessServiceListener, GameStatePayload };

// Default export for compatibility
export default chessServiceStranglerFacade;