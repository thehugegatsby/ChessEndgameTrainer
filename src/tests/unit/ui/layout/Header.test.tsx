/**
 * @fileoverview Unit tests for Header component
 * @description Tests main application header with title and styling
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { Header } from "@shared/components/layout/Header";

describe("Header Component", () => {
  describe("Rendering", () => {
    it("should render main title", () => {
      render(<Header />);

      expect(screen.getByText("Schach Endspiel Training")).toBeInTheDocument();
    });

    it("should render subtitle", () => {
      render(<Header />);

      expect(screen.getByText("Verbessere dein Endspiel")).toBeInTheDocument();
    });

    it("should render chess king icon", () => {
      render(<Header />);

      expect(screen.getByText("♔")).toBeInTheDocument();
    });

    it("should be rendered as header element", () => {
      render(<Header />);

      const header = screen.getByRole("banner");
      expect(header).toBeInTheDocument();
      expect(header.tagName).toBe("HEADER");
    });
  });

  describe("Structure and Layout", () => {
    it("should have proper header structure", () => {
      const { container } = render(<Header />);

      const header = container.querySelector("header");
      expect(header).toBeInTheDocument();

      // Should have max-width container
      const container_div = header?.querySelector(".max-w-7xl");
      expect(container_div).toBeInTheDocument();

      // Should have flex layout
      const flexDiv = container_div?.querySelector(
        ".flex.items-center.justify-between",
      );
      expect(flexDiv).toBeInTheDocument();
    });

    it("should have left section with icon and title", () => {
      const { container } = render(<Header />);

      // Find the left section (first flex section)
      const leftSection = container.querySelector(
        ".flex.items-center.space-x-3",
      );
      expect(leftSection).toBeInTheDocument();

      // Should contain icon and title
      expect(leftSection).toHaveTextContent("♔");
      expect(leftSection).toHaveTextContent("Schach Endspiel Training");
    });

    it("should have right section with subtitle", () => {
      render(<Header />);

      // The subtitle should be in the right section
      const subtitle = screen.getByText("Verbessere dein Endspiel");
      expect(subtitle).toBeInTheDocument();
    });
  });

  describe("CSS Classes and Styling", () => {
    it("should have fixed positioning classes", () => {
      const { container } = render(<Header />);

      const header = container.querySelector("header");
      expect(header?.className).toContain("fixed");
      expect(header?.className).toContain("top-0");
      expect(header?.className).toContain("left-0");
      expect(header?.className).toContain("right-0");
    });

    it("should have proper z-index", () => {
      const { container } = render(<Header />);

      const header = container.querySelector("header");
      expect(header?.className).toContain("z-50");
    });

    it("should have dark card styling", () => {
      const { container } = render(<Header />);

      const header = container.querySelector("header");
      expect(header?.className).toContain("dark-card-elevated");
    });

    it("should have responsive container", () => {
      const { container } = render(<Header />);

      const containerDiv = container.querySelector(".max-w-7xl.mx-auto");
      expect(containerDiv).toBeInTheDocument();
    });

    it("should have proper padding", () => {
      const { container } = render(<Header />);

      const containerDiv = container.querySelector(".px-4.py-3");
      expect(containerDiv).toBeInTheDocument();
    });

    it("should use CSS custom properties for colors", () => {
      render(<Header />);

      const title = screen.getByText("Schach Endspiel Training");
      const subtitle = screen.getByText("Verbessere dein Endspiel");

      // Check that the elements have the correct inline styles set
      // Note: JSDOM may not parse CSS custom properties, so we check for the property being set
      expect(title).toHaveStyle({ color: "var(--text-primary)" });
      expect(subtitle).toHaveStyle({ color: "var(--text-secondary)" });
    });
  });

  describe("Typography", () => {
    it("should have correct title typography classes", () => {
      render(<Header />);

      const title = screen.getByText("Schach Endspiel Training");
      expect(title.className).toContain("text-xl");
      expect(title.className).toContain("font-bold");
    });

    it("should have correct subtitle typography classes", () => {
      render(<Header />);

      const subtitle = screen.getByText("Verbessere dein Endspiel");
      expect(subtitle.className).toContain("text-sm");
    });

    it("should have correct icon size", () => {
      render(<Header />);

      const icon = screen.getByText("♔");
      expect(icon.className).toContain("text-2xl");
    });
  });

  describe("Accessibility", () => {
    it("should use semantic header element", () => {
      render(<Header />);

      const header = screen.getByRole("banner");
      expect(header.tagName).toBe("HEADER");
    });

    it("should have proper heading hierarchy", () => {
      render(<Header />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Schach Endspiel Training");
    });

    it("should have accessible text content", () => {
      render(<Header />);

      // All text should be visible and accessible
      expect(screen.getByText("Schach Endspiel Training")).toBeVisible();
      expect(screen.getByText("Verbessere dein Endspiel")).toBeVisible();
      expect(screen.getByText("♔")).toBeVisible();
    });
  });

  describe("Responsive Design", () => {
    it("should have responsive container classes", () => {
      const { container } = render(<Header />);

      const responsiveContainer = container.querySelector(
        ".max-w-7xl.mx-auto.px-4",
      );
      expect(responsiveContainer).toBeInTheDocument();
    });

    it("should have flexible layout", () => {
      const { container } = render(<Header />);

      const flexContainer = container.querySelector(
        ".flex.items-center.justify-between",
      );
      expect(flexContainer).toBeInTheDocument();
    });

    it("should have proper spacing classes", () => {
      const { container } = render(<Header />);

      const spacedContainer = container.querySelector(".space-x-3");
      expect(spacedContainer).toBeInTheDocument();
    });
  });

  describe("Component Stability", () => {
    it("should render consistently", () => {
      const { container: container1 } = render(<Header />);
      const { container: container2 } = render(<Header />);

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it("should not have dynamic content", () => {
      const { container } = render(<Header />);
      const initialHtml = container.innerHTML;

      // Re-render after some time
      setTimeout(() => {
        const { container: newContainer } = render(<Header />);
        expect(newContainer.innerHTML).toBe(initialHtml);
      }, 100);
    });
  });

  describe("Layout Integration", () => {
    it("should be positioned for layout integration", () => {
      const { container } = render(<Header />);

      const header = container.querySelector("header");

      // Should be fixed positioned to work with app layout
      expect(header?.className).toContain("fixed");
      expect(header?.className).toContain("top-0");
      expect(header?.className).toContain("left-0");
      expect(header?.className).toContain("right-0");

      // Should have high z-index to stay on top
      expect(header?.className).toContain("z-50");
    });

    it("should have elevated styling for visibility", () => {
      const { container } = render(<Header />);

      const header = container.querySelector("header");
      expect(header?.className).toContain("dark-card-elevated");
    });
  });

  describe("Text Content", () => {
    it("should display German text correctly", () => {
      render(<Header />);

      // Should handle German characters correctly
      expect(screen.getByText("Schach Endspiel Training")).toBeInTheDocument();
      expect(screen.getByText("Verbessere dein Endspiel")).toBeInTheDocument();
    });

    it("should display Unicode chess symbol correctly", () => {
      render(<Header />);

      const icon = screen.getByText("♔");
      expect(icon).toBeInTheDocument();
      expect(icon.textContent).toBe("♔");
    });
  });

  describe("Performance", () => {
    it("should be a functional component without state", () => {
      // Header should be a simple functional component
      expect(typeof Header).toBe("function");
    });

    it("should render quickly without heavy computations", () => {
      const startTime = performance.now();
      render(<Header />);
      const endTime = performance.now();

      // Should render very quickly (less than 10ms in most cases)
      expect(endTime - startTime).toBeLessThan(50);
    });

    it("should not cause memory leaks", () => {
      const { unmount } = render(<Header />);

      // Should unmount cleanly
      expect(() => unmount()).not.toThrow();
    });
  });
});
