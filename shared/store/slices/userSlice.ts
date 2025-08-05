/**
 * @file User state slice for Zustand store
 * @description Manages user profile, preferences, and authentication state
 */

import { ImmerStateCreator, UserSlice } from "./types";
import { UserState } from "../types";
import { RATING } from "../../constants";

/**
 * Initial user state factory
 * @returns Initial user state with default values
 */
export const createInitialUserState = (): UserState => ({
  id: undefined,
  username: undefined,
  email: undefined,
  rating: RATING.DEFAULT_RATING,
  completedPositions: [],
  currentStreak: 0,
  totalTrainingTime: 0,
  lastActiveDate: new Date().toISOString(),
  preferences: {
    theme: "dark",
    soundEnabled: true,
    notificationsEnabled: true,
    boardOrientation: "white",
    pieceTheme: "standard",
    autoPromoteToQueen: true,
    showCoordinates: true,
    showLegalMoves: true,
    animationSpeed: "normal",
  },
});

/**
 * Creates the user slice for the Zustand store
 * @param set - Zustand's set function for state updates
 * @param get - Zustand's get function for accessing current state
 * @returns User slice with state and actions
 *
 * @example
 * ```typescript
 * const useStore = create<UserSlice>()(createUserSlice);
 * ```
 */
export const createUserSlice: ImmerStateCreator<UserSlice> = (set, _get) => ({
  // Initial state
  ...createInitialUserState(),

  // Actions
  setUser: (user) =>
    set((state) => {
      Object.assign(state, user);
      state.lastActiveDate = new Date().toISOString();
    }),

  updatePreferences: (preferences) =>
    set((state) => {
      state.preferences = {
        ...state.preferences,
        ...preferences,
      };
    }),

  incrementStreak: () =>
    set((state) => {
      state.currentStreak += 1;
      state.lastActiveDate = new Date().toISOString();
    }),

  resetStreak: () =>
    set((state) => {
      state.currentStreak = 0;
    }),

  addCompletedPosition: (positionId) =>
    set((state) => {
      if (!state.completedPositions.includes(positionId)) {
        state.completedPositions.push(positionId);
      }
      state.lastActiveDate = new Date().toISOString();
    }),

  updateLastActive: () =>
    set((state) => {
      state.lastActiveDate = new Date().toISOString();
    }),

  clearUser: () => set(() => createInitialUserState()),
});

/**
 * Selector hooks for accessing user state
 * @example
 * ```typescript
 * const username = useStore(selectUsername);
 * const preferences = useStore(selectUserPreferences);
 * ```
 */
export const userSelectors = {
  selectUser: (state: UserSlice) => state,
  selectUserId: (state: UserSlice) => state.id,
  selectUsername: (state: UserSlice) => state.username,
  selectUserEmail: (state: UserSlice) => state.email,
  selectUserRating: (state: UserSlice) => state.rating,
  selectUserPreferences: (state: UserSlice) => state.preferences,
  selectCompletedPositions: (state: UserSlice) => state.completedPositions,
  selectCurrentStreak: (state: UserSlice) => state.currentStreak,
  selectIsAuthenticated: (state: UserSlice) => !!state.id,
};
