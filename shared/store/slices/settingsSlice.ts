/**
 * @file Essential settings slice - clean AI-readable implementation
 * @module store/slices/settingsSlice
 * @description Clean settings implementation with only functional code.
 * 
 * @remarks
 * This slice contains ONLY implemented functionality:
 * - Restart required flag (used by critical settings changes)
 * - Settings update timestamp (for change tracking)
 * 
 * All fake/dummy state removed to prevent AI confusion.
 */

import { ImmerStateCreator, SettingsSlice } from "./types";
import type { ExperimentalFeatures } from "../types";

/**
 * Creates essential settings slice for the Zustand store
 * 
 * @param set - Zustand's set function for immutable state updates
 * @param _get - Zustand's get function for accessing current state
 * @returns {SettingsSlice} Essential settings functionality only
 * 
 * @remarks
 * Contains ONLY functional code - no fake APIs to confuse AI systems.
 * 
 * @example
 * ```typescript
 * const restartRequired = useStore(state => state.restartRequired);
 * const clearRestartRequired = useStore(state => state.clearRestartRequired);
 * 
 * // After critical settings change
 * if (criticalSettingChanged) {
 *   store.getState().clearRestartRequired();
 * }
 * ```
 */
export const createSettingsSlice: ImmerStateCreator<SettingsSlice> = (set, _get) => ({
  // ONLY functional state
  restartRequired: false,
  lastSettingsUpdate: undefined,

  // ONLY functional actions
  clearRestartRequired: () =>
    set((state) => {
      state.restartRequired = false;
    }),

  resetSettings: () =>
    set((state) => {
      state.restartRequired = false;
      state.lastSettingsUpdate = undefined;
    }),
});

/**
 * Essential settings selectors - only functional ones
 */
export const settingsSelectors = {
  selectRestartRequired: (state: SettingsSlice) => state.restartRequired,
  selectLastSettingsUpdate: (state: SettingsSlice) => state.lastSettingsUpdate,
} as const;