import { useState, useCallback, useRef, useEffect } from "react";
import type {
  UsePromptQLAPIReturn,
  StartThreadRequest,
  ContinueThreadRequest,
  ThreadResponse,
  Thread,
  PromptQLError,
} from "../types";
import { API_ENDPOINTS, ERROR_CODES, DEFAULT_CONFIG, HTTP_STATUS } from "../utils/constants";
import {
  createPromptQLError,
  isNetworkError,
  getUserTimezone,
  sanitizeUserInput,
  isValidThreadId,
  calculateBackoffDelay,
} from "../utils";

/**
 * Hook for HTTP interactions with PromptQL threads/v2 API
 * Handles request formatting, error handling, and retry logic
 */
export function usePromptQLAPI(endpoint: string): UsePromptQLAPIReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PromptQLError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Create base headers for all requests
  const createHeaders = useCallback((): HeadersInit => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // No Authorization header needed - proxy handles authentication
    return headers;
  }, []);

  // Generic fetch wrapper with retry logic
  const fetchWithRetry = useCallback(
    async <T>(url: string, options: RequestInit, retries = DEFAULT_CONFIG.MAX_RETRIES): Promise<T> => {
      let lastError: Error;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          // Create new AbortController for each attempt
          abortControllerRef.current = new AbortController();

          const response = await fetch(`${endpoint}${url}`, {
            ...options,
            signal: abortControllerRef.current.signal,
          });

          if (!response.ok) {
            const errorText = await response.text();
            let errorData;

            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { message: errorText };
            }

            throw createPromptQLError(errorData.message || `HTTP ${response.status}: ${response.statusText}`, {
              code:
                response.status === HTTP_STATUS.UNAUTHORIZED
                  ? ERROR_CODES.AUTHENTICATION_ERROR
                  : response.status === HTTP_STATUS.TOO_MANY_REQUESTS
                  ? ERROR_CODES.RATE_LIMIT_ERROR
                  : response.status >= 500
                  ? ERROR_CODES.SERVER_ERROR
                  : ERROR_CODES.VALIDATION_ERROR,
              status: response.status,
            });
          }

          const data = await response.json();
          return data as T;
        } catch (err) {
          lastError = err as Error;

          // Don't retry on abort or non-network errors
          if (err instanceof Error && (err.name === "AbortError" || !isNetworkError(err))) {
            throw err;
          }

          // Don't retry on authentication or validation errors
          if (err instanceof Error && "code" in err) {
            const promptQLError = err as PromptQLError;
            if (
              promptQLError.code === ERROR_CODES.AUTHENTICATION_ERROR ||
              promptQLError.code === ERROR_CODES.VALIDATION_ERROR
            ) {
              throw err;
            }
          }

          // Wait before retrying (except on last attempt)
          if (attempt < retries) {
            const delay = calculateBackoffDelay(attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError!;
    },
    [endpoint]
  );

  // Start a new thread
  const startThread = useCallback(
    async (message: string): Promise<string> => {
      try {
        setIsLoading(true);
        setError(null);

        const sanitizedMessage = sanitizeUserInput(message);
        if (!sanitizedMessage) {
          throw createPromptQLError("Message cannot be empty", {
            code: ERROR_CODES.VALIDATION_ERROR,
          });
        }

        const requestBody: StartThreadRequest = {
          user_message: sanitizedMessage,
          ddn_headers: {},
          timezone: getUserTimezone(),
        };

        const response = await fetchWithRetry<ThreadResponse>(API_ENDPOINTS.START_THREAD, {
          method: "POST",
          headers: createHeaders(),
          body: JSON.stringify(requestBody),
        });

        if (!response.thread_id || !isValidThreadId(response.thread_id)) {
          throw createPromptQLError("Invalid thread ID received from server", {
            code: ERROR_CODES.SERVER_ERROR,
          });
        }

        return response.thread_id;
      } catch (err) {
        const promptQLError =
          err instanceof Error && "code" in err
            ? (err as PromptQLError)
            : createPromptQLError(err instanceof Error ? err.message : "Failed to start thread", {
                code: ERROR_CODES.NETWORK_ERROR,
                cause: err as Error,
              });

        setError(promptQLError);
        throw promptQLError;
      } finally {
        setIsLoading(false);
      }
    },
    [createHeaders, fetchWithRetry]
  );

  // Continue an existing thread
  const continueThread = useCallback(
    async (threadId: string, message: string): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        if (!isValidThreadId(threadId)) {
          throw createPromptQLError("Invalid thread ID format", {
            code: ERROR_CODES.INVALID_THREAD,
            threadId,
          });
        }

        const sanitizedMessage = sanitizeUserInput(message);
        if (!sanitizedMessage) {
          throw createPromptQLError("Message cannot be empty", {
            code: ERROR_CODES.VALIDATION_ERROR,
          });
        }

        const requestBody: ContinueThreadRequest = {
          user_message: sanitizedMessage,
          ddn_headers: {},
          timezone: getUserTimezone(),
        };

        await fetchWithRetry(API_ENDPOINTS.CONTINUE_THREAD(threadId), {
          method: "POST",
          headers: createHeaders(),
          body: JSON.stringify(requestBody),
        });
      } catch (err) {
        const promptQLError =
          err instanceof Error && "code" in err
            ? (err as PromptQLError)
            : createPromptQLError(err instanceof Error ? err.message : "Failed to continue thread", {
                code: ERROR_CODES.NETWORK_ERROR,
                threadId,
                cause: err as Error,
              });

        setError(promptQLError);
        throw promptQLError;
      } finally {
        setIsLoading(false);
      }
    },
    [createHeaders, fetchWithRetry]
  );

  // Cancel a thread
  const cancelThread = useCallback(
    async (threadId: string): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        if (!isValidThreadId(threadId)) {
          throw createPromptQLError("Invalid thread ID format", {
            code: ERROR_CODES.INVALID_THREAD,
            threadId,
          });
        }

        await fetchWithRetry(API_ENDPOINTS.CANCEL_THREAD(threadId), {
          method: "POST",
          headers: createHeaders(),
        });
      } catch (err) {
        const promptQLError =
          err instanceof Error && "code" in err
            ? (err as PromptQLError)
            : createPromptQLError(err instanceof Error ? err.message : "Failed to cancel thread", {
                code: ERROR_CODES.NETWORK_ERROR,
                threadId,
                cause: err as Error,
              });

        setError(promptQLError);
        throw promptQLError;
      } finally {
        setIsLoading(false);
      }
    },
    [createHeaders, fetchWithRetry]
  );

  // Get thread details
  const getThread = useCallback(
    async (threadId: string): Promise<Thread> => {
      try {
        setIsLoading(true);
        setError(null);

        if (!isValidThreadId(threadId)) {
          throw createPromptQLError("Invalid thread ID format", {
            code: ERROR_CODES.INVALID_THREAD,
            threadId,
          });
        }

        // Create headers with text/event-stream accept header for thread retrieval
        const headers: HeadersInit = {
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        };

        // No Authorization header needed - proxy handles authentication

        // Use fetch directly to handle SSE response
        const response = await fetch(`${endpoint}${API_ENDPOINTS.GET_THREAD(threadId)}`, {
          method: "GET",
          headers,
        });

        if (!response.ok) {
          throw createPromptQLError(`HTTP ${response.status}: ${response.statusText}`, {
            code: ERROR_CODES.NETWORK_ERROR,
            threadId,
          });
        }

        if (!response.body) {
          throw createPromptQLError("Response body is null", {
            code: ERROR_CODES.SERVER_ERROR,
            threadId,
          });
        }

        // Parse SSE stream to extract thread data
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let threadData: Thread | null = null;

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Process complete lines
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith("data: ")) {
                const data = trimmedLine.slice(6); // Remove 'data: ' prefix
                if (data.trim() && data !== "[DONE]") {
                  try {
                    const eventData = JSON.parse(data);

                    // Look for current_thread_state event which contains the full thread data
                    if (eventData.type === "current_thread_state") {
                      // Construct the thread object by combining the thread ID from the event
                      // with the thread state data
                      if (eventData.thread_state && eventData.thread_id) {
                        threadData = {
                          id: eventData.thread_id,
                          ...eventData.thread_state,
                          // Add created_at and updated_at if they don't exist
                          created_at: eventData.thread_state.created_at || new Date(),
                          updated_at: eventData.thread_state.updated_at || new Date(),
                        };
                      }

                      break; // We found what we need
                    }
                  } catch (parseErr) {
                    console.warn("Failed to parse SSE data:", data, parseErr);
                  }
                }
              }
            }

            if (threadData) break; // Exit early if we found the thread data
          }
        } finally {
          reader.releaseLock();
        }

        if (!threadData) {
          throw createPromptQLError("No thread data found in response", {
            code: ERROR_CODES.SERVER_ERROR,
            threadId,
          });
        }

        // Validate thread structure
        if (!threadData.id) {
          throw createPromptQLError("Invalid thread data: missing id field", {
            code: ERROR_CODES.SERVER_ERROR,
            threadId,
          });
        }

        if (!threadData.interactions) {
          throw createPromptQLError("Invalid thread data: missing interactions field", {
            code: ERROR_CODES.SERVER_ERROR,
            threadId,
          });
        }

        if (!Array.isArray(threadData.interactions)) {
          throw createPromptQLError("Invalid thread data: interactions is not an array", {
            code: ERROR_CODES.SERVER_ERROR,
            threadId,
          });
        }

        return threadData;
      } catch (err) {
        const promptQLError =
          err instanceof Error && "code" in err
            ? (err as PromptQLError)
            : createPromptQLError(err instanceof Error ? err.message : "Failed to get thread", {
                code: ERROR_CODES.NETWORK_ERROR,
                threadId,
                cause: err as Error,
              });

        setError(promptQLError);
        throw promptQLError;
      } finally {
        setIsLoading(false);
      }
    },
    [endpoint]
  );

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup function to abort ongoing requests
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    startThread,
    continueThread,
    cancelThread,
    getThread,
    isLoading,
    error,
    clearError,
  };
}
