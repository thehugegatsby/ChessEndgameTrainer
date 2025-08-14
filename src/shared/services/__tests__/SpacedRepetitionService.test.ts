import { vi } from 'vitest';
/**
 * @file Unit tests for SpacedRepetitionService
 * @description Tests the spaced repetition algorithm implementation and utilities
 */

import {
  mapBinaryToQuality,
  mapMoveQualityToSM2,
  updateCardProgress,
  getDueCards,
  getDueCardsFromMap,
  createNewCard,
  resetCardProgress,
  batchUpdateCards,
  calculateCardStatistics,
  isCardDifficult,
  sortByReviewPriority,
} from '@shared/services/SpacedRepetitionService';
import type { CardProgress } from '@shared/store/slices/types';

// Mock logger to avoid console noise in tests
vi.mock('@shared/services/logging/Logger', () => ({
  getLogger: () => ({
    setContext: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

describe('SpacedRepetitionService', () => {
  const NOW = 1704067200000; // 2024-01-01 00:00:00 UTC
  const ONE_DAY_MS = 86400000;

  // Helper to create a test card
  const createTestCard = (overrides?: Partial<CardProgress>): CardProgress => ({
    id: 'test-card',
    nextReviewAt: NOW,
    lastReviewedAt: NOW - ONE_DAY_MS,
    interval: 1,
    repetition: 1,
    efactor: 2.5,
    lapses: 0,
    ...overrides,
  });

  describe('mapBinaryToQuality', () => {
    it('should map correct to quality 4', () => {
      expect(mapBinaryToQuality(true)).toBe(4);
    });

    it('should map incorrect to quality 0', () => {
      expect(mapBinaryToQuality(false)).toBe(0);
    });
  });

  describe('mapMoveQualityToSM2', () => {
    it('should map fail to 0', () => {
      expect(mapMoveQualityToSM2('fail')).toBe(0);
    });

    it('should map hard to 3', () => {
      expect(mapMoveQualityToSM2('hard')).toBe(3);
    });

    it('should map good to 4', () => {
      expect(mapMoveQualityToSM2('good')).toBe(4);
    });

    it('should map easy to 5', () => {
      expect(mapMoveQualityToSM2('easy')).toBe(5);
    });
  });

  describe('updateCardProgress', () => {
    it('should update card with quality 0 (fail)', () => {
      const card = createTestCard();
      const updated = updateCardProgress(card, 0, NOW);

      expect(updated.interval).toBe(1); // Reset to 1 day
      expect(updated.repetition).toBe(0); // Reset repetitions
      expect(updated.efactor).toBeLessThan(2.5); // Decrease ease
      expect(updated.lapses).toBe(1); // Increment lapses
      expect(updated.lastReviewedAt).toBe(NOW);
      expect(updated.nextReviewAt).toBe(NOW + ONE_DAY_MS);
    });

    it('should update card with quality 4 (good)', () => {
      const card = createTestCard({ repetition: 2, interval: 6 });
      const updated = updateCardProgress(card, 4, NOW);

      expect(updated.interval).toBeGreaterThan(6); // Interval should increase
      expect(updated.repetition).toBe(3); // Increment repetitions
      expect(updated.efactor).toBeGreaterThanOrEqual(2.5); // Maintain or increase
      expect(updated.lapses).toBe(0); // No change
      expect(updated.lastReviewedAt).toBe(NOW);
    });

    it('should update card with quality 5 (perfect)', () => {
      const card = createTestCard();
      const updated = updateCardProgress(card, 5, NOW);

      expect(updated.interval).toBeGreaterThan(1);
      expect(updated.repetition).toBe(2);
      expect(updated.efactor).toBeGreaterThan(2.5); // Should increase
      expect(updated.lapses).toBe(0);
    });

    it('should throw error for invalid quality', () => {
      const card = createTestCard();
      
      expect(() => updateCardProgress(card, -1, NOW)).toThrow('Quality must be between 0 and 5');
      expect(() => updateCardProgress(card, 6, NOW)).toThrow('Quality must be between 0 and 5');
    });

    it('should handle NaN from supermemo gracefully', () => {
      // Test with edge case values that might cause NaN
      const card = createTestCard({ repetition: 0, efactor: 0 });
      const updated = updateCardProgress(card, 3, NOW);

      expect(isNaN(updated.interval)).toBe(false);
      expect(isNaN(updated.efactor)).toBe(false);
      expect(isNaN(updated.repetition)).toBe(false);
    });
  });

  describe('getDueCards', () => {
    it('should return cards due for review', () => {
      const cards: CardProgress[] = [
        createTestCard({ id: 'due-1', nextReviewAt: NOW - ONE_DAY_MS }),
        createTestCard({ id: 'due-2', nextReviewAt: NOW }),
        createTestCard({ id: 'not-due', nextReviewAt: NOW + ONE_DAY_MS }),
      ];

      const dueCards = getDueCards(cards, NOW);
      
      expect(dueCards).toHaveLength(2);
      expect(dueCards.map(c => c.id)).toEqual(['due-1', 'due-2']);
    });

    it('should return empty array when no cards are due', () => {
      const cards: CardProgress[] = [
        createTestCard({ nextReviewAt: NOW + ONE_DAY_MS }),
        createTestCard({ nextReviewAt: NOW + 2 * ONE_DAY_MS }),
      ];

      const dueCards = getDueCards(cards, NOW);
      expect(dueCards).toHaveLength(0);
    });
  });

  describe('getDueCardsFromMap', () => {
    it('should return due cards from a map structure', () => {
      const cardMap: Record<string, CardProgress> = {
        'due-1': createTestCard({ id: 'due-1', nextReviewAt: NOW - ONE_DAY_MS }),
        'due-2': createTestCard({ id: 'due-2', nextReviewAt: NOW }),
        'not-due': createTestCard({ id: 'not-due', nextReviewAt: NOW + ONE_DAY_MS }),
      };

      const dueCards = getDueCardsFromMap(cardMap, NOW);
      
      expect(dueCards).toHaveLength(2);
      expect(dueCards.map(c => c.id).sort()).toEqual(['due-1', 'due-2']);
    });
  });

  describe('createNewCard', () => {
    it('should create a new card with default values', () => {
      const card = createNewCard('new-card', NOW);

      expect(card).toEqual({
        id: 'new-card',
        nextReviewAt: NOW, // Immediately due
        lastReviewedAt: 0,
        interval: 0,
        repetition: 0,
        efactor: 2.5,
        lapses: 0,
      });
    });
  });

  describe('resetCardProgress', () => {
    it('should reset card to initial state', () => {
      const card = resetCardProgress({ id: 'reset-card' });

      expect(card).toEqual({
        id: 'reset-card',
        nextReviewAt: 0,
        lastReviewedAt: 0,
        interval: 0,
        repetition: 0,
        efactor: 2.5,
        lapses: 0,
      });
    });

    it('should preserve override values', () => {
      const card = resetCardProgress({
        id: 'reset-card',
        efactor: 2.0,
        lapses: 5,
      });

      expect(card.efactor).toBe(2.0);
      expect(card.lapses).toBe(5);
      expect(card.interval).toBe(0); // Still reset
    });
  });

  describe('batchUpdateCards', () => {
    it('should update multiple cards', () => {
      const cards: CardProgress[] = [
        createTestCard({ id: 'card-1' }),
        createTestCard({ id: 'card-2' }),
        createTestCard({ id: 'card-3' }),
      ];

      const results = {
        'card-1': 4, // Good
        'card-2': 0, // Fail
        // card-3 not included
      };

      const updated = batchUpdateCards(cards, results, NOW);

      expect(updated[0].repetition).toBe(2); // card-1 succeeded
      expect(updated[1].repetition).toBe(0); // card-2 failed
      expect(updated[1].lapses).toBe(1); // card-2 lapsed
      expect(updated[2]).toEqual(cards[2]); // card-3 unchanged
    });
  });

  describe('calculateCardStatistics', () => {
    it('should calculate correct statistics', () => {
      const cards: CardProgress[] = [
        createTestCard({ id: '1', interval: 0, repetition: 0, nextReviewAt: NOW }), // New, due
        createTestCard({ id: '2', interval: 7, nextReviewAt: NOW - ONE_DAY_MS }), // Learning, due  
        createTestCard({ id: '3', interval: 30, efactor: 2.3, nextReviewAt: NOW + 30 * ONE_DAY_MS }), // Mastered, not due
        createTestCard({ id: '4', interval: 21, lapses: 2, nextReviewAt: NOW + 21 * ONE_DAY_MS }), // Mastered, not due
      ];

      const stats = calculateCardStatistics(cards, NOW);

      expect(stats.totalCards).toBe(4);
      expect(stats.dueCards).toBe(2);
      expect(stats.masteredCards).toBe(2); // interval >= 21
      expect(stats.learningCards).toBe(1); // 0 < interval < 21
      expect(stats.newCards).toBe(1); // repetition === 0
      expect(stats.totalLapses).toBe(2);
      expect(stats.duePercentage).toBe(50); // 2 due out of 4 total
      expect(stats.averageEfactor).toBeCloseTo(2.45, 2); // (2.5 + 2.5 + 2.3 + 2.5) / 4 = 2.45
    });

    it('should handle empty array', () => {
      const stats = calculateCardStatistics([], NOW);

      expect(stats.totalCards).toBe(0);
      expect(stats.dueCards).toBe(0);
      expect(stats.averageEfactor).toBe(2.5); // Default
      expect(stats.duePercentage).toBe(0);
    });
  });

  describe('isCardDifficult', () => {
    it('should identify difficult cards by low efactor', () => {
      const card = createTestCard({ efactor: 1.8 });
      expect(isCardDifficult(card)).toBe(true);
    });

    it('should identify difficult cards by high lapses', () => {
      const card = createTestCard({ lapses: 4 });
      expect(isCardDifficult(card)).toBe(true);
    });

    it('should not mark normal cards as difficult', () => {
      const card = createTestCard({ efactor: 2.3, lapses: 2 });
      expect(isCardDifficult(card)).toBe(false);
    });
  });

  describe('sortByReviewPriority', () => {
    it('should sort overdue cards first, most overdue at top', () => {
      const cards: CardProgress[] = [
        createTestCard({ id: 'future', nextReviewAt: NOW + ONE_DAY_MS }),
        createTestCard({ id: 'very-overdue', nextReviewAt: NOW - 2 * ONE_DAY_MS }),
        createTestCard({ id: 'slightly-overdue', nextReviewAt: NOW - ONE_DAY_MS }),
        createTestCard({ id: 'due-now', nextReviewAt: NOW }),
      ];

      const sorted = sortByReviewPriority(cards, NOW);
      
      expect(sorted.map(c => c.id)).toEqual([
        'very-overdue',
        'slightly-overdue',
        'due-now',
        'future',
      ]);
    });

    it('should sort future cards by soonest first', () => {
      const cards: CardProgress[] = [
        createTestCard({ id: 'far-future', nextReviewAt: NOW + 10 * ONE_DAY_MS }),
        createTestCard({ id: 'tomorrow', nextReviewAt: NOW + ONE_DAY_MS }),
        createTestCard({ id: 'next-week', nextReviewAt: NOW + 7 * ONE_DAY_MS }),
      ];

      const sorted = sortByReviewPriority(cards, NOW);
      
      expect(sorted.map(c => c.id)).toEqual([
        'tomorrow',
        'next-week',
        'far-future',
      ]);
    });
  });
});