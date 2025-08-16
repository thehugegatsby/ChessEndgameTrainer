/**
 * Zustand Store Test Factory
 *
 * Factory for creating test-ready Zustand store instances with state isolation.
 * Note: This uses the real store implementation but resets state between tests
 * to prevent pollution. For true mocking, consider separate mock implementations.
 */

// @ts-nocheck - Test infrastructure with complex mock typing

import { vi } from 'vitest';
import { act } from '@testing-library/react';
import { type StoreApi } from 'zustand';
import { BaseMockFactory } from './BaseMockFactory';
import { useStore, type RootStore } from '@shared/store/rootStore';
import type { GameSlice, TrainingSlice, TablebaseSlice, UISlice } from '@shared/store/slices/types';

export interface StoreMockOverrides {
  game?: Partial<GameSlice>;
  training?: Partial<TrainingSlice>;
  tablebase?: Partial<TablebaseSlice>;
  ui?: Partial<UISlice>;
}

export interface MockStoreResult {
  store: StoreApi<RootStore>;
  getState: () => RootStore;
  setState: (partial: Partial<RootStore>) => void;
  subscribe: (listener: (state: RootStore) => void) => () => void;
}

export class ZustandStoreMockFactory extends BaseMockFactory<MockStoreResult, StoreMockOverrides> {
  private storeInstance: StoreApi<RootStore> | null = null;
  private subscriptions: Set<() => void> = new Set();

  /**
   * Override create to handle Zustand's specific setup
   */
  public create(overrides?: StoreMockOverrides): MockStoreResult {
    // Clean up any existing store
    if (this.storeInstance) {
      this.cleanup();
    }

    // Get the real store instance with proper typing
    this.storeInstance = useStore as StoreApi<RootStore>;

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
      setState: partial => {
        act(() => {
          this.storeInstance!.setState(partial);
        });
      },
      subscribe: listener => {
        const unsubscribe = this.storeInstance!.subscribe(listener);
        this.subscriptions.add(unsubscribe);
        return unsubscribe;
      },
    };

    this.mockInstance = mockResult as unknown as MockStoreResult;
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
      this.storeInstance!.setState(state => ({
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
      this.storeInstance!.setState(state => ({
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
      this.storeInstance!.setState(state => ({
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
      this.storeInstance!.setState(state => ({
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
        };
      }

      if (overrides.training) {
        updates.training = {
          ...this.storeInstance!.getState().training,
          ...overrides.training,
        };
      }

      if (overrides.tablebase) {
        updates.tablebase = {
          ...this.storeInstance!.getState().tablebase,
          ...overrides.tablebase,
        };
      }

      if (overrides.ui) {
        updates.ui = {
          ...this.storeInstance!.getState().ui,
          ...overrides.ui,
        };
      }

      this.storeInstance!.setState(updates);
    });
  }

  protected _createDefaultMock(): MockStoreResult {
    // Note: This factory overrides create() method completely,
    // but we provide a valid implementation to satisfy base class contract
    const mockStore = {
      getState: vi.fn(),
      setState: vi.fn(),
      subscribe: vi.fn(),
      store: {} as StoreApi<RootStore>,
    };

    return mockStore as unknown as MockStoreResult;
  }

  protected _beforeCleanup(): void {
    // Unsubscribe all listeners
    this.subscriptions.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('[ZustandStoreMockFactory] Error during unsubscribe:', error);
      }
    });
    this.subscriptions.clear();

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
    return new Promise(resolve => {
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
  public updateSlice<K extends keyof RootStore>(slice: K, updates: Partial<RootStore[K]>): void {
    if (!this.storeInstance) {
      throw new Error('Store not initialized. Call create() first.');
    }

    act(() => {
      this.storeInstance!.setState(state => ({
        [slice]: {
          ...state[slice],
          ...updates,
        },
      }));
    });
  }
}
