/**
 * Endgame training types
 */

export interface EndgamePosition {
  id: number;
  title: string;
  description: string;
  fen: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'master';
  targetMoves?: number;
  hints?: string[];
  solution?: string[];
  nextPositionId?: number | null;
  sideToMove?: 'white' | 'black';
  goal?: 'win' | 'draw' | 'defend';
}

export interface EndgameCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  positions: EndgamePosition[];
  subcategories?: EndgameSubcategory[];
}

export interface EndgameSubcategory {
  id: string;
  name: string;
  description: string;
  categoryId: string;
}

export interface EndgameChapter {
  id: string;
  name: string;
  description: string;
  category: string;
  lessons: EndgamePosition[];
  totalLessons: number;
}
