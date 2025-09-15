import { useState, useCallback, useEffect } from "react";
import { usePromptQLAPI } from "./usePromptQLAPI";
import { useSSEConnection } from "./useSSEConnection";
import { useThreadPersistence } from "./useThreadPersistence";
import { useModalPersistence } from "./useModalPersistence";
import { useThemeDetection } from "./useThemeDetection";
import { mergeThemeColors, getDefaultTheme, applyThemeToElement, convertThreadToMessages } from "../utils";
import type { Message, Theme, ConnectionState, PromptQLError } from "../types";

/**
 * Configuration for the headless usePromptQLChat hook
 */
export interface UsePromptQLChatConfig {
  endpoint: string; // Should point to your secure proxy server
  ddnToken?: string;
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  codeExecutionIndicatorText?: string;
  onThreadStart?: (threadId: string) => void;
  onError?: (error: PromptQLError) => void;
}

/**
 * Return type for the usePromptQLChat hook
 */
export interface UsePromptQLChatReturn {
  // Modal state
  isModalOpen: boolean;
  isFullscreen: boolean;
  toggleModal: () => void;
  closeModal: () => void;
  toggleFullscreen: () => void;

  // Chat state
  messages: Message[];
  isLoading: boolean;
  isCodeExecuting: boolean;
  connectionState: ConnectionState;
  currentThreadId: string | null;

  // Actions
  sendMessage: (message: string) => Promise<void>;
  cancelMessage: () => Promise<void>;
  startNewThread: () => void;

  // Theme
  theme: Theme;
  isDarkMode: boolean;

  // Error state
  error: PromptQLError | null;
  clearError: () => void;
}

/**
 * Headless hook that provides complete PromptQL Chat functionality
 * without any UI components. Perfect for building completely custom interfaces.
 *
 * @example
 * ```tsx
 * function MyCustomChat() {
 *   const {
 *     isModalOpen,
 *     toggleModal,
 *     messages,
 *     sendMessage,
 *     theme,
 *     connectionState
 *   } = usePromptQLChat({
 *     endpoint: "https://api.promptql.com",
 *     projectId: "my-project"
 *   });
 *
 *   return (
 *     <div>
 *       <button onClick={toggleModal}>
 *         Chat ({connectionState})
 *       </button>
 *       {isModalOpen && (
 *         <MyCustomModal>
 *           <MyMessageList messages={messages} />
 *           <MyInput onSend={sendMessage} />
 *         </MyCustomModal>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePromptQLChat(config: UsePromptQLChatConfig): UsePromptQLChatReturn {
  const { endpoint, ddnToken, primaryColor, backgroundColor, textColor, onThreadStart, onError } = config;

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeExecuting, setIsCodeExecuting] = useState(false);
  const [error, setError] = useState<PromptQLError | null>(null);

  // Handle SSE events callback
  const handleSSEEvent = useCallback((eventData: any) => {
    const event = eventData.event || eventData;
    const eventType = event.type || event.event;

    switch (eventType) {
      case "assistant_action_message_appended":
        // Handle streaming message chunks
        if (event.message_chunk) {
          setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];

            // Check if we should append to the last message or create a new one
            const shouldCreateNewMessage =
              !lastMessage ||
              lastMessage.type !== "assistant" ||
              // If the last message has code blocks/query plans, create a new message
              (lastMessage.code_blocks && Object.keys(lastMessage.code_blocks).length > 0) ||
              lastMessage.query_plan;

            if (shouldCreateNewMessage) {
              // Create a new assistant message
              const newMessage: Message = {
                id: event.assistant_action_id || `msg-${Date.now()}`,
                type: "assistant",
                content: event.message_chunk,
                timestamp: new Date(eventData.created_at || Date.now()),
              };
              return [...prevMessages, newMessage];
            } else {
              // Append to the existing message
              return [
                ...prevMessages.slice(0, -1),
                {
                  ...lastMessage,
                  content: lastMessage.content + event.message_chunk,
                },
              ];
            }
          });
        }
        break;

      case "code_block_query_plan_appended":
        // This indicates code execution is happening
        setIsCodeExecuting(true);
        break;

      default:
        // Other events are handled by the main component
        break;
    }
  }, []);

  // Initialize hooks
  const themeDetection = useThemeDetection();
  const threadPersistence = useThreadPersistence("promptql-chat");
  const modalPersistence = useModalPersistence("promptql-chat");
  const api = usePromptQLAPI(endpoint, ddnToken);
  const sseConnection = useSSEConnection(endpoint, handleSSEEvent);

  // Create merged theme
  const theme = mergeThemeColors(getDefaultTheme(themeDetection.isDark ? "dark" : "light"), {
    primaryColor,
    backgroundColor,
    textColor,
  });

  // Apply theme to document root
  useEffect(() => {
    const rootElement = document.querySelector(":root") as HTMLElement;
    if (rootElement) {
      applyThemeToElement(rootElement, theme);
    }
  }, [theme]);

  // Restore thread content on component mount if thread ID exists in localStorage
  useEffect(() => {
    const restoreThread = async () => {
      const threadId = threadPersistence.currentThreadId;

      if (!threadId || messages.length > 0) {
        // No thread ID or messages already loaded, skip restoration
        return;
      }

      try {
        const thread = await api.getThread(threadId);
        const restoredMessages = convertThreadToMessages(thread);

        if (restoredMessages.length > 0) {
          setMessages(restoredMessages);
        }
      } catch (err) {
        console.warn("Failed to restore thread:", err);
        // Clear invalid thread ID from localStorage
        threadPersistence.clearStoredThread();
      }
    };

    restoreThread();
  }, [threadPersistence.currentThreadId, api, messages.length, threadPersistence]);

  // Modal actions
  const toggleModal = useCallback(() => {
    modalPersistence.toggleModal();
  }, [modalPersistence]);

  const closeModal = useCallback(() => {
    modalPersistence.closeModal();
  }, [modalPersistence]);

  const toggleFullscreen = useCallback(() => {
    modalPersistence.toggleFullscreen();
  }, [modalPersistence]);

  // Chat actions
  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        // Add user message to the conversation immediately
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          type: "user",
          content: message.trim(),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);

        let threadId = threadPersistence.currentThreadId;

        if (!threadId) {
          // Start new thread
          const response = await api.startThread(message);
          threadId = response; // startThread returns the thread ID directly
          threadPersistence.setCurrentThreadId(threadId);
          onThreadStart?.(threadId);
        } else {
          // Continue existing thread
          await api.continueThread(threadId, message);
        }

        // Connect to SSE for real-time updates
        if (threadId) {
          sseConnection.connect(threadId);
        }
      } catch (err) {
        const promptQLError = err as PromptQLError;
        setError(promptQLError);
        onError?.(promptQLError);
      } finally {
        setIsLoading(false);
      }
    },
    [api, threadPersistence, sseConnection, onThreadStart, onError]
  );

  const cancelMessage = useCallback(async () => {
    const threadId = threadPersistence.currentThreadId;
    if (!threadId) return;

    try {
      await api.cancelThread(threadId);
      sseConnection.disconnect();
      setIsLoading(false);
    } catch (err) {
      const promptQLError = err as PromptQLError;
      setError(promptQLError);
      onError?.(promptQLError);
    }
  }, [api, threadPersistence, sseConnection, onError]);

  const startNewThread = useCallback(() => {
    threadPersistence.clearStoredThread();
    threadPersistence.setCurrentThreadId(null);
    sseConnection.disconnect();
    setMessages([]);
    setError(null);
  }, [threadPersistence, sseConnection]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Handle SSE connection state changes
  useEffect(() => {
    // Reset code execution state when SSE disconnects
    if (sseConnection.connectionState === "disconnected" && isCodeExecuting) {
      setIsCodeExecuting(false);
    }

    console.log("SSE connection state:", sseConnection.connectionState);
  }, [sseConnection.connectionState, isCodeExecuting]);

  return {
    // Modal state
    isModalOpen: modalPersistence.isModalOpen,
    isFullscreen: modalPersistence.isFullscreen,
    toggleModal,
    closeModal,
    toggleFullscreen,

    // Chat state
    messages,
    isLoading,
    isCodeExecuting,
    connectionState: sseConnection.connectionState,
    currentThreadId: threadPersistence.currentThreadId,

    // Actions
    sendMessage,
    cancelMessage,
    startNewThread,

    // Theme
    theme,
    isDarkMode: themeDetection.isDark,

    // Error state
    error,
    clearError,
  };
}
