import { SpacedRepetition } from './spacedRepetition';

export interface ProgressEntry {
  scenarioId: string;
  lastPlayed: string;
  attempts: number;
  successCount: number;
  successRate: number;
  dueDate: string;
  lastResult: "success" | "failure";
  currentInterval: number; // Für Spaced Repetition
}

const PROGRESS_KEY = 'endgamebook-progress';

type ProgressData = Record<string, ProgressEntry>;

class ProgressService {
  private loadProgress(): ProgressData {
    if (typeof window === 'undefined') return {};
    const data = localStorage.getItem(PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  }

  private saveProgress(progress: ProgressData): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

  public updateProgress(scenarioId: string, isSuccess: boolean): void {
    const progress = this.loadProgress();
    const now = new Date();

    let entry = progress[scenarioId];

    if (!entry) {
      entry = {
        scenarioId,
        attempts: 0,
        successCount: 0,
        successRate: 0,
        currentInterval: 0,
        lastPlayed: '',
        dueDate: '',
        lastResult: 'failure',
      };
    }

    entry.attempts += 1;
    if (isSuccess) {
      entry.successCount += 1;
    }
    entry.successRate = entry.successCount / entry.attempts;
    entry.lastResult = isSuccess ? 'success' : 'failure';
    entry.lastPlayed = now.toISOString();
    
    // Spaced Repetition Logik
    const nextDueDate = SpacedRepetition.getNextDueDate(isSuccess, entry.currentInterval);
    entry.dueDate = nextDueDate.toISOString();
    entry.currentInterval = isSuccess ? Math.max(1, entry.currentInterval * 2) : 1;


    progress[scenarioId] = entry;
    this.saveProgress(progress);
  }

  public getProgress(scenarioId: string): ProgressEntry | undefined {
    const progress = this.loadProgress();
    return progress[scenarioId];
  }

  public getDueScenarios(): ProgressEntry[] {
    const progress = this.loadProgress();
    const allEntries = Object.values(progress);
    const now = new Date();
    
    // Setze die Uhrzeit auf Mitternacht, um den ganzen Tag zu vergleichen
    now.setHours(0, 0, 0, 0);

    return allEntries.filter(entry => {
      const dueDate = new Date(entry.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate <= now;
    });
  }
}

export const progressService = new ProgressService(); 