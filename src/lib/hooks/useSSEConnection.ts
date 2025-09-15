import { useState, useCallback, useRef, useEffect } from "react";
import type { UseSSEConnectionReturn, ConnectionState, SSEEventCallback } from "../types";
import { SSE_EVENTS, API_ENDPOINTS } from "../utils/constants";
import { isValidThreadId } from "../utils";

/**
 * Hook for managing SSE connections for real-time message streaming
 * Handles connection lifecycle, event parsing, and automatic reconnection
 */
export function useSSEConnection(endpoint: string, onEvent?: SSEEventCallback): UseSSEConnectionReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [error, setError] = useState<Error | null>(null);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const isCancellingRef = useRef(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const currentThreadIdRef = useRef<string | null>(null);

  // Clear reconnection timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Handle connection events
  const handleOpen = useCallback(() => {
    setConnectionState("connected");
    setError(null);
    reconnectAttemptsRef.current = 0;
    clearReconnectTimeout();
  }, [clearReconnectTimeout]);

  // Disconnect from SSE endpoint
  const disconnect = useCallback(() => {
    // Set cancelling flag to prevent errors during disconnection
    isCancellingRef.current = true;

    clearReconnectTimeout();

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }

    setConnectionState("disconnected");
    setError(null);
    reconnectAttemptsRef.current = 0;
    currentThreadIdRef.current = null;

    // Clear the cancelling flag after a brief delay to allow cleanup
    setTimeout(() => {
      isCancellingRef.current = false;
    }, 100);
  }, [clearReconnectTimeout]);

  // Parse and handle SSE events
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        // Parse the SSE event data
        const eventData = JSON.parse(event.data);

        // Set the last event for consumers to use
        setLastEvent(eventData);

        // Call the event callback if provided
        if (onEvent) {
          onEvent(eventData);
        }

        // Handle different event types
        switch (eventData.event || eventData.type) {
          case SSE_EVENTS.CURRENT_THREAD_STATE:
            // Handle current thread state event
            break;

          case SSE_EVENTS.INTERACTION_UPDATE:
            // Handle interaction update event
            break;

          case SSE_EVENTS.ASSISTANT_ACTION_MESSAGE_APPENDED:
            // Handle assistant message appended event
            break;

          case SSE_EVENTS.CODE_BLOCK_QUERY_PLAN_APPENDED:
            // Handle code block query plan appended event
            break;

          default:
            // Unknown SSE events are silently ignored
            break;
        }
      } catch (err) {
        console.error("Failed to parse SSE event data:", err);
        setError(new Error("Failed to parse SSE event data"));
      }
    },
    [onEvent]
  );

  // Connect to SSE endpoint using fetch with custom headers
  const connect = useCallback(
    async (threadId: string) => {
      if (!isValidThreadId(threadId)) {
        const error = new Error("Invalid thread ID format");
        setError(error);
        setConnectionState("error");
        return;
      }

      // Disconnect existing connection
      disconnect();

      try {
        setConnectionState("connecting");
        setError(null);
        currentThreadIdRef.current = threadId;

        // Create the correct SSE URL
        const sseUrl = `${endpoint}${API_ENDPOINTS.SSE_THREAD(threadId)}`;

        // Use fetch with proper headers instead of EventSource
        const headers: HeadersInit = {
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        };

        // No Authorization header needed - proxy handles authentication

        const response = await fetch(sseUrl, {
          method: "GET",
          headers,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error("Response body is null");
        }

        // Handle the connection as opened
        handleOpen();

        // Read the stream
        const reader = response.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder();

        const readStream = async () => {
          let buffer = "";

          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                // Stream ended naturally, set to disconnected
                setConnectionState("disconnected");
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;

              // Process complete lines
              const lines = buffer.split("\n");
              buffer = lines.pop() || ""; // Keep incomplete line in buffer

              for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith("data: ")) {
                  const data = trimmedLine.slice(6); // Remove 'data: ' prefix
                  if (data.trim()) {
                    if (data === "[DONE]") {
                      // Stream is complete, disconnect
                      setConnectionState("disconnected");
                      break;
                    }
                    try {
                      // Create a mock MessageEvent to maintain compatibility
                      const mockEvent = {
                        data: data,
                        type: "message",
                      } as MessageEvent;
                      handleMessage(mockEvent);
                    } catch (parseErr) {
                      console.warn("Failed to process SSE message:", data, parseErr);
                    }
                  }
                } else if (trimmedLine.startsWith("event: ")) {
                  // Handle event type lines if needed (silently)
                }
              }
            }
          } catch (err) {
            if (err instanceof Error && err.name !== "AbortError" && !isCancellingRef.current) {
              const error = new Error(`Stream reading error: ${err.message}`);
              setError(error);
              setConnectionState("error");
            }
          } finally {
            reader.releaseLock();
            readerRef.current = null;
          }
        };

        readStream();
      } catch (err) {
        if (!isCancellingRef.current) {
          const error = err instanceof Error ? err : new Error("Failed to establish SSE connection");
          setError(error);
          setConnectionState("error");
        }
      }
    },
    [disconnect, handleOpen, handleMessage]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    connectionState,
    connect,
    disconnect,
    clearError,
    error,
    lastEvent,
  };
}
