import * as React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import type { ChatInputProps } from "../../types";
import { CSS_CLASSES, DEFAULT_CONFIG } from "../../utils/constants";

/**
 * ChatInput - Message composition area component
 *
 * Provides a text input area with send and stop button functionality,
 * message composition and submission handling, input validation and placeholder text,
 * keyboard navigation (Enter to send, Shift+Enter for new line), and disabled state
 * during message processing.
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  disabled,
  isLoading,
  isCodeExecuting,
  theme,
  placeholder = "Type your message...",
  className,
  onSendMessage,
  onCancelMessage,
}) => {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";

    // Set height based on content, with min and max constraints
    const minHeight = 44; // Minimum single line height
    const maxHeight = 120; // Maximum height before scrolling
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);

    textarea.style.height = `${newHeight}px`;
  }, []);

  // Adjust height when message changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    // Enforce maximum length
    if (value.length <= DEFAULT_CONFIG.MESSAGE_MAX_LENGTH) {
      setMessage(value);
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedMessage = message.trim();
      if (!trimmedMessage || disabled) return;

      onSendMessage(trimmedMessage);
      setMessage("");
    },
    [message, disabled, onSendMessage]
  );

  // Handle key press for keyboard shortcuts
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as any);
      }
    },
    [handleSubmit]
  );

  // Handle cancel action
  const handleCancel = useCallback(() => {
    onCancelMessage();
  }, [onCancelMessage]);

  // Focus management
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const canSend = message.trim().length > 0 && !disabled;
  const showCancel = isLoading || isCodeExecuting;

  return (
    <form
      onSubmit={handleSubmit}
      className={`${CSS_CLASSES.INPUT} ${className || ""}`}
      style={{
        padding: "16px",
        borderTop: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.surface,
      }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "12px",
          position: "relative",
        }}>
        {/* Text input area */}
        <div
          style={{
            flex: 1,
            position: "relative",
            border: `2px solid ${isFocused ? theme.colors.primary : theme.colors.border}`,
            borderRadius: "12px",
            backgroundColor: theme.colors.background,
            transition: "border-color 0.2s ease",
          }}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={CSS_CLASSES.INPUT_FIELD}
            style={{
              width: "100%",
              minHeight: "44px",
              maxHeight: "120px",
              padding: "12px 16px",
              border: "none",
              outline: "none",
              resize: "none",
              backgroundColor: "transparent",
              color: theme.colors.text,
              fontSize: "14px",
              lineHeight: 1.5,
              fontFamily: "inherit",
              overflow: "hidden",
              scrollbarWidth: "thin",
            }}
            rows={1}
          />

          {/* Character count indicator */}
          {message.length > DEFAULT_CONFIG.MESSAGE_MAX_LENGTH * 0.8 && (
            <div
              style={{
                position: "absolute",
                bottom: "4px",
                right: "8px",
                fontSize: "11px",
                color:
                  message.length >= DEFAULT_CONFIG.MESSAGE_MAX_LENGTH ? theme.colors.error : theme.colors.textSecondary,
                pointerEvents: "none",
              }}>
              {message.length}/{DEFAULT_CONFIG.MESSAGE_MAX_LENGTH}
            </div>
          )}
        </div>

        {/* Action button */}
        <button
          type={showCancel ? "button" : "submit"}
          onClick={showCancel ? handleCancel : undefined}
          disabled={!showCancel && !canSend}
          className={CSS_CLASSES.INPUT_BUTTON}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px", // Will be overridden by CSS class
            border: "none",
            padding: "0", // Override global button padding
            backgroundColor: showCancel ? theme.colors.error : canSend ? theme.colors.primary : theme.colors.border,
            color: showCancel || canSend ? "white" : theme.colors.textSecondary,
            cursor: showCancel || canSend ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (showCancel || canSend) {
              e.currentTarget.style.transform = "scale(1.05)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          aria-label={showCancel ? "Cancel message" : "Send message"}>
          {showCancel ? (
            // Stop icon
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "currentColor",
                borderRadius: "2px",
              }}
            />
          ) : (
            // Send icon (arrow)
            <div
              style={{
                width: "0",
                height: "0",
                borderLeft: "8px solid currentColor",
                borderTop: "6px solid transparent",
                borderBottom: "6px solid transparent",
                marginLeft: "2px",
              }}
            />
          )}
        </button>
      </div>

      {/* Keyboard shortcut hint */}
      <div
        style={{
          marginTop: "8px",
          fontSize: "11px",
          color: theme.colors.textSecondary,
          textAlign: "center",
        }}>
        Press Enter to send, Shift+Enter for new line
      </div>
    </form>
  );
};

export default ChatInput;
