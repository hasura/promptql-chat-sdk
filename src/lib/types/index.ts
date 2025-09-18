// PromptQL API Types
export interface DDNHeaders {
  [key: string]: string;
}

export interface StartThreadRequest {
  user_message: string;
  ddn_headers: DDNHeaders;
  timezone: string;
}

export interface ContinueThreadRequest {
  user_message: string;
  ddn_headers: DDNHeaders;
  timezone: string;
}

export interface ThreadResponse {
  thread_id: string;
}

// SSE Event Types
export interface SSEEvent {
  event: string;
  data: string;
  id?: string;
}

export interface AssistantActionMessageAppendedEvent {
  event: "assistant_action_message_appended";
  type: "assistant_action_message_appended";
  version: "v1";
  created_at: string;
  assistant_action_id: string;
  message_chunk: string;
}

export interface CodeBlockQueryPlanAppendedEvent {
  event: "code_block_query_plan_appended";
  type: "code_block_query_plan_appended";
  version: "v1";
  created_at: string;
  assistant_action_id: string;
  code_block_id: string;
  query_plan_chunk: string;
}

export interface CurrentThreadStateEvent {
  event: "current-thread-state";
  type: "current-thread-state";
  version: "v1";
  created_at: string;
  thread: Thread;
}

export interface InteractionUpdateEvent {
  event: "interaction-update";
  type: "interaction-update";
  version: "v1";
  created_at: string;
  interaction: Interaction;
}

export interface CurrentThreadStateEvent {
  event: "current-thread-state";
  data: {
    thread_id: string;
    interactions: Interaction[];
  };
}

export interface InteractionUpdateEvent {
  event: "interaction-update";
  data: {
    interaction_id: string;
    status: "processing" | "completed" | "error";
    messages?: AssistantMessage[];
  };
}

export interface AssistantActionMessageAppendedEvent {
  event: "assistant_action_message_appended";
  data: {
    interaction_id: string;
    message_chunk: string;
    message_id: string;
  };
}

// Message Types
export interface UserMessage {
  id: string;
  type: "user";
  content: string;
  timestamp: Date;
}

export interface AssistantMessage {
  id: string;
  type: "assistant";
  content: string;
  timestamp: Date;
  query_plan?: QueryPlan;
  code_blocks?: Record<string, CodeBlock>;
  streaming?: boolean;
}

export interface QueryPlan {
  id: string;
  query: string;
  execution_time?: number;
  result_count?: number;
}

export interface CodeBlock {
  id: string;
  content: string;
  streaming?: boolean;
}

export type Message = UserMessage | AssistantMessage;

// Interaction Types
export interface Interaction {
  id: string;
  user_message: UserMessage;
  assistant_messages: AssistantMessage[];
  status: "processing" | "completed" | "error";
  created_at: Date;
}

// Thread Types
export interface Thread {
  id: string;
  interactions: Interaction[];
  created_at: Date;
  updated_at: Date;
}

// Component Props Types
export interface PromptQLChatProps {
  /** PromptQL API endpoint URL (should point to your secure proxy server) */
  endpoint: string;

  /** Theme mode override - 'light', 'dark', or 'auto' (default: 'auto' uses system preference) */
  themeMode?: 'light' | 'dark' | 'auto';
  /** Primary color for theming */
  primaryColor?: string;
  /** Background color for theming */
  backgroundColor?: string;
  /** Text color for theming */
  textColor?: string;
  /** Custom title for the chat modal */
  title?: string;
  /** Custom welcome message for empty chat state */
  welcomeMessage?: string;
  /** Custom help text for empty chat state */
  helpText?: string;
  /** Custom icon for the floating action button */
  icon?: React.ReactNode;
  /** Custom avatar for assistant messages */
  assistantAvatar?: React.ReactNode;
  /** Whether to show query plans */
  showQueryPlans?: boolean;
  /** Whether to enable real-time updates */
  enableRealTime?: boolean;
  /** Prism theme for syntax highlighting in light mode */
  prismThemeLight?: PrismTheme;
  /** Prism theme for syntax highlighting in dark mode */
  prismThemeDark?: PrismTheme;
  /** @deprecated Use prismThemeLight and prismThemeDark instead */
  prismTheme?: PrismTheme;
  /** Custom text for the typing indicator during code execution */
  codeExecutionIndicatorText?: string;
  /** Callback fired when a new thread starts */
  onThreadStart?: (threadId: string) => void;
  /** Callback fired when an error occurs */
  onError?: (error: Error) => void;
  /** Custom CSS class name */
  className?: string;
}

// Component prop types for Milestone 3 component library usage
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
}

// Chat Interface Component Props (Phase 5)
export interface ChatInterfaceProps {
  /** Current messages in the conversation */
  messages: Message[];
  /** Whether a message is currently being sent */
  isLoading: boolean;
  /** Whether code execution is currently happening */
  isCodeExecuting: boolean;
  /** Current SSE connection state */
  connectionState: ConnectionState;
  /** Whether to show query plans */
  showQueryPlans: boolean;
  /** Theme object for styling */
  theme: Theme;
  /** Prism theme for syntax highlighting in light mode */
  prismThemeLight?: PrismTheme;
  /** Prism theme for syntax highlighting in dark mode */
  prismThemeDark?: PrismTheme;
  /** @deprecated Use prismThemeLight and prismThemeDark instead */
  prismTheme?: PrismTheme;
  /** Custom text for the typing indicator during code execution */
  codeExecutionIndicatorText?: string;
  /** Custom welcome message for empty chat state */
  welcomeMessage?: string;
  /** Custom help text for empty chat state */
  helpText?: string;
  /** Custom avatar for assistant messages */
  assistantAvatar?: React.ReactNode;
  /** Callback fired when a message is sent */
  onSendMessage: (message: string) => void;
  /** Callback fired when message sending is cancelled */
  onCancelMessage: () => void;
  /** Custom CSS class name */
  className?: string;
  /** Error state */
  error: PromptQLError | null;
  /** Callback fired when error is cleared */
  onClearError?: () => void;
}

export interface MessageListProps {
  /** Messages to display */
  messages: Message[];
  /** Whether code execution is currently happening */
  isCodeExecuting: boolean;
  /** Whether to show query plans */
  showQueryPlans: boolean;
  /** Theme object for styling */
  theme: Theme;
  /** Prism theme for syntax highlighting in light mode */
  prismThemeLight?: PrismTheme;
  /** Prism theme for syntax highlighting in dark mode */
  prismThemeDark?: PrismTheme;
  /** @deprecated Use prismThemeLight and prismThemeDark instead */
  prismTheme?: PrismTheme;
  /** Custom text for the typing indicator during code execution */
  codeExecutionIndicatorText?: string;
  /** Custom welcome message for empty chat state */
  welcomeMessage?: string;
  /** Custom help text for empty chat state */
  helpText?: string;
  /** Custom avatar for assistant messages */
  assistantAvatar?: React.ReactNode;
  /** Custom CSS class name */
  className?: string;
  /** Callback fired when query plan visibility is toggled for a message */
  onToggleQueryPlan?: (messageId: string) => void;
}

export interface MessageItemProps {
  /** Message to display */
  message: Message;
  /** Whether to show query plan (if available) */
  showQueryPlan: boolean;
  /** Theme object for styling */
  theme: Theme;
  /** Prism theme for syntax highlighting in light mode */
  prismThemeLight?: PrismTheme;
  /** Prism theme for syntax highlighting in dark mode */
  prismThemeDark?: PrismTheme;
  /** @deprecated Use prismThemeLight and prismThemeDark instead */
  prismTheme?: PrismTheme;
  /** Custom avatar for assistant messages */
  assistantAvatar?: React.ReactNode;
  /** Custom CSS class name */
  className?: string;
  /** Callback fired when query plan visibility is toggled */
  onToggleQueryPlan?: () => void;
}

export interface ChatInputProps {
  /** Whether input is disabled (e.g., during message sending) */
  disabled: boolean;
  /** Whether a message is currently being sent */
  isLoading: boolean;
  /** Whether code execution is currently happening */
  isCodeExecuting: boolean;
  /** Theme object for styling */
  theme: Theme;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Custom CSS class name */
  className?: string;
  /** Callback fired when a message is sent */
  onSendMessage: (message: string) => void;
  /** Callback fired when message sending is cancelled */
  onCancelMessage: () => void;
}

export interface ConnectionIndicatorProps {
  /** Current connection state */
  connectionState: ConnectionState;
  /** Theme object for styling */
  theme: Theme;
  /** Whether to show detailed status text */
  showStatusText?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Error details if connection is in error state */
  error?: Error | null;
}

// Prism Theme Types
export type PrismTheme =
  | "prism"
  | "dark"
  | "funky"
  | "okaidia"
  | "coy"
  | "tomorrow"
  | "twilight"
  | "vs"
  | "vs-dark"
  | "vsc-dark-plus"
  | "one-light"
  | "one-dark"
  | "night-owl"
  | "material-light"
  | "material-dark"
  | "dracula"
  | "nord"
  | "gruvbox-light"
  | "gruvbox-dark"
  | "atom-dark";

// Theme Types
export interface Theme {
  mode: "light" | "dark";
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
  };
}

// Connection States
export type ConnectionState = "disconnected" | "connecting" | "connected" | "error" | "reconnecting";

// Error Types
export interface PromptQLError extends Error {
  code?: string;
  status?: number;
  threadId?: string;
  cause?: Error;
}

// Hook Return Types
export interface UsePromptQLAPIReturn {
  startThread: (message: string) => Promise<string>;
  continueThread: (threadId: string, message: string) => Promise<void>;
  cancelThread: (threadId: string) => Promise<void>;
  getThread: (threadId: string) => Promise<Thread>;
  isLoading: boolean;
  error: PromptQLError | null;
  clearError: () => void;
}

export interface UseSSEConnectionReturn {
  connectionState: ConnectionState;
  connect: (threadId: string) => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
  error: Error | null;
  lastEvent: any | null;
}

export interface SSEEventCallback {
  (event: any): void;
}

export interface UseThreadPersistenceReturn {
  currentThreadId: string | null;
  setCurrentThreadId: (threadId: string | null) => void;
  getStoredThread: () => Promise<Thread | null>;
  clearStoredThread: () => void;
}

/**
 * Modal state for persistence
 */
export type ModalState = "closed" | "open" | "fullscreen";

/**
 * Return type for the useModalPersistence hook
 */
export interface UseModalPersistenceReturn {
  /** Current modal state */
  modalState: ModalState;
  /** Whether the modal is open (open or fullscreen) */
  isModalOpen: boolean;
  /** Whether the modal is in fullscreen mode */
  isFullscreen: boolean;
  /** Set the modal state */
  setModalState: (state: ModalState) => void;
  /** Toggle between closed and open states */
  toggleModal: () => void;
  /** Close the modal */
  closeModal: () => void;
  /** Toggle fullscreen mode (only when modal is open) */
  toggleFullscreen: () => void;
}

export interface UseThemeDetectionReturn {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

// Internal State Types
export interface ChatState {
  isOpen: boolean;
  currentThread: Thread | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  connectionState: ConnectionState;
  error: PromptQLError | null;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredProps<T, K extends keyof T> = T & Required<Pick<T, K>>;
