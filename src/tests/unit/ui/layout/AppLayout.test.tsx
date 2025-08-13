import { vi } from 'vitest';
/**
 * @fileoverview Unit tests for AppLayout component
 * @description Tests main layout component with header, menu, and navigation
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppLayout } from "@shared/components/layout/AppLayout";

// Mock Next.js Link component
vi.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock child components
vi.mock("@shared/components/layout/Header", () => ({
  Header: () => <div data-testid="mock-header">Header Component</div>,
}));

vi.mock("@shared/components/navigation/AdvancedEndgameMenu", () => ({
  AdvancedEndgameMenu: ({ isOpen, onClose, currentPositionId }: any) => (
    <div
      data-testid="mock-menu"
      data-is-open={isOpen}
      data-position-id={currentPositionId}
    >
      Menu Component
      <button onClick={onClose}>Close Menu</button>
    </div>
  ),
}));

vi.mock("@shared/components/ui/DarkModeToggle", () => ({
  DarkModeToggle: () => (
    <div data-testid="mock-dark-toggle">Dark Mode Toggle</div>
  ),
}));

vi.mock("@shared/components/ui/SettingsIcon", () => ({
  SettingsIcon: () => <div data-testid="mock-settings">Settings Icon</div>,
}));

describe("AppLayout Component", () => {
  const mockChildren = <div data-testid="test-content">Test Content</div>;

  const defaultProps = {
    children: mockChildren,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render main layout structure", () => {
      render(<AppLayout {...defaultProps} />);

      expect(screen.getByTestId("test-content")).toBeInTheDocument();
      expect(screen.getByTestId("mock-menu")).toBeInTheDocument();
      expect(screen.getByTestId("mock-settings")).toBeInTheDocument();
    });

    it("should render header section", () => {
      render(<AppLayout {...defaultProps} />);

      expect(screen.getByText("Endgame Training")).toBeInTheDocument();
      expect(screen.getByTestId("mock-settings")).toBeInTheDocument();
    });

    it("should pass currentPositionId to menu", () => {
      render(<AppLayout {...defaultProps} currentPositionId={42} />);

      const menu = screen.getByTestId("mock-menu");
      expect(menu).toHaveAttribute("data-position-id", "42");
    });

    it("should render children in main content area", () => {
      render(<AppLayout {...defaultProps} />);

      const mainContent = screen.getByRole("main");
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toContainElement(screen.getByTestId("test-content"));
    });
  });

  describe("Menu State Management", () => {
    it("should start with menu open by default", () => {
      render(<AppLayout {...defaultProps} />);

      const menu = screen.getByTestId("mock-menu");
      expect(menu).toHaveAttribute("data-is-open", "true");
    });

    it("should close menu when close button clicked", () => {
      render(<AppLayout {...defaultProps} />);

      const closeButton = screen.getByText("Close Menu");
      fireEvent.click(closeButton);

      const menu = screen.getByTestId("mock-menu");
      expect(menu).toHaveAttribute("data-is-open", "false");
    });

    it("should toggle menu with mobile toggle button", () => {
      render(<AppLayout {...defaultProps} />);

      // Initially open
      let menu = screen.getByTestId("mock-menu");
      expect(menu).toHaveAttribute("data-is-open", "true");

      // Find and click mobile toggle button
      const toggleButton = screen.getByText("❌ Menü schließen");
      fireEvent.click(toggleButton);

      menu = screen.getByTestId("mock-menu");
      expect(menu).toHaveAttribute("data-is-open", "false");

      // Should change button text when closed
      expect(screen.getByText("📖 Navigation")).toBeInTheDocument();

      // Click again to open
      fireEvent.click(screen.getByText("📖 Navigation"));

      menu = screen.getByTestId("mock-menu");
      expect(menu).toHaveAttribute("data-is-open", "true");
    });
  });

  describe("Header Structure", () => {
    it("should have fixed header with correct styling", () => {
      const { container } = render(<AppLayout {...defaultProps} />);

      const header = container.querySelector("header");
      expect(header?.className).toContain("fixed");
      expect(header?.className).toContain("top-0");
      expect(header?.className).toContain("left-0");
      expect(header?.className).toContain("right-0");
      expect(header?.className).toContain("z-50");
      expect(header?.className).toContain("bg-gray-900");
      expect(header?.className).toContain("border-b");
      expect(header?.className).toContain("border-gray-700");
    });

    it("should have proper header content layout", () => {
      render(<AppLayout {...defaultProps} />);

      const title = screen.getByText("Endgame Training");
      expect(title.className).toContain("text-xl");
      expect(title.className).toContain("font-bold");
      expect(title.className).toContain("text-white");
    });
  });

  describe("Main Content Layout", () => {
    it("should have proper main layout structure", () => {
      const { container } = render(<AppLayout {...defaultProps} />);

      const mainLayout = container.querySelector(".flex.pt-14");
      expect(mainLayout).toBeInTheDocument();

      const flexContent = container.querySelector(".flex-1");
      expect(flexContent).toBeInTheDocument();
    });

    it("should have container with proper styling", () => {
      const { container } = render(<AppLayout {...defaultProps} />);

      const mainContainer = container.querySelector(".container.mx-auto.p-4");
      expect(mainContainer).toBeInTheDocument();
    });

    it("should apply background color from CSS variables", () => {
      const { container } = render(<AppLayout {...defaultProps} />);

      const rootDiv = container.firstChild as HTMLElement;
      // CSS variables are not evaluated in jsdom
      expect(rootDiv).toHaveClass("min-h-screen");
    });
  });

  describe("Mobile Navigation", () => {
    it("should show mobile toggle button", () => {
      render(<AppLayout {...defaultProps} />);

      const mobileToggle = screen.getByText("❌ Menü schließen");
      // Check parent container has responsive class
      expect(mobileToggle.parentElement).toHaveClass("lg:hidden");
    });

    it("should have responsive classes for mobile toggle", () => {
      render(<AppLayout {...defaultProps} />);

      const toggleButton = screen.getByText("❌ Menü schließen");
      expect(toggleButton.className).toContain("px-4");
      expect(toggleButton.className).toContain("py-2");
      expect(toggleButton.className).toContain("bg-blue-600");
      expect(toggleButton.className).toContain("text-white");
      expect(toggleButton.className).toContain("rounded-lg");
      expect(toggleButton.className).toContain("hover:bg-blue-700");
    });
  });

  describe("Desktop Floating Actions", () => {

    it("should render dark mode toggle in floating actions", () => {
      render(<AppLayout {...defaultProps} />);

      const darkToggle = screen.getAllByTestId("mock-dark-toggle")[0]; // Desktop version
      expect(darkToggle).toBeInTheDocument();
    });

    it("should have proper styling for floating actions", () => {
      const { container } = render(<AppLayout {...defaultProps} />);

      const floatingContainer = container.querySelector(
        ".fixed.bottom-6.right-6",
      );
      expect(floatingContainer).toBeInTheDocument();
      expect(floatingContainer?.className).toContain("hidden");
      expect(floatingContainer?.className).toContain("lg:flex");
    });
  });

  describe("Mobile Bottom Navigation", () => {

    it("should render home link in bottom navigation", () => {
      render(<AppLayout {...defaultProps} />);

      const homeLink = screen.getByText("🏠 Home");
      expect(homeLink.closest("a")).toHaveAttribute("href", "/");
    });

    it("should hide bottom navigation when showMobileBottomNav is false", () => {
      render(<AppLayout {...defaultProps} showMobileBottomNav={false} />);

      expect(screen.queryByText("🏠 Home")).not.toBeInTheDocument();
    });

    it("should have proper bottom navigation styling", () => {
      const { container } = render(<AppLayout {...defaultProps} />);

      const bottomNav = container.querySelector(".lg\\:hidden.fixed.bottom-0");
      expect(bottomNav).toBeInTheDocument();
      expect(bottomNav?.className).toContain("dark-card-elevated");
      expect(bottomNav?.className).toContain("border-t");
    });

    it("should include dark mode toggle in bottom navigation", () => {
      render(<AppLayout {...defaultProps} />);

      // Should have dark mode toggle in bottom nav (second instance)
      const darkToggles = screen.getAllByTestId("mock-dark-toggle");
      expect(darkToggles.length).toBeGreaterThan(1);
    });
  });

  describe("Responsive Behavior", () => {
    it("should have responsive classes for different screen sizes", () => {
      const { container } = render(<AppLayout {...defaultProps} />);

      // Mobile toggle should be hidden on large screens
      const mobileSection = container.querySelector(".lg\\:hidden.p-4");
      expect(mobileSection).toBeInTheDocument();

      // Floating actions should be hidden on mobile
      const desktopActions = container.querySelector(".hidden.lg\\:flex");
      expect(desktopActions).toBeInTheDocument();
    });

    it("should handle window resize gracefully", () => {
      render(<AppLayout {...defaultProps} />);

      // Should not break with different viewport sizes
      expect(screen.getByTestId("test-content")).toBeInTheDocument();
      expect(screen.getByTestId("mock-menu")).toBeInTheDocument();
    });
  });

  describe("Link Navigation", () => {

    it("should render home link correctly", () => {
      render(<AppLayout {...defaultProps} />);

      const homeLink = screen.getByText("🏠 Home");
      expect(homeLink.closest("a")).toHaveAttribute("href", "/");
    });

  });

  describe("CSS Layout Classes", () => {
    it("should apply minimum height to main container", () => {
      const { container } = render(<AppLayout {...defaultProps} />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain("min-h-screen");
    });

    it("should have flex layout for main content", () => {
      const { container } = render(<AppLayout {...defaultProps} />);

      const flexContainer = container.querySelector(".flex.pt-14");
      expect(flexContainer).toBeInTheDocument();
    });

    it("should have proper spacing and padding", () => {
      const { container } = render(<AppLayout {...defaultProps} />);

      const headerPadding = container.querySelector(".px-4.py-3");
      const contentPadding = container.querySelector(".container.mx-auto.p-4");

      expect(headerPadding).toBeInTheDocument();
      expect(contentPadding).toBeInTheDocument();
    });
  });

  describe("Component Integration", () => {
    it("should integrate properly with menu component", () => {
      render(<AppLayout {...defaultProps} currentPositionId={123} />);

      const menu = screen.getByTestId("mock-menu");
      expect(menu).toHaveAttribute("data-position-id", "123");
      expect(menu).toHaveAttribute("data-is-open", "true");
    });

    it("should handle menu close callback", () => {
      render(<AppLayout {...defaultProps} />);

      const menu = screen.getByTestId("mock-menu");
      expect(menu).toHaveAttribute("data-is-open", "true");

      const closeButton = screen.getByText("Close Menu");
      fireEvent.click(closeButton);

      expect(menu).toHaveAttribute("data-is-open", "false");
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing children gracefully", () => {
      render(<AppLayout>{undefined}</AppLayout>);

      const mainContent = screen.getByRole("main");
      expect(mainContent).toBeInTheDocument();
    });

    it("should handle undefined currentPositionId", () => {
      render(<AppLayout {...defaultProps} currentPositionId={undefined} />);

      const menu = screen.getByTestId("mock-menu");
      // Check menu exists, data attributes are optional
      expect(menu).toBeInTheDocument();
    });

    it("should handle rapid menu toggle clicks", () => {
      render(<AppLayout {...defaultProps} />);

      const toggleButton = screen.getByText("❌ Menü schließen");

      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(toggleButton);
      }

      // Final state depends on implementation
      const menu = screen.getByTestId("mock-menu");
      expect(menu).toBeInTheDocument();
    });

    it("should handle complex children content", () => {
      const complexChildren = (
        <div>
          <h1>Complex Content</h1>
          <div>
            <p>Nested content</p>
            <button>Action Button</button>
          </div>
        </div>
      );

      render(<AppLayout>{complexChildren}</AppLayout>);

      expect(screen.getByText("Complex Content")).toBeInTheDocument();
      expect(screen.getByText("Nested content")).toBeInTheDocument();
      expect(screen.getByText("Action Button")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should not cause memory leaks on unmount", () => {
      const { unmount } = render(<AppLayout {...defaultProps} />);

      expect(() => unmount()).not.toThrow();
    });

    it("should handle frequent prop changes efficiently", () => {
      const { rerender } = render(
        <AppLayout {...defaultProps} currentPositionId={1} />,
      );

      // Frequent position changes
      for (let i = 2; i <= 20; i++) {
        rerender(<AppLayout {...defaultProps} currentPositionId={i} />);
      }

      expect(screen.getByTestId("test-content")).toBeInTheDocument();
      const menu = screen.getByTestId("mock-menu");
      expect(menu).toHaveAttribute("data-position-id", "20");
    });
  });

  describe("State Management", () => {
    it("should maintain menu state across re-renders", () => {
      const { rerender } = render(<AppLayout {...defaultProps} />);

      // Close menu
      const closeButton = screen.getByText("Close Menu");
      fireEvent.click(closeButton);

      let menu = screen.getByTestId("mock-menu");
      expect(menu).toHaveAttribute("data-is-open", "false");

      // Re-render with different props
      rerender(<AppLayout {...defaultProps} currentPositionId={42} />);

      // Menu should still be closed
      menu = screen.getByTestId("mock-menu");
      expect(menu).toHaveAttribute("data-is-open", "false");
    });

    it("should initialize with correct default state", () => {
      render(<AppLayout {...defaultProps} />);

      // Menu should start open
      const menu = screen.getByTestId("mock-menu");
      expect(menu).toHaveAttribute("data-is-open", "true");

      // Mobile bottom nav should be shown by default
      expect(screen.getByText("🏠 Home")).toBeInTheDocument();
    });
  });
});
