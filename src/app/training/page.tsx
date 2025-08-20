/**
 * @file Single URL Training Page (Lichess-style)
 * @route /training
 * 
 * @description
 * Single URL for all training positions. Positions are loaded
 * dynamically without URL changes, creating a seamless training
 * experience similar to Lichess puzzle training.
 */

'use client';

import React from 'react';
import { getLogger } from '@shared/services/logging/Logger';
import EndgameTrainingPage from '@shared/pages/EndgameTrainingPageNew';

const logger = getLogger().setContext('TrainingPage');

/**
 * Training page that loads positions dynamically
 * URL stays the same: /training
 * Positions change without navigation
 */
export default function TrainingPage(): React.ReactElement {
  // Only log on client-side to avoid SSR issues
  if (typeof window !== 'undefined') {
    logger.info('Loading initial training position');
  }

  return <EndgameTrainingPage />;
}