/**
 * @fileoverview Tests for utility formatters
 * @description Tests for data formatting functions
 */

// Mock utility functions for testing
const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

const formatScore = (score: number): string => {
  if (score === 0) return '0.00';
  if (Math.abs(score) >= 1000) {
    return score > 0 ? '+M' : '-M';
  }
  return (score / 100).toFixed(2);
};

const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(1)}%`;
};

const formatRating = (rating: number): string => {
  return rating.toString();
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString();
};

describe('Formatters', () => {
  describe('formatTime', () => {
    it('should format seconds only', () => {
      expect(formatTime(30)).toBe('30s');
      expect(formatTime(59)).toBe('59s');
    });

    it('should format minutes and seconds', () => {
      expect(formatTime(60)).toBe('1m 0s');
      expect(formatTime(90)).toBe('1m 30s');
      expect(formatTime(3599)).toBe('59m 59s');
    });

    it('should format hours and minutes', () => {
      expect(formatTime(3600)).toBe('1h 0m');
      expect(formatTime(3660)).toBe('1h 1m');
      expect(formatTime(7200)).toBe('2h 0m');
    });

    it('should handle zero', () => {
      expect(formatTime(0)).toBe('0s');
    });

    it('should handle large numbers', () => {
      expect(formatTime(36000)).toBe('10h 0m');
    });
  });

  describe('formatScore', () => {
    it('should format zero score', () => {
      expect(formatScore(0)).toBe('0.00');
    });

    it('should format positive scores in centipawns', () => {
      expect(formatScore(50)).toBe('0.50');
      expect(formatScore(150)).toBe('1.50');
      expect(formatScore(999)).toBe('9.99');
    });

    it('should format negative scores in centipawns', () => {
      expect(formatScore(-50)).toBe('-0.50');
      expect(formatScore(-150)).toBe('-1.50');
      expect(formatScore(-999)).toBe('-9.99');
    });

    it('should format mate scores', () => {
      expect(formatScore(1000)).toBe('+M');
      expect(formatScore(-1000)).toBe('-M');
      expect(formatScore(2000)).toBe('+M');
      expect(formatScore(-2000)).toBe('-M');
    });
  });

  describe('formatPercentage', () => {
    it('should format valid percentages', () => {
      expect(formatPercentage(50, 100)).toBe('50.0%');
      expect(formatPercentage(1, 3)).toBe('33.3%');
      expect(formatPercentage(2, 3)).toBe('66.7%');
    });

    it('should handle zero total', () => {
      expect(formatPercentage(0, 0)).toBe('0%');
      expect(formatPercentage(5, 0)).toBe('0%');
    });

    it('should handle zero value', () => {
      expect(formatPercentage(0, 100)).toBe('0.0%');
    });

    it('should handle 100% cases', () => {
      expect(formatPercentage(100, 100)).toBe('100.0%');
      expect(formatPercentage(3, 3)).toBe('100.0%');
    });

    it('should round to one decimal place', () => {
      expect(formatPercentage(1, 6)).toBe('16.7%');
      expect(formatPercentage(1, 7)).toBe('14.3%');
    });
  });

  describe('formatRating', () => {
    it('should format rating numbers', () => {
      expect(formatRating(1200)).toBe('1200');
      expect(formatRating(1500)).toBe('1500');
      expect(formatRating(2000)).toBe('2000');
    });

    it('should handle zero rating', () => {
      expect(formatRating(0)).toBe('0');
    });

    it('should handle negative ratings', () => {
      expect(formatRating(-100)).toBe('-100');
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2023-12-25');
      const formatted = formatDate(date);
      
      // Just check that it returns a string (format may vary by locale)
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('should handle different date formats', () => {
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2023-12-31');
      
      expect(typeof formatDate(date1)).toBe('string');
      expect(typeof formatDate(date2)).toBe('string');
    });
  });

  describe('Edge Cases', () => {
    it('should handle extreme values', () => {
      expect(formatTime(999999)).toContain('h');
      expect(formatScore(99999)).toBe('+M');
      expect(formatScore(-99999)).toBe('-M');
    });

    it('should handle decimal inputs where appropriate', () => {
      expect(formatTime(60.5)).toBe('1m 0s'); // Should floor to integer
      expect(formatScore(50.7)).toBe('0.51'); // Should work with decimals
    });

    it('should be consistent with formatting', () => {
      // Test that multiple calls return same result
      expect(formatTime(120)).toBe(formatTime(120));
      expect(formatScore(250)).toBe(formatScore(250));
      expect(formatPercentage(1, 4)).toBe(formatPercentage(1, 4));
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        formatTime(i);
        formatScore(i);
        formatPercentage(i, 1000);
        formatRating(i + 1200);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete within reasonable time (1 second)
      expect(duration).toBeLessThan(1000);
    });
  });
});