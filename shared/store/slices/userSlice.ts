/**
 * @file User state slice for Zustand store
 * @description Manages user profile, preferences, and authentication state
 */

import { ImmerStateCreator } from "./types";
import { UserState, UserPreferences } from "../types";
import { RATING } from "../../constants";

/**
 * User-related actions interface
 * @interface UserActions
 */
export interface UserActions {
  /**
   * Sets the complete user profile
   * @param user - Partial user object to merge with existing state
   * @example
   * setUser({ id: '123', username: 'player1', email: 'player1@example.com' })
   */
  setUser: (user: Partial<UserState>) => void;

  /**
   * Updates user preferences
   * @param preferences - Partial preferences object to merge
   * @example
   * updatePreferences({ theme: 'dark', soundEnabled: false })
   */
  updatePreferences: (preferences: Partial<UserPreferences>) => void;

  /**
   * Increments the current winning streak
   * @example
   * incrementStreak() // Increases currentStreak by 1
   */
  incrementStreak: () => void;

  /**
   * Resets the winning streak to zero
   * @example
   * resetStreak() // Sets currentStreak to 0
   */
  resetStreak: () => void;

  /**
   * Adds a position ID to the completed positions list
   * @param positionId - The ID of the completed position
   * @example
   * addCompletedPosition(42) // Adds position 42 to completedPositions array
   */
  addCompletedPosition: (positionId: number) => void;

  /**
   * Updates the last active date to current timestamp
   * @example
   * updateLastActive() // Sets lastActiveDate to current ISO string
   */
  updateLastActive: () => void;

  /**
   * Clears all user data and resets to initial state
   * @example
   * clearUser() // Resets entire user state
   */
  clearUser: () => void;
}

/**
 * Combined user slice type (state + actions)
 */
export type UserSlice = UserState & UserActions;

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
export const createUserSlice: ImmerStateCreator<UserSlice> = (
  set,
  _get,
) => ({
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
