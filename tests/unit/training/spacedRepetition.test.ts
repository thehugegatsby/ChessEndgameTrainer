import { SpacedRepetition } from '@/shared/lib/training/spacedRepetition';

describe('SpacedRepetition', () => {
  describe('getNextDueDate', () => {
    test('should schedule next review in 1 day on first success', () => {
      const currentInterval = 0;
      const nextDate = SpacedRepetition.getNextDueDate(true, currentInterval);
      
      const now = new Date();
      const expectedDate = new Date();
      expectedDate.setDate(now.getDate() + 1); // Math.max(1, 0 * 2) = 1
      
      expect(nextDate.getDate()).toBe(expectedDate.getDate());
    });

    test('should double interval on success', () => {
      const currentInterval = 2;
      const nextDate = SpacedRepetition.getNextDueDate(true, currentInterval);
      
      const now = new Date();
      const expectedDate = new Date();
      expectedDate.setDate(now.getDate() + 4); // 2 * 2 = 4
      
      expect(nextDate.getDate()).toBe(expectedDate.getDate());
    });

    test('should reset to 1 day on failure', () => {
      const currentInterval = 8;
      const nextDate = SpacedRepetition.getNextDueDate(false, currentInterval);
      
      const now = new Date();
      const expectedDate = new Date();
      expectedDate.setDate(now.getDate() + 1);
      
      expect(nextDate.getDate()).toBe(expectedDate.getDate());
    });

    test('should handle large intervals', () => {
      const currentInterval = 16;
      const nextDate = SpacedRepetition.getNextDueDate(true, currentInterval);
      
      const now = new Date();
      const expectedDate = new Date();
      expectedDate.setDate(now.getDate() + 32); // 16 * 2 = 32
      
      expect(nextDate.getDate()).toBe(expectedDate.getDate());
    });

    test('should ensure minimum interval of 1 day', () => {
      const currentInterval = 0;
      const nextDate = SpacedRepetition.getNextDueDate(true, currentInterval);
      
      const now = new Date();
      const expectedDate = new Date();
      expectedDate.setDate(now.getDate() + 1); // Math.max(1, 0 * 2) = 1
      
      expect(nextDate.getDate()).toBe(expectedDate.getDate());
    });

    test('should return Date object', () => {
      const nextDate = SpacedRepetition.getNextDueDate(true, 1);
      expect(nextDate).toBeInstanceOf(Date);
    });

    test('should schedule in the future', () => {
      const now = new Date();
      const nextDate = SpacedRepetition.getNextDueDate(true, 1);
      
      expect(nextDate.getTime()).toBeGreaterThan(now.getTime());
    });
  });
});