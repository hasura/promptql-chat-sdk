import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ConnectionIndicator from "./index";
import { getDefaultTheme } from "../../utils";
import type { ConnectionState } from "../../types";

describe("ConnectionIndicator", () => {
  const defaultProps = {
    connectionState: "connected" as ConnectionState,
    theme: getDefaultTheme("light"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Connection States", () => {
    it("displays connected state correctly", () => {
      render(<ConnectionIndicator {...defaultProps} connectionState="connected" />);

      const indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute("aria-label", "Connection status: Connected - API is healthy and ready");
      expect(indicator.textContent).toContain("●");
    });

    it("displays connecting state correctly", () => {
      render(<ConnectionIndicator {...defaultProps} connectionState="connecting" />);

      const indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute("aria-label", "Connection status: Checking - Checking API health...");
      expect(indicator.textContent).toContain("◐");
    });

    it("displays reconnecting state correctly", () => {
      render(<ConnectionIndicator {...defaultProps} connectionState="reconnecting" />);

      const indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute("aria-label", "Connection status: Reconnecting - Attempting to reconnect...");
      expect(indicator.textContent).toContain("◑");
    });

    it("displays error state correctly", () => {
      render(<ConnectionIndicator {...defaultProps} connectionState="error" />);

      const indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute("aria-label", "Connection status: Unavailable - API health check failed");
      expect(indicator.textContent).toContain("●");
    });

    it("displays disconnected state correctly", () => {
      render(<ConnectionIndicator {...defaultProps} connectionState="disconnected" />);

      const indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute("aria-label", "Connection status: Disconnected - API health status unknown");
      expect(indicator.textContent).toContain("○");
    });
  });

  describe("Status Text", () => {
    it("shows status text when showStatusText is true", () => {
      render(<ConnectionIndicator {...defaultProps} showStatusText={true} />);

      expect(screen.getByText("Connected")).toBeInTheDocument();
    });

    it("does not show status text by default", () => {
      render(<ConnectionIndicator {...defaultProps} />);

      expect(screen.queryByText("Connected")).not.toBeInTheDocument();
    });

    it("shows correct status text for each state", () => {
      const states: ConnectionState[] = ["connected", "connecting", "reconnecting", "error", "disconnected"];
      const expectedTexts = ["Connected", "Checking", "Reconnecting", "Unavailable", "Disconnected"];

      states.forEach((state, index) => {
        const { rerender } = render(
          <ConnectionIndicator {...defaultProps} connectionState={state} showStatusText={true} />
        );

        expect(screen.getByText(expectedTexts[index])).toBeInTheDocument();

        rerender(<div />); // Clear for next iteration
      });
    });
  });

  describe("Tooltip", () => {
    it("has correct title attribute for tooltip", () => {
      render(<ConnectionIndicator {...defaultProps} />);

      const indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute("title", "Connected: API is healthy and ready");
    });

    it("shows correct title for different states", () => {
      const { rerender } = render(<ConnectionIndicator {...defaultProps} connectionState="connecting" />);

      let indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute("title", "Checking: Checking API health...");

      rerender(<ConnectionIndicator {...defaultProps} connectionState="error" />);
      indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute("title", "Unavailable: API health check failed");
    });

    it("shows correct title text for each state", () => {
      const states: { state: ConnectionState; expectedTitle: string }[] = [
        { state: "connected", expectedTitle: "Connected: API is healthy and ready" },
        { state: "connecting", expectedTitle: "Checking: Checking API health..." },
        { state: "reconnecting", expectedTitle: "Reconnecting: Attempting to reconnect..." },
        { state: "error", expectedTitle: "Unavailable: API health check failed" },
        { state: "disconnected", expectedTitle: "Disconnected: API health status unknown" },
      ];

      for (const { state, expectedTitle } of states) {
        const { rerender } = render(<ConnectionIndicator {...defaultProps} connectionState={state} />);

        const indicator = screen.getByRole("status");
        expect(indicator).toHaveAttribute("title", expectedTitle);

        rerender(<div />); // Clear for next iteration
      }
    });

    it("shows custom error message in title when error is provided", () => {
      const customError = new Error("Custom connection error");

      render(<ConnectionIndicator {...defaultProps} connectionState="error" error={customError} />);

      const indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute("title", "Unavailable: Custom connection error");
    });
  });

  describe("Visual States", () => {
    it("applies correct colors for each connection state", () => {
      const states: { state: ConnectionState; expectedColor: string }[] = [
        { state: "connected", expectedColor: defaultProps.theme.colors.success },
        { state: "connecting", expectedColor: defaultProps.theme.colors.primary },
        { state: "reconnecting", expectedColor: defaultProps.theme.colors.primary },
        { state: "error", expectedColor: defaultProps.theme.colors.error },
        { state: "disconnected", expectedColor: defaultProps.theme.colors.text },
      ];

      states.forEach(({ state, expectedColor }) => {
        const { rerender } = render(<ConnectionIndicator {...defaultProps} connectionState={state} />);

        const indicator = screen.getByRole("status");
        const iconElement = indicator.querySelector("div");

        expect(iconElement).toHaveStyle({ color: expectedColor });

        rerender(<div />); // Clear for next iteration
      });
    });

    it("applies animation for connecting and reconnecting states", () => {
      const { rerender } = render(<ConnectionIndicator {...defaultProps} connectionState="connecting" />);

      const indicator = screen.getByRole("status");
      const iconElement = indicator.querySelector("div");

      expect(iconElement).toHaveStyle({ animation: "pulse 1.5s ease-in-out infinite" });

      rerender(<ConnectionIndicator {...defaultProps} connectionState="reconnecting" />);
      expect(iconElement).toHaveStyle({ animation: "pulse 1.5s ease-in-out infinite" });

      rerender(<ConnectionIndicator {...defaultProps} connectionState="connected" />);
      expect(iconElement).toHaveStyle({ animation: "none" });
    });
  });

  describe("Theming", () => {
    it("applies theme colors correctly", () => {
      const darkTheme = getDefaultTheme("dark");
      render(<ConnectionIndicator {...defaultProps} theme={darkTheme} connectionState="connected" />);

      const indicator = screen.getByRole("status");
      const iconElement = indicator.querySelector("div");

      expect(iconElement).toHaveStyle({ color: darkTheme.colors.success });
    });

    it("applies theme colors to title attribute", () => {
      const darkTheme = getDefaultTheme("dark");
      render(<ConnectionIndicator {...defaultProps} theme={darkTheme} />);

      const indicator = screen.getByRole("status");
      // Native title tooltips don't have customizable styling, but we can verify the title content
      expect(indicator).toHaveAttribute("title", "Connected: API is healthy and ready");

      // Verify the icon uses the theme color
      const iconElement = indicator.querySelector("div");
      expect(iconElement).toHaveStyle({ color: darkTheme.colors.success });
    });
  });

  describe("Accessibility", () => {
    it("has proper role and aria-label", () => {
      render(<ConnectionIndicator {...defaultProps} />);

      const indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute("aria-label", "Connection status: Connected - API is healthy and ready");
    });

    it("updates aria-label based on connection state", () => {
      const { rerender } = render(<ConnectionIndicator {...defaultProps} connectionState="connecting" />);

      let indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute("aria-label", "Connection status: Checking - Checking API health...");

      rerender(<ConnectionIndicator {...defaultProps} connectionState="error" />);
      indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute("aria-label", "Connection status: Unavailable - API health check failed");
    });

    it("has default cursor for status indicator", () => {
      render(<ConnectionIndicator {...defaultProps} />);

      const indicator = screen.getByRole("status");
      expect(indicator).toHaveStyle({ cursor: "default" });
    });
  });

  describe("Custom Styling", () => {
    it("applies custom className", () => {
      render(<ConnectionIndicator {...defaultProps} className="custom-class" />);

      const indicator = screen.getByRole("status");
      expect(indicator).toHaveClass("custom-class");
    });
  });
});
