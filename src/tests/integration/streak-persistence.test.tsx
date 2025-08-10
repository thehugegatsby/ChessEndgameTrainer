/**
 * @file Integration test for streak persistence across position navigation
 * @module tests/integration/streak-persistence
 * 
 * @description
 * Tests that the streak counter correctly persists and increments when:
 * 1. Completing a training position successfully
 * 2. Navigating to the next position
 * 3. Verifying the streak count has increased
 * 
 * This test addresses the bug where the streak was being reset to 0
 * when loading a new training position.
 */

import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import type { JSX } from 'react';
import { createStore } from '@shared/store/createStore';
import { useTrainingStore } from '@shared/store/hooks';
import { StoreProvider } from '@shared/store/StoreContext';
import type { EndgamePosition } from '@shared/types/endgame';

// Test positions
const position1: EndgamePosition = {
  id: 1,
  title: "Test Position 1",
  description: "First test position for streak testing",
  fen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
  category: "test-category",
  difficulty: "beginner",
  sideToMove: "white",
  goal: "win",
};

const position2: EndgamePosition = {
  id: 2,
  title: "Test Position 2", 
  description: "Second test position for streak testing",
  fen: "4k3/8/4K3/4Q3/8/8/8/8 w - - 0 1",
  category: "test-category",
  difficulty: "beginner",
  sideToMove: "white",
  goal: "win",
};

describe('Streak Persistence Integration Test', () => {
  let store: ReturnType<typeof createStore>;
  let wrapper: ({ children }: { children: ReactNode }) => JSX.Element;

  beforeEach(() => {
    // Create fresh store for each test
    store = createStore();
    
    // Create wrapper with store provider
    wrapper = ({ children }: { children: ReactNode }) => (
      <StoreProvider>{children}</StoreProvider>
    );
  });

  it('should persist and increment streak when navigating between positions after success', async () => {
    const { result } = renderHook(() => useTrainingStore(), { wrapper });
    const [initialState, actions] = result.current;

    // Verify initial streak is 0
    expect(initialState.currentStreak).toBe(0);
    expect(initialState.bestStreak).toBe(0);

    // Step 1: Load first position
    await act(async () => {
      await actions.loadTrainingContext(position1);
    });

    // Verify position loaded and streak still 0
    const [stateAfterLoad1] = result.current;
    expect(stateAfterLoad1.currentPosition?.id).toBe(1);
    expect(stateAfterLoad1.currentStreak).toBe(0);
    expect(stateAfterLoad1.bestStreak).toBe(0);

    // Step 2: Simulate successful completion of position 1
    act(() => {
      actions.incrementStreak();
    });

    // Verify streak was incremented
    const [stateAfterSuccess] = result.current;
    expect(stateAfterSuccess.currentStreak).toBe(1);
    expect(stateAfterSuccess.bestStreak).toBe(1);

    // Step 3: Navigate to next position
    await act(async () => {
      await actions.loadTrainingContext(position2);
    });

    // Step 4: Verify streak persisted after navigation
    const [finalState] = result.current;
    expect(finalState.currentPosition?.id).toBe(2);
    expect(finalState.currentStreak).toBe(1); // Should still be 1, NOT reset to 0
    expect(finalState.bestStreak).toBe(1);
  });

  it('should handle multiple successful completions and maintain streak', async () => {
    const { result } = renderHook(() => useTrainingStore(), { wrapper });
    const [, actions] = result.current;

    // Load first position
    await act(async () => {
      await actions.loadTrainingContext(position1);
    });

    // Complete first position successfully
    act(() => {
      actions.incrementStreak();
    });

    let [state] = result.current;
    expect(state.currentStreak).toBe(1);
    expect(state.bestStreak).toBe(1);

    // Navigate to second position
    await act(async () => {
      await actions.loadTrainingContext(position2);
    });

    // Complete second position successfully
    act(() => {
      actions.incrementStreak();
    });

    // Verify streak continued to increment
    [state] = result.current;
    expect(state.currentStreak).toBe(2);
    expect(state.bestStreak).toBe(2);
  });

  it('should reset streak on failure but maintain best streak', async () => {
    const { result } = renderHook(() => useTrainingStore(), { wrapper });
    const [, actions] = result.current;

    // Load first position and complete successfully twice
    await act(async () => {
      await actions.loadTrainingContext(position1);
    });

    act(() => {
      actions.incrementStreak();
      actions.incrementStreak();
    });

    let [state] = result.current;
    expect(state.currentStreak).toBe(2);
    expect(state.bestStreak).toBe(2);

    // Navigate to next position
    await act(async () => {
      await actions.loadTrainingContext(position2);
    });

    // Verify streak still maintained after navigation
    [state] = result.current;
    expect(state.currentStreak).toBe(2);
    expect(state.bestStreak).toBe(2);

    // Simulate failure
    act(() => {
      actions.resetStreak();
    });

    // Verify current streak reset but best streak preserved
    [state] = result.current;
    expect(state.currentStreak).toBe(0);
    expect(state.bestStreak).toBe(2); // Should remain 2
  });

  it('should not reset streak when setPosition is called during loadTrainingContext', async () => {
    const { result } = renderHook(() => useTrainingStore(), { wrapper });
    const [, actions] = result.current;

    // Manually increment streak first
    act(() => {
      actions.incrementStreak();
      actions.incrementStreak();
      actions.incrementStreak();
    });

    let [state] = result.current;
    expect(state.currentStreak).toBe(3);
    expect(state.bestStreak).toBe(3);

    // Now load a training context - this should NOT reset the streak
    await act(async () => {
      await actions.loadTrainingContext(position1);
    });

    // Verify streak was preserved during position loading
    [state] = result.current;
    expect(state.currentPosition?.id).toBe(1);
    expect(state.currentStreak).toBe(3); // Should still be 3, NOT reset to 0
    expect(state.bestStreak).toBe(3);
  });
});