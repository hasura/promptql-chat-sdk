import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ChatModal from "./index";
import { getDefaultTheme } from "../../utils";

// Mock CSS classes
jest.mock("../../utils/constants", () => ({
  CSS_CLASSES: {
    MODAL: "promptql-chat__modal",
    MODAL_OVERLAY: "promptql-chat__modal-overlay",
  },
  Z_INDEX: {
    MODAL: 1002,
    MODAL_OVERLAY: 1001,
  },
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
  },
  BREAKPOINTS: {
    MOBILE: 480,
    DESKTOP: 1024,
  },
}));

describe("ChatModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    theme: getDefaultTheme("light"),
    children: <div data-testid="modal-content">Test Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset body styles
    document.body.style.overflow = "";
  });

  afterEach(() => {
    // Clean up any remaining event listeners
    document.removeEventListener("keydown", jest.fn());
  });

  describe("Rendering", () => {
    it("renders when open", () => {
      render(<ChatModal {...defaultProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByTestId("modal-content")).toBeInTheDocument();
      expect(screen.getByText("PromptQL Chat")).toBeInTheDocument();
    });

    it("does not render when closed", () => {
      render(<ChatModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders with custom title", () => {
      render(<ChatModal {...defaultProps} title="Custom Title" />);

      expect(screen.getByText("Custom Title")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(<ChatModal {...defaultProps} className="custom-class" />);

      const overlay = screen.getByRole("dialog").parentElement;
      expect(overlay).toHaveClass("promptql-chat__modal-overlay", "custom-class");
    });
  });

  describe("Modal States", () => {
    it("shows fullscreen toggle button by default", () => {
      render(<ChatModal {...defaultProps} />);

      const fullscreenButton = screen.getByLabelText("Enter fullscreen");
      expect(fullscreenButton).toBeInTheDocument();
    });

    it("hides fullscreen toggle when disabled", () => {
      render(<ChatModal {...defaultProps} showFullscreenToggle={false} />);

      expect(screen.queryByLabelText("Enter fullscreen")).not.toBeInTheDocument();
    });

    it("shows correct fullscreen button state", () => {
      render(<ChatModal {...defaultProps} isFullscreen={true} />);

      const fullscreenButton = screen.getByLabelText("Exit fullscreen");
      expect(fullscreenButton).toBeInTheDocument();
    });

    it("shows new thread button when enabled", () => {
      render(<ChatModal {...defaultProps} showNewThreadButton={true} />);

      const newThreadButton = screen.getByLabelText("Start new conversation");
      expect(newThreadButton).toBeInTheDocument();
      expect(newThreadButton).toHaveTextContent("New");
    });

    it("hides new thread button when disabled", () => {
      render(<ChatModal {...defaultProps} showNewThreadButton={false} />);

      expect(screen.queryByLabelText("Start new conversation")).not.toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("calls onClose when close button is clicked", async () => {
      const user = userEvent.setup();
      render(<ChatModal {...defaultProps} />);

      const closeButton = screen.getByLabelText("Close chat");
      await user.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when overlay is clicked", async () => {
      const user = userEvent.setup();
      render(<ChatModal {...defaultProps} />);

      const overlay = screen.getByRole("dialog").parentElement!;
      await user.click(overlay);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose when modal content is clicked", async () => {
      const user = userEvent.setup();
      render(<ChatModal {...defaultProps} />);

      const modal = screen.getByRole("dialog");
      await user.click(modal);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it("calls onToggleFullscreen when fullscreen button is clicked", async () => {
      const user = userEvent.setup();
      const onToggleFullscreen = jest.fn();
      render(<ChatModal {...defaultProps} onToggleFullscreen={onToggleFullscreen} />);

      const fullscreenButton = screen.getByLabelText("Enter fullscreen");
      await user.click(fullscreenButton);

      expect(onToggleFullscreen).toHaveBeenCalledTimes(1);
    });

    it("calls onNewThread when new thread button is clicked", async () => {
      const user = userEvent.setup();
      const onNewThread = jest.fn();
      render(<ChatModal {...defaultProps} showNewThreadButton={true} onNewThread={onNewThread} />);

      const newThreadButton = screen.getByLabelText("Start new conversation");
      await user.click(newThreadButton);

      expect(onNewThread).toHaveBeenCalledTimes(1);
    });

    it("handles missing onNewThread gracefully", async () => {
      const user = userEvent.setup();
      render(<ChatModal {...defaultProps} showNewThreadButton={true} onNewThread={undefined} />);

      const newThreadButton = screen.getByLabelText("Start new conversation");

      // Should not throw error when clicked
      await expect(user.click(newThreadButton)).resolves.not.toThrow();
    });
  });

  describe("Keyboard Navigation", () => {
    beforeEach(() => {
      // Reset mock before each test
      jest.clearAllMocks();
    });

    it("calls onClose when Escape key is pressed", () => {
      render(<ChatModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: "Escape" });

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose on Escape when modal is closed", () => {
      render(<ChatModal {...defaultProps} isOpen={false} />);

      fireEvent.keyDown(document, { key: "Escape" });

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it("ignores other key presses", () => {
      render(<ChatModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: "Enter" });
      fireEvent.keyDown(document, { key: "Space" });

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe("Focus Management", () => {
    it("focuses modal when opened", async () => {
      render(<ChatModal {...defaultProps} />);

      await waitFor(() => {
        const modal = screen.getByRole("dialog");
        expect(modal).toHaveFocus();
      });
    });

    it("prevents body scroll when open", () => {
      render(<ChatModal {...defaultProps} />);

      expect(document.body.style.overflow).toBe("hidden");
    });

    it("restores body scroll when closed", () => {
      const { rerender } = render(<ChatModal {...defaultProps} />);

      expect(document.body.style.overflow).toBe("hidden");

      rerender(<ChatModal {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe("");
    });

    it("restores focus to previous element when closed", () => {
      // Create a button to focus initially
      const button = document.createElement("button");
      document.body.appendChild(button);
      button.focus();

      const { rerender } = render(<ChatModal {...defaultProps} />);

      // Modal should be focused
      expect(screen.getByRole("dialog")).toHaveFocus();

      // Close modal
      rerender(<ChatModal {...defaultProps} isOpen={false} />);

      // Focus should return to button
      expect(button).toHaveFocus();

      // Cleanup
      document.body.removeChild(button);
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes", () => {
      render(<ChatModal {...defaultProps} />);

      const modal = screen.getByRole("dialog");
      expect(modal).toHaveAttribute("aria-modal", "true");
      expect(modal).toHaveAttribute("aria-labelledby", "modal-title");
      expect(modal).toHaveAttribute("aria-describedby", "modal-description");
    });

    it("has proper modal attributes", () => {
      render(<ChatModal {...defaultProps} />);

      const modal = screen.getByRole("dialog");
      expect(modal).toHaveAttribute("aria-modal", "true");
      expect(modal).toHaveAttribute("aria-labelledby", "modal-title");
      expect(modal).toHaveAttribute("aria-describedby", "modal-description");
    });

    it("has proper heading structure", () => {
      render(<ChatModal {...defaultProps} />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveAttribute("id", "modal-title");
    });
  });

  describe("Theme Integration", () => {
    it("applies light theme colors", () => {
      const lightTheme = getDefaultTheme("light");
      render(<ChatModal {...defaultProps} theme={lightTheme} />);

      const modal = screen.getByRole("dialog");
      expect(modal).toBeInTheDocument();
      // Theme colors are applied via CSS custom properties
    });

    it("applies dark theme colors", () => {
      const darkTheme = getDefaultTheme("dark");
      render(<ChatModal {...defaultProps} theme={darkTheme} />);

      const modal = screen.getByRole("dialog");
      expect(modal).toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("handles mobile viewport", () => {
      // Mock window.matchMedia for mobile
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

      render(<ChatModal {...defaultProps} />);

      const modal = screen.getByRole("dialog");
      expect(modal).toBeInTheDocument();
    });

    it("handles desktop viewport", () => {
      // Mock window.matchMedia for desktop
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query.includes("min-width: 1024px"),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<ChatModal {...defaultProps} />);

      const modal = screen.getByRole("dialog");
      expect(modal).toBeInTheDocument();
    });
  });

  describe("Animation States", () => {
    it("handles animation timing", async () => {
      render(<ChatModal {...defaultProps} />);

      const modal = screen.getByRole("dialog");
      expect(modal).toBeInTheDocument();

      // Animation states are handled internally, we just verify no errors
      await waitFor(() => {
        expect(modal).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("handles missing onToggleFullscreen gracefully", async () => {
      const user = userEvent.setup();
      render(<ChatModal {...defaultProps} onToggleFullscreen={undefined} />);

      const fullscreenButton = screen.getByLabelText("Enter fullscreen");

      // Should not throw error when clicked
      await expect(user.click(fullscreenButton)).resolves.not.toThrow();
    });

    it("handles missing theme gracefully", () => {
      const propsWithNullTheme = { ...defaultProps, theme: null as any };
      expect(() => render(<ChatModal {...propsWithNullTheme} />)).not.toThrow();
    });

    it("handles missing children gracefully", () => {
      const propsWithNullChildren = { ...defaultProps, children: null as any };
      expect(() => render(<ChatModal {...propsWithNullChildren} />)).not.toThrow();
    });
  });

  describe("Event Cleanup", () => {
    it("removes event listeners when unmounted", async () => {
      const addEventListenerSpy = jest.spyOn(document, "addEventListener");
      const removeEventListenerSpy = jest.spyOn(document, "removeEventListener");

      const { unmount } = render(<ChatModal {...defaultProps} />);

      // Wait for useEffect to run
      await waitFor(() => {
        expect(addEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
      });

      unmount();

      // Wait for cleanup to run
      await waitFor(() => {
        expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
      });

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
});
