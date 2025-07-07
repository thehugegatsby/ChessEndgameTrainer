import { SpacedRepetition } from '../../../../shared/lib/training/spacedRepetition';

describe('SpacedRepetition', () => {
  describe('getNextDueDate', () => {
    beforeEach(() => {
      // Mock Date to ensure consistent testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-17T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe('when answer is successful', () => {
      it('should double the interval from current interval', () => {
        const currentInterval = 2; // 2 days
        const result = SpacedRepetition.getNextDueDate(true, currentInterval);
        
        const expectedDate = new Date('2025-01-17T12:00:00Z');
        expectedDate.setDate(expectedDate.getDate() + 4); // 2 * 2 = 4 days
        
        expect(result).toEqual(expectedDate);
      });

      it('should handle minimum interval of 1 day', () => {
        const currentInterval = 0.5; // Less than 1
        const result = SpacedRepetition.getNextDueDate(true, currentInterval);
        
        const expectedDate = new Date('2025-01-17T12:00:00Z');
        expectedDate.setDate(expectedDate.getDate() + 1); // Max(1, 0.5 * 2) = 1
        
        expect(result).toEqual(expectedDate);
      });

      it('should handle large intervals correctly', () => {
        const currentInterval = 30; // 30 days
        const result = SpacedRepetition.getNextDueDate(true, currentInterval);
        
        const expectedDate = new Date('2025-01-17T12:00:00Z');
        expectedDate.setDate(expectedDate.getDate() + 60); // 30 * 2 = 60 days
        
        expect(result).toEqual(expectedDate);
      });

      it('should work with decimal intervals', () => {
        const currentInterval = 1.5; // 1.5 days
        const result = SpacedRepetition.getNextDueDate(true, currentInterval);
        
        const expectedDate = new Date('2025-01-17T12:00:00Z');
        expectedDate.setDate(expectedDate.getDate() + 3); // 1.5 * 2 = 3 days
        
        expect(result).toEqual(expectedDate);
      });

      it('should handle first successful attempt (interval = 1)', () => {
        const currentInterval = 1;
        const result = SpacedRepetition.getNextDueDate(true, currentInterval);
        
        const expectedDate = new Date('2025-01-17T12:00:00Z');
        expectedDate.setDate(expectedDate.getDate() + 2); // 1 * 2 = 2 days
        
        expect(result).toEqual(expectedDate);
      });
    });

    describe('when answer is unsuccessful', () => {
      it('should reset interval to 1 day regardless of current interval', () => {
        const intervals = [0.5, 1, 2, 5, 10, 30];
        
        intervals.forEach((currentInterval) => {
          const result = SpacedRepetition.getNextDueDate(false, currentInterval);
          
          const expectedDate = new Date('2025-01-17T12:00:00Z');
          expectedDate.setDate(expectedDate.getDate() + 1); // Always 1 day
          
          expect(result).toEqual(expectedDate);
        });
      });

      it('should return same date for different failure intervals', () => {
        const result1 = SpacedRepetition.getNextDueDate(false, 2);
        const result2 = SpacedRepetition.getNextDueDate(false, 30);
        
        expect(result1).toEqual(result2);
      });
    });

    describe('edge cases', () => {
      it('should handle zero interval', () => {
        const result = SpacedRepetition.getNextDueDate(true, 0);
        
        const expectedDate = new Date('2025-01-17T12:00:00Z');
        expectedDate.setDate(expectedDate.getDate() + 1); // Max(1, 0 * 2) = 1
        
        expect(result).toEqual(expectedDate);
      });

      it('should handle negative interval', () => {
        const result = SpacedRepetition.getNextDueDate(true, -5);
        
        const expectedDate = new Date('2025-01-17T12:00:00Z');
        expectedDate.setDate(expectedDate.getDate() + 1); // Max(1, -5 * 2) = 1
        
        expect(result).toEqual(expectedDate);
      });

      it('should handle very large intervals', () => {
        const currentInterval = 365; // 1 year
        const result = SpacedRepetition.getNextDueDate(true, currentInterval);
        
        const expectedDate = new Date('2025-01-17T12:00:00Z');
        expectedDate.setDate(expectedDate.getDate() + 730); // 365 * 2 = 730 days
        
        expect(result).toEqual(expectedDate);
      });

      it('should maintain date precision', () => {
        const result = SpacedRepetition.getNextDueDate(true, 1);
        
        // The result should be 2 days later at the same time
        const expectedDate = new Date('2025-01-19T12:00:00Z');
        expect(result.toISOString()).toBe(expectedDate.toISOString());
      });
    });

    describe('integration scenarios', () => {
      it('should follow typical learning progression', () => {
        let interval = 1;
        const dates: Date[] = [];
        
        // Simulate successful learning progression
        for (let i = 0; i < 5; i++) {
          const date = SpacedRepetition.getNextDueDate(true, interval);
          dates.push(date);
          interval *= 2;
        }
        
        // Check intervals: 1 -> 2 -> 4 -> 8 -> 16 -> 32 days
        expect(dates[0].getDate()).toBe(19); // +2 days
        expect(dates[1].getDate()).toBe(21); // +4 days
        expect(dates[2].getDate()).toBe(25); // +8 days
        expect(dates[3].getDate()).toBe(2); // +16 days (next month)
        expect(dates[4].getDate()).toBe(18); // +32 days (next month)
      });

      it('should handle failure and recovery', () => {
        // Start with interval of 8 days, then fail
        let date = SpacedRepetition.getNextDueDate(false, 8);
        expect(date.getDate()).toBe(18); // Reset to 1 day
        
        // Then succeed
        date = SpacedRepetition.getNextDueDate(true, 1);
        expect(date.getDate()).toBe(19); // 1 * 2 = 2 days from original
      });
    });
  });

  describe('FSRS algorithm considerations', () => {
    it('should be compatible with FSRS interval calculations', () => {
      // Test that our simple algorithm can be replaced with FSRS
      // by ensuring consistent interface
      const isSuccess = true;
      const currentInterval = 2.5;
      
      const result = SpacedRepetition.getNextDueDate(isSuccess, currentInterval);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThan(Date.now());
    });
  });
});