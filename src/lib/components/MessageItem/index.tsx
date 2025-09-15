import * as React from "react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import * as prismStyles from "react-syntax-highlighter/dist/esm/styles/prism";
// Import specific VS Code themes
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark";
import type { MessageItemProps } from "../../types";
import { CSS_CLASSES } from "../../utils/constants";
import { formatTimestamp } from "../../utils";

/**
 * Copy button component for code blocks
 */
const CopyButton: React.FC<{
  text: string;
  theme: any;
}> = ({ text, theme }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        position: "absolute",
        top: "8px",
        right: "8px",
        background: copied ? theme.colors.primary : theme.colors.surface,
        color: copied ? "#fff" : theme.colors.text,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: "4px",
        padding: "4px 8px",
        fontSize: "11px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        zIndex: 1,
        opacity: 0.8,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "0.8";
      }}
      title={copied ? "Copied!" : "Copy code"}>
      {copied ? (
        "✓"
      ) : (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
};

/**
 * Get Prism style object based on theme name
 */
function getPrismStyleObject(themeName?: string) {
  switch (themeName) {
    // Basic themes
    case "one-dark":
      return oneDark;
    case "tomorrow":
      return prismStyles.tomorrow;
    default:
      return prismStyles.prism; // Default theme
  }
}

/**
 * Format query plan content as a readable list
 */
function formatQueryPlanContent(content: string): React.ReactNode {
  if (!content) return null;

  // Split content into lines and filter out empty lines
  const lines = content.split("\n").filter((line) => line.trim());

  // If it looks like a numbered list, format it properly
  const numberedListRegex = /^\d+\.\s*/;
  const isNumberedList = lines.some((line) => numberedListRegex.test(line.trim()));

  if (isNumberedList) {
    return (
      <ol style={{ margin: 0, paddingLeft: "20px" }}>
        {lines.map((line, index) => {
          const cleanLine = line.trim().replace(numberedListRegex, "");
          return cleanLine ? (
            <li key={index} style={{ marginBottom: "4px" }}>
              {cleanLine}
            </li>
          ) : null;
        })}
      </ol>
    );
  }

  // Otherwise, format as bullet points if it looks like a list
  const bulletRegex = /^[-*•]\s*/;
  const isBulletList = lines.some((line) => bulletRegex.test(line.trim()));

  if (isBulletList) {
    return (
      <ul style={{ margin: 0, paddingLeft: "20px" }}>
        {lines.map((line, index) => {
          const cleanLine = line.trim().replace(bulletRegex, "");
          return cleanLine ? (
            <li key={index} style={{ marginBottom: "4px" }}>
              {cleanLine}
            </li>
          ) : null;
        })}
      </ul>
    );
  }

  // For other content, just display as paragraphs
  return (
    <div>
      {lines.map((line, index) =>
        line.trim() ? (
          <div key={index} style={{ marginBottom: "4px" }}>
            {line.trim()}
          </div>
        ) : null
      )}
    </div>
  );
}

/**
 * MessageItem - Individual message bubble component
 *
 * Renders individual message bubbles with distinct styling for user vs assistant
 * messages, markdown rendering for rich text content, timestamp display,
 * and query plan visibility toggle.
 */
export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  showQueryPlan,
  theme,
  prismTheme = "prism",
  assistantAvatar,
  className,
  onToggleQueryPlan,
}) => {
  const [isQueryPlanExpanded, setIsQueryPlanExpanded] = useState(false);
  const isUser = message.type === "user";
  const isAssistant = message.type === "assistant";

  // Handle query plan toggle
  const handleToggleQueryPlan = () => {
    setIsQueryPlanExpanded(!isQueryPlanExpanded);
    onToggleQueryPlan?.();
  };

  return (
    <div
      className={`${CSS_CLASSES.MESSAGE_ITEM} ${isUser ? CSS_CLASSES.MESSAGE_USER : CSS_CLASSES.MESSAGE_ASSISTANT} ${
        className || ""
      }`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        maxWidth: "100%",
      }}>
      {/* Message container with avatar */}
      <div
        style={{
          display: "flex",
          flexDirection: isUser ? "row-reverse" : "row",
          alignItems: "flex-end",
          gap: "8px",
          minWidth: isUser ? "40%" : "auto", // Give user messages a reasonable minimum width
          maxWidth: "100%",
        }}>
        {/* Avatar for assistant messages */}
        {isAssistant && assistantAvatar && (
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: theme.colors.surface, // Match the chat bubble background
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: "16px",
              border: `1px solid ${theme.colors.border}`, // Add subtle border for definition
            }}>
            {assistantAvatar}
          </div>
        )}

        {/* Message bubble */}
        <div
          style={{
            maxWidth: isAssistant && assistantAvatar ? "calc(80% - 40px)" : "80%",
            minWidth: isUser ? "auto" : "120px", // Let user messages size naturally
            padding: "12px 16px",
            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            backgroundColor: isUser ? theme.colors.primary : theme.colors.surface,
            color: isUser ? "white" : theme.colors.text,
            wordWrap: "break-word", // Standard word wrapping behavior
            position: "relative",
          }}>
          {/* Message content */}
          <div
            style={{
              fontSize: "14px",
              lineHeight: 1.5,
            }}>
            {isUser ? (
              // User messages are plain text
              <div>{message.content}</div>
            ) : (
              // Assistant messages support markdown
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Customize markdown rendering
                  p: ({ children }) => <div style={{ margin: "0 0 8px 0" }}>{children}</div>,
                  code: ({ children, className }) => {
                    const match = /language-(\w+)/.exec(className || "");
                    const language = match ? match[1] : "";
                    const isInline = !className;

                    if (isInline) {
                      return (
                        <code
                          style={{
                            backgroundColor: `${theme.colors.border}40`,
                            padding: "2px 4px",
                            borderRadius: "4px",
                            fontSize: "13px",
                            fontFamily: "monospace",
                          }}>
                          {children}
                        </code>
                      );
                    }

                    const codeText = String(children).replace(/\n$/, "");

                    return (
                      <div style={{ position: "relative", margin: "8px 0" }}>
                        <SyntaxHighlighter
                          style={getPrismStyleObject(prismTheme)}
                          language={language}
                          PreTag="div"
                          customStyle={{
                            margin: "0",
                            borderRadius: "6px",
                            fontSize: "13px",
                            paddingRight: "50px", // Make room for copy button
                          }}>
                          {codeText}
                        </SyntaxHighlighter>
                        <CopyButton text={codeText} theme={theme} />
                      </div>
                    );
                  },
                  pre: ({ children }) => <div>{children}</div>, // Let SyntaxHighlighter handle pre tags
                  ul: ({ children }) => <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ margin: "8px 0", paddingLeft: "20px" }}>{children}</ol>,
                  li: ({ children }) => <li style={{ margin: "4px 0" }}>{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote
                      style={{
                        borderLeft: `3px solid ${theme.colors.border}`,
                        paddingLeft: "12px",
                        margin: "8px 0",
                        fontStyle: "italic",
                        color: theme.colors.textSecondary,
                      }}>
                      {children}
                    </blockquote>
                  ),
                  // Table components for GitHub Flavored Markdown
                  table: ({ children }) => (
                    <div style={{ overflowX: "auto", margin: "12px 0" }}>
                      <table
                        style={{
                          borderCollapse: "collapse",
                          width: "100%",
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: "6px",
                          fontSize: "13px",
                        }}>
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead
                      style={{
                        backgroundColor: theme.colors.surface,
                      }}>
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => <tbody>{children}</tbody>,
                  tr: ({ children }) => (
                    <tr
                      style={{
                        borderBottom: `1px solid ${theme.colors.border}`,
                      }}>
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: theme.colors.text,
                        borderRight: `1px solid ${theme.colors.border}`,
                      }}>
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td
                      style={{
                        padding: "8px 12px",
                        color: theme.colors.text,
                        borderRight: `1px solid ${theme.colors.border}`,
                      }}>
                      {children}
                    </td>
                  ),
                }}>
                {message.content}
              </ReactMarkdown>
            )}
          </div>

          {/* Query plan section (for assistant messages) */}
          {isAssistant && message.query_plan && showQueryPlan && (
            <div
              style={{
                marginTop: "12px",
                borderTop: `1px solid ${theme.colors.border}40`,
                paddingTop: "12px",
              }}>
              <button
                onClick={handleToggleQueryPlan}
                style={{
                  background: "none",
                  border: "none",
                  color: theme.colors.textSecondary,
                  cursor: "pointer",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "0",
                  marginBottom: isQueryPlanExpanded ? "8px" : "0",
                }}
                aria-expanded={isQueryPlanExpanded}>
                <span>{isQueryPlanExpanded ? "▼" : "▶"}</span>
                Query Plan
                {message.query_plan.execution_time && (
                  <span style={{ opacity: 0.7 }}>({message.query_plan.execution_time}ms)</span>
                )}
              </button>

              {isQueryPlanExpanded && (
                <div
                  className={CSS_CLASSES.QUERY_PLAN}
                  style={{
                    backgroundColor: `${theme.colors.background}80`,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: "4px",
                    padding: "8px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}>
                  <div style={{ marginBottom: "4px", fontWeight: 600 }}>Query:</div>
                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      color: theme.colors.textSecondary,
                    }}>
                    {message.query_plan.query}
                  </div>
                  {message.query_plan.result_count !== undefined && (
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "11px",
                        color: theme.colors.textSecondary,
                      }}>
                      Results: {message.query_plan.result_count}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Code blocks section (for assistant messages) */}
          {isAssistant && message.code_blocks && Object.keys(message.code_blocks).length > 0 && showQueryPlan && (
            <div
              style={{
                marginTop: "12px",
                borderTop: `1px solid ${theme.colors.border}40`,
                paddingTop: "12px",
              }}>
              {Object.values(message.code_blocks).map((codeBlock) => (
                <div
                  key={codeBlock.id}
                  style={{
                    marginBottom: "8px",
                  }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: theme.colors.textSecondary,
                      marginBottom: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}>
                    <span>Query Plan</span>
                    {codeBlock.streaming && (
                      <span
                        style={{
                          display: "inline-block",
                          width: "6px",
                          height: "6px",
                          backgroundColor: theme.colors.primary,
                          borderRadius: "50%",
                          animation: "pulse 1.5s ease-in-out infinite",
                        }}
                      />
                    )}
                  </div>
                  <div style={{ position: "relative" }}>
                    <div
                      className={CSS_CLASSES.QUERY_PLAN}
                      style={{
                        backgroundColor: `${theme.colors.background}80`,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: "4px",
                        padding: "12px",
                        paddingRight: "50px", // Make room for copy button
                        fontSize: "13px",
                        lineHeight: "1.5",
                        color: theme.colors.text,
                        maxHeight: "300px",
                        overflowY: "auto",
                      }}>
                      {formatQueryPlanContent(codeBlock.content)}
                    </div>
                    <CopyButton text={codeBlock.content} theme={theme} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div
        style={{
          fontSize: "11px",
          color: theme.colors.textSecondary,
          marginTop: "4px",
          marginLeft: isUser ? "0" : isAssistant && assistantAvatar ? "40px" : "8px",
          marginRight: isUser ? "8px" : "0",
        }}>
        {formatTimestamp(message.timestamp)}
      </div>
    </div>
  );
};

export default MessageItem;
