import * as React from "react";
import { useEffect, useRef, useState } from "react";
import type { MessageListProps } from "../../types";
import { CSS_CLASSES } from "../../utils/constants";
import MessageItem from "../MessageItem";

/**
 * MessageList - Scrollable conversation container component
 *
 * Provides a scrollable container for conversation messages with automatic
 * scrolling to new messages, scroll position maintenance during updates,
 * loading states and typing indicators, and proper spacing between messages.
 */
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isCodeExecuting,
  showQueryPlans,
  theme,
  prismTheme,
  codeExecutionIndicatorText = "Executing query...",
  welcomeMessage = "Welcome to PromptQL Chat",
  helpText = "Start a conversation by typing a message below.",
  assistantAvatar,
  className,
  onToggleQueryPlan,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const lastMessageCountRef = useRef(messages.length);

  // Auto-scroll to bottom when new messages arrive (unless user is scrolling)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const hasNewMessages = messages.length > lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;

    if (hasNewMessages && !isUserScrolling) {
      // Smooth scroll to bottom
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length, isUserScrolling]);

  // Handle scroll events to detect user scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      setIsUserScrolling(true);

      // Check if user is near bottom
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom);

      // Reset user scrolling flag after a delay
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsUserScrolling(false);
      }, 1000);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // Scroll to bottom function
  const scrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
      setShowScrollToBottom(false);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}>
      {/* Scrollable message container */}
      <div
        ref={scrollContainerRef}
        className={`${CSS_CLASSES.MESSAGE_LIST} ${className || ""}`}
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "16px",
          scrollBehavior: "smooth",
        }}>
        {messages.length === 0 ? (
          // Empty state
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: theme.colors.textSecondary,
              textAlign: "center",
              padding: "40px 20px",
            }}>
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: theme.colors.text,
                }}>
                {welcomeMessage}
              </div>
              <div style={{ fontSize: "14px", lineHeight: 1.5 }}>{helpText}</div>
            </div>
          </div>
        ) : (
          // Message list
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                showQueryPlan={showQueryPlans}
                theme={theme}
                prismTheme={prismTheme}
                assistantAvatar={assistantAvatar}
                onToggleQueryPlan={() => onToggleQueryPlan?.(message.id)}
              />
            ))}

            {/* Typing indicator for code execution */}
            {isCodeExecuting && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: theme.colors.textSecondary,
                  fontSize: "14px",
                  padding: "8px 0",
                }}>
                <div
                  style={{
                    display: "flex",
                    gap: "4px",
                  }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: theme.colors.primary,
                        animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
                <span>{codeExecutionIndicatorText}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          style={{
            position: "absolute",
            bottom: "16px",
            right: "16px",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "none",
            backgroundColor: theme.colors.primary,
            color: "white",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            transition: "all 0.2s ease",
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          aria-label="Scroll to bottom">
          ↓
        </button>
      )}
    </div>
  );
};

export default MessageList;
