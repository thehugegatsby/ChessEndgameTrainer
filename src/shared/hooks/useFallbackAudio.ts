/**
 * @file Fallback audio system using Web Audio API
 * @module hooks/useFallbackAudio
 *
 * @description
 * Provides fallback audio functionality using Web Audio API when MP3 files are not available.
 * Creates simple synthesized sounds for chess events.
 */

import { useCallback, useState, useEffect } from 'react';
import { getLogger } from '@shared/services/logging/Logger';
import { AUDIO_CONSTANTS } from '@shared/constants/multipliers';
import type { ChessSoundType } from './useChessAudio';

/**
 * Hook for fallback audio using Web Audio API
 */
export const useFallbackAudio = (
  volume: number = 0.7
): {
  playFallbackSound: (soundType: ChessSoundType) => void;
  isSupported: boolean;
} => {
  const logger = getLogger();

  /**
   * Create and play a synthesized sound
   */
  const playFallbackSound = useCallback(
    (soundType: ChessSoundType) => {
      try {
        // Guard against SSR - only create audio context on client
        if (typeof window === 'undefined') {
          logger.debug('Skipping audio playback on server');
          return;
        }

        const audioContext = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

        // Different sound characteristics for each chess event
        const soundConfig = {
          move: { frequency: 800, duration: 0.1, type: 'sine' as OscillatorType },
          capture: { frequency: 600, duration: 0.15, type: 'square' as OscillatorType },
          check: { frequency: 1000, duration: 0.2, type: 'triangle' as OscillatorType },
          checkmate: { frequency: 400, duration: 0.3, type: 'sawtooth' as OscillatorType },
          draw: { frequency: 500, duration: 0.25, type: 'sine' as OscillatorType },
          promotion: { frequency: 1200, duration: 0.15, type: 'triangle' as OscillatorType },
          error: { frequency: 300, duration: 0.2, type: 'square' as OscillatorType },
          success: { frequency: 900, duration: 0.2, type: 'sine' as OscillatorType },
        };

        const config = soundConfig[soundType];
        if (!config) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = config.frequency;
        oscillator.type = config.type;

        // Create a smooth attack and decay
        const currentTime = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(
          volume * AUDIO_CONSTANTS.FADE_IN_VOLUME,
          currentTime + AUDIO_CONSTANTS.ATTACK_DURATION
        );
        gainNode.gain.exponentialRampToValueAtTime(
          AUDIO_CONSTANTS.MIN_DECAY_VOLUME,
          currentTime + config.duration
        );

        oscillator.start(currentTime);
        oscillator.stop(currentTime + config.duration);

        logger.debug(`Played fallback ${soundType} sound`);
      } catch (error) {
        logger.warn('Failed to create Web Audio API sound', error as Error);
      }
    },
    [volume, logger]
  );

  /**
   * Check if Web Audio API is supported (SSR-safe)
   */
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Only check for Web Audio API support on the client
    const audioContextAvailable = Boolean(
      typeof window !== 'undefined' &&
        (window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
    );
    setIsSupported(audioContextAvailable);
  }, []);

  return {
    playFallbackSound,
    isSupported,
  };
};
