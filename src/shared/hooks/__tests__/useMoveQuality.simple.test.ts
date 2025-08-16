import { vi } from 'vitest';
/**
 * Simple test to verify useMoveQuality basic functionality
 */

import React from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock logging service
vi.mock('@shared/services/logging', () => ({
  getLogger: () => ({
    setContext: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  }),
}));

// Mock the hooks BEFORE importing the component that uses them
vi.mock('@shared/hooks/useTablebaseQuery', () => ({
  useTablebaseEvaluation: vi.fn(() => ({
    data: {
      isAvailable: true,
      result: {
        wdl: 0,
        dtz: 0,
        dtm: 0,
        category: 'draw',
        precise: false,
      },
    },
    isLoading: false,
    isError: false,
    error: null,
  })),
}));

vi.mock('@shared/utils/moveQuality', () => ({
  assessTablebaseMoveQuality: vi.fn(() => ({
    quality: 'perfect',
    reason: 'Best move',
    isTablebaseAnalysis: true,
  })),
}));

vi.mock('@shared/services/logging/Logger', () => ({
  Logger: vi.fn().mockImplementation(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

vi.mock('chess.js', () => ({
  Chess: vi.fn().mockImplementation(() => ({
    move: vi.fn().mockReturnValue({ san: 'Kh1' }),
    fen: vi.fn(() => '8/8/8/8/8/8/8/8 w - - 0 1'),
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
