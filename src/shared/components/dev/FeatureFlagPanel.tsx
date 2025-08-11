/**
 * Development UI for managing feature flags
 * Only shown in development mode
 */

'use client';

import React, { useState } from 'react';
import { FeatureFlag } from '@shared/services/FeatureFlagService';
import { useFeatureFlagControls } from '@shared/hooks/useFeatureFlag';

const FEATURE_GROUPS = {
  'Chess Core': [
    { flag: FeatureFlag.USE_NEW_CHESS_CORE, label: 'New Chess Core' },
    { flag: FeatureFlag.USE_NEW_MOVE_VALIDATION, label: 'New Move Validation' },
  ],
  'Tablebase': [
    { flag: FeatureFlag.USE_NEW_TABLEBASE_SERVICE, label: 'New Tablebase Service' },
    { flag: FeatureFlag.USE_NEW_TABLEBASE_UI, label: 'New Tablebase UI' },
  ],
  'Training': [
    { flag: FeatureFlag.USE_NEW_TRAINING_LOGIC, label: 'New Training Logic' },
    { flag: FeatureFlag.USE_NEW_TRAINING_BOARD, label: 'New Training Board' },
  ],
  'Move Quality': [
    { flag: FeatureFlag.USE_NEW_MOVE_QUALITY, label: 'New Move Quality System' },
  ],
  'Progress': [
    { flag: FeatureFlag.USE_NEW_PROGRESS_TRACKING, label: 'New Progress Tracking' },
  ],
  'UI Components': [
    { flag: FeatureFlag.USE_NEW_COMPONENT_LIBRARY, label: 'New Component Library' },
  ],
};

export function FeatureFlagPanel(): React.ReactElement | null {
  const [isOpen, setIsOpen] = useState(false);
  const controls = useFeatureFlagControls();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-50"
        aria-label="Open Feature Flags Panel"
      >
        🚀 Feature Flags
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-96 max-h-[600px] overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Feature Flags (Dev Only)
        </h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => controls.enablePhase('chess')}
          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
        >
          Enable Chess
        </button>
        <button
          onClick={() => controls.enablePhase('tablebase')}
          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
        >
          Enable Tablebase
        </button>
        <button
          onClick={() => controls.enablePhase('training')}
          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
        >
          Enable Training
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(FEATURE_GROUPS).map(([groupName, flags]) => (
          <div key={groupName}>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {groupName}
            </h3>
            <div className="space-y-2">
              {flags.map(({ flag, label }) => {
                const isEnabled = controls.isEnabled(flag);
                return (
                  <div
                    key={flag}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {label}
                    </span>
                    <button
                      onClick={() => controls.toggle(flag)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isEnabled
                          ? 'bg-green-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      aria-label={`Toggle ${label}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 Changes persist in localStorage. Use for A/B testing during migration.
        </p>
      </div>
    </div>
  );
}