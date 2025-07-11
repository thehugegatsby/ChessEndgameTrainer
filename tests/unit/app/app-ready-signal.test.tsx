/**
 * @fileoverview Unit test for app-ready signal in _app.tsx
 * @description Tests that the app-ready attribute is correctly set based on router and engine status
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import MyApp from '../../../pages/_app';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

// Mock EngineContext
jest.mock('@shared/contexts/EngineContext', () => ({
  EngineProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useEngineStatus: jest.fn()
}));

// Import mocked module to get typed mock
import { useEngineStatus } from '@shared/contexts/EngineContext';
const mockUseEngineStatus = useEngineStatus as jest.MockedFunction<typeof useEngineStatus>;

describe('App Ready Signal', () => {
  let mockRouter: any;
  let mockRouterEvents: any;

  beforeEach(() => {
    // Setup router mock
    mockRouterEvents = {
      on: jest.fn(),
      off: jest.fn()
    };
    
    mockRouter = {
      isReady: false,
      events: mockRouterEvents,
      pathname: '/test',
      query: {},
      asPath: '/test'
    };
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Default engine status
    mockUseEngineStatus.mockReturnValue('initializing');
    
    // Clear body attributes
    document.body.removeAttribute('data-app-ready');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should set data-app-ready to false when router is not ready', () => {
    const TestComponent = () => <div>Test Page</div>;
    
    render(<MyApp Component={TestComponent} pageProps={{}} />);
    
    expect(document.body.getAttribute('data-app-ready')).toBe('false');
  });

  test('should set data-app-ready to true when both router and engine are ready', async () => {
    mockRouter.isReady = true;
    mockUseEngineStatus.mockReturnValue('ready');
    
    const TestComponent = () => <div>Test Page</div>;
    
    render(<MyApp Component={TestComponent} pageProps={{}} />);
    
    await waitFor(() => {
      expect(document.body.getAttribute('data-app-ready')).toBe('true');
    });
  });

  test('should set data-app-ready to error when engine has error', async () => {
    mockRouter.isReady = true;
    mockUseEngineStatus.mockReturnValue('error');
    
    const TestComponent = () => <div>Test Page</div>;
    
    render(<MyApp Component={TestComponent} pageProps={{}} />);
    
    await waitFor(() => {
      expect(document.body.getAttribute('data-app-ready')).toBe('error');
    });
  });

  test('should register route change event handlers', () => {
    const TestComponent = () => <div>Test Page</div>;
    
    render(<MyApp Component={TestComponent} pageProps={{}} />);
    
    expect(mockRouterEvents.on).toHaveBeenCalledWith('routeChangeStart', expect.any(Function));
    expect(mockRouterEvents.on).toHaveBeenCalledWith('routeChangeComplete', expect.any(Function));
  });

  test('should set data-app-ready to false on route change start', () => {
    const TestComponent = () => <div>Test Page</div>;
    
    render(<MyApp Component={TestComponent} pageProps={{}} />);
    
    // Get the registered handler
    const routeChangeStartHandler = mockRouterEvents.on.mock.calls.find(
      (call: any[]) => call[0] === 'routeChangeStart'
    )?.[1];
    
    // Set initial ready state
    document.body.setAttribute('data-app-ready', 'true');
    
    // Trigger route change
    routeChangeStartHandler?.();
    
    expect(document.body.getAttribute('data-app-ready')).toBe('false');
  });

  test('should restore data-app-ready after route change complete', () => {
    mockRouter.isReady = true;
    mockUseEngineStatus.mockReturnValue('ready');
    
    const TestComponent = () => <div>Test Page</div>;
    
    render(<MyApp Component={TestComponent} pageProps={{}} />);
    
    // Get the registered handler
    const routeChangeCompleteHandler = mockRouterEvents.on.mock.calls.find(
      (call: any[]) => call[0] === 'routeChangeComplete'
    )?.[1];
    
    // Trigger route change complete
    routeChangeCompleteHandler?.();
    
    expect(document.body.getAttribute('data-app-ready')).toBe('true');
  });

  test('should clean up event handlers on unmount', () => {
    const TestComponent = () => <div>Test Page</div>;
    
    const { unmount } = render(<MyApp Component={TestComponent} pageProps={{}} />);
    
    unmount();
    
    expect(mockRouterEvents.off).toHaveBeenCalledWith('routeChangeStart', expect.any(Function));
    expect(mockRouterEvents.off).toHaveBeenCalledWith('routeChangeComplete', expect.any(Function));
  });
});