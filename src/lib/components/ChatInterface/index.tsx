import * as React from "react";
import { useCallback } from "react";
import type { ChatInterfaceProps } from "../../types";
import { CSS_CLASSES } from "../../utils/constants";
import MessageList from "../MessageList";
import ChatInput from "../ChatInput";

/**
 * ChatInterface - Core chat user interface component
 *
 * Orchestrates the message display and input areas, manages overall chat layout
 * and scrolling behavior, and integrates MessageList and ChatInput components.
 */
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  isCodeExecuting,
  connectionState,
  showQueryPlans,
  theme,
  prismTheme,
  codeExecutionIndicatorText,
  welcomeMessage,
  helpText,
  assistantAvatar,
  onSendMessage,
  onCancelMessage,
  className,
  error,
  onClearError,
}) => {
  // Handle error dismissal
  const handleClearError = useCallback(() => {
    onClearError?.();
  }, [onClearError]);

  return (
    <div
      className={`${CSS_CLASSES.INTERFACE} ${className || ""}`}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        position: "relative", // Enable absolute positioning for error overlay
      }}>
      {/* Error/Status display - Fixed position overlay */}
      {error && (
        <div
          className={CSS_CLASSES.ERROR}
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            zIndex: 1000,
            padding: "12px 16px",
            backgroundColor:
              error.name === "CancellationConfirmation" ? `${theme.colors.success}E6` : `${theme.colors.error}E6`,
            borderBottom:
              error.name === "CancellationConfirmation"
                ? `1px solid ${theme.colors.success}30`
                : `1px solid ${theme.colors.error}30`,
            color: "white", // High contrast white text on colored background
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {error.name === "CancellationConfirmation" && (
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  backgroundColor: theme.colors.success,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  color: "white",
                  fontWeight: "bold",
                }}>
                ✓
              </div>
            )}
            <span>{error.message}</span>
          </div>
          {/* Only show dismiss button for actual errors, not cancellation confirmations */}
          {error.name !== "CancellationConfirmation" && (
            <button
              onClick={handleClearError}
              style={{
                background: "none",
                border: "none",
                color: "white", // High contrast white text
                cursor: "pointer",
                padding: "4px",
                fontSize: "16px",
                lineHeight: 1,
              }}
              aria-label="Dismiss error">
              ×
            </button>
          )}
        </div>
      )}

      {/* Message list - takes up remaining space */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <MessageList
          messages={messages}
          isCodeExecuting={isCodeExecuting}
          showQueryPlans={showQueryPlans}
          theme={theme}
          prismTheme={prismTheme}
          codeExecutionIndicatorText={codeExecutionIndicatorText}
          welcomeMessage={welcomeMessage}
          helpText={helpText}
          assistantAvatar={assistantAvatar}
        />
      </div>

      {/* Input area */}
      <div style={{ flexShrink: 0 }}>
        <ChatInput
          disabled={isLoading || isCodeExecuting || connectionState === "error"}
          isLoading={isLoading}
          isCodeExecuting={isCodeExecuting}
          theme={theme}
          onSendMessage={onSendMessage}
          onCancelMessage={onCancelMessage}
          placeholder={
            connectionState === "error" ? "Connection unavailable - check your network" : "Type your message..."
          }
        />
      </div>
    </div>
  );
};

export default ChatInterface;
