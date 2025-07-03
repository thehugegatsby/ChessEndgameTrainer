import { progressService, ProgressEntry } from '../progressService';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { 
  value: mockLocalStorage,
  writable: true
});

// Mock SpacedRepetition
jest.mock('../spacedRepetition', () => ({
  SpacedRepetition: {
    getNextDueDate: jest.fn((isSuccess, currentInterval) => {
      const now = new Date();
      const days = isSuccess ? Math.max(1, currentInterval * 2) : 1;
      now.setDate(now.getDate() + days);
      return now;
    })
  }
}));

describe('ProgressService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    mockLocalStorage.clear();
  });

  describe('updateProgress', () => {
    test('should create new entry for first attempt', () => {
      progressService.updateProgress('scenario1', true);
      
      const progress = progressService.getProgress('scenario1');
      expect(progress).toBeDefined();
      expect(progress?.attempts).toBe(1);
      expect(progress?.successCount).toBe(1);
      expect(progress?.successRate).toBe(1);
      expect(progress?.lastResult).toBe('success');
      expect(progress?.currentInterval).toBe(2); // First success doubles interval
    });

    test('should update existing entry', () => {
      progressService.updateProgress('scenario1', true);
      progressService.updateProgress('scenario1', false);
      progressService.updateProgress('scenario1', true);
      
      const progress = progressService.getProgress('scenario1');
      expect(progress?.attempts).toBe(3);
      expect(progress?.successCount).toBe(2);
      expect(progress?.successRate).toBeCloseTo(0.667, 3);
      expect(progress?.lastResult).toBe('success');
    });

    test('should reset interval on failure', () => {
      progressService.updateProgress('scenario1', true); // interval = 2
      progressService.updateProgress('scenario1', true); // interval = 4
      progressService.updateProgress('scenario1', false); // interval = 1
      
      const progress = progressService.getProgress('scenario1');
      expect(progress?.currentInterval).toBe(1);
      expect(progress?.lastResult).toBe('failure');
    });

    test('should update due date correctly', () => {
      const beforeUpdate = new Date();
      progressService.updateProgress('scenario1', true);
      
      const progress = progressService.getProgress('scenario1');
      const dueDate = new Date(progress!.dueDate);
      
      // Should be at least tomorrow
      expect(dueDate.getTime()).toBeGreaterThan(beforeUpdate.getTime());
    });

    test('should persist to localStorage', () => {
      progressService.updateProgress('scenario1', true);
      
      const storedData = localStorage.getItem('endgamebook-progress');
      expect(storedData).toBeTruthy();
      
      const parsed = JSON.parse(storedData!);
      expect(parsed.scenario1).toBeDefined();
      expect(parsed.scenario1.attempts).toBe(1);
    });
  });

  describe('getProgress', () => {
    test('should return undefined for non-existent scenario', () => {
      const progress = progressService.getProgress('nonexistent');
      expect(progress).toBeUndefined();
    });

    test('should return correct progress entry', () => {
      progressService.updateProgress('scenario1', true);
      progressService.updateProgress('scenario2', false);
      
      const progress1 = progressService.getProgress('scenario1');
      const progress2 = progressService.getProgress('scenario2');
      
      expect(progress1?.successCount).toBe(1);
      expect(progress2?.successCount).toBe(0);
    });
  });

  describe('getDueScenarios', () => {
    test('should return empty array when no scenarios', () => {
      const due = progressService.getDueScenarios();
      expect(due).toEqual([]);
    });

    test('should return scenarios due today', () => {
      // Create a scenario due yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const mockProgress = {
        scenario1: {
          scenarioId: 'scenario1',
          lastPlayed: yesterday.toISOString(),
          attempts: 1,
          successCount: 1,
          successRate: 1,
          dueDate: yesterday.toISOString(),
          lastResult: 'success' as const,
          currentInterval: 1
        }
      };
      
      localStorage.setItem('endgamebook-progress', JSON.stringify(mockProgress));
      
      const due = progressService.getDueScenarios();
      expect(due).toHaveLength(1);
      expect(due[0].scenarioId).toBe('scenario1');
    });

    test('should not return future scenarios', () => {
      // Create a scenario due tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const mockProgress = {
        scenario1: {
          scenarioId: 'scenario1',
          lastPlayed: new Date().toISOString(),
          attempts: 1,
          successCount: 1,
          successRate: 1,
          dueDate: tomorrow.toISOString(),
          lastResult: 'success' as const,
          currentInterval: 1
        }
      };
      
      localStorage.setItem('endgamebook-progress', JSON.stringify(mockProgress));
      
      const due = progressService.getDueScenarios();
      expect(due).toHaveLength(0);
    });

    test('should handle multiple scenarios with different due dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const mockProgress = {
        scenario1: {
          scenarioId: 'scenario1',
          lastPlayed: yesterday.toISOString(),
          attempts: 1,
          successCount: 1,
          successRate: 1,
          dueDate: yesterday.toISOString(),
          lastResult: 'success' as const,
          currentInterval: 1
        },
        scenario2: {
          scenarioId: 'scenario2',
          lastPlayed: new Date().toISOString(),
          attempts: 1,
          successCount: 0,
          successRate: 0,
          dueDate: tomorrow.toISOString(),
          lastResult: 'failure' as const,
          currentInterval: 1
        },
        scenario3: {
          scenarioId: 'scenario3',
          lastPlayed: new Date().toISOString(),
          attempts: 2,
          successCount: 1,
          successRate: 0.5,
          dueDate: new Date().toISOString(),
          lastResult: 'success' as const,
          currentInterval: 2
        }
      };
      
      localStorage.setItem('endgamebook-progress', JSON.stringify(mockProgress));
      
      const due = progressService.getDueScenarios();
      expect(due).toHaveLength(2); // scenario1 (yesterday) and scenario3 (today)
      expect(due.map(d => d.scenarioId).sort()).toEqual(['scenario1', 'scenario3']);
    });
  });

  describe('spaced repetition integration', () => {
    test('should double interval on consecutive successes', () => {
      progressService.updateProgress('scenario1', true); // interval 0 -> 2
      let progress = progressService.getProgress('scenario1');
      expect(progress?.currentInterval).toBe(2);

      progressService.updateProgress('scenario1', true); // interval 2 -> 4
      progress = progressService.getProgress('scenario1');
      expect(progress?.currentInterval).toBe(4);

      progressService.updateProgress('scenario1', true); // interval 4 -> 8
      progress = progressService.getProgress('scenario1');
      expect(progress?.currentInterval).toBe(8);
    });

    test('should reset to 1 on failure regardless of previous interval', () => {
      progressService.updateProgress('scenario1', true); // interval -> 2
      progressService.updateProgress('scenario1', true); // interval -> 4
      progressService.updateProgress('scenario1', true); // interval -> 8
      progressService.updateProgress('scenario1', false); // interval -> 1
      
      const progress = progressService.getProgress('scenario1');
      expect(progress?.currentInterval).toBe(1);
    });
  });

  describe('edge cases', () => {
    test('should handle localStorage not available', () => {
      const originalLocalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage');
      
      // Mock missing localStorage
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true
      });
      
      expect(() => progressService.updateProgress('scenario1', true)).not.toThrow();
      expect(progressService.getProgress('scenario1')).toBeUndefined();
      expect(progressService.getDueScenarios()).toEqual([]);
      
      // Restore localStorage
      if (originalLocalStorage) {
        Object.defineProperty(window, 'localStorage', originalLocalStorage);
      }
    });

    test('should handle corrupted localStorage data', () => {
      mockLocalStorage.setItem('endgamebook-progress', 'invalid json');
      
      expect(() => progressService.getProgress('scenario1')).not.toThrow();
      expect(progressService.getProgress('scenario1')).toBeUndefined();
    });

    test('should create valid initial entry structure', () => {
      progressService.updateProgress('newScenario', false);
      
      const progress = progressService.getProgress('newScenario');
      expect(progress).toMatchObject({
        scenarioId: 'newScenario',
        attempts: 1,
        successCount: 0,
        successRate: 0,
        currentInterval: 1,
        lastResult: 'failure'
      });
      expect(progress?.lastPlayed).toBeTruthy();
      expect(progress?.dueDate).toBeTruthy();
    });
  });
});