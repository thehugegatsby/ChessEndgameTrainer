/**
 * @file Title formatting utilities for chess positions
 * @module utils/titleFormatter
 *
 * @description
 * Provides specialized formatting for chess endgame position titles,
 * with custom handling for specific position types like Brückenbau
 * (bridge-building) positions and progress indicators.
 *
 * @remarks
 * Key features:
 * - Special formatting for Brückenbau positions (X/Y numbering)
 * - Title truncation for navigation elements
 * - Progress indicators for training sessions
 * - Category-based formatting rules
 *
 * The module ensures consistent title display across the application
 * while handling edge cases and special position types.
 */

import { EndgamePosition } from "@shared/types";

/**
 * Formats position titles according to UI requirements
 *
 * @param {EndgamePosition} position - The endgame position to format
 * @param {number} [totalPositions] - Total positions in the category (for numbering)
 * @returns {string} Formatted position title
 *
 * @description
 * Applies special formatting rules based on position type:
 * - Brückenbau positions: "Brückenbau X/Y" format
 * - Other positions: Use original title unchanged
 *
 * @example
 * ```typescript
 * // Brückenbau position
 * formatPositionTitle({ title: 'Brückenbau', id: 3 }, 10);
 * // Returns: "Brückenbau 3/10"
 *
 * // Regular position
 * formatPositionTitle({ title: 'Rook vs Pawn', id: 1 });
 * // Returns: "Rook vs Pawn"
 * ```
 *
 * @remarks
 * Brückenbau (bridge-building) is a specific rook endgame technique
 * that requires sequential learning, hence the special numbering.
 */
export function formatPositionTitle(
  position: EndgamePosition,
  totalPositions?: number,
): string {
  const { title, id, category } = position;

  // Handle Brückenbau positions with special formatting
  if (title === "Brückenbau" || title.toLowerCase().includes("brückenbau")) {
    if (totalPositions) {
      return `Brückenbau ${id}/${totalPositions}`;
    }
    // Fallback if no total is provided
    return `Brückenbau ${id}`;
  }

  // Handle other position types that might need special formatting
  if (category === "rook-pawn" && title === "Brückenbau") {
    // Ensure rook-pawn Brückenbau positions get proper numbering
    return totalPositions
      ? `Brückenbau ${id}/${totalPositions}`
      : `Brückenbau ${id}`;
  }

  // For all other positions, return the original title
  return title;
}

/**
 * Gets a short version of the title for navigation elements
 *
 * @param {EndgamePosition} position - The endgame position
 * @returns {string} Shortened title suitable for navigation
 *
 * @description
 * Creates concise titles for UI elements with limited space.
 * Preserves full Brückenbau titles due to their importance,
 * but truncates other long titles to fit navigation constraints.
 *
 * @example
 * ```typescript
 * getShortTitle({ title: 'Brückenbau', id: 5 });
 * // Returns: "Brückenbau 5" (kept full)
 *
 * getShortTitle({ title: 'King and Pawn vs King Endgame Fundamentals' });
 * // Returns: "King and Pawn vs King End..." (truncated)
 * ```
 *
 * @remarks
 * Maximum length is 30 characters before truncation.
 * Ellipsis (...) is added to indicate truncation.
 */
export function getShortTitle(position: EndgamePosition): string {
  const formatted = formatPositionTitle(position);

  // For Brückenbau, keep the full formatted title as it's already concise
  if (formatted.includes("Brückenbau")) {
    return formatted;
  }

  // For other long titles, truncate if needed
  if (formatted.length > 30) {
    return formatted.substring(0, 27) + "...";
  }

  return formatted;
}

/**
 * Gets the display title for the current training session
 *
 * @param {EndgamePosition} position - The current training position
 * @param {number} [moveCount] - Number of moves played (kept for compatibility, not used)
 * @param {number} [totalPositions] - Total positions in the category
 * @returns {string} Training session title
 *
 * @description
 * Creates titles for active training sessions showing position
 * information and progress through multiple positions.
 *
 * @example
 * ```typescript
 * // Single position
 * getTrainingDisplayTitle(position);
 * // Returns: "Brückenbau"
 *
 * // Multiple positions
 * getTrainingDisplayTitle(position, 8, 10);
 * // Returns: "Brückenbau 3/10"
 * ```
 *
 * @remarks
 * The moveCount parameter is kept for backwards compatibility but
 * is no longer used. Previously showed move progress indicators.
 */
export function getTrainingDisplayTitle(
  position: EndgamePosition,
  moveCount?: number,
  totalPositions?: number,
): string {
  const baseTitle = formatPositionTitle(position, totalPositions);

  // Simply return the base title without move indicators
  return baseTitle;
}
