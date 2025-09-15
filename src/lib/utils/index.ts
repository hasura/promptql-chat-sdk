import type { Theme, PromptQLError, Thread, Message, PrismTheme } from "../types";

/**
 * Generate a unique ID for messages and interactions
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get the user's timezone
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/**
 * Create a storage key for thread persistence
 */
export function createStorageKey(projectId: string): string {
  return `promptql-thread-${projectId}`;
}

/**
 * Parse SSE event data
 */
export function parseSSEData<T = any>(data: string): T | null {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Create a PromptQL error with additional context
 */
export function createPromptQLError(
  message: string,
  options?: {
    code?: string;
    status?: number;
    threadId?: string;
    cause?: Error;
  }
): PromptQLError {
  const error = new Error(message) as PromptQLError;
  error.name = "PromptQLError";

  if (options?.code) error.code = options.code;
  if (options?.status) error.status = options.status;
  if (options?.threadId) error.threadId = options.threadId;
  if (options?.cause) error.cause = options.cause;

  return error;
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: Error): boolean {
  return (
    error.name === "NetworkError" ||
    error.message.includes("fetch") ||
    error.message.includes("network") ||
    error.message.includes("connection")
  );
}

/**
 * Get default theme colors
 */
export function getDefaultTheme(mode: "light" | "dark"): Theme {
  if (mode === "dark") {
    return {
      mode: "dark",
      colors: {
        primary: "#3b82f6",
        background: "#1f2937",
        surface: "#374151",
        text: "#f9fafb",
        textSecondary: "#d1d5db",
        border: "#4b5563",
        error: "#ef4444",
        success: "#10b981",
      },
    };
  }

  return {
    mode: "light",
    colors: {
      primary: "#3b82f6",
      background: "#ffffff",
      surface: "#f9fafb",
      text: "#111827",
      textSecondary: "#6b7280",
      border: "#e5e7eb",
      error: "#ef4444",
      success: "#10b981",
    },
  };
}

/**
 * Apply theme colors to CSS custom properties
 */
export function applyThemeToElement(element: HTMLElement, theme: Theme): void {
  const { colors } = theme;

  element.style.setProperty("--promptql-primary", colors.primary);
  element.style.setProperty("--promptql-background", colors.background);
  element.style.setProperty("--promptql-surface", colors.surface);
  element.style.setProperty("--promptql-text", colors.text);
  element.style.setProperty("--promptql-text-secondary", colors.textSecondary);
  element.style.setProperty("--promptql-border", colors.border);
  element.style.setProperty("--promptql-error", colors.error);
  element.style.setProperty("--promptql-success", colors.success);
}

/**
 * Merge custom colors with default theme
 * If backgroundColor or textColor are not provided, they will use theme-appropriate defaults
 */
export function mergeThemeColors(
  baseTheme: Theme,
  customColors?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  }
): Theme {
  if (!customColors) return baseTheme;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...(customColors.primaryColor && { primary: customColors.primaryColor }),
      // Only override backgroundColor if explicitly provided
      ...(customColors.backgroundColor && { background: customColors.backgroundColor }),
      // Only override textColor if explicitly provided
      ...(customColors.textColor && { text: customColors.textColor }),
    },
  };
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Exponential backoff delay calculation
 */
export function calculateBackoffDelay(attempt: number, baseDelay = 1000, maxDelay = 30000): number {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

/**
 * Validate thread ID format
 */
export function isValidThreadId(threadId: string): boolean {
  // UUID format validation (more permissive to handle different UUID versions)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(threadId);
}

/**
 * Sanitize user input for safety
 */
export function sanitizeUserInput(input: string): string {
  return input.trim().slice(0, 10000); // Limit length and trim whitespace
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

/**
 * Check if the browser supports EventSource
 */
export function supportsEventSource(): boolean {
  return typeof EventSource !== "undefined";
}

/**
 * Get theme-aware fallback colors based on system preference
 * Used when theme prop is unavailable but we need sensible defaults
 */
export function getThemeAwareFallbacks(): Theme["colors"] {
  // Detect system theme preference
  const prefersDark =
    typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

  return prefersDark ? getDefaultTheme("dark").colors : getDefaultTheme("light").colors;
}

/**
 * Get the appropriate Prism theme based on the current theme mode
 */
export function getPrismTheme(
  theme: Theme,
  prismThemeLight?: PrismTheme,
  prismThemeDark?: PrismTheme,
  legacyPrismTheme?: PrismTheme
): PrismTheme {
  // If legacy prismTheme is provided, use it for backward compatibility
  if (legacyPrismTheme) {
    return legacyPrismTheme;
  }

  // Use theme-specific Prism themes
  if (theme.mode === "dark") {
    return prismThemeDark || "dark";
  } else {
    return prismThemeLight || "prism";
  }
}

/**
 * Convert Thread data to Message array for chat interface
 * Transforms Thread.interactions into the Message[] format expected by the chat interface
 */
export function convertThreadToMessages(thread: Thread): Message[] {
  const messages: Message[] = [];

  // Sort interactions by creation date to maintain chronological order
  const sortedInteractions = [...thread.interactions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  for (const interaction of sortedInteractions) {
    // Handle both API format and internal TypeScript format
    const apiInteraction = interaction as any;

    // Add user message - handle both formats
    if (interaction.user_message) {
      const userMessage: Message = {
        id: interaction.user_message.id || generateId(),
        type: "user",
        // Handle both API format (message) and internal format (content)
        content: interaction.user_message.content || apiInteraction.user_message?.message,
        timestamp: new Date(interaction.user_message.timestamp),
      };
      messages.push(userMessage);
    }

    // Add assistant messages - handle both formats
    // Internal format: assistant_messages array
    if (interaction.assistant_messages && Array.isArray(interaction.assistant_messages)) {
      for (const assistantMessage of interaction.assistant_messages) {
        const message: Message = {
          id: assistantMessage.id || generateId(),
          type: "assistant",
          content: assistantMessage.content,
          timestamp: new Date(assistantMessage.timestamp),
          streaming: assistantMessage.streaming || false,
        };
        messages.push(message);
      }
    }
    // API format: assistant_actions array
    else if (apiInteraction.assistant_actions && Array.isArray(apiInteraction.assistant_actions)) {
      for (const assistantAction of apiInteraction.assistant_actions) {
        if (assistantAction.message && assistantAction.status === "completed") {
          const assistantMessage: Message = {
            id: assistantAction.action_id || generateId(),
            type: "assistant",
            content: assistantAction.message,
            timestamp: new Date(assistantAction.created_timestamp || apiInteraction.completion_timestamp),
            streaming: false,
          };
          messages.push(assistantMessage);
        }
      }
    }
  }

  return messages;
}
