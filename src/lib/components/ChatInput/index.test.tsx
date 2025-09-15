import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ChatInput from "./index";
import { getDefaultTheme } from "../../utils";

describe("ChatInput", () => {
  const defaultProps = {
    disabled: false,
    isLoading: false,
    isCodeExecuting: false,
    theme: getDefaultTheme("light"),
    onSendMessage: jest.fn(),
    onCancelMessage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders input field and send button", () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByPlaceholderText("Type your message...")).toBeInTheDocument();
      expect(screen.getByLabelText("Send message")).toBeInTheDocument();
    });

    it("shows custom placeholder text", () => {
      render(<ChatInput {...defaultProps} placeholder="Custom placeholder" />);

      expect(screen.getByPlaceholderText("Custom placeholder")).toBeInTheDocument();
    });

    it("shows keyboard shortcut hint", () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByText("Press Enter to send, Shift+Enter for new line")).toBeInTheDocument();
    });
  });

  describe("Input Handling", () => {
    it("updates input value when typing", async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByPlaceholderText("Type your message...");
      await user.type(input, "Hello world");

      expect(input).toHaveValue("Hello world");
    });
  });

  describe("Message Sending", () => {
    it("calls onSendMessage when send button is clicked with content", async () => {
      const user = userEvent.setup();
      const onSendMessage = jest.fn();
      render(<ChatInput {...defaultProps} onSendMessage={onSendMessage} />);

      const input = screen.getByPlaceholderText("Type your message...");
      const sendButton = screen.getByLabelText("Send message");

      // Simulate input by directly setting value and triggering change event
      fireEvent.change(input, { target: { value: "Test message" } });
      await user.click(sendButton);

      expect(onSendMessage).toHaveBeenCalledWith("Test message");
    });

    it("calls onSendMessage when Enter is pressed with content", async () => {
      const onSendMessage = jest.fn();
      render(<ChatInput {...defaultProps} onSendMessage={onSendMessage} />);

      const input = screen.getByPlaceholderText("Type your message...");
      const form = input.closest("form");

      // Simulate input and form submission
      fireEvent.change(input, { target: { value: "Test message" } });
      fireEvent.submit(form!);

      expect(onSendMessage).toHaveBeenCalledWith("Test message");
    });

    it("does not send message when input is empty", () => {
      const onSendMessage = jest.fn();
      render(<ChatInput {...defaultProps} onSendMessage={onSendMessage} />);

      const input = screen.getByPlaceholderText("Type your message...");

      // Try to send empty message
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

      expect(onSendMessage).not.toHaveBeenCalled();
    });
  });

  describe("Cancel Functionality", () => {
    it("shows cancel button when loading", () => {
      render(<ChatInput {...defaultProps} isLoading={true} />);

      expect(screen.getByLabelText("Cancel message")).toBeInTheDocument();
    });

    it("shows cancel button when code is executing", () => {
      render(<ChatInput {...defaultProps} isCodeExecuting={true} />);

      expect(screen.getByLabelText("Cancel message")).toBeInTheDocument();
    });

    it("calls onCancelMessage when cancel button is clicked", async () => {
      const user = userEvent.setup();
      const onCancelMessage = jest.fn();
      render(<ChatInput {...defaultProps} isLoading={true} onCancelMessage={onCancelMessage} />);

      const cancelButton = screen.getByLabelText("Cancel message");
      await user.click(cancelButton);

      expect(onCancelMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe("Disabled State", () => {
    it("disables input when disabled prop is true", () => {
      render(<ChatInput {...defaultProps} disabled={true} />);

      const input = screen.getByPlaceholderText("Type your message...");
      expect(input).toBeDisabled();
    });

    it("disables send button when disabled", () => {
      render(<ChatInput {...defaultProps} disabled={true} />);

      const sendButton = screen.getByLabelText("Send message");
      expect(sendButton).toBeDisabled();
    });

    it("disables send button when input is empty", () => {
      render(<ChatInput {...defaultProps} />);

      const sendButton = screen.getByLabelText("Send message");
      expect(sendButton).toBeDisabled();
    });

    it("enables send button when input has content", async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByPlaceholderText("Type your message...");
      const sendButton = screen.getByLabelText("Send message");

      await user.type(input, "Test");

      expect(sendButton).not.toBeDisabled();
    });
  });

  describe("Auto-resize", () => {
    it("adjusts textarea height based on content", async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByPlaceholderText("Type your message...");

      // Mock scrollHeight to simulate content height
      Object.defineProperty(input, "scrollHeight", {
        get: () => 80,
        configurable: true,
      });

      await user.type(input, "Line 1\nLine 2\nLine 3");

      // Height should be adjusted (mocked in the component)
      expect(input.style.height).toBeTruthy();
    });
  });

  describe("Button States", () => {
    it("shows send icon when not loading/streaming", () => {
      render(<ChatInput {...defaultProps} />);

      const sendButton = screen.getByLabelText("Send message");
      const sendIcon = sendButton.querySelector('div[style*="border-left"]');
      expect(sendIcon).toBeInTheDocument();
    });

    it("applies correct button colors based on state", () => {
      const { rerender } = render(<ChatInput {...defaultProps} />);

      // Disabled state
      let sendButton = screen.getByLabelText("Send message");
      expect(sendButton).toHaveStyle({ backgroundColor: defaultProps.theme.colors.border });

      // With content (enabled)
      rerender(<ChatInput {...defaultProps} />);
      const input = screen.getByPlaceholderText("Type your message...");
      fireEvent.change(input, { target: { value: "test" } });

      sendButton = screen.getByLabelText("Send message");
      expect(sendButton).toHaveStyle({ backgroundColor: defaultProps.theme.colors.primary });

      // Cancel state
      rerender(<ChatInput {...defaultProps} isLoading={true} />);
      const cancelButton = screen.getByLabelText("Cancel message");
      expect(cancelButton).toHaveStyle({ backgroundColor: defaultProps.theme.colors.error });
    });
  });

  describe("Theming", () => {
    it("applies theme colors correctly", () => {
      const darkTheme = getDefaultTheme("dark");
      render(<ChatInput {...defaultProps} theme={darkTheme} />);

      const input = screen.getByPlaceholderText("Type your message...");
      expect(input).toHaveStyle({ color: darkTheme.colors.text });
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels", () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByLabelText("Send message")).toBeInTheDocument();
    });

    it("updates ARIA label based on button state", () => {
      const { rerender } = render(<ChatInput {...defaultProps} />);

      expect(screen.getByLabelText("Send message")).toBeInTheDocument();

      rerender(<ChatInput {...defaultProps} isLoading={true} />);
      expect(screen.getByLabelText("Cancel message")).toBeInTheDocument();
    });
  });
});
