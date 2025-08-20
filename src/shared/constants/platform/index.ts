/**
 * @fileoverview Platform constants barrel export
 * @module constants/platform
 */

// Storage constants
export const STORAGE = {
  PREFIX: 'endgame-trainer',
  KEYS: {
    USER_SETTINGS: 'user-settings',
    TRAINING_PROGRESS: 'training-progress',
    POSITION_CACHE: 'position-cache',
  },
} as const;

// System constants  
export const SYSTEM = {
  GB_TO_BYTES_FACTOR: 1024 * 1024 * 1024, // 1 GB in bytes
  DEFAULT_MEMORY_GB: 4, // Default memory assumption
  LOW_MEMORY_THRESHOLD_GB: 2, // Low memory threshold
} as const;

// Rating constants
export const RATING = {
  BEGINNER_THRESHOLD: 1200,
  INTERMEDIATE_THRESHOLD: 1800,
  ADVANCED_THRESHOLD: 2200,
  EXPERT_THRESHOLD: 2600,
} as const;