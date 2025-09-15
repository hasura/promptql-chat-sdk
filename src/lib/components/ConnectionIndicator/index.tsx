import * as React from "react";
import type { ConnectionIndicatorProps, ConnectionState } from "../../types";
import { CSS_CLASSES } from "../../utils/constants";

/**
 * ConnectionIndicator - Status display component
 *
 * Shows API connection state (connected, disconnected, reconnecting, error),
 * provides visual cues for different connection states and accessibility support.
 */
export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  connectionState,
  theme,
  showStatusText = false,
  className,
  error,
}) => {
  // Get connection state display properties
  const getConnectionDisplay = (state: ConnectionState) => {
    switch (state) {
      case "connected":
        return {
          color: theme.colors.success,
          icon: "●",
          text: "Connected",
          description: "API is healthy and ready",
        };
      case "connecting":
        return {
          color: theme.colors.primary,
          icon: "◐",
          text: "Checking",
          description: "Checking API health...",
        };
      case "reconnecting":
        return {
          color: theme.colors.primary,
          icon: "◑",
          text: "Reconnecting",
          description: "Attempting to reconnect...",
        };
      case "error":
        return {
          color: theme.colors.error,
          icon: "●",
          text: "Unavailable",
          description: error?.message || "API health check failed",
        };
      case "disconnected":
      default:
        return {
          color: theme.colors.text,
          icon: "○",
          text: "Disconnected",
          description: "API health status unknown",
        };
    }
  };

  const display = getConnectionDisplay(connectionState);
  const isAnimated = connectionState === "connecting" || connectionState === "reconnecting";

  return (
    <div
      className={`${CSS_CLASSES.CONNECTION_INDICATOR} ${className || ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        cursor: "default",
      }}
      role="status"
      aria-label={`Connection status: ${display.text} - ${display.description}`}
      title={`${display.text}: ${display.description}`}>
      {/* Status indicator dot */}
      <div
        style={{
          fontSize: "10px",
          color: display.color,
          lineHeight: 1,
          animation: isAnimated ? "pulse 1.5s ease-in-out infinite" : "none",
          fontWeight: "bold",
        }}>
        {display.icon}
      </div>

      {/* Status text (optional) */}
      {showStatusText && (
        <span
          style={{
            fontSize: "12px",
            color: theme.colors.textSecondary,
            fontWeight: 500,
          }}>
          {display.text}
        </span>
      )}
    </div>
  );
};

export default ConnectionIndicator;
