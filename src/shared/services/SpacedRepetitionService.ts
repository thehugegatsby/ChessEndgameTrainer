/**
 * @file SpacedRepetitionService
 * @description Pure computation service for spaced repetition using SuperMemo-2 algorithm
 * 
 * This service provides stateless functions for managing spaced repetition scheduling.
 * It uses the supermemo npm package for algorithm implementation and provides
 * utility functions for chess training specific needs.
 * 
 * @example
 * ```typescript
 * // Update card after review
 * const updatedCard = updateCardProgress(card, mapBinaryToQuality(true));
 * 
 * // Get cards due for review
 * const dueCards = getDueCards(allCards);
 * 
 * // Create new card
 * const newCard = createNewCard('position-123');
 * ```
 */

import { supermemo } from 'supermemo';
import type { CardProgress } from '@shared/store/slices/types';
import { getLogger } from '@shared/services/logging/Logger';
import { filterDueCards, type DueCard } from '@shared/types/progress';
import { ALGORITHM_MULTIPLIERS } from '@shared/constants/multipliers';
import { TIME_UNITS } from '@shared/constants/time.constants';
import { SPACED_REPETITION, SUCCESS_METRICS } from '@shared/constants/progress.constants';

const logger = getLogger().setContext('SpacedRepetitionService');

/**
 * Maps binary correct/incorrect to SuperMemo quality scale (0-5)
 * 
 * Quality scale:
 * - 0: Complete blackout, wrong response
 * - 1: Incorrect response, but remembered upon seeing answer
 * - 2: Incorrect, but close/easy to recall
 * - 3: Correct but with difficulty
 * - 4: Correct after hesitation
 * - 5: Perfect response
 * 
 * For chess moves, we use conservative mapping:
 * - Incorrect → 0 (reset interval)
 * - Correct → 4 (good but not perfect, allows steady progress)
 * 
 * @param correct - Whether the move was correct
 * @returns Quality value for SuperMemo algorithm
 */
export function mapBinaryToQuality(correct: boolean): number {
  return correct ? 4 : 0;
}

/**
 * Maps move quality assessment to SuperMemo quality scale
 * Allows for more nuanced quality assessment in future
 * 
 * @param quality - Move quality assessment
 * @returns Quality value for SuperMemo algorithm (0-5)
 */
export function mapMoveQualityToSM2(quality: 'fail' | 'hard' | 'good' | 'easy'): number {
  switch (quality) {
    case 'fail': return 0;
    case 'hard': return 3;
    case 'good': return 4;
    case 'easy': return 5;
    default: return 4; // Safe default
  }
}

/**
 * Updates card progress using SuperMemo-2 algorithm
 * 
 * @param card - Current card state
 * @param quality - Review quality (0-5)
 * @param now - Current timestamp (defaults to Date.now())
 * @returns Updated card with new scheduling
 * @throws Error if quality is out of bounds
 */
export function updateCardProgress(
  card: CardProgress,
  quality: number,
  now: number = Date.now()
): CardProgress {
  // Validate quality parameter
  if (quality < 0 || quality > 5) {
    logger.error('Invalid quality value', { quality, cardId: card.id });
    throw new Error(`Quality must be between 0 and 5, got ${quality}`);
  }

  logger.debug('Updating card progress', {
    cardId: card.id,
    quality,
    oldInterval: card.interval,
    oldEfactor: card.efactor,
  });

  // Call SuperMemo algorithm - expects item object and grade
  const result = supermemo(
    {
      interval: card.interval,
      repetition: card.repetition,
      efactor: card.efactor,
    },
    quality as 0 | 1 | 2 | 3 | 4 | 5 // Cast to valid SuperMemo grade values
  );
  
  // Handle potential NaN from supermemo library
  const interval = isNaN(result['interval']) ? 1 : result['interval'];
  const efactor = isNaN(result['efactor']) ? ALGORITHM_MULTIPLIERS.SUPERMEMO_MAX_EFACTOR : result['efactor'];
  const repetition = isNaN(result['repetition']) ? 0 : result['repetition'];

  // Calculate next review date (interval is in days)
  const nextReviewAt = now + (interval * TIME_UNITS.DAY); // Convert days to milliseconds

  const updatedCard: CardProgress = {
    ...card,
    interval,
    repetition,
    efactor,
    lapses: quality === 0 ? card.lapses + 1 : card.lapses,
    lastReviewedAt: now,
    nextReviewAt,
  };

  logger.debug('Card progress updated', {
    cardId: card.id,
    newInterval: interval,
    newEfactor: efactor,
    nextReviewDate: new Date(nextReviewAt).toISOString(),
  });

  return updatedCard;
}

/**
 * Filters cards that are due for review
 * 
 * @param cards - Array of card progress objects
 * @param now - Current timestamp (defaults to Date.now())
 * @returns Array of cards due for review
 */
export function getDueCards(
  cards: CardProgress[],
  now: number = Date.now()
): CardProgress[] {
  return cards.filter(card => card.nextReviewAt <= now);
}

/**
 * Gets cards due for review from a record/map structure
 * 
 * @param cardMap - Record of card IDs to CardProgress
 * @param now - Current timestamp (defaults to Date.now())
 * @returns Array of cards due for review
 */
export function getDueCardsFromMap(
  cardMap: Record<string, CardProgress>,
  now: number = Date.now()
): CardProgress[] {
  return getDueCards(Object.values(cardMap), now);
}

/**
 * Gets cards due for review with branded types (NEW - Enhanced Version)
 * 
 * Type-safe version that returns DueCard branded objects.
 * Provides better type safety and leverages optimized filterDueCards implementation.
 * 
 * @param cardMap - Record of card IDs to CardProgress
 * @param now - Current timestamp (defaults to Date.now())
 * @returns Array of type-safe DueCard objects
 * 
 * @example
 * ```typescript
 * const dueCards: DueCard[] = getDueCardsWithBranding(cardProgress);
 * // TypeScript knows these are validated due cards
 * dueCards.forEach(card => processCard(card));
 * ```
 */
export function getDueCardsWithBranding(
  cardMap: Record<string, CardProgress>,
  now: number = Date.now()
): DueCard[] {
  return filterDueCards(Object.values(cardMap), now);
}

/**
 * Creates a new card with initial spaced repetition values
 * 
 * @param id - Unique identifier for the card
 * @param now - Current timestamp (defaults to Date.now())
 * @returns New card with default SM-2 values
 */
export function createNewCard(
  id: string,
  now: number = Date.now()
): CardProgress {
  return {
    id,
    nextReviewAt: now, // Immediately due for first review
    lastReviewedAt: 0,
    interval: 0,
    repetition: 0,
    efactor: SPACED_REPETITION.SUCCESS_INTERVAL_MULTIPLIER, // SM-2 default ease factor
    lapses: 0,
  };
}

/**
 * Resets card progress to initial state
 * Preserves the card ID and optionally other fields
 * 
 * @param base - Card with ID and optional fields to preserve
 * @returns Reset card with default SM-2 values
 */
export function resetCardProgress(
  base: Pick<CardProgress, 'id'> & Partial<CardProgress>
): CardProgress {
  return {
    nextReviewAt: 0,
    lastReviewedAt: 0,
    interval: 0,
    repetition: 0,
    efactor: SPACED_REPETITION.SUCCESS_INTERVAL_MULTIPLIER,
    lapses: 0,
    ...base, // ID and any overrides
  };
}

/**
 * Batch updates multiple cards
 * Useful for bulk operations and performance optimization
 * 
 * @param cards - Array of cards to update
 * @param results - Map of card ID to review result (quality)
 * @param now - Current timestamp
 * @returns Updated cards array
 */
export function batchUpdateCards(
  cards: CardProgress[],
  results: Record<string, number>,
  now: number = Date.now()
): CardProgress[] {
  return cards.map(card => {
    const quality = results[card.id];
    if (quality === undefined) {
      return card; // No update for this card
    }
    return updateCardProgress(card, quality, now);
  });
}

/**
 * Calculates statistics for a set of cards
 * 
 * @param cards - Array of card progress objects
 * @param now - Current timestamp
 * @returns Statistics object
 */
export function calculateCardStatistics(
  cards: CardProgress[],
  now: number = Date.now()
): {
  totalCards: number;
  dueCards: number;
  masteredCards: number;
  learningCards: number;
  newCards: number;
  averageEfactor: number;
  totalLapses: number;
  duePercentage: number;
} {
  const dueCards = getDueCards(cards, now);
  const totalCards = cards.length;
  const masteredCards = cards.filter(c => c.interval >= SUCCESS_METRICS.LEARNED_INTERVAL_DAYS).length; // 3+ weeks
  const learningCards = cards.filter(c => c.interval > 0 && c.interval < SUCCESS_METRICS.LEARNED_INTERVAL_DAYS).length;
  const newCards = cards.filter(c => c.repetition === 0).length;
  const averageEfactor = cards.reduce((sum, c) => sum + c.efactor, 0) / totalCards || SPACED_REPETITION.SUCCESS_INTERVAL_MULTIPLIER;
  const totalLapses = cards.reduce((sum, c) => sum + c.lapses, 0);

  return {
    totalCards,
    dueCards: dueCards.length,
    masteredCards,
    learningCards,
    newCards,
    averageEfactor,
    totalLapses,
    duePercentage: totalCards > 0 ? (dueCards.length / totalCards) * SPACED_REPETITION.PERCENTAGE_BASE : 0,
  };
}

/**
 * Determines if a card should be considered "difficult"
 * Based on ease factor and lapse count
 * 
 * @param card - Card to evaluate
 * @returns True if card is difficult
 */
export function isCardDifficult(card: CardProgress): boolean {
  return card.efactor < 2.0 || card.lapses > 3;
}

/**
 * Sorts cards by review priority
 * Most overdue cards first
 * 
 * @param cards - Array of cards to sort
 * @param now - Current timestamp
 * @returns Sorted array (most urgent first)
 */
export function sortByReviewPriority(
  cards: CardProgress[],
  now: number = Date.now()
): CardProgress[] {
  return [...cards].sort((a, b) => {
    // Both overdue: most overdue first
    if (a.nextReviewAt <= now && b.nextReviewAt <= now) {
      return a.nextReviewAt - b.nextReviewAt;
    }
    // One overdue: overdue first
    if (a.nextReviewAt <= now) return -1;
    if (b.nextReviewAt <= now) return 1;
    // Neither overdue: soonest first
    return a.nextReviewAt - b.nextReviewAt;
  });
}