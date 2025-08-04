/**
 * @file Unit tests for UI state slice
 * @module tests/store/slices/uiSlice
 * @description Comprehensive test suite for the UI slice including state, actions, and selectors.
 * Tests cover all UI operations like toasts, modals, loading states, and sidebar management.
 */

import { createStore } from "zustand/vanilla";
import {
  createUISlice,
  uiSelectors,
  createInitialUIState,
} from "@shared/store/slices/uiSlice";
import type { UISlice } from "@shared/store/slices/types";

// Mock nanoid for predictable IDs in tests
jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => "test-id-123"),
}));

/**
 * Creates a test store instance with only the UI slice
 * @returns Store instance with getState and setState methods
 */
const createTestStore = () => {
  return createStore<UISlice>()(createUISlice);
};

describe("UISlice", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Initial State", () => {
    /**
     * Tests that the initial state matches expected defaults
     */
    it("should have correct initial state", () => {
      const state = store.getState();
      const expectedState = createInitialUIState();

      expect(state.sidebarOpen).toBe(expectedState.sidebarOpen);
      expect(state.modalOpen).toBe(expectedState.modalOpen);
      expect(state.toasts).toEqual(expectedState.toasts);
      expect(state.loading).toEqual(expectedState.loading);
      expect(state.analysisPanel).toEqual(expectedState.analysisPanel);
    });

    /**
     * Tests the initial state factory function
     */
    it("should create fresh initial state on each call", () => {
      const state1 = createInitialUIState();
      const state2 = createInitialUIState();

      // Should be equal but not the same reference
      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
      expect(state1.toasts).not.toBe(state2.toasts);
    });
  });

  describe("Sidebar Actions", () => {
    /**
     * Tests sidebar toggle functionality
     */
    it("should toggle sidebar open/closed", () => {
      expect(store.getState().sidebarOpen).toBe(true);

      store.getState().toggleSidebar();
      expect(store.getState().sidebarOpen).toBe(false);

      store.getState().toggleSidebar();
      expect(store.getState().sidebarOpen).toBe(true);
    });
  });

  describe("Modal Actions", () => {
    /**
     * Tests opening different modal types
     */
    it("should open modal by type", () => {
      expect(store.getState().modalOpen).toBe(null);

      store.getState().openModal("settings");
      expect(store.getState().modalOpen).toBe("settings");

      store.getState().openModal("achievements");
      expect(store.getState().modalOpen).toBe("achievements");
    });

    /**
     * Tests modal closing functionality
     */
    it("should close modal", () => {
      store.getState().openModal("help");
      expect(store.getState().modalOpen).toBe("help");

      store.getState().closeModal();
      expect(store.getState().modalOpen).toBe(null);
    });

    /**
     * Tests that opening a new modal closes the previous one
     */
    it("should replace current modal when opening new one", () => {
      store.getState().openModal("settings");
      store.getState().openModal("share");

      expect(store.getState().modalOpen).toBe("share");
    });
  });

  describe("Toast Actions", () => {
    /**
     * Tests basic toast creation
     */
    it("should add toast with correct properties", () => {
      store.getState().showToast("Test message", "success");

      const toasts = store.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]).toEqual({
        id: "test-id-123",
        message: "Test message",
        type: "success",
        duration: 3000,
      });
    });

    /**
     * Tests multiple toast support
     */
    it("should support multiple toasts", () => {
      store.getState().showToast("First toast", "info");
      store.getState().showToast("Second toast", "warning");
      store.getState().showToast("Third toast", "error");

      expect(store.getState().toasts).toHaveLength(3);
    });

    /**
     * Tests custom duration support
     */
    it("should accept custom duration", () => {
      store.getState().showToast("Custom duration", "info", 5000);

      const toast = store.getState().toasts[0];
      expect(toast.duration).toBe(5000);
    });

    /**
     * Tests auto-removal after duration
     */
    it("should auto-remove toast after duration", () => {
      store.getState().showToast("Auto remove", "success", 1000);
      expect(store.getState().toasts).toHaveLength(1);

      // Fast-forward time
      jest.advanceTimersByTime(1000);
      expect(store.getState().toasts).toHaveLength(0);
    });

    /**
     * Tests that zero duration disables auto-removal
     */
    it("should not auto-remove when duration is 0", () => {
      store.getState().showToast("Permanent toast", "info", 0);

      jest.advanceTimersByTime(10000);
      expect(store.getState().toasts).toHaveLength(1);
    });

    /**
     * Tests manual toast removal
     */
    it("should remove toast by ID", () => {
      store.getState().showToast("Toast 1", "info");
      const toastId = store.getState().toasts[0].id;

      store.getState().removeToast(toastId);
      expect(store.getState().toasts).toHaveLength(0);
    });

    /**
     * Tests removing non-existent toast doesn't error
     */
    it("should handle removing non-existent toast gracefully", () => {
      store.getState().showToast("Toast", "info");

      expect(() => {
        store.getState().removeToast("non-existent-id");
      }).not.toThrow();

      expect(store.getState().toasts).toHaveLength(1);
    });
  });

  describe("Loading Actions", () => {
    /**
     * Tests setting individual loading states
     */
    it("should set loading state by key", () => {
      expect(store.getState().loading.global).toBe(false);

      store.getState().setLoading("global", true);
      expect(store.getState().loading.global).toBe(true);

      store.getState().setLoading("tablebase", true);
      expect(store.getState().loading.tablebase).toBe(true);
      expect(store.getState().loading.global).toBe(true); // Should not affect other keys
    });

    /**
     * Tests toggling loading states
     */
    it("should toggle loading states correctly", () => {
      store.getState().setLoading("analysis", true);
      expect(store.getState().loading.analysis).toBe(true);

      store.getState().setLoading("analysis", false);
      expect(store.getState().loading.analysis).toBe(false);
    });

    /**
     * Tests all loading state keys
     */
    it("should support all loading state keys", () => {
      const loading = store.getState().loading;
      const keys: Array<keyof typeof loading> = [
        "global",
        "tablebase",
        "position",
        "analysis",
      ];

      keys.forEach((key) => {
        store.getState().setLoading(key, true);
        expect(store.getState().loading[key]).toBe(true);
      });
    });
  });

  describe("Analysis Panel Actions", () => {
    /**
     * Tests partial updates to analysis panel
     */
    it("should update analysis panel with partial data", () => {
      const initialState = store.getState().analysisPanel;
      expect(initialState.isOpen).toBe(false);

      store.getState().updateAnalysisPanel({ isOpen: true });
      expect(store.getState().analysisPanel.isOpen).toBe(true);
      expect(store.getState().analysisPanel.activeTab).toBe(
        initialState.activeTab,
      );
    });

    /**
     * Tests multiple property updates
     */
    it("should update multiple analysis panel properties", () => {
      store.getState().updateAnalysisPanel({
        isOpen: true,
        activeTab: "evaluation",
        showTablebase: false,
      });

      const panel = store.getState().analysisPanel;
      expect(panel.isOpen).toBe(true);
      expect(panel.activeTab).toBe("evaluation");
      expect(panel.showTablebase).toBe(false);
    });

    /**
     * Tests that empty update doesn't break state
     */
    it("should handle empty update gracefully", () => {
      const before = { ...store.getState().analysisPanel };
      store.getState().updateAnalysisPanel({});
      const after = store.getState().analysisPanel;

      expect(after).toEqual(before);
    });
  });

  describe("Selectors", () => {
    /**
     * Tests all basic selectors
     */
    it("should select correct state values", () => {
      // Set up some state
      store.getState().toggleSidebar(); // Close sidebar
      store.getState().openModal("settings");
      store.getState().showToast("Test", "info");
      store.getState().setLoading("global", true);

      const state = store.getState();

      expect(uiSelectors.selectSidebarOpen(state)).toBe(false);
      expect(uiSelectors.selectModalOpen(state)).toBe("settings");
      expect(uiSelectors.selectToasts(state)).toHaveLength(1);
      expect(uiSelectors.selectGlobalLoading(state)).toBe(true);
      expect(uiSelectors.selectTablebaseLoading(state)).toBe(false);
    });

    /**
     * Tests the modal type selector factory
     */
    it("should correctly check if specific modal is open", () => {
      const state = store.getState();

      expect(uiSelectors.selectIsModalOpen("settings")(state)).toBe(false);

      store.getState().openModal("settings");
      const newState = store.getState();

      expect(uiSelectors.selectIsModalOpen("settings")(newState)).toBe(true);
      expect(uiSelectors.selectIsModalOpen("help")(newState)).toBe(false);
    });

    /**
     * Tests loading state selector
     */
    it("should select full loading state object", () => {
      store.getState().setLoading("position", true);
      store.getState().setLoading("analysis", true);

      const loadingState = uiSelectors.selectLoading(store.getState());

      expect(loadingState).toEqual({
        global: false,
        tablebase: false,
        position: true,
        analysis: true,
      });
    });

    /**
     * Tests analysis panel selector
     */
    it("should select analysis panel state", () => {
      store.getState().updateAnalysisPanel({
        isOpen: true,
        activeTab: "variations",
      });

      const panel = uiSelectors.selectAnalysisPanel(store.getState());

      expect(panel.isOpen).toBe(true);
      expect(panel.activeTab).toBe("variations");
      expect(panel.showTablebase).toBe(true); // Default value
    });
  });

  describe("Integration Scenarios", () => {
    /**
     * Tests a common UI workflow
     */
    it("should handle typical UI workflow", () => {
      // User starts an action
      store.getState().setLoading("global", true);

      // Action completes successfully
      store.getState().setLoading("global", false);
      store.getState().showToast("Action completed!", "success");

      // User opens modal to see details
      store.getState().openModal("share");

      const state = store.getState();
      expect(state.loading.global).toBe(false);
      expect(state.toasts).toHaveLength(1);
      expect(state.modalOpen).toBe("share");
    });

    /**
     * Tests error handling workflow
     */
    it("should handle error workflow", () => {
      // Start loading
      store.getState().setLoading("tablebase", true);

      // Error occurs
      store.getState().setLoading("tablebase", false);
      store
        .getState()
        .showToast("Failed to load tablebase data", "error", 5000);

      const state = store.getState();
      expect(state.loading.tablebase).toBe(false);
      expect(state.toasts[0].type).toBe("error");
      expect(state.toasts[0].duration).toBe(5000);
    });
  });
});
