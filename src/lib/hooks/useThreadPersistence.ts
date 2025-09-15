import { useState, useCallback, useEffect } from "react";
import type {
  UseThreadPersistenceReturn,
  Thread,
} from "../types";
import {
  createStorageKey,
  isValidThreadId,
} from "../utils";

/**
 * Hook for thread persistence across sessions using localStorage
 * Provides cross-session state management with server-side validation fallback
 */
export function useThreadPersistence(projectId: string): UseThreadPersistenceReturn {
  const [currentThreadId, setCurrentThreadIdState] = useState<string | null>(null);
  const storageKey = createStorageKey(projectId);

  // Check if localStorage is available
  const isStorageAvailable = useCallback(() => {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Load thread ID from localStorage on mount
  useEffect(() => {
    if (!isStorageAvailable()) return;

    try {
      const storedThreadId = localStorage.getItem(storageKey);
      if (storedThreadId && isValidThreadId(storedThreadId)) {
        setCurrentThreadIdState(storedThreadId);
      }
    } catch (error) {
      console.warn("Failed to load thread ID from localStorage:", error);
    }
  }, [storageKey, isStorageAvailable]);

  // Set current thread ID and persist to localStorage
  const setCurrentThreadId = useCallback(
    (threadId: string | null) => {
      setCurrentThreadIdState(threadId);

      if (!isStorageAvailable()) return;

      try {
        if (threadId) {
          if (!isValidThreadId(threadId)) {
            console.warn("Invalid thread ID format, not persisting:", threadId);
            return;
          }
          localStorage.setItem(storageKey, threadId);
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.warn("Failed to persist thread ID to localStorage:", error);
      }
    },
    [storageKey, isStorageAvailable]
  );

  // Get stored thread data (placeholder for future server integration)
  const getStoredThread = useCallback(async (): Promise<Thread | null> => {
    if (!currentThreadId) return null;

    try {
      // In a real implementation, this would fetch from the server
      // Currently returns a basic thread structure for local development
      return {
        id: currentThreadId,
        interactions: [],
        created_at: new Date(),
        updated_at: new Date(),
      };
    } catch (error) {
      console.warn("Failed to get stored thread:", error);
      return null;
    }
  }, [currentThreadId]);

  // Clear stored thread data
  const clearStoredThread = useCallback(() => {
    setCurrentThreadId(null);
  }, [setCurrentThreadId]);

  return {
    currentThreadId,
    setCurrentThreadId,
    getStoredThread,
    clearStoredThread,
  };
}
