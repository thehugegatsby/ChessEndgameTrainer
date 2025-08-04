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
}));

// Mock zustand store before importing components that use it
jest.mock("@shared/store/rootStore");

// Import mock helpers
import {
  mockRootStoreWithSelector,
  resetRootStoreMock,
} from "../../helpers/mockRootStore";

// Import component after mocks are set up
import { AppProviders } from "../../../app/providers";

describe("App Ready Signal (App Router)", () => {
  const mockUsePathname = usePathname as jest.Mock;

  beforeEach(() => {
    // Setup pathname mock
    mockUsePathname.mockReturnValue("/dashboard");

    // Default store mock
    mockRootStoreWithSelector({ analysisStatus: "loading" });

    // Clear body attributes
    document.body.removeAttribute("data-app-ready");
  });

  afterEach(() => {
    jest.clearAllMocks();
    resetRootStoreMock();
  });

  test("should set data-app-ready to true when engine is initializing on non-training page", async () => {
    mockUsePathname.mockReturnValue("/dashboard");
    mockRootStoreWithSelector({ analysisStatus: "loading" });

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
    mockRootStoreWithSelector({ analysisStatus: "loading" });

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
    mockRootStoreWithSelector({ analysisStatus: "idle" });

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
    mockRootStoreWithSelector({ analysisStatus: "idle" });

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
    mockRootStoreWithSelector({ analysisStatus: "error" });

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
    mockRootStoreWithSelector({ analysisStatus: "error" });

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
    mockRootStoreWithSelector({ analysisStatus: "idle" });

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
    mockRootStoreWithSelector({ analysisStatus: "loading" });

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
    mockRootStoreWithSelector({ analysisStatus: "loading" });

    const { rerender } = render(
      <AppProviders>
        <div>Test Page</div>
      </AppProviders>,
    );

    await waitFor(() => {
      expect(document.body.getAttribute("data-app-ready")).toBe("false");
    });

    // Engine becomes ready
    mockRootStoreWithSelector({ analysisStatus: "idle" });

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
    mockRootStoreWithSelector({ analysisStatus: "idle" });

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
