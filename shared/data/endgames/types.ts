/**
 * @fileoverview Type definitions for Endgame Training System
 * @version 1.0.0
 * @description Comprehensive type system for chess endgame training
 * Designed for web and mobile (Android) compatibility
 */

/**
 * Main endgame position interface
 * Enhanced with mobile training features and progress tracking
 */
export interface EndgamePosition {
  id: number;
  title: string;
  description: string;
  fen: string;
  category: 'pawn' | 'rook' | 'queen' | 'minor' | 'other';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  goal: 'win' | 'draw' | 'defend';
  sideToMove: 'white' | 'black';
  
  // Material classification for advanced menu and mobile filtering
  material: {
    white: string;  // e.g. "K+P", "K+R", "K+Q"
    black: string;  // e.g. "K", "K+P", "K+R"
  };
  
  // Hybrid WikiPanel content - educational information
  baseContent?: {
    strategies?: string[];
    commonMistakes?: string[];
    keyPrinciples?: string[];
  };
  
  // Individual additions for special positions
  specialContent?: {
    keySquares?: string[];
    criticalMoves?: string[];
    historicalNote?: string;
    specificTips?: string[];
  };
  
  // Brückenbau-spezifische Hinweise für progressive Lernhilfe
  bridgeHints?: string[];
  
  // Tags for search and filtering (mobile app features)
  tags: string[];
  
  // User progress tracking (mobile/local storage)
  userRating?: number;        // ELO-like rating for this position
  timesPlayed?: number;       // Training session count
  successRate?: number;       // Success percentage (0-1)
  lastPlayed?: Date;         // For spaced repetition
  averageTime?: number;      // Average solving time in seconds
  
  // Mobile-specific metadata
  estimatedDifficulty?: number;  // 1-10 scale for mobile UI
  studyTime?: number;           // Estimated study time in minutes
  prerequisites?: number[];     // IDs of positions to study first
}

/**
 * Subcategory interface for material-based grouping
 * Optimized for mobile navigation and hierarchical display
 */
export interface EndgameSubcategory {
  id: string;
  name: string;
  material: string;        // "K+P vs K", "K+2P vs K+P", etc.
  icon: string;           // Chess symbols for mobile UI
  positions: EndgamePosition[];
  
  // Mobile UI enhancements
  displayOrder?: number;
  isLocked?: boolean;     // For progressive unlocking
  requiredRating?: number; // Minimum rating to unlock
}

/**
 * Main category interface with mobile enhancements
 * Supports Android app navigation and progress tracking
 */
export interface EndgameCategory {
  id: string;
  name: string;
  description: string;
  icon: string;           // Unicode chess symbols: ♙, ♜, ♛, ♞, ♝
  subcategories: EndgameSubcategory[];
  positions: EndgamePosition[];  // For backward compatibility
  
  // Mobile app specific fields
  mobilePriority?: number;    // Display order in mobile app
  estimatedStudyTime?: string; // "2-4 weeks" for user planning
  skillLevel?: string;        // "Beginner", "Advanced", etc.
  color?: string;            // Hex color for mobile theming
  isAvailableOffline?: boolean; // For Android offline mode
}

/**
 * Chapter system for thematic learning
 */
export interface EndgameChapter {
  id: string;
  name: string;           // "Brückenbau", "Bauernendspiele", etc.
  description: string;
  category: string;       // Links to EndgameCategory
  lessons: EndgamePosition[];
  totalLessons: number;   // For "Brückenbau 1/3" display
}

/**
 * Training session data for mobile progress tracking
 */
export interface TrainingSession {
  id: string;
  positionId: number;
  startTime: Date;
  endTime?: Date;
  moves: string[];        // Moves played in session
  result: 'success' | 'failure' | 'partial' | 'abandoned';
  mistakes: number;       // Count of critical mistakes
  hints: number;          // Hints used
  timeSpent: number;      // Total time in seconds
  finalScore: number;     // 0-1 based on performance
}

/**
 * User progress data for mobile app state management
 */
export interface UserProgress {
  userId?: string;
  totalPositions: number;
  completedPositions: number;
  currentStreak: number;
  longestStreak: number;
  totalStudyTime: number; // in minutes
  averageAccuracy: number; // 0-1
  favoriteCategory?: string;
  
  // Per-position data
  positionProgress: Map<number, {
    rating: number;
    timesPlayed: number;
    successRate: number;
    lastPlayed: Date;
    averageTime: number;
    needsReview: boolean;
  }>;
  
  // Spaced repetition data
  dueDates: Map<number, Date>;
  intervals: Map<number, number>; // Days until next review
}

/**
 * Mobile app configuration interface
 */
export interface MobileAppConfig {
  theme: 'light' | 'dark' | 'auto';
  language: 'de' | 'en' | 'es' | 'fr';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  offlineModeEnabled: boolean;
  
  // Training preferences
  showHints: boolean;
  autoAdvance: boolean;
  dailyGoal: number;      // Positions to study per day
  reminderTime?: string;  // "19:00" format
  
  // Performance settings for older Android devices
  reduceAnimations: boolean;
  lowPowerMode: boolean;
  preloadPositions: number; // Number of positions to preload
}

/**
 * Analytics data for training insights (mobile dashboard)
 */
export interface TrainingAnalytics {
  weeklyStats: {
    positionsStudied: number;
    timeSpent: number;
    accuracy: number;
    streak: number;
  }[];
  
  categoryPerformance: {
    categoryId: string;
    accuracy: number;
    averageTime: number;
    positionsCompleted: number;
  }[];
  
  difficultyDistribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  
  improvementTrends: {
    date: Date;
    averageRating: number;
    accuracy: number;
  }[];
} 