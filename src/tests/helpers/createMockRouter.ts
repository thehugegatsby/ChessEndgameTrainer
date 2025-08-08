/**
 * Next.js Router Mock Helper
 * Centralized mock for consistent router testing across the application
 */

import { NextRouter } from "next/router";

/**
 * Creates a complete mock of the Next.js Router with all properties
 * Can be customized per test by passing partial router overrides
 *
 * @param router - Partial router object to override defaults
 * @returns Complete NextRouter mock instance with stateful behavior
 */
export function createMockRouter(router?: Partial<NextRouter>): NextRouter {
  // Internal state that can be modified by router methods
  let internalState = {
    pathname: router?.pathname || "/",
    query: router?.query || {},
    asPath: router?.asPath || "/",
    route: router?.route || "/",
    basePath: router?.basePath || "",
    locale: router?.locale || "en",
    locales: router?.locales || ["en", "de", "es"],
    defaultLocale: router?.defaultLocale || "en",
    isReady: router?.isReady ?? true,
    isPreview: router?.isPreview ?? false,
    isFallback: router?.isFallback ?? false,
    isLocaleDomain: router?.isLocaleDomain ?? false,
  };

  // Parse URL to extract pathname and query
  const parseUrl = (
    url: string,
  ): { pathname: string; query: Record<string, string | string[]> } => {
    try {
      const [pathname, search] = url.split("?");
      const query: Record<string, string | string[]> = {};

      if (search) {
        const params = new URLSearchParams(search);
        params.forEach((value, key) => {
          const existing = query[key];
          if (existing) {
            query[key] = Array.isArray(existing)
              ? [...existing, value]
              : [existing, value];
          } else {
            query[key] = value;
          }
        });
      }

      return { pathname: pathname || "/", query };
    } catch {
      return { pathname: url || "/", query: {} };
    }
  };

  const mockRouter: NextRouter = {
    // Core routing properties - getters for stateful behavior
    get basePath() {
      return internalState.basePath;
    },
    get pathname() {
      return internalState.pathname;
    },
    get route() {
      return internalState.route;
    },
    get query() {
      return internalState.query;
    },
    get asPath() {
      return internalState.asPath;
    },

    // Navigation methods with state updates
    push: jest.fn(async (url: string) => {
      const { pathname, query } = parseUrl(url);
      internalState = {
        ...internalState,
        pathname,
        query,
        asPath: url,
        route: pathname, // Simplified - in reality this might differ
      };
      // Emit route change events
      (mockRouter.events.emit as jest.Mock)("routeChangeStart", url);
      (mockRouter.events.emit as jest.Mock)("routeChangeComplete", url);
      return true;
    }),

    replace: jest.fn(async (url: string) => {
      const { pathname, query } = parseUrl(url);
      internalState = {
        ...internalState,
        pathname,
        query,
        asPath: url,
        route: pathname,
      };
      (mockRouter.events.emit as jest.Mock)("routeChangeStart", url);
      (mockRouter.events.emit as jest.Mock)("routeChangeComplete", url);
      return true;
    }),

    reload: jest.fn(() => {
      // Reload doesn't change state but might emit events
      (mockRouter.events.emit as jest.Mock)(
        "routeChangeStart",
        internalState.asPath,
      );
      (mockRouter.events.emit as jest.Mock)(
        "routeChangeComplete",
        internalState.asPath,
      );
    }),

    back: jest.fn(() => {
      // In a real router, this would use history
      // For testing, we'll just emit events
      (mockRouter.events.emit as jest.Mock)(
        "routeChangeStart",
        internalState.asPath,
      );
      (mockRouter.events.emit as jest.Mock)(
        "routeChangeComplete",
        internalState.asPath,
      );
    }),

    forward: jest.fn(),
    prefetch: jest.fn(() => Promise.resolve()),
    beforePopState: jest.fn(),

    // Event system
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },

    // i18n properties - getters for stateful behavior
    get locale() {
      return internalState.locale;
    },
    get locales() {
      return internalState.locales;
    },
    get defaultLocale() {
      return internalState.defaultLocale;
    },

    // State properties - getters for stateful behavior
    get isFallback() {
      return internalState.isFallback;
    },
    get isLocaleDomain() {
      return internalState.isLocaleDomain;
    },
    get isReady() {
      return internalState.isReady;
    },
    get isPreview() {
      return internalState.isPreview;
    },

    // Additional properties for completeness
    domainLocales: undefined,
  };

  // Override with custom implementations if provided
  if (router?.push) mockRouter.push = router.push;
  if (router?.replace) mockRouter.replace = router.replace;
  if (router?.events) {
    mockRouter.events = {
      ...mockRouter.events,
      ...router.events,
    };
  }

  return mockRouter;
}

/**
 * Helper to create a router in a specific state for common test scenarios
 */
export const createMockRouterScenarios = {
  /**
   * Router on a training page with specific ID
   */
  trainingPage: (id: string) =>
    createMockRouter({
      pathname: "/train/[id]",
      route: "/train/[id]",
      query: { id },
      asPath: `/train/${id}`,
    }),

  /**
   * Router on dashboard
   */
  dashboard: () =>
    createMockRouter({
      pathname: "/dashboard",
      route: "/dashboard",
      asPath: "/dashboard",
    }),

  /**
   * Router with error state
   */
  errorPage: () =>
    createMockRouter({
      pathname: "/404",
      route: "/404",
      asPath: "/404",
    }),

  /**
   * Router in loading/fallback state
   */
  loading: () =>
    createMockRouter({
      isFallback: true,
      isReady: false,
    }),

  /**
   * Router with locale
   */
  withLocale: (locale: string) =>
    createMockRouter({
      locale,
      asPath: `/${locale}`,
    }),
};

/**
 * Type guard to check if an object is a mocked router
 * Useful for assertions in tests
 */
export function isMockedRouter(router: any): router is jest.Mocked<NextRouter> {
  return (
    router &&
    typeof router.push === "function" &&
    jest.isMockFunction(router.push)
  );
}

/**
 * Reset all mock functions on a router instance
 * Useful in beforeEach/afterEach hooks
 */
export function resetMockRouter(router: NextRouter): void {
  if (isMockedRouter(router)) {
    // Reset navigation methods
    router.push.mockClear();
    router.replace.mockClear();
    router.reload.mockClear();
    router.back.mockClear();
    router.forward?.mockClear();
    router.prefetch.mockClear();
    router.beforePopState.mockClear();

    // Reset event methods
    if (router.events) {
      (router.events.on as jest.Mock).mockClear();
      (router.events.off as jest.Mock).mockClear();
      (router.events.emit as jest.Mock).mockClear();
    }
  }
}
