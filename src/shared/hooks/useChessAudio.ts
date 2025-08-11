/**
 * @file Chess audio hook with use-sound integration
 * @module hooks/useChessAudio
 * 
 * @description
 * Hook for playing chess-specific audio effects during gameplay to enhance
 * the Lichess-like experience. Supports various chess events with fallback
 * for missing audio files and respects browser autoplay policies.
 * 
 * @remarks
 * Phase 1 implementation with basic sound types:
 * - Move sounds for regular moves
 * - Capture sounds for piece captures
 * - Check sounds for check notifications
 * - Game end sounds (checkmate, draw)
 * - Error sounds for invalid moves
 * 
 * Future phases will add audio sprites and advanced settings.
 */

import { useCallback, useRef } from 'react';
import useSound from 'use-sound';
import { getLogger } from '@shared/services/logging/Logger';
import { useFallbackAudio } from './useFallbackAudio';

/**
 * Chess sound event types
 */
export type ChessSoundType = 
  | 'move'          // Regular piece move
  | 'capture'       // Piece capture
  | 'check'         // Check notification
  | 'checkmate'     // Game ends in checkmate
  | 'draw'          // Game ends in draw/stalemate
  | 'promotion'     // Pawn promotion
  | 'error'         // Invalid move or error
  | 'success';      // Training success

/**
 * Audio configuration options
 */
export interface AudioConfig {
  /** Master volume (0-1) */
  volume: number;
  /** Whether audio is enabled */
  enabled: boolean;
  /** Preload strategy */
  preload: boolean;
}

/**
 * Default audio configuration
 */
const DEFAULT_CONFIG: AudioConfig = {
  volume: 0.7,
  enabled: true,
  preload: true,
};

/**
 * Sound file paths (fallback to single file if sprites not available)
 */
const SOUND_PATHS = {
  move: '/sounds/chess/move.mp3',
  capture: '/sounds/chess/capture.mp3',
  check: '/sounds/chess/check.mp3',
  checkmate: '/sounds/chess/checkmate.mp3',
  draw: '/sounds/chess/draw.mp3',
  promotion: '/sounds/chess/promotion.mp3',
  error: '/sounds/chess/error.mp3',
  success: '/sounds/chess/success.mp3',
} as const;

/**
 * Chess audio hook for playing game-related sounds
 * 
 * @description
 * Provides a simple interface for playing chess audio effects with automatic
 * fallback handling and logging. Respects browser autoplay policies and 
 * gracefully degrades when audio files are missing.
 * 
 * @param config - Optional audio configuration
 * @returns Object with play function and audio state
 * 
 * @example
 * ```tsx
 * const { playSound, isAudioEnabled } = useChessAudio({
 *   volume: 0.8,
 *   enabled: true
 * });
 * 
 * // Play move sound
 * playSound('move');
 * 
 * // Play capture sound
 * playSound('capture');
 * ```
 */
/**
 * Return type for useChessAudio hook
 */
export type UseChessAudioReturn = {
  readonly playSound: (soundType: ChessSoundType) => Promise<void>;
  readonly isSoundLoaded: (soundType: ChessSoundType) => boolean;
  readonly getLoadedSoundCount: () => number;
  readonly isAudioEnabled: boolean;
  readonly audioVolume: number;
};

export const useChessAudio = (config: Partial<AudioConfig> = {}): UseChessAudioReturn => {
  const audioConfig = { ...DEFAULT_CONFIG, ...config };
  const logger = getLogger();
  const loadedSounds = useRef<Set<ChessSoundType>>(new Set());
  
  // Fallback audio system
  const { playFallbackSound } = useFallbackAudio(audioConfig.volume);

  // Load all sounds with use-sound (with error handling)
  const [playMove] = useSound(SOUND_PATHS.move, {
    volume: audioConfig.volume,
    preload: audioConfig.preload,
    onload: () => loadedSounds.current.add('move'),
    onloaderror: () => logger.warn('Failed to load move sound'),
  });

  const [playCapture] = useSound(SOUND_PATHS.capture, {
    volume: audioConfig.volume,
    preload: audioConfig.preload,
    onload: () => loadedSounds.current.add('capture'),
    onloaderror: () => logger.warn('Failed to load capture sound'),
  });

  const [playCheck] = useSound(SOUND_PATHS.check, {
    volume: audioConfig.volume,
    preload: audioConfig.preload,
    onload: () => loadedSounds.current.add('check'),
    onloaderror: () => logger.warn('Failed to load check sound'),
  });

  const [playCheckmate] = useSound(SOUND_PATHS.checkmate, {
    volume: audioConfig.volume,
    preload: audioConfig.preload,
    onload: () => loadedSounds.current.add('checkmate'),
    onloaderror: () => logger.warn('Failed to load checkmate sound'),
  });

  const [playDraw] = useSound(SOUND_PATHS.draw, {
    volume: audioConfig.volume,
    preload: audioConfig.preload,
    onload: () => loadedSounds.current.add('draw'),
    onloaderror: () => logger.warn('Failed to load draw sound'),
  });

  const [playPromotion] = useSound(SOUND_PATHS.promotion, {
    volume: audioConfig.volume,
    preload: audioConfig.preload,
    onload: () => loadedSounds.current.add('promotion'),
    onloaderror: () => logger.warn('Failed to load promotion sound'),
  });

  const [playError] = useSound(SOUND_PATHS.error, {
    volume: audioConfig.volume,
    preload: audioConfig.preload,
    onload: () => loadedSounds.current.add('error'),
    onloaderror: () => logger.warn('Failed to load error sound'),
  });

  const [playSuccess] = useSound(SOUND_PATHS.success, {
    volume: audioConfig.volume,
    preload: audioConfig.preload,
    onload: () => loadedSounds.current.add('success'),
    onloaderror: () => logger.warn('Failed to load success sound'),
  });

  /**
   * Play a chess sound effect
   * 
   * @param soundType - Type of sound to play
   * @returns Promise that resolves when sound starts playing
   */
  const playSound = useCallback(async (soundType: ChessSoundType): Promise<void> => {
    // Check if audio is enabled
    if (!audioConfig.enabled) {
      return;
    }

    try {
      // Map sound types to their respective play functions
      const soundMap = {
        move: playMove,
        capture: playCapture,
        check: playCheck,
        checkmate: playCheckmate,
        draw: playDraw,
        promotion: playPromotion,
        error: playError,
        success: playSuccess,
      };

      const playFunction = soundMap[soundType];
      if (playFunction) {
        try {
          playFunction();
          logger.debug(`Played ${soundType} sound from MP3`);
        } catch {
          // If MP3 fails, try fallback audio
          logger.info(`MP3 failed for ${soundType}, using fallback`);
          await playFallbackSound(soundType);
        }
      } else {
        logger.warn(`Unknown sound type: ${soundType}`);
      }
    } catch (error) {
      // Graceful degradation - don't let audio errors break the game
      logger.warn(`Failed to play ${soundType} sound`, error as Error);
    }
  }, [
    audioConfig.enabled,
    playMove,
    playCapture,
    playCheck,
    playCheckmate,
    playDraw,
    playPromotion,
    playError,
    playSuccess,
    logger,
    playFallbackSound,
  ]);

  /**
   * Check if a specific sound type is loaded and ready
   */
  const isSoundLoaded = useCallback((soundType: ChessSoundType): boolean => {
    return loadedSounds.current.has(soundType);
  }, []);

  /**
   * Get the count of successfully loaded sounds
   */
  const getLoadedSoundCount = useCallback((): number => {
    return loadedSounds.current.size;
  }, []);

  return {
    playSound,
    isSoundLoaded,
    getLoadedSoundCount,
    isAudioEnabled: audioConfig.enabled,
    audioVolume: audioConfig.volume,
  };
};

/**
 * Chess audio context for detecting game events and playing appropriate sounds
 * This will be expanded in Phase 2 with store integration
 */
export interface ChessAudioContext {
  /** Whether the last move was a capture */
  wasCapture: boolean;
  /** Whether the position is in check */
  isInCheck: boolean;
  /** Whether the game ended in checkmate */
  isCheckmate: boolean;
  /** Whether the game ended in draw */
  isDraw: boolean;
  /** Whether a promotion occurred */
  wasPromotion: boolean;
}