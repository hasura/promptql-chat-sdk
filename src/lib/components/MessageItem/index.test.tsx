import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import MessageItem from "./index";
import { getDefaultTheme } from "../../utils";
import type { UserMessage, AssistantMessage } from "../../types";

// Mock react-markdown
jest.mock("react-markdown", () => {
  return function MockReactMarkdown({ children, components, remarkPlugins }: any) {
    // Always return with markdown-content test ID for consistency
    return <div data-testid="markdown-content">{children}</div>;
  };
});

// Mock remark-gfm
jest.mock("remark-gfm", () => {
  return jest.fn();
});

// Mock react-syntax-highlighter
jest.mock("react-syntax-highlighter", () => ({
  Prism: function MockSyntaxHighlighter({ children }: any) {
    return <pre data-testid="syntax-highlighter">{children}</pre>;
  },
}));

// Mock prism styles
jest.mock("react-syntax-highlighter/dist/esm/styles/prism", () => ({
  prism: {},
  dark: {},
  tomorrow: {},
  twilight: {},
  okaidia: {},
  funky: {},
  coy: {},
}));

describe("MessageItem", () => {
  const userMessage: UserMessage = {
    id: "user-1",
    type: "user",
    content: "Hello, how are you?",
    timestamp: new Date(Date.now() - 30000), // 30 seconds ago = "Just now"
  };

  const assistantMessage: AssistantMessage = {
    id: "assistant-1",
    type: "assistant",
    content: "I'm doing well, thank you! How can I help you today?",
    timestamp: new Date(Date.now() - 30000), // 30 seconds ago = "Just now"
    query_plan: {
      id: "plan-1",
      query: "SELECT * FROM users WHERE active = true",
      execution_time: 150,
      result_count: 42,
    },
  };

  const assistantMessageWithoutQueryPlan: AssistantMessage = {
    id: "assistant-2",
    type: "assistant",
    content: "Simple response without query plan",
    timestamp: new Date("2023-01-01T10:00:02Z"),
  };

  const defaultProps = {
    showQueryPlan: false,
    theme: getDefaultTheme("light"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("User Messages", () => {
    it("renders user message correctly", () => {
      render(<MessageItem {...defaultProps} message={userMessage} />);

      expect(screen.getByText("Hello, how are you?")).toBeInTheDocument();
      expect(screen.getByText("Just now")).toBeInTheDocument(); // timestamp
    });

    it("applies user message styling", () => {
      render(<MessageItem {...defaultProps} message={userMessage} />);

      const messageContent = screen.getByText("Hello, how are you?");
      // The message bubble is the parent of the content div
      const messageBubble = messageContent.parentElement?.parentElement;

      expect(messageBubble).toHaveStyle({
        backgroundColor: defaultProps.theme.colors.primary,
        color: "white",
      });
    });

    it("aligns user messages to the right", () => {
      render(<MessageItem {...defaultProps} message={userMessage} />);

      // The main container has alignItems: flex-end for user messages
      const messageItem = screen.getByText("Hello, how are you?").closest(".promptql-chat__message-item");
      expect(messageItem).toHaveStyle({
        alignItems: "flex-end",
      });
    });
  });

  describe("Assistant Messages", () => {
    it("renders assistant message correctly", () => {
      render(<MessageItem {...defaultProps} message={assistantMessage} />);

      expect(screen.getByTestId("markdown-content")).toBeInTheDocument();
      expect(screen.getByText("Just now")).toBeInTheDocument();
    });

    it("applies assistant message styling", () => {
      render(<MessageItem {...defaultProps} message={assistantMessage} />);

      const messageContent = screen.getByTestId("markdown-content");
      // The message bubble is the parent of the ReactMarkdown component
      const messageBubble = messageContent.parentElement?.parentElement;

      expect(messageBubble).toHaveStyle({
        backgroundColor: defaultProps.theme.colors.surface,
        color: defaultProps.theme.colors.text,
      });
    });

    it("aligns assistant messages to the left", () => {
      render(<MessageItem {...defaultProps} message={assistantMessage} />);

      // The main container has alignItems: flex-start for assistant messages
      const messageItem = screen.getByTestId("markdown-content").closest(".promptql-chat__message-item");
      expect(messageItem).toHaveStyle({
        alignItems: "flex-start",
      });
    });

    it("renders markdown content for assistant messages", () => {
      const markdownMessage: AssistantMessage = {
        ...assistantMessage,
        content: "Here's some `inline code` and a list:\n- Item 1\n- Item 2",
      };

      render(<MessageItem {...defaultProps} message={markdownMessage} />);

      expect(screen.getByTestId("markdown-content")).toBeInTheDocument();
    });
  });

  describe("Query Plans", () => {
    it("shows query plan section when showQueryPlan is true and query plan exists", () => {
      render(<MessageItem {...defaultProps} message={assistantMessage} showQueryPlan={true} />);

      expect(screen.getByText("Query Plan")).toBeInTheDocument();
      expect(screen.getByText("(150ms)")).toBeInTheDocument();
    });

    it("does not show query plan section when showQueryPlan is false", () => {
      render(<MessageItem {...defaultProps} message={assistantMessage} showQueryPlan={false} />);

      expect(screen.queryByText("Query Plan")).not.toBeInTheDocument();
    });

    it("does not show query plan section when message has no query plan", () => {
      render(<MessageItem {...defaultProps} message={assistantMessageWithoutQueryPlan} showQueryPlan={true} />);

      expect(screen.queryByText("Query Plan")).not.toBeInTheDocument();
    });

    it("toggles query plan details when clicked", async () => {
      const user = userEvent.setup();
      render(<MessageItem {...defaultProps} message={assistantMessage} showQueryPlan={true} />);

      const queryPlanButton = screen.getByText("Query Plan");

      // Initially collapsed
      expect(screen.queryByText("SELECT * FROM users WHERE active = true")).not.toBeInTheDocument();

      // Click to expand
      await user.click(queryPlanButton);

      expect(screen.getByText("SELECT * FROM users WHERE active = true")).toBeInTheDocument();
      expect(screen.getByText("Results: 42")).toBeInTheDocument();
    });

    it("calls onToggleQueryPlan when query plan is toggled", async () => {
      const user = userEvent.setup();
      const onToggleQueryPlan = jest.fn();

      render(
        <MessageItem
          {...defaultProps}
          message={assistantMessage}
          showQueryPlan={true}
          onToggleQueryPlan={onToggleQueryPlan}
        />
      );

      const queryPlanButton = screen.getByText("Query Plan");
      await user.click(queryPlanButton);

      expect(onToggleQueryPlan).toHaveBeenCalledTimes(1);
    });

    it("shows correct arrow direction for collapsed/expanded state", async () => {
      const user = userEvent.setup();
      render(<MessageItem {...defaultProps} message={assistantMessage} showQueryPlan={true} />);

      const queryPlanButton = screen.getByText("Query Plan");

      // Initially collapsed (right arrow)
      expect(queryPlanButton.textContent).toContain("▶");

      // Click to expand (down arrow)
      await user.click(queryPlanButton);
      expect(queryPlanButton.textContent).toContain("▼");
    });
  });

  describe("Timestamps", () => {
    it("formats timestamps correctly", () => {
      const recentMessage: UserMessage = {
        ...userMessage,
        timestamp: new Date(Date.now() - 30000), // 30 seconds ago
      };

      render(<MessageItem {...defaultProps} message={recentMessage} />);

      expect(screen.getByText("Just now")).toBeInTheDocument();
    });

    it("shows relative time for older messages", () => {
      const oldMessage: UserMessage = {
        ...userMessage,
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      };

      render(<MessageItem {...defaultProps} message={oldMessage} />);

      expect(screen.getByText("5m ago")).toBeInTheDocument();
    });
  });

  describe("Theming", () => {
    it("applies dark theme correctly", () => {
      const darkTheme = getDefaultTheme("dark");
      render(<MessageItem {...defaultProps} message={assistantMessage} theme={darkTheme} />);

      const messageContent = screen.getByTestId("markdown-content");
      // The message bubble is the parent of the ReactMarkdown component
      const messageBubble = messageContent.parentElement?.parentElement;

      expect(messageBubble).toHaveStyle({
        backgroundColor: darkTheme.colors.surface,
        color: darkTheme.colors.text,
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes for query plan toggle", () => {
      render(<MessageItem {...defaultProps} message={assistantMessage} showQueryPlan={true} />);

      const queryPlanButton = screen.getByText("Query Plan");
      expect(queryPlanButton).toHaveAttribute("aria-expanded", "false");
    });

    it("updates aria-expanded when query plan is toggled", async () => {
      const user = userEvent.setup();
      render(<MessageItem {...defaultProps} message={assistantMessage} showQueryPlan={true} />);

      const queryPlanButton = screen.getByText("Query Plan");

      expect(queryPlanButton).toHaveAttribute("aria-expanded", "false");

      await user.click(queryPlanButton);

      expect(queryPlanButton).toHaveAttribute("aria-expanded", "true");
    });
  });
});
