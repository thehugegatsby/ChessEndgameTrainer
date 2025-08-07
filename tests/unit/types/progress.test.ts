/**
 * @file Unit tests for progress branded types
 * @description Comprehensive tests for DueCard branded types and utilities
 */

import {
  DueCard,
  isDueCard,
  toDueCard,
  filterDueCards,
  fromDueCard,
  areDueCards,
  createDueCardsMap,
  calculateDueCardsStats
} from '@shared/types/progress';
import type { CardProgress } from '@shared/store/slices/types';

// Test helpers
const createTestCard = (id: string, nextReviewAt: number): CardProgress => ({
  id,
  nextReviewAt,
  lastReviewedAt: Date.now() - 86400000, // 24 hours ago
  interval: 1,
  repetition: 1,
  efactor: 2.5,
  lapses: 0
});

const createDueTestCard = (id: string): CardProgress => createTestCard(id, Date.now() - 1000);
const createFutureTestCard = (id: string): CardProgress => createTestCard(id, Date.now() + 86400000);

describe('Progress Branded Types', () => {
  const now = Date.now();
  
  describe('isDueCard', () => {
    it('should return true for cards that are due', () => {
      const dueCard = createDueTestCard('test-1');
      expect(isDueCard(dueCard, now)).toBe(true);
    });
    
    it('should return false for cards that are not due', () => {
      const futureCard = createFutureTestCard('test-1');
      expect(isDueCard(futureCard, now)).toBe(false);
    });
    
    it('should return true for cards due exactly now', () => {
      const exactCard = createTestCard('test-1', now);
      expect(isDueCard(exactCard, now)).toBe(true);
    });
    
    it('should handle invalid card structures gracefully', () => {
      const invalidCard = { id: 'test' } as CardProgress;
      expect(isDueCard(invalidCard, now)).toBe(false);
    });
    
    it('should handle null/undefined cards', () => {
      expect(isDueCard(null as any, now)).toBe(false);
      expect(isDueCard(undefined as any, now)).toBe(false);
    });
    
    it('should use current time when now parameter is not provided', () => {
      const dueCard = createTestCard('test-1', Date.now() - 1000);
      expect(isDueCard(dueCard)).toBe(true);
    });
  });
  
  describe('toDueCard', () => {
    it('should successfully convert a due card', () => {
      const card = createDueTestCard('test-1');
      const dueCard = toDueCard(card, now);
      
      expect(dueCard).toMatchObject(card);
      expect(dueCard.__isDue).toBe(true);
      expect(dueCard.__brand).toBe('DueCard');
    });
    
    it('should throw error for non-due cards', () => {
      const futureCard = createFutureTestCard('test-1');
      
      expect(() => toDueCard(futureCard, now)).toThrow();
      expect(() => toDueCard(futureCard, now)).toThrow(/not due for review/);
    });
    
    it('should include detailed error information', () => {
      const futureCard = createFutureTestCard('test-1');
      
      try {
        toDueCard(futureCard, now);
      } catch (error) {
        expect((error as Error).message).toContain('test-1');
        expect((error as Error).message).toContain('Next review:');
        expect((error as Error).message).toContain('Current:');
      }
    });
    
    it('should use current time when now parameter is not provided', () => {
      const dueCard = createTestCard('test-1', Date.now() - 1000);
      const result = toDueCard(dueCard);
      
      expect(result.__isDue).toBe(true);
      expect(result.__brand).toBe('DueCard');
    });
  });
  
  describe('filterDueCards', () => {
    it('should filter due cards from mixed collection', () => {
      const cards = [
        createDueTestCard('due-1'),
        createFutureTestCard('future-1'),
        createDueTestCard('due-2'),
        createFutureTestCard('future-2')
      ];
      
      const dueCards = filterDueCards(cards, now);
      
      expect(dueCards).toHaveLength(2);
      expect(dueCards[0].id).toBe('due-1');
      expect(dueCards[1].id).toBe('due-2');
      expect(dueCards[0].__isDue).toBe(true);
      expect(dueCards[0].__brand).toBe('DueCard');
    });
    
    it('should return empty array for no due cards', () => {
      const cards = [
        createFutureTestCard('future-1'),
        createFutureTestCard('future-2')
      ];
      
      const dueCards = filterDueCards(cards, now);
      expect(dueCards).toHaveLength(0);
    });
    
    it('should handle empty array input', () => {
      const dueCards = filterDueCards([], now);
      expect(dueCards).toHaveLength(0);
    });
    
    it('should handle invalid array input gracefully', () => {
      const dueCards = filterDueCards(null as any, now);
      expect(dueCards).toHaveLength(0);
    });
    
    it('should skip invalid cards in the collection', () => {
      const cards = [
        createDueTestCard('due-1'),
        { id: 'invalid' } as CardProgress, // Missing nextReviewAt
        createDueTestCard('due-2'),
        null as any
      ];
      
      const dueCards = filterDueCards(cards, now);
      expect(dueCards).toHaveLength(2);
      expect(dueCards[0].id).toBe('due-1');
      expect(dueCards[1].id).toBe('due-2');
    });
    
    it('should handle large collections efficiently', () => {
      // Create large collection
      const largeCollection = Array.from({ length: 1000 }, (_, i) => 
        i % 2 === 0 ? createDueTestCard(`due-${i}`) : createFutureTestCard(`future-${i}`)
      );
      
      const start = performance.now();
      const dueCards = filterDueCards(largeCollection, now);
      const duration = performance.now() - start;
      
      expect(dueCards).toHaveLength(500); // Half should be due
      expect(duration).toBeLessThan(50); // Should be fast (<50ms)
    });
    
    it('should use current time when now parameter is not provided', () => {
      const cards = [createTestCard('test-1', Date.now() - 1000)];
      const dueCards = filterDueCards(cards);
      
      expect(dueCards).toHaveLength(1);
    });
  });
  
  describe('fromDueCard', () => {
    it('should extract CardProgress from DueCard', () => {
      const originalCard = createDueTestCard('test-1');
      const dueCard = toDueCard(originalCard, now);
      const extracted = fromDueCard(dueCard);
      
      expect(extracted).toMatchObject(originalCard);
      expect(extracted).not.toHaveProperty('__isDue');
      expect(extracted).not.toHaveProperty('__brand');
    });
  });
  
  describe('areDueCards', () => {
    it('should return true for array of DueCard objects', () => {
      const cards = [
        createDueTestCard('due-1'),
        createDueTestCard('due-2')
      ];
      const dueCards = filterDueCards(cards, now);
      
      expect(areDueCards(dueCards)).toBe(true);
    });
    
    it('should return false for mixed array', () => {
      const cards = [
        createDueTestCard('due-1'),
        createDueTestCard('due-2')
      ];
      const dueCards = filterDueCards(cards, now);
      const mixed = [...dueCards, createFutureTestCard('future-1')];
      
      expect(areDueCards(mixed)).toBe(false);
    });
    
    it('should return true for empty array', () => {
      expect(areDueCards([])).toBe(true);
    });
    
    it('should return false for invalid objects', () => {
      const invalid = [{ id: 'test' }, null, undefined];
      expect(areDueCards(invalid)).toBe(false);
    });
  });
  
  describe('createDueCardsMap', () => {
    it('should create map with positionId keys', () => {
      const cards = [
        createDueTestCard('due-1'),
        createDueTestCard('due-2')
      ];
      const dueCards = filterDueCards(cards, now);
      const map = createDueCardsMap(dueCards);
      
      expect(map.size).toBe(2);
      expect(map.has('due-1')).toBe(true);
      expect(map.has('due-2')).toBe(true);
      expect(map.get('due-1')).toMatchObject(dueCards[0]);
    });
    
    it('should handle empty array', () => {
      const map = createDueCardsMap([]);
      expect(map.size).toBe(0);
    });
    
    it('should skip cards without id', () => {
      const cards = [createDueTestCard('due-1')];
      const dueCards = filterDueCards(cards, now);
      // Remove id from one card
      delete (dueCards[0] as any).id;
      
      const map = createDueCardsMap(dueCards);
      expect(map.size).toBe(0);
    });
  });
  
  describe('calculateDueCardsStats', () => {
    it('should calculate correct statistics', () => {
      const allCards = [
        createDueTestCard('due-1'),
        createDueTestCard('due-2'), 
        createFutureTestCard('future-1'),
        createFutureTestCard('future-2')
      ];
      const dueCards = filterDueCards(allCards, now);
      
      const stats = calculateDueCardsStats(allCards, dueCards, now);
      
      expect(stats.totalCards).toBe(4);
      expect(stats.dueCount).toBe(2);
      expect(stats.duePercentage).toBe(50);
      expect(stats.nextDueAt).toBeTruthy();
      expect(typeof stats.averageInterval).toBe('number');
    });
    
    it('should handle empty collections', () => {
      const stats = calculateDueCardsStats([], [], now);
      
      expect(stats.totalCards).toBe(0);
      expect(stats.dueCount).toBe(0);
      expect(stats.duePercentage).toBe(0);
      expect(stats.nextDueAt).toBeNull();
      expect(stats.averageInterval).toBe(0);
    });
    
    it('should handle no future due cards', () => {
      const allCards = [
        createDueTestCard('due-1'),
        createDueTestCard('due-2')
      ];
      const dueCards = filterDueCards(allCards, now);
      
      const stats = calculateDueCardsStats(allCards, dueCards, now);
      
      expect(stats.nextDueAt).toBeNull();
    });
    
    it('should calculate average interval correctly', () => {
      const cards = [
        createDueTestCard('due-1'),
        createDueTestCard('due-2')
      ];
      // Set specific intervals
      cards[0].interval = 2;
      cards[1].interval = 4;
      
      const dueCards = filterDueCards(cards, now);
      const stats = calculateDueCardsStats(cards, dueCards, now);
      
      expect(stats.averageInterval).toBe(3); // (2 + 4) / 2
    });
    
    it('should find next due card correctly', () => {
      const nextDueTime = now + 3600000; // 1 hour from now
      const allCards = [
        createDueTestCard('due-1'),
        createTestCard('next-due', nextDueTime),
        createTestCard('later-due', now + 7200000) // 2 hours from now
      ];
      const dueCards = filterDueCards(allCards, now);
      
      const stats = calculateDueCardsStats(allCards, dueCards, now);
      
      expect(stats.nextDueAt).toBe(nextDueTime);
    });
  });
  
  describe('TypeScript type checking', () => {
    it('should enforce DueCard branded type at compile time', () => {
      const card = createDueTestCard('test-1');
      const dueCard = toDueCard(card, now);
      
      // These should compile without errors
      const branded: DueCard = dueCard;
      expect(branded.__isDue).toBe(true);
      expect(branded.__brand).toBe('DueCard');
      
      // This should be caught by TypeScript (though not at runtime)
      // const invalid: DueCard = card; // Would fail TypeScript compilation
    });
  });
});