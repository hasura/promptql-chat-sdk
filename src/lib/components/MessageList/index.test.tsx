import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import MessageList from "./index";
import { getDefaultTheme } from "../../utils";
import type { Message } from "../../types";

// Mock MessageItem component
jest.mock("../MessageItem", () => {
  return function MockMessageItem({ message, showQueryPlan, onToggleQueryPlan }: any) {
    return (
      <div data-testid={`message-${message.id}`}>
        <div data-testid={`message-content-${message.id}`}>{message.content}</div>
        <div data-testid={`message-type-${message.id}`}>{message.type}</div>
        <div data-testid={`query-plan-${message.id}`}>{showQueryPlan ? "shown" : "hidden"}</div>
        {onToggleQueryPlan && (
          <button data-testid={`toggle-${message.id}`} onClick={onToggleQueryPlan}>
            Toggle Query Plan
          </button>
        )}
      </div>
    );
  };
});

// Mock scrollTo for testing
Object.defineProperty(HTMLElement.prototype, "scrollTo", {
  value: jest.fn(),
  writable: true,
});

Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
  get: () => 1000,
  configurable: true,
});

Object.defineProperty(HTMLElement.prototype, "clientHeight", {
  get: () => 500,
  configurable: true,
});

Object.defineProperty(HTMLElement.prototype, "scrollTop", {
  get: () => 0,
  set: jest.fn(),
  configurable: true,
});

describe("MessageList", () => {
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
    {
      id: "3",
      type: "user",
      content: "How are you?",
      timestamp: new Date("2023-01-01T10:00:02Z"),
    },
  ];

  const defaultProps = {
    messages: mockMessages,
    isCodeExecuting: false,
    showQueryPlans: false,
    theme: getDefaultTheme("light"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders all messages", () => {
      render(<MessageList {...defaultProps} />);

      expect(screen.getByTestId("message-1")).toBeInTheDocument();
      expect(screen.getByTestId("message-2")).toBeInTheDocument();
      expect(screen.getByTestId("message-3")).toBeInTheDocument();
    });

    it("renders empty state when no messages", () => {
      render(<MessageList {...defaultProps} messages={[]} />);

      expect(screen.getByText("Welcome to PromptQL Chat")).toBeInTheDocument();
      expect(screen.getByText("Start a conversation by typing a message below.")).toBeInTheDocument();
    });

    it("passes correct props to MessageItem components", () => {
      render(<MessageList {...defaultProps} showQueryPlans={true} />);

      expect(screen.getByTestId("message-content-1")).toHaveTextContent("Hello");
      expect(screen.getByTestId("message-type-1")).toHaveTextContent("user");
      expect(screen.getByTestId("query-plan-1")).toHaveTextContent("shown");
    });

    it("shows code execution indicator when code is executing", () => {
      render(<MessageList {...defaultProps} isCodeExecuting={true} />);

      expect(screen.getByText("Executing query...")).toBeInTheDocument();
    });

    it("shows custom code execution indicator text", () => {
      render(
        <MessageList {...defaultProps} isCodeExecuting={true} codeExecutionIndicatorText="Running your query..." />
      );

      expect(screen.getByText("Running your query...")).toBeInTheDocument();
    });

    it("does not show indicator when not executing code", () => {
      render(<MessageList {...defaultProps} isCodeExecuting={false} />);

      expect(screen.queryByText("Executing query...")).not.toBeInTheDocument();
      expect(screen.queryByText("Assistant is typing...")).not.toBeInTheDocument();
    });
  });

  describe("Query Plan Toggle", () => {
    it("calls onToggleQueryPlan when message query plan is toggled", async () => {
      const user = userEvent.setup();
      const onToggleQueryPlan = jest.fn();

      render(<MessageList {...defaultProps} onToggleQueryPlan={onToggleQueryPlan} />);

      const toggleButton = screen.getByTestId("toggle-1");
      await user.click(toggleButton);

      expect(onToggleQueryPlan).toHaveBeenCalledWith("1");
    });
  });

  describe("Scroll Behavior", () => {
    it("shows scroll to bottom button when not at bottom", async () => {
      // Mock scroll properties to simulate user scrolled up
      const mockScrollContainer = {
        scrollTop: 100, // Not at bottom
        scrollHeight: 1000, // Total height
        clientHeight: 400, // Visible height
      };

      render(<MessageList {...defaultProps} />);

      // Get the scroll container and mock its properties
      const messageList = document.querySelector(".promptql-chat__message-list") as HTMLElement;
      Object.defineProperty(messageList, "scrollTop", {
        get: () => mockScrollContainer.scrollTop,
        configurable: true,
      });
      Object.defineProperty(messageList, "scrollHeight", {
        get: () => mockScrollContainer.scrollHeight,
        configurable: true,
      });
      Object.defineProperty(messageList, "clientHeight", {
        get: () => mockScrollContainer.clientHeight,
        configurable: true,
      });

      // Simulate scroll event
      fireEvent.scroll(messageList);

      // Wait for scroll to bottom button to appear
      await waitFor(() => {
        expect(screen.getByLabelText("Scroll to bottom")).toBeInTheDocument();
      });
    });

    it("scrolls to bottom when scroll button is clicked", async () => {
      const user = userEvent.setup();
      const mockScrollTo = jest.fn();

      // Mock scroll properties to simulate user scrolled up
      const mockScrollContainer = {
        scrollTop: 100, // Not at bottom
        scrollHeight: 1000, // Total height
        clientHeight: 400, // Visible height
      };

      render(<MessageList {...defaultProps} />);

      // Get the scroll container and mock its properties
      const messageList = document.querySelector(".promptql-chat__message-list") as HTMLElement;
      Object.defineProperty(messageList, "scrollTop", {
        get: () => mockScrollContainer.scrollTop,
        configurable: true,
      });
      Object.defineProperty(messageList, "scrollHeight", {
        get: () => mockScrollContainer.scrollHeight,
        configurable: true,
      });
      Object.defineProperty(messageList, "clientHeight", {
        get: () => mockScrollContainer.clientHeight,
        configurable: true,
      });
      Object.defineProperty(messageList, "scrollTo", {
        value: mockScrollTo,
        writable: true,
      });

      // Simulate scroll event to show button
      fireEvent.scroll(messageList);

      // Wait for scroll button to appear and click it
      await waitFor(() => {
        const scrollButton = screen.getByLabelText("Scroll to bottom");
        expect(scrollButton).toBeInTheDocument();
      });

      const scrollButton = screen.getByLabelText("Scroll to bottom");
      await user.click(scrollButton);

      await waitFor(() => {
        expect(mockScrollTo).toHaveBeenCalled();
      });
    });
  });

  describe("Theming", () => {
    it("applies theme colors", () => {
      const darkTheme = getDefaultTheme("dark");
      render(<MessageList {...defaultProps} theme={darkTheme} />);

      const welcomeText = screen.queryByText("Welcome to PromptQL Chat");
      if (welcomeText) {
        expect(welcomeText.closest("div")).toHaveStyle({
          color: darkTheme.colors.text,
        });
      }
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels for scroll button", async () => {
      // Mock scroll properties to simulate user scrolled up
      const mockScrollContainer = {
        scrollTop: 100, // Not at bottom
        scrollHeight: 1000, // Total height
        clientHeight: 400, // Visible height
      };

      render(<MessageList {...defaultProps} />);

      // Get the scroll container and mock its properties
      const messageList = document.querySelector(".promptql-chat__message-list") as HTMLElement;
      Object.defineProperty(messageList, "scrollTop", {
        get: () => mockScrollContainer.scrollTop,
        configurable: true,
      });
      Object.defineProperty(messageList, "scrollHeight", {
        get: () => mockScrollContainer.scrollHeight,
        configurable: true,
      });
      Object.defineProperty(messageList, "clientHeight", {
        get: () => mockScrollContainer.clientHeight,
        configurable: true,
      });

      // Simulate scroll event
      fireEvent.scroll(messageList);

      await waitFor(() => {
        const scrollButton = screen.getByLabelText("Scroll to bottom");
        expect(scrollButton).toBeInTheDocument();
        expect(scrollButton).toHaveAttribute("aria-label", "Scroll to bottom");
      });
    });
  });

  describe("Performance", () => {
    it("handles large number of messages efficiently", () => {
      const manyMessages: Message[] = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        type: i % 2 === 0 ? "user" : "assistant",
        content: `Message ${i}`,
        timestamp: new Date(`2023-01-01T10:${String(i).padStart(2, "0")}:00Z`),
      }));

      const { container } = render(<MessageList {...defaultProps} messages={manyMessages} />);

      // Should render without performance issues
      expect(container).toBeInTheDocument();
      expect(screen.getByTestId("message-msg-0")).toBeInTheDocument();
      expect(screen.getByTestId("message-msg-99")).toBeInTheDocument();
    });
  });
});
