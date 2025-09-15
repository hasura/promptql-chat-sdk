import * as React from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import type { Theme } from "../../types";
import { CSS_CLASSES, Z_INDEX, ANIMATION_DURATION } from "../../utils/constants";
import { getThemeAwareFallbacks } from "../../utils";

export interface ChatFABProps {
  /** Whether the chat modal is currently open */
  isOpen: boolean;
  /** Callback fired when the FAB is clicked */
  onClick: () => void;
  /** Theme object for styling */
  theme: Theme;
  /** Custom CSS class name */
  className?: string;
  /** Whether the FAB is disabled */
  disabled?: boolean;
  /** Custom icon to display (defaults to chat icon) */
  icon?: React.ReactNode;
  /** Accessibility label */
  ariaLabel?: string;
}

/**
 * ChatFAB - Floating Action Button component
 *
 * A fixed bottom-right positioned button that opens the chat modal.
 * Features hover states, accessibility support, and responsive behavior.
 */
export const ChatFAB: React.FC<ChatFABProps> = ({
  isOpen,
  onClick,
  theme,
  className,
  disabled = false,
  icon,
  ariaLabel = "Open chat",
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get theme-aware fallback colors for when theme prop is unavailable
  const fallbackColors = getThemeAwareFallbacks();

  // Handle keyboard interactions
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsPressed(true);
    }
  }, []);

  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setIsPressed(false);
        if (!disabled) {
          onClick();
        }
      }
    },
    [disabled, onClick]
  );

  // Handle mouse interactions
  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled) {
      onClick();
    }
  }, [disabled, onClick]);

  // Apply theme to CSS custom properties
  useEffect(() => {
    if (buttonRef.current && theme?.colors) {
      const element = buttonRef.current;
      element.style.setProperty("--fab-primary", theme.colors.primary);
      element.style.setProperty("--fab-surface", theme.colors.surface);
      element.style.setProperty("--fab-text", theme.colors.text);
      element.style.setProperty("--fab-border", theme.colors.border);
    }
  }, [theme]);

  // Calculate dynamic styles
  const getTransform = () => {
    if (isPressed) return "scale(0.95)";
    if (isHovered || isFocused) return "scale(1.05)";
    return "scale(1)";
  };

  const getShadow = () => {
    if (disabled) return "0 2px 8px rgba(0, 0, 0, 0.1)";
    if (isPressed) return "0 2px 8px rgba(0, 0, 0, 0.2)";
    if (isHovered || isFocused) return "0 8px 24px rgba(0, 0, 0, 0.25)";
    return "0 4px 12px rgba(0, 0, 0, 0.15)";
  };

  const getBackgroundColor = () => {
    if (!theme?.colors) return fallbackColors.border; // theme-aware fallback
    if (disabled) return theme.colors.border;
    if (isOpen) return theme.colors.surface;
    return theme.colors.primary;
  };

  const getTextColor = () => {
    if (!theme?.colors) return fallbackColors.textSecondary; // theme-aware fallback
    if (disabled) return theme.colors.textSecondary;
    if (isOpen) return theme.colors.text;
    return "#ffffff"; // White text on primary color is always appropriate
  };

  // Default chat icon - testing with much thicker stroke and explicit white color
  const defaultIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ minWidth: "28px", minHeight: "28px" }}
      aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );

  return (
    <button
      ref={buttonRef}
      className={`${CSS_CLASSES.FAB} ${className || ""}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        setIsPressed(false);
      }}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      type="button"
      role="button"
      style={{
        // Base positioning and layout
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        zIndex: Z_INDEX.FAB,

        // Visual styling
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        boxShadow: getShadow(),
        transform: getTransform(),

        // Transitions
        transition: `all ${ANIMATION_DURATION.NORMAL}ms cubic-bezier(0.4, 0, 0.2, 1)`,

        // Layout
        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        // Typography
        fontSize: "24px",
        fontFamily: "inherit",

        // Accessibility
        outline: "none",

        // Focus styles
        ...(isFocused && {
          boxShadow: `${getShadow()}, 0 0 0 3px ${theme.colors.primary}40`,
        }),

        // Note: Responsive adjustments would need to be handled via CSS classes
        // since inline styles don't support media queries
      }}>
      {icon || defaultIcon}
    </button>
  );
};

export default ChatFAB;
