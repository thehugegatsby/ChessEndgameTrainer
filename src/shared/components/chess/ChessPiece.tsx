/**
 * @file ChessPiece component for rendering Lichess cburnett SVG pieces
 * @module components/chess/ChessPiece
 *
 * @description
 * Reusable component for rendering chess piece SVGs from the Lichess cburnett set.
 * Provides a clean interface for displaying chess pieces with proper styling and accessibility.
 *
 * @remarks
 * Key features:
 * - Uses actual Lichess cburnett SVG pieces for authentic look
 * - Supports all standard chess pieces (Q, R, B, N) in both colors
 * - Configurable size and styling through props
 * - Accessible with proper alt text and ARIA labels
 */

import React from 'react';

/**
 * Mapping of piece identifiers to their SVG URLs in public directory
 */
const pieceMap = {
  wQ: '/pieces/wQ.svg',
  wR: '/pieces/wR.svg',
  wB: '/pieces/wB.svg',
  wN: '/pieces/wN.svg',
  bQ: '/pieces/bQ.svg',
  bR: '/pieces/bR.svg',
  bB: '/pieces/bB.svg',
  bN: '/pieces/bN.svg',
} as const;

/**
 * Valid piece identifiers
 */
export type PieceId = keyof typeof pieceMap;

/**
 * Props for the ChessPiece component
 */
interface ChessPieceProps {
  /** Piece identifier (e.g., 'wQ' for white queen, 'bN' for black knight) */
  piece: PieceId;
  /** Size of the piece in pixels (default: 48) */
  size?: number;
  /** Additional CSS class names */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
  /** Click handler */
  onClick?: () => void;
  /** Alt text for accessibility (auto-generated if not provided) */
  alt?: string;
  /** ARIA label for accessibility (auto-generated if not provided) */
  'aria-label'?: string;
}

/**
 * Generate human-readable piece name for accessibility
 */
const getPieceName = (piece: PieceId): string => {
  const color = piece.charAt(0) === 'w' ? 'White' : 'Black';
  const type = piece.charAt(1);

  const typeNames = {
    Q: 'Queen',
    R: 'Rook',
    B: 'Bishop',
    N: 'Knight',
  } as const;

  return `${color} ${typeNames[type as keyof typeof typeNames]}`;
};

/**
 * ChessPiece component
 *
 * @component
 * @description
 * Renders a chess piece using the authentic Lichess cburnett SVG set.
 * Provides a clean, reusable interface for displaying chess pieces
 * with proper accessibility and styling support.
 *
 * @example
 * ```tsx
 * // White queen
 * <ChessPiece piece="wQ" size={64} />
 *
 * // Black knight with click handler
 * <ChessPiece
 *   piece="bN"
 *   onClick={() => selectPiece('n')}
 *   className="cursor-pointer hover:scale-110"
 * />
 *
 * // Custom styling
 * <ChessPiece
 *   piece="wR"
 *   style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
 * />
 * ```
 */
export const ChessPiece: React.FC<ChessPieceProps> = ({
  piece,
  size = 48,
  className = '',
  style = {},
  onClick,
  alt,
  'aria-label': ariaLabel,
  ...props
}) => {
  const pieceUrl = pieceMap[piece];

  if (!pieceUrl) {
    console.warn(`Unknown chess piece: ${piece}`);
    return null;
  }

  const pieceName = getPieceName(piece);
  const finalAlt = alt || pieceName;
  const finalAriaLabel = ariaLabel || pieceName;

  const combinedStyle: React.CSSProperties = {
    width: size,
    height: size,
    display: 'block',
    userSelect: 'none',
    ...style,
  };

  const combinedClassName = `chess-piece ${className}`.trim();

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={pieceUrl}
      className={combinedClassName}
      style={combinedStyle}
      onClick={onClick}
      alt={finalAlt}
      aria-label={finalAriaLabel}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : undefined}
      draggable={false}
      {...props}
    />
  );
};

export default ChessPiece;
