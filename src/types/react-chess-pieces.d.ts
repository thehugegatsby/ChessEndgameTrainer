declare module 'react-chess-pieces/dist/svg-index' {
  import { type FC, type SVGProps } from 'react';

  // White pieces
  export const K: FC<SVGProps<SVGSVGElement>>; // White King
  export const Q: FC<SVGProps<SVGSVGElement>>; // White Queen
  export const R: FC<SVGProps<SVGSVGElement>>; // White Rook
  export const B: FC<SVGProps<SVGSVGElement>>; // White Bishop
  export const N: FC<SVGProps<SVGSVGElement>>; // White Knight
  export const P: FC<SVGProps<SVGSVGElement>>; // White Pawn

  // Black pieces
  export const k: FC<SVGProps<SVGSVGElement>>; // Black King
  export const q: FC<SVGProps<SVGSVGElement>>; // Black Queen
  export const r: FC<SVGProps<SVGSVGElement>>; // Black Rook
  export const b: FC<SVGProps<SVGSVGElement>>; // Black Bishop
  export const n: FC<SVGProps<SVGSVGElement>>; // Black Knight
  export const p: FC<SVGProps<SVGSVGElement>>; // Black Pawn
}
