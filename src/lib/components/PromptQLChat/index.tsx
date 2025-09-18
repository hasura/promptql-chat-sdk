import * as React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import type { PromptQLChatProps, Message } from "../../types";
import {
  useThemeDetection,
  useThreadPersistence,
  useModalPersistence,
  usePromptQLAPI,
  useSSEConnection,
  useHealthCheck,
} from "../../hooks";
import { mergeThemeColors, applyThemeToElement, generateId, convertThreadToMessages, getPrismTheme } from "../../utils";
import { CSS_CLASSES } from "../../utils/constants";
import ChatFAB from "../ChatFAB";
import ChatModal from "../ChatModal";
import ChatInterface from "../ChatInterface";
import pqlLogoUrl from "../../assets/icons/pql.svg";
import "../../styles/components.css";

/**
 * PromptQLChat - Main SDK component
 *
 * A drop-in React component that provides a chat interface for PromptQL applications.
 * Renders as a fixed bottom-right FAB that opens a modal chat interface.
 */
const PromptQLChat: React.FC<PromptQLChatProps> = ({
  endpoint,
  themeMode = 'auto',
  primaryColor,
  backgroundColor,
  textColor,
  title = "PromptQL Chat",
  welcomeMessage = "Welcome to PromptQL Chat",
  helpText = "Start a conversation by typing a message below.",
  icon,
  assistantAvatar,
  showQueryPlans = false,
  enableRealTime = true,
  prismTheme, // Remove default value to allow theme-aware selection
  prismThemeLight = "vs",
  prismThemeDark = "vsc-dark-plus",
  codeExecutionIndicatorText = "Executing query...",
  onThreadStart,
  onError,
  className,
}) => {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [hasRecentlyCancelled, setHasRecentlyCancelled] = useState(false);
  const [isCodeExecuting, setIsCodeExecuting] = useState(false);

  // Prevent unused variable warnings for future use
  console.debug("PromptQL Chat Config:", { enableRealTime });

  // Create default avatar if none provided
  const defaultAvatar = React.useMemo(
    () => <img src={pqlLogoUrl} alt="PQL Logo" style={{ width: "20px", height: "20px" }} />,
    []
  );
  const effectiveAssistantAvatar = assistantAvatar || defaultAvatar;

  // Handle SSE events callback
  const handleSSEEvent = useCallback((eventData: any) => {
    // The event structure has the actual event nested inside an 'event' property
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
                id: event.assistant_action_id || generateId(),
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
        // Handle streaming query plan chunks - process immediately without debouncing
        // This indicates code execution is happening
        setIsCodeExecuting(true);

        if (event.query_plan_chunk && event.code_block_id) {
          setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];

            // Only append to assistant messages
            if (lastMessage && lastMessage.type === "assistant") {
              const updatedMessage = { ...lastMessage };

              // Initialize code_blocks if it doesn't exist
              if (!updatedMessage.code_blocks) {
                updatedMessage.code_blocks = {};
              }

              // Get existing code block or create new one
              const existingCodeBlock = updatedMessage.code_blocks[event.code_block_id];
              const currentContent = existingCodeBlock?.content || "";
              const newChunk = event.query_plan_chunk;

              // Simple approach: just append if the chunk isn't already at the end
              let updatedContent = currentContent;
              if (!currentContent.endsWith(newChunk)) {
                updatedContent = currentContent + newChunk;
              }

              updatedMessage.code_blocks[event.code_block_id] = {
                id: event.code_block_id,
                content: updatedContent,
                streaming: true,
              };

              return [...prevMessages.slice(0, -1), updatedMessage];
            }
            return prevMessages;
          });
        }
        break;

      case "current_thread_state":
        // Handle thread state updates
        break;

      case "interaction_update":
        // Handle interaction updates
        break;

      default:
      // Unhandled SSE events are silently ignored
    }
  }, []);

  // Memoize health check config to prevent unnecessary re-renders
  const healthCheckConfig = useMemo(
    () => ({
      endpoint,
      interval: 30000,
      autoStart: false, // Disable autoStart to avoid StrictMode issues
    }),
    [endpoint]
  );

  // Hooks
  const themeDetection = useThemeDetection(themeMode);
  const threadPersistence = useThreadPersistence("promptql-chat");
  const modalPersistence = useModalPersistence("promptql-chat");
  const api = usePromptQLAPI(endpoint);
  const sse = useSSEConnection(endpoint, handleSSEEvent);
  const healthCheck = useHealthCheck(healthCheckConfig);

  // Manually start health checks after component is stable (avoid StrictMode issues)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      healthCheck.startHealthChecks();
    }, 1000); // Wait 1 second for component to stabilize

    return () => {
      clearTimeout(timeoutId);
    };
  }, [healthCheck.startHealthChecks]);

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

  // Create merged theme with custom colors
  const theme = mergeThemeColors(themeDetection.theme, {
    primaryColor,
    backgroundColor,
    textColor,
  });

  // Get the appropriate Prism theme based on current theme mode
  const effectivePrismTheme = getPrismTheme(theme, prismThemeLight, prismThemeDark, prismTheme);

  // Handle modal open/close
  const handleOpenModal = useCallback(() => {
    modalPersistence.setModalState("open");
  }, [modalPersistence]);

  const handleCloseModal = useCallback(() => {
    modalPersistence.closeModal();
  }, [modalPersistence]);

  const handleToggleFullscreen = useCallback(() => {
    modalPersistence.toggleFullscreen();
  }, [modalPersistence]);

  // Handle sending messages
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);
      setHasRecentlyCancelled(false); // Clear recent cancellation flag for new messages

      try {
        // Add user message to the conversation
        const userMessage: Message = {
          id: generateId(),
          type: "user",
          content: message.trim(),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);

        let threadId = threadPersistence.currentThreadId;

        if (!threadId) {
          // Start new thread
          threadId = await api.startThread(message);
          threadPersistence.setCurrentThreadId(threadId);
          onThreadStart?.(threadId);
        } else {
          // Continue existing thread
          await api.continueThread(threadId, message);
        }

        // Connect to SSE for real-time updates
        if (threadId) {
          sse.connect(threadId);
        }
        // Keep isLoading true until SSE disconnects
      } catch (err: any) {
        setError(err);
        onError?.(err);
        setIsLoading(false);
      }
    },
    [isLoading, api, threadPersistence, sse, onThreadStart, onError]
  );

  // Handle cancelling messages
  const handleCancelMessage = useCallback(async () => {
    const threadId = threadPersistence.currentThreadId;

    // Set cancelling state to show confirmation message
    setIsCancelling(true);
    setHasRecentlyCancelled(true);

    // Immediately clean up local state
    setIsLoading(false);
    setError(null); // Clear any existing errors
    api.clearError(); // Clear API errors
    sse.clearError(); // Clear SSE errors immediately
    sse.disconnect(); // Disconnect SSE to stop streaming

    // Try to cancel on the server, but don't show errors if it fails
    if (threadId) {
      try {
        await api.cancelThread(threadId);
      } catch (err: any) {
        // Silently handle cancel errors - user has already indicated they want to stop
        console.warn("Failed to cancel thread on server:", err);
      }
    }

    // Show cancellation confirmation for a brief moment, then clear it
    setTimeout(() => {
      setIsCancelling(false);
      // Also clear any lingering errors that might have appeared during cancellation
      setError(null);
      api.clearError();
      sse.clearError(); // Clear any SSE errors that might be lingering
    }, 3000); // Show for 3 seconds
  }, [api, threadPersistence, sse]);

  // Handle clearing errors
  const handleClearError = useCallback(() => {
    setError(null);
    setIsCancelling(false); // Also clear cancellation state
    setHasRecentlyCancelled(false); // Also clear recent cancellation flag
  }, []);

  // Handle starting a new thread
  const handleNewThread = useCallback(() => {
    threadPersistence.clearStoredThread();
    threadPersistence.setCurrentThreadId(null);
    sse.disconnect();
    setMessages([]);
    setError(null);
    setIsLoading(false);
    setIsCancelling(false); // Clear cancellation state
    setHasRecentlyCancelled(false); // Clear recent cancellation flag
  }, [threadPersistence, sse]);

  // Create cancellation confirmation message
  const cancellationMessage = isCancelling
    ? {
        name: "CancellationConfirmation",
        message: "Message cancelled successfully. You can now send a new message.",
      }
    : null;

  // Apply theme to root element
  useEffect(() => {
    const rootElement = document.querySelector(`.${CSS_CLASSES.ROOT}`) as HTMLElement;
    if (rootElement) {
      applyThemeToElement(rootElement, theme);
    }
  }, [theme]);

  // Manage loading state based on SSE connection
  useEffect(() => {
    if (sse.connectionState === "disconnected" && isLoading) {
      // Set loading to false when SSE disconnects (stream complete)
      setIsLoading(false);
    }

    // Reset code execution state when SSE disconnects
    if (sse.connectionState === "disconnected" && isCodeExecuting) {
      setIsCodeExecuting(false);
    }
  }, [sse.connectionState, isLoading, isCodeExecuting]);

  // Handle API errors
  useEffect(() => {
    if (api.error && onError) {
      onError(api.error);
    }
  }, [api.error, onError]);

  // Handle SSE errors (but ignore them during cancellation)
  useEffect(() => {
    if (sse.error && onError && !isCancelling) {
      onError(sse.error);
    }
  }, [sse.error, onError, isCancelling]);

  // Handle thread start callback
  useEffect(() => {
    if (threadPersistence.currentThreadId && onThreadStart) {
      onThreadStart(threadPersistence.currentThreadId);
    }
  }, [threadPersistence.currentThreadId, onThreadStart]);

  return (
    <div className={`${CSS_CLASSES.ROOT} ${className || ""}`}>
      {/* Floating Action Button */}
      <ChatFAB
        isOpen={modalPersistence.isModalOpen}
        onClick={handleOpenModal}
        theme={theme}
        icon={icon}
        ariaLabel="Open PromptQL Chat"
      />

      {/* Chat Modal */}
      <ChatModal
        isOpen={modalPersistence.isModalOpen}
        onClose={handleCloseModal}
        theme={theme}
        isFullscreen={modalPersistence.isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        title={title}
        showNewThreadButton={true}
        onNewThread={handleNewThread}
        connectionState={healthCheck.healthStatus}
        connectionError={healthCheck.error}>
        {/* Chat Interface */}
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          isCodeExecuting={isCodeExecuting}
          connectionState={healthCheck.healthStatus}
          showQueryPlans={showQueryPlans}
          theme={theme}
          prismTheme={effectivePrismTheme}
          codeExecutionIndicatorText={codeExecutionIndicatorText}
          welcomeMessage={welcomeMessage}
          helpText={helpText}
          assistantAvatar={effectiveAssistantAvatar}
          onSendMessage={handleSendMessage}
          onCancelMessage={handleCancelMessage}
          error={
            cancellationMessage ||
            error ||
            api.error ||
            healthCheck.error ||
            (isCancelling || hasRecentlyCancelled ? null : sse.error)
          }
          onClearError={handleClearError}
        />
      </ChatModal>
    </div>
  );
};

export default PromptQLChat;
