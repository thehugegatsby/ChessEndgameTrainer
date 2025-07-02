import { progressService, ProgressEntry } from '@shared/lib/training/progressService';
import { SpacedRepetition } from '@shared/lib/training/spacedRepetition';

const PROGRESS_KEY = 'endgamebook-progress';

describe('ProgressService', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('sollte einen neuen Eintrag erstellen, wenn keiner existiert', () => {
    const scenarioId = 'test-1';
    progressService.updateProgress(scenarioId, true);
    
    const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    expect(progress[scenarioId]).toBeDefined();
    expect(progress[scenarioId].attempts).toBe(1);
    expect(progress[scenarioId].successCount).toBe(1);
    expect(progress[scenarioId].lastResult).toBe('success');
  });

  it('sollte einen bestehenden Eintrag bei Erfolg aktualisieren', () => {
    // Vorhandenen Eintrag erstellen
    const scenarioId = 'test-1';
    const initialEntry: ProgressEntry = {
      scenarioId,
      attempts: 1,
      successCount: 0,
      dueDate: new Date().toISOString(),
      lastPlayed: new Date().toISOString(),
      lastResult: 'failure',
      successRate: 0,
      currentInterval: 1,
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ [scenarioId]: initialEntry }));

    progressService.updateProgress(scenarioId, true);

    const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    expect(progress[scenarioId].attempts).toBe(2);
    expect(progress[scenarioId].successCount).toBe(1);
    expect(progress[scenarioId].successRate).toBe(0.5);
    expect(progress[scenarioId].lastResult).toBe('success');
  });

  it('sollte einen bestehenden Eintrag bei Misserfolg aktualisieren', () => {
    const scenarioId = 'test-1';
    const initialEntry: ProgressEntry = {
        scenarioId,
        attempts: 1,
        successCount: 1,
        dueDate: new Date().toISOString(),
        lastPlayed: new Date().toISOString(),
        lastResult: 'success',
        successRate: 1,
        currentInterval: 2,
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ [scenarioId]: initialEntry }));

    progressService.updateProgress(scenarioId, false);

    const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    expect(progress[scenarioId].attempts).toBe(2);
    expect(progress[scenarioId].successCount).toBe(1);
    expect(progress[scenarioId].successRate).toBe(0.5);
    expect(progress[scenarioId].lastResult).toBe('failure');
  });

  it('sollte SpacedRepetition für das Fälligkeitsdatum verwenden', () => {
    const scenarioId = 'test-1';
    const getNextDueDateSpy = jest.spyOn(SpacedRepetition, 'getNextDueDate');
    
    progressService.updateProgress(scenarioId, true);
    
    expect(getNextDueDateSpy).toHaveBeenCalledWith(true, expect.any(Number));
  });

  describe('getDueScenarios', () => {
    it('sollte nur Szenarien zurückgeben, die heute oder früher fällig sind', () => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      const dueScenario: ProgressEntry = {
        scenarioId: 'due-1',
        attempts: 1, successCount: 1, successRate: 1, lastResult: 'success',
        lastPlayed: yesterday.toISOString(),
        dueDate: yesterday.toISOString(),
        currentInterval: 1
      };
      const notDueScenario: ProgressEntry = {
        scenarioId: 'not-due-1',
        attempts: 1, successCount: 1, successRate: 1, lastResult: 'success',
        lastPlayed: today.toISOString(),
        dueDate: tomorrow.toISOString(),
        currentInterval: 1
      };
      const dueTodayScenario: ProgressEntry = {
        scenarioId: 'due-today-1',
        attempts: 1, successCount: 1, successRate: 1, lastResult: 'success',
        lastPlayed: yesterday.toISOString(),
        dueDate: today.toISOString(),
        currentInterval: 1
      };

      const progress = {
        [dueScenario.scenarioId]: dueScenario,
        [notDueScenario.scenarioId]: notDueScenario,
        [dueTodayScenario.scenarioId]: dueTodayScenario,
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));

      const dueScenarios = progressService.getDueScenarios();
      expect(dueScenarios.length).toBe(2);
      expect(dueScenarios.map(s => s.scenarioId)).toContain('due-1');
      expect(dueScenarios.map(s => s.scenarioId)).toContain('due-today-1');
      expect(dueScenarios.map(s => s.scenarioId)).not.toContain('not-due-1');
    });

    it('sollte ein leeres Array zurückgeben, wenn keine Szenarien fällig sind', () => {
        const scenarios = progressService.getDueScenarios();
        expect(scenarios).toEqual([]);
    });
  });
}); 