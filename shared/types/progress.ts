/**
 * @file Progress-related branded types
 * @description Type-safe Due Card implementations with branded types
 * 
 * This module provides branded types for Due Cards to ensure type safety
 * and prevent runtime errors when working with spaced repetition cards.
 * 
 * @example
 * ```typescript
 * // Type-safe due card filtering
 * const cards: CardProgress[] = getUserCards();
 * const dueCards: DueCard[] = filterDueCards(cards);
 * 
 * // Type guard usage
 * if (isDueCard(card)) {
 *   // TypeScript knows 'card' is DueCard here
 *   processCard(card);
 * }
 * ```
 */

import type { CardProgress } from '@shared/store/slices/types';
import { getLogger } from '@shared/services/logging/Logger';

const logger = getLogger().setContext('ProgressTypes');

/**
 * Branded type for cards that are due for review
 * 
 * This branded type ensures that only cards that have been validated
 * as due can be processed as DueCard instances.
 */
export type DueCard = CardProgress & { 
  readonly __isDue: true;
  readonly __brand: 'DueCard';
};

/**
 * Type guard to check if a card is due for review
 * 
 * @param card - CardProgress to check
 * @param now - Current timestamp (defaults to Date.now())
 * @returns True if card is due for review
 * 
 * @example
 * ```typescript
 * if (isDueCard(card)) {
 *   // TypeScript narrows type to DueCard
 *   const dueCard: DueCard = card;
 * }
 * ```
 */
export function isDueCard(
  card: CardProgress, 
  now: number = Date.now()
): card is DueCard {
  // Validate card structure
  if (!card || typeof card.nextReviewAt !== 'number') {
    logger.warn('Invalid card structure in isDueCard check', { card });
    return false;
  }
  
  // Check if card is due based on nextReviewAt timestamp
  return card.nextReviewAt <= now;
}

/**
 * Safe factory function to create a DueCard
 * 
 * @param card - CardProgress to convert
 * @param now - Current timestamp (defaults to Date.now())
 * @returns DueCard instance
 * @throws Error if card is not due
 * 
 * @example
 * ```typescript
 * try {
 *   const dueCard = toDueCard(card);
 *   processCard(dueCard);
 * } catch (error) {
 *   // Card is not due for review
 * }
 * ```
 */
export function toDueCard(
  card: CardProgress, 
  now: number = Date.now()
): DueCard {
  if (!isDueCard(card, now)) {
    const nextReview = new Date(card.nextReviewAt).toISOString();
    const currentTime = new Date(now).toISOString();
    throw new Error(
      `Card '${card.id}' is not due for review. ` +
      `Next review: ${nextReview}, Current: ${currentTime}`
    );
  }
  
  // Create branded DueCard
  return {
    ...card,
    __isDue: true,
    __brand: 'DueCard' as const
  } as DueCard;
}

/**
 * Batch processing function to filter due cards from a collection
 * 
 * This function is optimized for performance when processing large
 * collections of cards (>500 cards).
 * 
 * @param cards - Array of CardProgress objects
 * @param now - Current timestamp (defaults to Date.now())
 * @returns Array of DueCard objects
 * 
 * @example
 * ```typescript
 * const allCards = Object.values(cardProgress);
 * const dueCards = filterDueCards(allCards);
 * console.log(`${dueCards.length} cards are due for review`);
 * ```
 */
export function filterDueCards(
  cards: CardProgress[], 
  now: number = Date.now()
): DueCard[] {
  if (!Array.isArray(cards)) {
    logger.warn('Invalid cards array in filterDueCards', { cards });
    return [];
  }
  
  const dueCards: DueCard[] = [];
  
  // Optimized loop for large collections
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    
    // Skip invalid cards
    if (!card || typeof card.nextReviewAt !== 'number') {
      continue;
    }
    
    // Check if due and add to result
    if (card.nextReviewAt <= now) {
      dueCards.push({
        ...card,
        __isDue: true,
        __brand: 'DueCard' as const
      } as DueCard);
    }
  }
  
  logger.debug('Filtered due cards', { 
    totalCards: cards.length, 
    dueCards: dueCards.length,
    percentage: Math.round((dueCards.length / cards.length) * 100) || 0
  });
  
  return dueCards;
}

/**
 * Utility function to extract CardProgress from DueCard
 * 
 * This function removes the branded type properties and returns
 * the underlying CardProgress object.
 * 
 * @param dueCard - DueCard to convert
 * @returns CardProgress object
 */
export function fromDueCard(dueCard: DueCard): CardProgress {
  const { __isDue, __brand, ...cardProgress } = dueCard;
  return cardProgress;
}

/**
 * Type predicate to check if an array contains only DueCard objects
 * 
 * @param cards - Array to check
 * @returns True if all items are DueCard objects
 */
export function areDueCards(cards: unknown[]): cards is DueCard[] {
  return cards.every(card => 
    typeof card === 'object' && 
    card !== null && 
    '__isDue' in card && 
    '__brand' in card &&
    (card as any).__brand === 'DueCard'
  );
}

/**
 * Performance optimized due cards map creation
 * 
 * Creates a map of positionId -> DueCard for O(1) lookups.
 * Useful for large card collections.
 * 
 * @param dueCards - Array of DueCard objects
 * @returns Map of positionId to DueCard
 */
export function createDueCardsMap(dueCards: DueCard[]): Map<string, DueCard> {
  const map = new Map<string, DueCard>();
  
  for (const card of dueCards) {
    if (card.id) {
      map.set(card.id, card);
    }
  }
  
  return map;
}

/**
 * Statistics interface for due cards analysis
 */
export interface DueCardsStats {
  totalCards: number;
  dueCount: number;
  duePercentage: number;
  nextDueAt: number | null;
  averageInterval: number;
}

/**
 * Calculate statistics for due cards analysis
 * 
 * @param allCards - All card progress objects
 * @param dueCards - Due cards subset
 * @param now - Current timestamp
 * @returns Statistics object
 */
export function calculateDueCardsStats(
  allCards: CardProgress[],
  dueCards: DueCard[],
  now: number = Date.now()
): DueCardsStats {
  const totalCards = allCards.length;
  const dueCount = dueCards.length;
  const duePercentage = totalCards > 0 ? Math.round((dueCount / totalCards) * 100) : 0;
  
  // Find next due card
  const futureDueCards = allCards
    .filter(card => card.nextReviewAt > now)
    .sort((a, b) => a.nextReviewAt - b.nextReviewAt);
  
  const nextDueAt = futureDueCards.length > 0 ? futureDueCards[0].nextReviewAt : null;
  
  // Calculate average interval for due cards
  const totalInterval = dueCards.reduce((sum, card) => sum + card.interval, 0);
  const averageInterval = dueCount > 0 ? Math.round(totalInterval / dueCount) : 0;
  
  return {
    totalCards,
    dueCount,
    duePercentage,
    nextDueAt,
    averageInterval
  };
}