export class SpacedRepetition {
  public static getNextDueDate(isSuccess: boolean, currentInterval: number): Date {
    const now = new Date();
    if (isSuccess) {
      // Verdopple das Intervall bei Erfolg (in Tagen)
      const nextInterval = Math.max(1, currentInterval * 2); 
      now.setDate(now.getDate() + nextInterval);
    } else {
      // Setze das Intervall auf 1 Tag zurück bei Misserfolg
      now.setDate(now.getDate() + 1);
    }
    return now;
  }
} 