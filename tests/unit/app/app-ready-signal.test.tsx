/**
 * @fileoverview Unit test for app-ready signal in App Router providers
 * @description Tests that the app-ready attribute is correctly set based on pathname and engine status
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn()
}));

// Mock zustand store before importing components that use it
jest.mock('@shared/store/store');

// Import mock helpers
import { mockUseTraining, resetUseTrainingMock } from '../../helpers/mockUseTraining';

// Import component after mocks are set up
import { AppProviders } from '../../../app/providers';

describe('App Ready Signal (App Router)', () => {
  const mockUsePathname = usePathname as jest.Mock;

  beforeEach(() => {
    // Setup pathname mock
    mockUsePathname.mockReturnValue('/dashboard');
    
    // Default store mock
    mockUseTraining({ engineStatus: 'initializing' });
    
    // Clear body attributes
    document.body.removeAttribute('data-app-ready');
  });

  afterEach(() => {
    jest.clearAllMocks();
    resetUseTrainingMock();
  });

  test('should set data-app-ready to true when engine is initializing on non-training page', async () => {
    mockUsePathname.mockReturnValue('/dashboard');
    mockUseTraining({ engineStatus: 'initializing' });
    
    render(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>
    );
    
    await waitFor(() => {
      expect(document.body.getAttribute('data-app-ready')).toBe('true');
    });
  });

  test('should set data-app-ready to false when engine is initializing on training page', async () => {
    mockUsePathname.mockReturnValue('/train/1');
    mockUseTraining({ engineStatus: 'initializing' });
    
    render(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>
    );
    
    await waitFor(() => {
      expect(document.body.getAttribute('data-app-ready')).toBe('false');
    });
  });

  test('should set data-app-ready to true when engine is ready on non-training page', async () => {
    mockUsePathname.mockReturnValue('/dashboard');
    mockUseTraining({ engineStatus: 'ready' });
    
    render(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>
    );
    
    await waitFor(() => {
      expect(document.body.getAttribute('data-app-ready')).toBe('true');
    });
  });

  test('should set data-app-ready to true when engine is ready on training page', async () => {
    mockUsePathname.mockReturnValue('/train/1');
    mockUseTraining({ engineStatus: 'ready' });
    
    render(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>
    );
    
    await waitFor(() => {
      expect(document.body.getAttribute('data-app-ready')).toBe('true');
    });
  });

  test('should set data-app-ready to error when engine has error', async () => {
    mockUsePathname.mockReturnValue('/train/1');
    mockUseTraining({ engineStatus: 'error' });
    
    render(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>
    );
    
    await waitFor(() => {
      expect(document.body.getAttribute('data-app-ready')).toBe('error');
    });
  });

  test('should set data-app-ready to error when engine has error on non-training page', async () => {
    mockUsePathname.mockReturnValue('/dashboard');
    mockUseTraining({ engineStatus: 'error' });
    
    render(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>
    );
    
    await waitFor(() => {
      expect(document.body.getAttribute('data-app-ready')).toBe('error');
    });
  });

  test('should update data-app-ready when pathname changes', async () => {
    // Start on dashboard page
    mockUsePathname.mockReturnValue('/dashboard');
    mockUseTraining({ engineStatus: 'ready' });
    
    const { rerender } = render(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>
    );
    
    await waitFor(() => {
      expect(document.body.getAttribute('data-app-ready')).toBe('true');
    });

    // Change to training page with initializing engine
    mockUsePathname.mockReturnValue('/train/1');
    mockUseTraining({ engineStatus: 'initializing' });
    
    rerender(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>
    );
    
    await waitFor(() => {
      expect(document.body.getAttribute('data-app-ready')).toBe('false');
    });
  });

  test('should update data-app-ready when engine status changes', async () => {
    mockUsePathname.mockReturnValue('/train/1');
    mockUseTraining({ engineStatus: 'initializing' });
    
    const { rerender } = render(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>
    );
    
    await waitFor(() => {
      expect(document.body.getAttribute('data-app-ready')).toBe('false');
    });

    // Engine becomes ready
    mockUseTraining({ engineStatus: 'ready' });
    
    rerender(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>
    );
    
    await waitFor(() => {
      expect(document.body.getAttribute('data-app-ready')).toBe('true');
    });
  });

  test('should handle null pathname gracefully', async () => {
    mockUsePathname.mockReturnValue(null);
    mockUseTraining({ engineStatus: 'ready' });
    
    render(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>
    );
    
    await waitFor(() => {
      expect(document.body.getAttribute('data-app-ready')).toBe('false');
    });
  });
});