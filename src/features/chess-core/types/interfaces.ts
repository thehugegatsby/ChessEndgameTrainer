/**
 * Comprehensive interfaces for chess-core components
 * Following Clean Architecture principles
 */

/* eslint-disable @typescript-eslint/naming-convention */

import type { Move as ChessJsMove } from "chess.js";
import type { ValidatedMove } from "@shared/types/chess";

// ========== ChessEngine Interface ==========
// Core wrapper around chess.js library
export interface IChessEngine {
  // Core operations
  initialize(fen: string): boolean;
  reset(): void;
  getFen(): string;
  getPgn(): string;
  
  // Move operations
  move(move: ChessJsMove | { from: string; to: string; promotion?: string } | string): ChessJsMove | null;
  undo(): ChessJsMove | null;
  
  // Game state queries
  isGameOver(): boolean;
  isCheck(): boolean;
  isCheckmate(): boolean;
  isStalemate(): boolean;
  isDraw(): boolean;
  isInsufficientMaterial(): boolean;
  isThreefoldRepetition(): boolean;
  turn(): "w" | "b";
  
  // Move generation
  moves(options?: { square?: string; verbose?: boolean }): string[] | ChessJsMove[];
  
  // Position queries
  get(square: string): { type: string; color: "w" | "b" } | null;
  board(): (({ type: string; color: "w" | "b" } | null))[][];
  
  // PGN operations
  loadPgn(pgn: string): boolean;
  history(options?: { verbose?: boolean }): string[] | ChessJsMove[];
  
  // FEN operations
  load(fen: string): boolean;
  clear(): void;
}

// ========== MoveValidator Interface ==========
// Handles complex move validation logic
export interface IMoveValidator {
  // Validate moves with different input formats
  validateMove(
    move: ChessJsMove | { from: string; to: string; promotion?: string } | string,
    engine: IChessEngine
  ): boolean;
  
  // Validate specific move types
  validatePromotion(from: string, to: string, piece: string, engine: IChessEngine): boolean;
  validateCastling(move: string, engine: IChessEngine): boolean;
  validateEnPassant(from: string, to: string, engine: IChessEngine): boolean;
  
  // Square validation
  isValidSquare(square: string): boolean;
  hasPieceAt(square: string, engine: IChessEngine): boolean;
  
  // Get all legal moves
  getLegalMoves(square: string, engine: IChessEngine): ChessJsMove[];
}

// ========== MoveHistory Interface ==========
// Manages move history and navigation
export interface IMoveHistory {
  // History management
  addMove(move: ValidatedMove): void;
  clear(): void;
  
  // Navigation
  canUndo(): boolean;
  canRedo(): boolean;
  getCurrentIndex(): number;
  getMove(index: number): ValidatedMove | undefined;
  getMoves(): ValidatedMove[];
  
  // Position tracking
  setPosition(index: number): void;
  truncateAfterCurrent(): void;
  
  // FEN tracking
  getFenAtIndex(index: number): string | undefined;
  getInitialFen(): string;
  setInitialFen(fen: string): void;
}

// ========== GermanNotation Interface ==========
// Handles German chess notation conversion
export interface IGermanNotation {
  // Piece notation conversion
  toPieceNotation(germanPiece: string): string | undefined;
  fromPieceNotation(piece: string): string | undefined;
  
  // Move notation conversion
  normalizeMove(move: string): string;
  denormalizeMove(move: string): string;
  
  // Promotion handling
  normalizePromotion(promotion: string | undefined): string | undefined;
  
  // Validation
  isGermanNotation(notation: string): boolean;
  isValidGermanPiece(piece: string): boolean;
}

// ========== FenCache Interface ==========
// LRU cache for FEN positions
export interface IFenCache {
  // Cache operations
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  has(key: string): boolean;
  clear(): void;
  
  // Size management
  size(): number;
  setMaxSize(size: number): void;
}

// ========== ChessEventBus Interface ==========
// Event system for chess state updates
export interface IChessEventBus {
  // Event types
  on(event: ChessEventType, handler: ChessEventHandler): () => void;
  off(event: ChessEventType, handler: ChessEventHandler): void;
  emit(event: ChessEventType, payload: ChessEventPayload): void;
  
  // Batch operations
  emitBatch(events: Array<{ type: ChessEventType; payload: ChessEventPayload }>): void;
  
  // Clear all listeners
  clear(): void;
}

// Event types
export type ChessEventType = 
  | "stateUpdate"
  | "moveExecuted"
  | "moveUndone"
  | "moveRedone"
  | "positionLoaded"
  | "gameReset"
  | "error";

// Event payload
export interface ChessEventPayload {
  fen?: string;
  pgn?: string;
  move?: ValidatedMove;
  moveHistory?: ValidatedMove[];
  currentMoveIndex?: number;
  isGameOver?: boolean;
  gameResult?: string | null;
  error?: Error;
  message?: string;
  source?: "move" | "reset" | "undo" | "redo" | "load";
}

// Event handler
export type ChessEventHandler = (payload: ChessEventPayload) => void;

// ========== ChessServiceFacade Interface ==========
// Orchestrates all components (implements IChessService)
export interface IChessServiceFacade {
  // Component access (for testing)
  getEngine(): IChessEngine;
  getValidator(): IMoveValidator;
  getHistory(): IMoveHistory;
  getEventBus(): IChessEventBus;
  getNotation(): IGermanNotation;
  getCache(): IFenCache;
  
  // IChessService implementation
  subscribe(listener: (event: ChessEventPayload) => void): () => void;
  initialize(fen: string): boolean;
  reset(): void;
  move(move: ChessJsMove | { from: string; to: string; promotion?: string } | string): ValidatedMove | null;
  undo(): boolean;
  redo(): boolean;
  validateMove(move: ChessJsMove | { from: string; to: string; promotion?: string } | string): boolean;
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
  moves(options?: { square?: string; verbose?: boolean }): string[] | ChessJsMove[];
  loadPgn(pgn: string): boolean;
  goToMove(moveIndex: number): boolean;
}

// ========== Factory Functions ==========
// For dependency injection
export type ChessEngineFactory = () => IChessEngine;
export type MoveValidatorFactory = () => IMoveValidator;
export type MoveHistoryFactory = () => IMoveHistory;
export type GermanNotationFactory = () => IGermanNotation;
export type FenCacheFactory = (maxSize?: number) => IFenCache;
export type ChessEventBusFactory = () => IChessEventBus;
export type ChessServiceFacadeFactory = (dependencies?: {
  engine?: IChessEngine;
  validator?: IMoveValidator;
  history?: IMoveHistory;
  eventBus?: IChessEventBus;
  notation?: IGermanNotation;
  cache?: IFenCache;
}) => IChessServiceFacade;