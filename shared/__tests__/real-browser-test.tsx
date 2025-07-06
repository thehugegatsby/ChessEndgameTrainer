/**
 * This test simulates the real browser behavior to find where tablebase data is lost
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TrainingProvider } from '@shared/contexts/TrainingContext';
import TrainPage from '../../pages/train/[id]';
import { useRouter } from 'next/router';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock endgame positions
jest.mock('@shared/data/endgames', () => ({
  endgamePositions: [
    {
      id: '12',
      name: 'Turm vs. Turm',
      fen: '2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1',
      difficulty: 3,
      category: 'Turmendspiele',
      description: 'Test position'
    }
  ]
}));

describe('Real Browser Test - Tablebase Data Flow', () => {
  beforeEach(() => {
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      query: { id: '12' },
      push: jest.fn(),
    });

    // Spy on console to track data flow
    jest.spyOn(console, 'log');
    jest.spyOn(console, 'warn');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should trace data flow in real page setup', async () => {
    // This test will render the actual page and trace where data is lost
    
    // Add console logs to track data flow
    const originalLog = console.log;
    let dataFlowLog: any[] = [];
    
    console.log = (...args: any[]) => {
      // Capture relevant logs
      const logStr = args.join(' ');
      if (logStr.includes('evaluation') || 
          logStr.includes('tablebase') || 
          logStr.includes('Dual evaluation update')) {
        dataFlowLog.push({
          message: logStr,
          data: args[1] // Usually the data object
        });
      }
      originalLog(...args);
    };

    // Render the actual train page
    const { container } = render(
      <TrainingProvider>
        <TrainPage />
      </TrainingProvider>
    );

    // Wait for component to mount
    await new Promise(resolve => setTimeout(resolve, 500));

    // Analyze captured logs
    console.log('\n=== DATA FLOW ANALYSIS ===');
    dataFlowLog.forEach((log, index) => {
      console.log(`\nLog ${index}: ${log.message}`);
      if (log.data && typeof log.data === 'object') {
        console.log('Data structure:', JSON.stringify(log.data, null, 2));
      }
    });

    // Check if MovePanel is rendered
    const movePanelExists = container.querySelector('[class*="space-y-1"]');
    console.log('\nMovePanel rendered:', !!movePanelExists);

    // Restore original console.log
    console.log = originalLog;
  });

  it('should check TrainingContext state updates', () => {
    // Test the reducer directly
    const TrainingContext = require('@shared/contexts/TrainingContext');
    
    // Test SET_EVALUATIONS action
    const initialState = {
      evaluations: []
    };
    
    const evaluationsWithTablebase = [
      {
        evaluation: 0,
        tablebase: {
          isTablebasePosition: true,
          wdlBefore: 2,
          wdlAfter: 2,
          category: 'win'
        }
      }
    ];
    
    // Simulate the reducer action
    const action = {
      type: 'SET_EVALUATIONS',
      payload: evaluationsWithTablebase
    };
    
    console.log('\n=== REDUCER TEST ===');
    console.log('Initial state:', initialState);
    console.log('Action payload:', action.payload);
    
    // The reducer should preserve the complete evaluation structure
    const expectedState = {
      ...initialState,
      evaluations: evaluationsWithTablebase
    };
    
    console.log('Expected state after SET_EVALUATIONS:', expectedState);
  });
});