/**
 * @fileoverview Unit Tests for Spaced Repetition Algorithm
 * @description Tests the core spaced repetition logic for learning optimization
 */

import { SpacedRepetition } from '../../../../shared/lib/training/spacedRepetition';

describe('SpacedRepetition', () => {
  // Mock Date to ensure deterministic tests
  const mockDate = new Date('2025-07-12T10:00:00.000Z');
  let originalDate: DateConstructor;

  beforeEach(() => {
    originalDate = global.Date;
    global.Date = jest.fn(() => mockDate) as any;
    global.Date.now = jest.fn(() => mockDate.getTime());
  });

  afterEach(() => {
    global.Date = originalDate;
  });

  describe('getNextDueDate', () => {
    describe('Success scenarios', () => {
      it('should double interval on success', () => {
        const currentInterval = 4; // 4 days
        const result = SpacedRepetition.getNextDueDate(true, currentInterval);

        // Should add 8 days (4 * 2) to current date
        const expected = new Date('2025-07-12T10:00:00.000Z');
        expected.setDate(expected.getDate() + 8);
        
        expect(result).toEqual(expected);
      });

      it('should handle minimum interval of 1 day on success', () => {
        const currentInterval = 0; // Edge case: 0 days
        const result = SpacedRepetition.getNextDueDate(true, currentInterval);

        // Should use minimum of 1 day (Math.max(1, 0 * 2))
        const expected = new Date('2025-07-12T10:00:00.000Z');
        expected.setDate(expected.getDate() + 1);
        
        expect(result).toEqual(expected);
      });
    });

    describe('Failure scenarios', () => {
      it('should reset to 1 day on failure', () => {
        const currentInterval = 16; // 16 days interval
        const result = SpacedRepetition.getNextDueDate(false, currentInterval);

        // Should reset to 1 day regardless of current interval
        const expected = new Date('2025-07-12T10:00:00.000Z');
        expected.setDate(expected.getDate() + 1);
        
        expect(result).toEqual(expected);
      });
    });
  });
});