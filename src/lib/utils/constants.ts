// API Endpoints
export const API_ENDPOINTS = {
  START_THREAD: "/playground/threads/v2/start",
  CONTINUE_THREAD: (threadId: string) => `/playground/threads/v2/${threadId}/continue`,
  CANCEL_THREAD: (threadId: string) => `/playground/threads/v2/${threadId}/cancel`,
  GET_THREAD: (threadId: string) => `/playground/threads/v2/${threadId}`,
  SSE_THREAD: (threadId: string) => `/playground/threads/v2/${threadId}`,
  HEALTH_CHECK: "/playground/healthz",
} as const;

// SSE Event Types
export const SSE_EVENTS = {
  CURRENT_THREAD_STATE: "current_thread_state",
  INTERACTION_UPDATE: "interaction_update",
  ASSISTANT_ACTION_MESSAGE_APPENDED: "assistant_action_message_appended",
  CODE_BLOCK_QUERY_PLAN_APPENDED: "code_block_query_plan_appended",
} as const;

// Connection States
export const CONNECTION_STATES = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  ERROR: "error",
  RECONNECTING: "reconnecting",
} as const;

// Error Codes
export const ERROR_CODES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  INVALID_THREAD: "INVALID_THREAD",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  SSE_CONNECTION_ERROR: "SSE_CONNECTION_ERROR",
} as const;

// Default Configuration
export const DEFAULT_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  MAX_RETRY_DELAY: 30000,
  SSE_TIMEOUT: 30000,
  MESSAGE_MAX_LENGTH: 10000,
  STORAGE_KEY_PREFIX: "promptql-thread-",
} as const;

// CSS Class Names
export const CSS_CLASSES = {
  ROOT: "promptql-chat",
  FAB: "promptql-chat__fab",
  MODAL: "promptql-chat__modal",
  MODAL_OVERLAY: "promptql-chat__modal-overlay",
  INTERFACE: "promptql-chat__interface",
  HEADER: "promptql-chat__header",
  MESSAGE_LIST: "promptql-chat__message-list",
  MESSAGE_ITEM: "promptql-chat__message-item",
  MESSAGE_USER: "promptql-chat__message--user",
  MESSAGE_ASSISTANT: "promptql-chat__message--assistant",
  INPUT: "promptql-chat__input",
  INPUT_FIELD: "promptql-chat__input-field",
  INPUT_BUTTON: "promptql-chat__input-button",
  CONNECTION_INDICATOR: "promptql-chat__connection-indicator",
  QUERY_PLAN: "promptql-chat__query-plan",
  ERROR: "promptql-chat__error",
  LOADING: "promptql-chat__loading",
} as const;

// Z-Index Values
export const Z_INDEX = {
  FAB: 1000,
  MODAL_OVERLAY: 1001,
  MODAL: 1002,
} as const;

// Animation Durations (in ms)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Breakpoints for responsive design
export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
} as const;

// Default Theme Colors
export const DEFAULT_COLORS = {
  LIGHT: {
    PRIMARY: "#3b82f6",
    BACKGROUND: "#ffffff",
    SURFACE: "#f9fafb",
    TEXT: "#111827",
    TEXT_SECONDARY: "#6b7280",
    BORDER: "#e5e7eb",
    ERROR: "#ef4444",
    SUCCESS: "#10b981",
  },
  DARK: {
    PRIMARY: "#3b82f6",
    BACKGROUND: "#1f2937",
    SURFACE: "#374151",
    TEXT: "#f9fafb",
    TEXT_SECONDARY: "#d1d5db",
    BORDER: "#4b5563",
    ERROR: "#ef4444",
    SUCCESS: "#10b981",
  },
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Media Queries
export const MEDIA_QUERIES = {
  MOBILE: `(max-width: ${BREAKPOINTS.MOBILE}px)`,
  TABLET: `(max-width: ${BREAKPOINTS.TABLET}px)`,
  DESKTOP: `(min-width: ${BREAKPOINTS.DESKTOP}px)`,
  PREFERS_DARK: "(prefers-color-scheme: dark)",
  PREFERS_REDUCED_MOTION: "(prefers-reduced-motion: reduce)",
} as const;
