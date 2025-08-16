/**
 * @file Tests for UISlice with nested store structure
 * @module tests/unit/store/slices/uiSlice.nested
 */

import { describe, it, test, expect, beforeEach } from 'vitest';
import { useStore } from '@shared/store/rootStore';

describe('UISlice - Nested Store Structure', () => {
  beforeEach(() => {
    // Reset store to initial state - preserve actions by only updating state properties
    useStore.setState(state => {
      state.ui.toasts = [];
      state.ui.isSidebarOpen = true;
      state.ui.currentModal = null;
      state.ui.loading = {
        global: false,
        tablebase: false,
        position: false,
        analysis: false,
      };
      state.ui.analysisPanel = {
        isOpen: false,
        activeTab: 'moves',
        showTablebase: true,
      };
    });
  });

  describe('showToast', () => {
    it('should add a toast message', () => {
      const store = useStore.getState();

      store.ui.showToast('Test message', 'success');

      const state = useStore.getState();
      expect(state.ui.toasts).toHaveLength(1);
      expect(state.ui.toasts[0]).toMatchObject({
        message: 'Test message',
        type: 'success',
        id: expect.any(String),
      });
    });

    it('should add multiple toasts', () => {
      const store = useStore.getState();

      store.ui.showToast('First', 'info');
      store.ui.showToast('Second', 'error');

      const state = useStore.getState();
      expect(state.ui.toasts).toHaveLength(2);
      expect(state.ui.toasts[0].message).toBe('First');
      expect(state.ui.toasts[1].message).toBe('Second');
    });

    it('should add toast with duration', () => {
      const store = useStore.getState();

      store.ui.showToast('Timed message', 'warning', 5000);

      const state = useStore.getState();
      expect(state.ui.toasts[0].duration).toBe(5000);
    });
  });

  describe('removeToast', () => {
    it('should remove toast by id', () => {
      const store = useStore.getState();

      // Add toasts first
      store.ui.showToast('First', 'info');
      store.ui.showToast('Second', 'error');

      const state = useStore.getState();
      const firstToastId = state.ui.toasts[0].id;

      // Remove first toast
      store.ui.removeToast(firstToastId);

      const updatedState = useStore.getState();
      expect(updatedState.ui.toasts).toHaveLength(1);
      expect(updatedState.ui.toasts[0].message).toBe('Second');
    });

    it('should handle removing non-existent toast', () => {
      const store = useStore.getState();

      store.ui.showToast('Test', 'info');

      // Try to remove non-existent toast
      store.ui.removeToast('non-existent-id');

      const state = useStore.getState();
      expect(state.ui.toasts).toHaveLength(1);
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle sidebar from open to closed', () => {
      const store = useStore.getState();

      expect(useStore.getState().ui.isSidebarOpen).toBe(true);

      store.ui.toggleSidebar();

      expect(useStore.getState().ui.isSidebarOpen).toBe(false);
    });

    it('should toggle sidebar from closed to open', () => {
      const store = useStore.getState();

      // First close it
      store.ui.setIsSidebarOpen(false);
      expect(useStore.getState().ui.isSidebarOpen).toBe(false);

      // Then toggle to open
      store.ui.toggleSidebar();
      expect(useStore.getState().ui.isSidebarOpen).toBe(true);
    });
  });

  describe('setIsSidebarOpen', () => {
    it('should set sidebar open', () => {
      const store = useStore.getState();

      store.ui.setIsSidebarOpen(true);

      const state = useStore.getState();
      expect(state.ui.isSidebarOpen).toBe(true);
    });

    it('should set sidebar closed', () => {
      const store = useStore.getState();

      store.ui.setIsSidebarOpen(false);

      const state = useStore.getState();
      expect(state.ui.isSidebarOpen).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should set position loading state', () => {
      const store = useStore.getState();

      store.ui.setLoading('position', true);

      const state = useStore.getState();
      expect(state.ui.loading.position).toBe(true);
    });

    it('should set analysis loading state', () => {
      const store = useStore.getState();

      store.ui.setLoading('analysis', true);

      const state = useStore.getState();
      expect(state.ui.loading.analysis).toBe(true);
    });

    it('should clear loading states', () => {
      const store = useStore.getState();

      // Set all loading states
      store.ui.setLoading('position', true);
      store.ui.setLoading('tablebase', true);
      store.ui.setLoading('analysis', true);

      // Clear them
      store.ui.setLoading('position', false);
      store.ui.setLoading('tablebase', false);
      store.ui.setLoading('analysis', false);

      const state = useStore.getState();
      expect(state.ui.loading.position).toBe(false);
      expect(state.ui.loading.tablebase).toBe(false);
      expect(state.ui.loading.analysis).toBe(false);
    });
  });

  describe('openModal', () => {
    it('should show modal', () => {
      const store = useStore.getState();

      store.ui.openModal('confirm');

      const state = useStore.getState();
      expect(state.ui.currentModal).toBe('confirm');
    });
  });

  describe('closeModal', () => {
    it('should hide modal', () => {
      const store = useStore.getState();

      // First show a modal
      store.ui.openModal('settings');
      expect(useStore.getState().ui.currentModal).toBe('settings');

      // Then hide it
      store.ui.closeModal();

      const state = useStore.getState();
      expect(state.ui.currentModal).toBeNull();
    });
  });

  describe('updateAnalysisPanel', () => {
    it('should update analysis panel state', () => {
      const store = useStore.getState();

      store.ui.updateAnalysisPanel({
        isOpen: true,
        activeTab: 'evaluation',
      });

      const state = useStore.getState();
      expect(state.ui.analysisPanel.isOpen).toBe(true);
      expect(state.ui.analysisPanel.activeTab).toBe('evaluation');
      expect(state.ui.analysisPanel.showTablebase).toBe(true); // unchanged
    });

    it('should partially update analysis panel', () => {
      const store = useStore.getState();

      store.ui.updateAnalysisPanel({ showTablebase: false });

      const state = useStore.getState();
      expect(state.ui.analysisPanel.showTablebase).toBe(false);
      expect(state.ui.analysisPanel.isOpen).toBe(false); // unchanged
      expect(state.ui.analysisPanel.activeTab).toBe('moves'); // unchanged
    });
  });

  describe('Integration with nested structure', () => {
    it('should work with other slices in the store', () => {
      const store = useStore.getState();

      // Verify that other slices exist
      expect(store.game).toBeDefined();
      expect(store.training).toBeDefined();
      expect(store.tablebase).toBeDefined();

      // Set UI data
      store.ui.showToast('Test', 'info');

      // Verify it doesn't affect other slices
      const state = useStore.getState();
      expect(state.ui.toasts).toHaveLength(1);
      expect(state.game.currentFen).toBeDefined();
      expect(state.training.isPlayerTurn).toBeDefined();
      expect(state.tablebase.analysisStatus).toBeDefined();
    });

    it('should maintain proper nesting in state updates', () => {
      const store = useStore.getState();

      // Make multiple updates
      store.ui.showToast('Test', 'info');
      store.ui.toggleSidebar();
      store.ui.setLoading('position', true);

      // Check all updates were applied correctly
      const state = useStore.getState();
      expect(state.ui.toasts).toHaveLength(1);
      expect(state.ui.isSidebarOpen).toBe(false); // was toggled from true
      expect(state.ui.loading.position).toBe(true);
    });
  });
});
