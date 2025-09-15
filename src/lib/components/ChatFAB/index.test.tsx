import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ChatFAB from "./index";
import { getDefaultTheme } from "../../utils";

// Mock CSS classes
jest.mock("../../utils/constants", () => ({
  CSS_CLASSES: {
    FAB: "promptql-chat__fab",
  },
  Z_INDEX: {
    FAB: 1000,
  },
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
  },
  BREAKPOINTS: {
    MOBILE: 480,
  },
}));

describe("ChatFAB", () => {
  const defaultProps = {
    isOpen: false,
    onClick: jest.fn(),
    theme: getDefaultTheme("light"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders with default props", () => {
      render(<ChatFAB {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-label", "Open chat");
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).toHaveAttribute("aria-haspopup", "dialog");
    });

    it("renders with custom aria label", () => {
      render(<ChatFAB {...defaultProps} ariaLabel="Custom chat button" />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Custom chat button");
    });

    it("renders with custom icon", () => {
      const customIcon = <span data-testid="custom-icon">🤖</span>;
      render(<ChatFAB {...defaultProps} icon={customIcon} />);

      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(<ChatFAB {...defaultProps} className="custom-class" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("promptql-chat__fab", "custom-class");
    });
  });

  describe("States", () => {
    it("shows correct state when modal is open", () => {
      render(<ChatFAB {...defaultProps} isOpen={true} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(button).toHaveAttribute("aria-label", "Open chat");
    });

    it("shows correct state when modal is closed", () => {
      render(<ChatFAB {...defaultProps} isOpen={false} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).toHaveAttribute("aria-label", "Open chat");
    });

    it("handles disabled state", () => {
      render(<ChatFAB {...defaultProps} disabled={true} />);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-label", "Open chat");
    });
  });

  describe("Interactions", () => {
    it("calls onClick when clicked", async () => {
      const user = userEvent.setup();
      render(<ChatFAB {...defaultProps} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
    });

    it("does not call onClick when disabled", async () => {
      const user = userEvent.setup();
      render(<ChatFAB {...defaultProps} disabled={true} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(defaultProps.onClick).not.toHaveBeenCalled();
    });

    it("handles keyboard navigation with Enter key", async () => {
      const user = userEvent.setup();
      render(<ChatFAB {...defaultProps} />);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard("{Enter}");

      expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
    });

    it("handles keyboard navigation with Space key", async () => {
      const user = userEvent.setup();
      render(<ChatFAB {...defaultProps} />);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard(" ");

      expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
    });

    it("does not call onClick on keyboard when disabled", async () => {
      const user = userEvent.setup();
      render(<ChatFAB {...defaultProps} disabled={true} />);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard("{Enter}");

      expect(defaultProps.onClick).not.toHaveBeenCalled();
    });
  });

  describe("Mouse Events", () => {
    it("handles mouse hover states", () => {
      render(<ChatFAB {...defaultProps} />);

      const button = screen.getByRole("button");

      fireEvent.mouseEnter(button);
      // Note: We can't easily test style changes in JSDOM, but we can verify events fire

      fireEvent.mouseLeave(button);
      // Verify no errors occur
    });

    it("handles mouse press states", () => {
      render(<ChatFAB {...defaultProps} />);

      const button = screen.getByRole("button");

      fireEvent.mouseDown(button);
      fireEvent.mouseUp(button);

      // Verify no errors occur
    });
  });

  describe("Focus Management", () => {
    it("handles focus and blur events", () => {
      render(<ChatFAB {...defaultProps} />);

      const button = screen.getByRole("button");

      // In JSDOM, we can't reliably test focus state, but we can test that the events don't throw
      expect(() => {
        fireEvent.focus(button);
        fireEvent.blur(button);
      }).not.toThrow();
    });

    it("shows focus indicator when focused", () => {
      render(<ChatFAB {...defaultProps} />);

      const button = screen.getByRole("button");

      // Test that focus event handling doesn't throw errors
      expect(() => {
        fireEvent.focus(button);
      }).not.toThrow();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes", () => {
      render(<ChatFAB {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label");
      expect(button).toHaveAttribute("aria-expanded");
      expect(button).toHaveAttribute("aria-haspopup", "dialog");
    });

    it("supports keyboard navigation", () => {
      const mockOnClick = jest.fn();
      render(<ChatFAB {...defaultProps} onClick={mockOnClick} />);

      const button = screen.getByRole("button");

      // Test Enter key
      fireEvent.keyDown(button, { key: "Enter" });
      fireEvent.keyUp(button, { key: "Enter" });
      expect(mockOnClick).toHaveBeenCalledTimes(1);

      // Test Space key
      fireEvent.keyDown(button, { key: " " });
      fireEvent.keyUp(button, { key: " " });
      expect(mockOnClick).toHaveBeenCalledTimes(2);
    });

    it("does not trigger onClick when disabled", () => {
      const mockOnClick = jest.fn();
      render(<ChatFAB {...defaultProps} onClick={mockOnClick} disabled={true} />);

      const button = screen.getByRole("button");
      fireEvent.keyDown(button, { key: "Enter" });
      fireEvent.keyUp(button, { key: "Enter" });
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe("Theme Integration", () => {
    it("applies light theme colors", () => {
      const lightTheme = getDefaultTheme("light");
      render(<ChatFAB {...defaultProps} theme={lightTheme} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      // Theme colors are applied via CSS custom properties, which are hard to test in JSDOM
    });

    it("applies dark theme colors", () => {
      const darkTheme = getDefaultTheme("dark");
      render(<ChatFAB {...defaultProps} theme={darkTheme} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("renders without errors on different screen sizes", () => {
      // Mock window.matchMedia for responsive tests
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query.includes("max-width: 480px"),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<ChatFAB {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("handles missing theme gracefully", () => {
      const propsWithNullTheme = { ...defaultProps, theme: null as any };
      expect(() => render(<ChatFAB {...propsWithNullTheme} />)).not.toThrow();
    });

    it("handles invalid onClick prop", () => {
      const propsWithNullOnClick = { ...defaultProps, onClick: null as any };
      expect(() => render(<ChatFAB {...propsWithNullOnClick} />)).not.toThrow();
    });
  });
});
