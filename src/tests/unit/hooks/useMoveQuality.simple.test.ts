/**
 * Simple test to verify useMoveQuality basic functionality
 */

import React from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock logging service
jest.mock('@shared/services/logging', () => ({
  getLogger: () => ({
    setContext: () => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  }),
}));

// Mock the hooks BEFORE importing the component that uses them
jest.mock('@shared/hooks/useTablebaseQuery', () => ({
  useTablebaseEvaluation: jest.fn(() => ({
    data: {
      isAvailable: true,
      result: {
        wdl: 0,
        dtz: 0,
        dtm: 0,
        category: "draw",
        precise: false,
      }
    },
    isLoading: false,
    isError: false,
    error: null,
  })),
}));

jest.mock('@shared/utils/moveQuality', () => ({
  assessTablebaseMoveQuality: jest.fn(() => ({
    quality: "perfect",
    reason: "Best move",
    isTablebaseAnalysis: true,
  })),
}));

jest.mock('@shared/services/logging/Logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock('chess.js', () => ({
  Chess: jest.fn().mockImplementation(() => ({
    move: jest.fn().mockReturnValue({ san: 'Kh1' }),
    fen: jest.fn(() => '8/8/8/8/8/8/8/8 w - - 0 1'),
  })),
}));

// Now import the hook
import { useMoveQuality } from '@shared/hooks/useMoveQuality';

describe('useMoveQuality simple test', () => {
  it('should render without crashing', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }): React.ReactElement => 
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useMoveQuality(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.assessMove).toBe('function');
    expect(typeof result.current.clearAnalysis).toBe('function');
  });
});