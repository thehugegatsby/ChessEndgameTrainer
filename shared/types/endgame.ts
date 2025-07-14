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

export interface TrainingSession {
  positionId: number;
  startTime: Date;
  endTime?: Date;
  moves: string[];
  completed: boolean;
  score?: number;
  result?: 'success' | 'failure';
  mistakes?: number;
  timeSpent?: number;
}

export interface UserProgress {
  userId: string;
  positionId: number;
  completed: boolean;
  bestScore: number;
  attempts: number;
  lastAttempt: Date;
}

export interface MobileAppConfig {
  offlineMode: boolean;
  syncInterval: number;
  maxCacheSize: number;
  reminderTime?: string;
  reminderEnabled?: boolean;
}

export interface TrainingAnalytics {
  totalPositions: number;
  completedPositions: number;
  averageScore: number;
  timeSpent: number;
  favoriteCategory?: string;
}