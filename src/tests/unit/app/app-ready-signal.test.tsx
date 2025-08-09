/**
 * @file Unit test for app-ready signal in App Router providers
 * @description Tests that the app-ready attribute is correctly set based on pathname and engine status
 */

import React from "react";
import { render, waitFor } from "@testing-library/react";
import { usePathname } from "next/navigation";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
}));

// Mock the StoreContext to provide useStore
jest.mock("@shared/store/StoreContext", () => ({
  useStore: jest.fn(),
  StoreProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock hydration hook
jest.mock("@shared/hooks/useHydration", () => ({
  useStoreHydration: jest.fn().mockReturnValue(true),
}));

import { useStore } from "@shared/store/StoreContext";

// Import component after mocks are set up
import { AppProviders } from "../../../app/providers";

describe("App Ready Signal (App Router)", () => {
  const mockUsePathname = usePathname as jest.Mock;

  // Helper function to create a mock state with all required properties
  const createMockState = (analysisStatus: string) => ({
    tablebase: {
      analysisStatus,
    },
    game: {
      resetGame: jest.fn(),
      currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    },
    progress: {
      resetProgress: jest.fn(),
    },
  });

  beforeEach(() => {
    // Setup pathname mock
    mockUsePathname.mockReturnValue("/dashboard");

    // Default store mock - analysisStatus is now nested in tablebase slice
    (useStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = createMockState("loading");
      return selector ? selector(state) : state;
    });

    // Clear body attributes
    document.body.removeAttribute("data-app-ready");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should set data-app-ready to true when engine is initializing on non-training page", async () => {
    mockUsePathname.mockReturnValue("/dashboard");
    (useStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = createMockState("loading");
      return selector ? selector(state) : state;
    });

    render(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>,
    );

    await waitFor(() => {
      expect(document.body.getAttribute("data-app-ready")).toBe("true");
    });
  });

  test("should set data-app-ready to false when engine is initializing on training page", async () => {
    mockUsePathname.mockReturnValue("/train/1");
    (useStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = createMockState("loading");
      return selector ? selector(state) : state;
    });

    render(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>,
    );

    await waitFor(() => {
      expect(document.body.getAttribute("data-app-ready")).toBe("false");
    });
  });

  test("should set data-app-ready to true when engine is ready on non-training page", async () => {
    mockUsePathname.mockReturnValue("/dashboard");
    (useStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = createMockState("idle");
      return selector ? selector(state) : state;
    });

    render(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>,
    );

    await waitFor(() => {
      expect(document.body.getAttribute("data-app-ready")).toBe("true");
    });
  });

  test("should set data-app-ready to true when engine is ready on training page", async () => {
    mockUsePathname.mockReturnValue("/train/1");
    (useStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = createMockState("idle");
      return selector ? selector(state) : state;
    });

    render(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>,
    );

    await waitFor(() => {
      expect(document.body.getAttribute("data-app-ready")).toBe("true");
    });
  });

  test("should set data-app-ready to error when engine has error", async () => {
    mockUsePathname.mockReturnValue("/train/1");
    (useStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = createMockState("error");
      return selector ? selector(state) : state;
    });

    render(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>,
    );

    await waitFor(() => {
      expect(document.body.getAttribute("data-app-ready")).toBe("error");
    });
  });

  test("should set data-app-ready to error when engine has error on non-training page", async () => {
    mockUsePathname.mockReturnValue("/dashboard");
    (useStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = createMockState("error");
      return selector ? selector(state) : state;
    });

    render(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>,
    );

    await waitFor(() => {
      expect(document.body.getAttribute("data-app-ready")).toBe("error");
    });
  });

  test("should update data-app-ready when pathname changes", async () => {
    // Start on dashboard page
    mockUsePathname.mockReturnValue("/dashboard");
    (useStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = createMockState("idle");
      return selector ? selector(state) : state;
    });

    const { rerender } = render(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>,
    );

    await waitFor(() => {
      expect(document.body.getAttribute("data-app-ready")).toBe("true");
    });

    // Change to training page with initializing engine
    mockUsePathname.mockReturnValue("/train/1");
    (useStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = createMockState("loading");
      return selector ? selector(state) : state;
    });

    rerender(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>,
    );

    await waitFor(() => {
      expect(document.body.getAttribute("data-app-ready")).toBe("false");
    });
  });

  test("should update data-app-ready when engine status changes", async () => {
    mockUsePathname.mockReturnValue("/train/1");
    (useStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = createMockState("loading");
      return selector ? selector(state) : state;
    });

    const { rerender } = render(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>,
    );

    await waitFor(() => {
      expect(document.body.getAttribute("data-app-ready")).toBe("false");
    });

    // Engine becomes ready
    (useStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = createMockState("idle");
      return selector ? selector(state) : state;
    });

    rerender(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>,
    );

    await waitFor(() => {
      expect(document.body.getAttribute("data-app-ready")).toBe("true");
    });
  });

  test("should handle null pathname gracefully", async () => {
    mockUsePathname.mockReturnValue(null);
    (useStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = createMockState("idle");
      return selector ? selector(state) : state;
    });

    render(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>,
    );

    await waitFor(() => {
      expect(document.body.getAttribute("data-app-ready")).toBe("false");
    });
  });
});
