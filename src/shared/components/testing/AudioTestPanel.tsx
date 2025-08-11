/**
 * @file Audio testing panel component
 * @module components/testing/AudioTestPanel
 * 
 * @description
 * Development component for testing chess audio functionality.
 * Shows audio status, allows manual sound playback testing,
 * and displays loading/error states for debugging.
 * 
 * @remarks
 * This is a temporary development component that can be added to any page
 * to test the useChessAudio hook integration. It should be removed from
 * production builds.
 */

import React from 'react';
import { useChessAudio, type ChessSoundType } from '@shared/hooks/useChessAudio';
import { getLogger } from '@shared/services/logging/Logger';

/**
 * Audio testing panel for development
 * 
 * @component
 * @description
 * Provides buttons to test each chess sound type and displays
 * the current audio system status including loaded sounds count.
 * 
 * @example
 * ```tsx
 * // Add to any page for testing
 * import { AudioTestPanel } from '@shared/components/testing/AudioTestPanel';
 * 
 * function TestPage() {
 *   return (
 *     <div>
 *       <h1>Chess Audio Test</h1>
 *       <AudioTestPanel />
 *     </div>
 *   );
 * }
 * ```
 */
export const AudioTestPanel: React.FC = () => {
  const { playSound, isAudioEnabled, getLoadedSoundCount, audioVolume } = useChessAudio();
  const logger = getLogger();

  /**
   * Test playing a specific sound type
   */
  const testSound = async (soundType: ChessSoundType): Promise<void> => {
    logger.info(`Testing ${soundType} sound`);
    try {
      await playSound(soundType);
      logger.info(`${soundType} sound played successfully`);
    } catch (error) {
      logger.error(`Failed to play ${soundType} sound`, error as Error);
    }
  };

  // Sound types to test
  const soundTypes: ChessSoundType[] = [
    'move',
    'capture', 
    'check',
    'promotion',
    'checkmate',
    'draw',
    'success',
    'error'
  ];

  return (
    <div className="p-4 border rounded-lg bg-gray-50 max-w-md">
      <h3 className="text-lg font-bold mb-3">🔊 Chess Audio Test Panel</h3>
      
      {/* Audio Status */}
      <div className="mb-4 text-sm">
        <div className="flex justify-between">
          <span>Audio Enabled:</span>
          <span className={isAudioEnabled ? 'text-green-600' : 'text-red-600'}>
            {isAudioEnabled ? '✓ Yes' : '✗ No'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Loaded Sounds:</span>
          <span className="text-blue-600">{getLoadedSoundCount()}/8</span>
        </div>
        <div className="flex justify-between">
          <span>Volume:</span>
          <span className="text-gray-600">{Math.round(audioVolume * 100)}%</span>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {soundTypes.map((soundType) => (
          <button
            key={soundType}
            onClick={() => testSound(soundType)}
            disabled={!isAudioEnabled}
            className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {soundType}
          </button>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-600">
        <p>• Click buttons to test audio playback</p>
        <p>• Check browser console for detailed logs</p>
        <p>• Audio files must exist in /public/sounds/chess/</p>
      </div>
    </div>
  );
};

/**
 * Simple hook for using audio test panel in development
 */
export const useAudioTestPanelToggle = (): { showPanel: boolean; togglePanel: () => void } => {
  const [showPanel, setShowPanel] = React.useState(false);

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent): void => {
      // Toggle panel with Ctrl+Alt+A
      if (e.ctrlKey && e.altKey && e.key === 'a') {
        setShowPanel(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const togglePanel = (): void => setShowPanel(prev => !prev);
  
  return { showPanel, togglePanel };
};