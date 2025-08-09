/**
 * Zustand Store Mock Factory
 * 
 * Special factory for mocking Zustand stores with proper state management.
 * Creates isolated store instances for each test to prevent state pollution.
 */

import { jest } from '@jest/globals';
import { act } from '@testing-library/react';
import { StoreApi } from 'zustand';
import { BaseMockFactory } from './BaseMockFactory';
import { useStore, RootStore } from '@shared/store/rootStore';
import type { GameState } from '@shared/store/slices/gameSlice';
import type { TrainingState } from '@shared/store/slices/trainingSlice';
import type { TablebaseState } from '@shared/store/slices/tablebaseSlice';
import type { UIState } from '@shared/store/slices/uiSlice';

export interface StoreMockOverrides {
  game?: Partial<GameState>;
  training?: Partial<TrainingState>;
  tablebase?: Partial<TablebaseState>;
  ui?: Partial<UIState>;
}

export interface MockStoreResult {
  store: StoreApi<RootStore>;
  getState: () => RootStore;
  setState: (partial: Partial<RootStore>) => void;
  subscribe: (listener: (state: RootStore) => void) => () => void;
}

export class ZustandStoreMockFactory extends BaseMockFactory<MockStoreResult, StoreMockOverrides> {
  private storeInstance: StoreApi<RootStore> | null = null;
  private unsubscribe: (() => void) | null = null;

  /**
   * Override create to handle Zustand's specific setup
   */
  public create(overrides?: StoreMockOverrides): MockStoreResult {
    // Clean up any existing store
    if (this.storeInstance) {
      this.cleanup();
    }

    // Get the real store instance
    this.storeInstance = useStore as unknown as StoreApi<RootStore>;
    
    // Reset store to initial state
    this._resetStore();
    
    // Apply overrides if provided
    if (overrides) {
      this._applyOverrides(overrides);
    }

    // Create the mock result with helper methods
    const mockResult: MockStoreResult = {
      store: this.storeInstance,
      getState: () => this.storeInstance!.getState(),
      setState: (partial) => {
        act(() => {
          this.storeInstance!.setState(partial);
        });
      },
      subscribe: (listener) => {
        return this.storeInstance!.subscribe(listener);
      },
    };

    this.mockInstance = mockResult as any;
    return mockResult;
  }

  /**
   * Reset store to a clean initial state
   */
  private _resetStore(): void {
    if (!this.storeInstance) return;

    act(() => {
      const state = this.storeInstance!.getState();
      
      // Reset each slice using their reset methods if available
      if (state.reset) {
        state.reset();
      } else {
        // Manual reset for each slice
        this._resetGameSlice();
        this._resetTrainingSlice();
        this._resetTablebaseSlice();
        this._resetUISlice();
      }
    });
  }

  private _resetGameSlice(): void {
    act(() => {
      this.storeInstance!.setState((state) => ({
        game: {
          ...state.game,
          currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          currentPgn: '',
          moveHistory: [],
          currentMoveIndex: -1,
          isGameFinished: false,
          gameResult: null,
          isCheckmate: false,
          isDraw: false,
          isStalemate: false,
        },
      }));
    });
  }

  private _resetTrainingSlice(): void {
    act(() => {
      this.storeInstance!.setState((state) => ({
        training: {
          ...state.training,
          currentPosition: undefined,
          nextPosition: null,
          previousPosition: null,
          isLoadingNavigation: false,
          navigationError: null,
          chapterProgress: null,
          isPlayerTurn: true,
          isOpponentThinking: false,
          isSuccess: false,
          sessionStartTime: undefined,
          sessionEndTime: undefined,
          hintsUsed: 0,
          mistakeCount: 0,
          moveErrorDialog: null,
          moveSuccessDialog: null,
          evaluationBaseline: null,
          currentStreak: 0,
          bestStreak: 0,
          showCheckmark: false,
          autoProgressEnabled: false,
        },
      }));
    });
  }

  private _resetTablebaseSlice(): void {
    act(() => {
      this.storeInstance!.setState((state) => ({
        tablebase: {
          ...state.tablebase,
          analysisStatus: 'idle',
          analysisResult: null,
          cache: new Map(),
        },
      }));
    });
  }

  private _resetUISlice(): void {
    act(() => {
      this.storeInstance!.setState((state) => ({
        ui: {
          ...state.ui,
          selectedSquare: null,
          hoveredSquare: null,
          arrows: [],
          highlights: [],
          toastMessage: null,
          isAnalysisPanelOpen: false,
          isMobileMenuOpen: false,
          theme: 'light',
        },
      }));
    });
  }

  /**
   * Apply test-specific overrides to the store
   */
  private _applyOverrides(overrides: StoreMockOverrides): void {
    if (!this.storeInstance) return;

    act(() => {
      const updates: Partial<RootStore> = {};

      if (overrides.game) {
        updates.game = {
          ...this.storeInstance!.getState().game,
          ...overrides.game,
        } as GameState;
      }

      if (overrides.training) {
        updates.training = {
          ...this.storeInstance!.getState().training,
          ...overrides.training,
        } as TrainingState;
      }

      if (overrides.tablebase) {
        updates.tablebase = {
          ...this.storeInstance!.getState().tablebase,
          ...overrides.tablebase,
        } as TablebaseState;
      }

      if (overrides.ui) {
        updates.ui = {
          ...this.storeInstance!.getState().ui,
          ...overrides.ui,
        } as UIState;
      }

      this.storeInstance!.setState(updates);
    });
  }

  protected _createDefaultMock(): any {
    // Not used for this factory due to custom create method
    return {};
  }

  protected _beforeCleanup(): void {
    // Unsubscribe any listeners
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    // Reset the store one final time
    if (this.storeInstance) {
      this._resetStore();
    }

    this.storeInstance = null;
  }

  /**
   * Helper method to wait for async state updates
   */
  public async waitForStateUpdate(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        act(() => {
          resolve();
        });
      }, 0);
    });
  }

  /**
   * Helper method to get current state of a specific slice
   */
  public getSliceState<K extends keyof RootStore>(slice: K): RootStore[K] {
    if (!this.storeInstance) {
      throw new Error('Store not initialized. Call create() first.');
    }
    return this.storeInstance.getState()[slice];
  }

  /**
   * Helper method to update a specific slice
   */
  public updateSlice<K extends keyof RootStore>(
    slice: K, 
    updates: Partial<RootStore[K]>
  ): void {
    if (!this.storeInstance) {
      throw new Error('Store not initialized. Call create() first.');
    }

    act(() => {
      this.storeInstance!.setState((state) => ({
        [slice]: {
          ...state[slice],
          ...updates,
        },
      }));
    });
  }
}