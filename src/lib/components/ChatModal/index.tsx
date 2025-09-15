import * as React from "react";
import { useEffect, useCallback, useRef, useState } from "react";
import type { Theme, ConnectionState } from "../../types";
import { CSS_CLASSES, Z_INDEX, ANIMATION_DURATION, BREAKPOINTS } from "../../utils/constants";
import { getThemeAwareFallbacks } from "../../utils";
import ConnectionIndicator from "../ConnectionIndicator";

export interface ChatModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback fired when the modal should be closed */
  onClose: () => void;
  /** Theme object for styling */
  theme: Theme;
  /** Modal content */
  children: React.ReactNode;
  /** Custom CSS class name */
  className?: string;
  /** Whether to show fullscreen toggle button */
  showFullscreenToggle?: boolean;
  /** Whether the modal is in fullscreen mode */
  isFullscreen?: boolean;
  /** Callback fired when fullscreen mode is toggled */
  onToggleFullscreen?: () => void;
  /** Custom modal title */
  title?: string;
  /** Whether to show the new thread button */
  showNewThreadButton?: boolean;
  /** Callback fired when new thread button is clicked */
  onNewThread?: () => void;
  /** Connection state for the connection indicator */
  connectionState?: ConnectionState;
  /** Connection error for the connection indicator */
  connectionError?: Error | null;
}

/**
 * ChatModal - Modal overlay container component
 *
 * A modal dialog that overlays the page content with backdrop, escape key handling,
 * click-outside-to-close, focus management, and fullscreen toggle functionality.
 */
export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  theme,
  children,
  className,
  showFullscreenToggle = true,
  isFullscreen = false,
  onToggleFullscreen,
  title = "PromptQL Chat",
  showNewThreadButton = false,
  onNewThread,
  connectionState,
  connectionError,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Mobile detection hook
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= BREAKPOINTS.MOBILE);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Force fullscreen on mobile
  const effectiveIsFullscreen = isMobile || isFullscreen;
  const shouldShowFullscreenToggle = showFullscreenToggle && !isMobile;

  // Get theme-aware fallback colors for when theme prop is unavailable
  const fallbackColors = getThemeAwareFallbacks();

  // Handle escape key - use ref to avoid dependency issues
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  // Handle click outside modal
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === overlayRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus();
      }

      // Add escape key listener
      document.addEventListener("keydown", handleKeyDown);

      // Prevent body scroll
      document.body.style.overflow = "hidden";

      // Animation - start hidden, then show
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 50); // Short delay to prevent flash

      return () => {
        clearTimeout(timer);
        // Remove escape key listener
        document.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      // Restore focus to previous element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
        previousActiveElement.current = null;
      }

      // Restore body scroll
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  // Apply theme to CSS custom properties
  useEffect(() => {
    if (modalRef.current && theme?.colors) {
      const element = modalRef.current;
      element.style.setProperty("--modal-background", theme.colors.background);
      element.style.setProperty("--modal-surface", theme.colors.surface);
      element.style.setProperty("--modal-text", theme.colors.text);
      element.style.setProperty("--modal-border", theme.colors.border);
      element.style.setProperty("--modal-primary", theme.colors.primary);
    }
  }, [theme]);

  // Handle fullscreen toggle
  const handleToggleFullscreen = useCallback(() => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
    }
  }, [onToggleFullscreen]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  const getModalStyles = () => {
    const baseStyles = {
      backgroundColor: theme?.colors?.background || fallbackColors.background,
      border: `1px solid ${theme?.colors?.border || fallbackColors.border}`,
      borderRadius: effectiveIsFullscreen ? "0" : "12px",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      display: "flex",
      flexDirection: "column" as const,
      overflow: "hidden",
      transition: `all ${ANIMATION_DURATION.NORMAL}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      transform: isAnimating ? "scale(0.95) translateY(10px)" : "scale(1) translateY(0)",
      opacity: isAnimating ? 0 : 1,
    };

    if (effectiveIsFullscreen) {
      return {
        ...baseStyles,
        width: "100vw",
        height: "100vh",
        borderRadius: "0",
      };
    }

    // Responsive modal sizing - centered by the flex container with fixed height
    return {
      ...baseStyles,
      maxWidth: "1200px",
      width: "calc(100vw - 40px)",
      height: "calc(100vh - 40px)",
      maxHeight: "calc(100vh - 40px)",
    };
  };

  return (
    <div
      ref={overlayRef}
      className={`${CSS_CLASSES.MODAL_OVERLAY} ${className || ""}`}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: Z_INDEX.MODAL_OVERLAY,
        display: "flex",
        alignItems: effectiveIsFullscreen ? "stretch" : "center",
        justifyContent: effectiveIsFullscreen ? "stretch" : "center",
        padding: effectiveIsFullscreen ? 0 : "20px",
        transition: `opacity ${ANIMATION_DURATION.NORMAL}ms ease-in-out`,
        opacity: isAnimating ? 0 : 1,
      }}>
      <div
        ref={modalRef}
        className={CSS_CLASSES.MODAL}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        tabIndex={-1}
        style={getModalStyles()}
        onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: `1px solid ${theme?.colors?.border || fallbackColors.border}`,
            backgroundColor: theme?.colors?.surface || fallbackColors.surface,
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h2
              id="modal-title"
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 600,
                color: theme?.colors?.text || fallbackColors.text,
              }}>
              {title}
            </h2>
            {connectionState && (
              <ConnectionIndicator connectionState={connectionState} theme={theme} error={connectionError} />
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* New Thread Button */}
            {showNewThreadButton && (
              <button
                onClick={onNewThread}
                aria-label="Start new conversation"
                style={{
                  background: "none",
                  border: `1px solid ${theme?.colors?.border || fallbackColors.border}`,
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  color: theme?.colors?.text || fallbackColors.text,
                  fontSize: "12px",
                  fontWeight: 500,
                  transition: `all ${ANIMATION_DURATION.FAST}ms ease`,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme?.colors?.surface || fallbackColors.surface;
                  e.currentTarget.style.borderColor = theme?.colors?.primary || "#3b82f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = theme?.colors?.border || fallbackColors.border;
                }}>
                {/* Plus icon */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                New
              </button>
            )}

            {/* Fullscreen Toggle Button */}
            {shouldShowFullscreenToggle && (
              <button
                onClick={handleToggleFullscreen}
                aria-label={effectiveIsFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: "4px",
                  color: theme?.colors?.textSecondary || fallbackColors.textSecondary,
                  transition: `color ${ANIMATION_DURATION.FAST}ms ease`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme?.colors?.text || fallbackColors.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme?.colors?.textSecondary || fallbackColors.textSecondary;
                }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  {effectiveIsFullscreen ? (
                    <path
                      d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <path
                      d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close chat"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "4px",
                color: theme?.colors?.textSecondary || fallbackColors.textSecondary,
                transition: `color ${ANIMATION_DURATION.FAST}ms ease`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme?.colors?.text || fallbackColors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme?.colors?.textSecondary || fallbackColors.textSecondary;
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div
          id="modal-description"
          style={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            minHeight: 0, // Important: allows flex child to shrink below content size
          }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
