/**
 * Title formatting utilities for chess positions
 * Handles special formatting for different position types
 */

import { EndgamePosition } from '@shared/types';

/**
 * Formats position titles according to UI requirements
 * - Brückenbau positions: "Brückenbau X/Y" format
 * - Other positions: Use original title
 */
export function formatPositionTitle(position: EndgamePosition, totalPositions?: number): string {
  const { title, id, category } = position;
  
  // Handle Brückenbau positions with special formatting
  if (title === 'Brückenbau' || title.toLowerCase().includes('brückenbau')) {
    if (totalPositions) {
      return `Brückenbau ${id}/${totalPositions}`;
    }
    // Fallback if no total is provided
    return `Brückenbau ${id}`;
  }
  
  // Handle other position types that might need special formatting
  if (category === 'rook-pawn' && title === 'Brückenbau') {
    // Ensure rook-pawn Brückenbau positions get proper numbering
    return totalPositions ? `Brückenbau ${id}/${totalPositions}` : `Brückenbau ${id}`;
  }
  
  // For all other positions, return the original title
  return title;
}

/**
 * Gets a short version of the title for navigation elements
 */
export function getShortTitle(position: EndgamePosition): string {
  const formatted = formatPositionTitle(position);
  
  // For Brückenbau, keep the full formatted title as it's already concise
  if (formatted.includes('Brückenbau')) {
    return formatted;
  }
  
  // For other long titles, truncate if needed
  if (formatted.length > 30) {
    return formatted.substring(0, 27) + '...';
  }
  
  return formatted;
}

/**
 * Gets the display title for the current training session
 * Includes position context and progress indicators
 */
export function getTrainingDisplayTitle(
  position: EndgamePosition, 
  moveCount?: number,
  totalPositions?: number
): string {
  const baseTitle = formatPositionTitle(position, totalPositions);
  
  // Add move progress indicator for longer sessions
  if (moveCount && moveCount > 3) {
    const moveNumber = Math.floor(moveCount / 2);
    return `${baseTitle} 🔥 ${moveNumber}`;
  }
  
  return baseTitle;
}