import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ChatInterface from "./index";
import { getDefaultTheme } from "../../utils";
import type { Message, PromptQLError } from "../../types";

// Mock child components
jest.mock("../MessageList", () => {
  return function MockMessageList({ messages, isCodeExecuting, showQueryPlans }: any) {
    return (
      <div data-testid="message-list">
        <div data-testid="message-count">{messages.length}</div>
        <div data-testid="streaming-state">{isCodeExecuting ? "streaming" : "not-streaming"}</div>
        <div data-testid="query-plans-state">{showQueryPlans ? "shown" : "hidden"}</div>
      </div>
    );
  };
});

jest.mock("../ChatInput", () => {
  return function MockChatInput({ disabled, isLoading, isCodeExecuting, onSendMessage, onCancelMessage }: any) {
    return (
      <div data-testid="chat-input">
        <button data-testid="send-button" disabled={disabled} onClick={() => onSendMessage("test message")}>
          Send
        </button>
        <button data-testid="cancel-button" onClick={onCancelMessage}>
          Cancel
        </button>
        <div data-testid="input-state">
          {disabled ? "disabled" : "enabled"} |{isLoading ? "loading" : "not-loading"} |
          {isCodeExecuting ? "streaming" : "not-streaming"}
        </div>
      </div>
    );
  };
});

describe("ChatInterface", () => {
  const mockMessages: Message[] = [
    {
      id: "1",
      type: "user",
      content: "Hello",
      timestamp: new Date("2023-01-01T10:00:00Z"),
    },
    {
      id: "2",
      type: "assistant",
      content: "Hi there!",
      timestamp: new Date("2023-01-01T10:00:01Z"),
    },
  ];

  const defaultProps = {
    messages: mockMessages,
    isLoading: false,
    isCodeExecuting: false,
    connectionState: "connected" as const,
    showQueryPlans: false,
    theme: getDefaultTheme("light"),
    onSendMessage: jest.fn(),
    onCancelMessage: jest.fn(),
    onToggleQueryPlans: jest.fn(),
    error: null,
    onClearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders the chat interface with all components", () => {
      render(<ChatInterface {...defaultProps} />);

      expect(screen.getByTestId("message-list")).toBeInTheDocument();
      expect(screen.getByTestId("chat-input")).toBeInTheDocument();
    });

    it("does not display query plan toggle button", () => {
      render(<ChatInterface {...defaultProps} />);

      expect(screen.queryByText("Show Query Plans")).not.toBeInTheDocument();
      expect(screen.queryByText("Hide Query Plans")).not.toBeInTheDocument();
    });

    it("passes correct props to child components", () => {
      render(<ChatInterface {...defaultProps} />);

      expect(screen.getByTestId("message-count")).toHaveTextContent("2");
      expect(screen.getByTestId("streaming-state")).toHaveTextContent("not-streaming");
      expect(screen.getByTestId("query-plans-state")).toHaveTextContent("hidden");
    });
  });

  describe("Query Plan Visibility", () => {
    it("shows query plans when showQueryPlans prop is true", () => {
      render(<ChatInterface {...defaultProps} showQueryPlans={true} />);

      expect(screen.getByTestId("query-plans-state")).toHaveTextContent("shown");
    });

    it("hides query plans when showQueryPlans prop is false", () => {
      render(<ChatInterface {...defaultProps} showQueryPlans={false} />);

      expect(screen.getByTestId("query-plans-state")).toHaveTextContent("hidden");
    });
  });

  describe("Error Handling", () => {
    it("displays error message when error is present", () => {
      const error: PromptQLError = {
        name: "PromptQLError",
        message: "Test error message",
      };

      render(<ChatInterface {...defaultProps} error={error} />);

      expect(screen.getByText("Test error message")).toBeInTheDocument();
    });

    it("calls onClearError when error dismiss button is clicked", async () => {
      const user = userEvent.setup();
      const onClearError = jest.fn();
      const error: PromptQLError = {
        name: "PromptQLError",
        message: "Test error message",
      };

      render(<ChatInterface {...defaultProps} error={error} onClearError={onClearError} />);

      const dismissButton = screen.getByLabelText("Dismiss error");
      await user.click(dismissButton);

      expect(onClearError).toHaveBeenCalledTimes(1);
    });

    it("does not display error section when no error", () => {
      render(<ChatInterface {...defaultProps} error={null} />);

      expect(screen.queryByText("Test error message")).not.toBeInTheDocument();
    });

    it("displays cancellation confirmation with success styling", () => {
      const cancellationMessage = {
        name: "CancellationConfirmation",
        message: "Message cancelled successfully. You can now send a new message.",
      };

      render(<ChatInterface {...defaultProps} error={cancellationMessage} />);

      expect(screen.getByText("Message cancelled successfully. You can now send a new message.")).toBeInTheDocument();
      expect(screen.getByText("✓")).toBeInTheDocument(); // Check for success icon
    });

    it("does not show dismiss button for cancellation confirmations", () => {
      const cancellationMessage = {
        name: "CancellationConfirmation",
        message: "Message cancelled successfully. You can now send a new message.",
      };

      render(<ChatInterface {...defaultProps} error={cancellationMessage} />);

      // Should not have a dismiss button for cancellation confirmations
      expect(screen.queryByLabelText("Dismiss confirmation")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Dismiss error")).not.toBeInTheDocument();
      expect(screen.queryByText("×")).not.toBeInTheDocument();
    });
  });

  describe("Message Handling", () => {
    it("forwards onSendMessage to ChatInput", async () => {
      const onSendMessage = jest.fn();
      render(<ChatInterface {...defaultProps} onSendMessage={onSendMessage} />);

      const sendButton = screen.getByTestId("send-button");
      fireEvent.click(sendButton);

      expect(onSendMessage).toHaveBeenCalledWith("test message");
    });

    it("forwards onCancelMessage to ChatInput", async () => {
      const onCancelMessage = jest.fn();
      render(<ChatInterface {...defaultProps} onCancelMessage={onCancelMessage} />);

      const cancelButton = screen.getByTestId("cancel-button");
      fireEvent.click(cancelButton);

      expect(onCancelMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe("Loading States", () => {
    it("passes loading state to child components", () => {
      render(<ChatInterface {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId("input-state")).toHaveTextContent("disabled");
      expect(screen.getByTestId("input-state")).toHaveTextContent("loading");
    });

    it("passes code executing state to child components", () => {
      render(<ChatInterface {...defaultProps} isCodeExecuting={true} />);

      expect(screen.getByTestId("streaming-state")).toHaveTextContent("streaming");
      expect(screen.getByTestId("input-state")).toHaveTextContent("streaming");
    });
  });

  describe("Theming", () => {
    it("applies theme colors to interface", () => {
      const darkTheme = getDefaultTheme("dark");
      const { container } = render(<ChatInterface {...defaultProps} theme={darkTheme} />);

      const interfaceElement = container.firstChild as HTMLElement;
      expect(interfaceElement).toHaveStyle({
        backgroundColor: darkTheme.colors.background,
        color: darkTheme.colors.text,
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels for interactive elements", () => {
      const error: PromptQLError = {
        name: "PromptQLError",
        message: "Test error message",
      };

      render(<ChatInterface {...defaultProps} error={error} />);

      // Check that error dismiss button has proper aria-label (this is tested elsewhere too)
      const dismissButton = screen.getByLabelText("Dismiss error");
      expect(dismissButton).toBeInTheDocument();
    });

    it("error dismiss button has proper aria-label", () => {
      const error: PromptQLError = {
        name: "PromptQLError",
        message: "Test error",
      };

      render(<ChatInterface {...defaultProps} error={error} />);

      const dismissButton = screen.getByLabelText("Dismiss error");
      expect(dismissButton).toBeInTheDocument();
    });
  });
});
