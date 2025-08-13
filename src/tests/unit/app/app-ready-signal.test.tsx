import { vi } from 'vitest';
/**
 * @file Unit test for app-ready signal in App Router providers
 * @description Tests that the app-ready attribute is correctly set based on pathname and engine status
 */

import React from "react";
import { render, waitFor } from "@testing-library/react";
import { usePathname } from "next/navigation";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

// Mock the StoreContext to provide useStore
vi.mock("@shared/store/StoreContext", () => ({
  useStore: vi.fn(),
  StoreProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock hydration hook
vi.mock("@shared/hooks/useHydration", () => ({
  useStoreHydration: vi.fn().mockReturnValue(true),
}));

import { useStore } from "@shared/store/StoreContext";

// Import component after mocks are set up
import { AppProviders } from "../../../app/providers";

describe.skip("App Ready Signal (App Router)", () => {
  const mockUsePathname = usePathname as ReturnType<typeof vi.fn>;

  // Helper function to create a mock state with all required properties
  const createMockState = (analysisStatus: string): any => ({
    tablebase: {
      analysisStatus,
    },
    game: {
      resetGame: vi.fn(),
      currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    },
    progress: {
      resetProgress: vi.fn(),
    },
  });

  beforeEach(() => {
    // Setup pathname mock
    mockUsePathname.mockReturnValue("/");

    // Default store mock - analysisStatus is now nested in tablebase slice
    (useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const state = createMockState("loading");
      return selector ? selector(state) : state;
    });

    // Clear body attributes
    document.body.removeAttribute("data-app-ready");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("should set data-app-ready to true when engine is initializing on non-training page", async () => {
    mockUsePathname.mockReturnValue("/");
    (useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
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
    (useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
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
    mockUsePathname.mockReturnValue("/");
    (useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
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
    (useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
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
    (useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
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
    mockUsePathname.mockReturnValue("/");
    (useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
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
    // Start on home page
    mockUsePathname.mockReturnValue("/");
    (useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
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
    (useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
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
    (useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
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
    (useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
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
    (useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
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
