// Main component export (Simple SDK usage)
export { default as PromptQLChat } from "./components/PromptQLChat";

// Individual component exports (Component Library usage - Milestone 3)
export { default as ChatFAB } from "./components/ChatFAB";
export { default as ChatModal } from "./components/ChatModal";

// Chat Interface components (Phase 5)
export { default as ChatInterface } from "./components/ChatInterface";
export { default as MessageList } from "./components/MessageList";
export { default as MessageItem } from "./components/MessageItem";
export { default as ChatInput } from "./components/ChatInput";
export { default as ConnectionIndicator } from "./components/ConnectionIndicator";

// Type exports
export type {
  PromptQLChatProps,
  ChatFABProps,
  ChatModalProps,
  ChatInterfaceProps,
  MessageListProps,
  MessageItemProps,
  ChatInputProps,
  ConnectionIndicatorProps,
  Theme,
  Message,
  UserMessage,
  AssistantMessage,
  Thread,
  Interaction,
  QueryPlan,
  CodeBlock,
  PromptQLError,
  ConnectionState,
  DDNHeaders,
} from "./types";

// Hook exports
export { usePromptQLAPI, useSSEConnection, useThreadPersistence, useThemeDetection, useHealthCheck } from "./hooks";
export type { UseHealthCheckConfig, UseHealthCheckReturn } from "./hooks";

// Headless hook for component library usage (Milestone 3)
export { usePromptQLChat } from "./hooks";
export type { UsePromptQLChatConfig, UsePromptQLChatReturn } from "./hooks";

// Utility exports
export {
  generateId,
  getUserTimezone,
  createStorageKey,
  parseSSEData,
  createPromptQLError,
  isNetworkError,
  getDefaultTheme,
  applyThemeToElement,
  mergeThemeColors,
  debounce,
  calculateBackoffDelay,
  isValidThreadId,
  sanitizeUserInput,
  formatTimestamp,
  supportsEventSource,
} from "./utils";

// Constants exports
export {
  API_ENDPOINTS,
  SSE_EVENTS,
  CONNECTION_STATES,
  ERROR_CODES,
  DEFAULT_CONFIG,
  CSS_CLASSES,
  Z_INDEX,
  ANIMATION_DURATION,
  BREAKPOINTS,
  DEFAULT_COLORS,
  HTTP_STATUS,
  MEDIA_QUERIES,
} from "./utils/constants";
