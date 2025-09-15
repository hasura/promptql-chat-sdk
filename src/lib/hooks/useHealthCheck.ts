import { useState, useCallback, useEffect, useRef } from "react";
import type { ConnectionState } from "../types";
import { API_ENDPOINTS, HTTP_STATUS } from "../utils/constants";

/**
 * Configuration for the health check hook
 */
export interface UseHealthCheckConfig {
  /** Base endpoint URL */
  endpoint: string;
  /** API key for authentication */
  apiKey: string;
  /** Health check interval in milliseconds (default: 30000 = 30 seconds) */
  interval?: number;
  /** Whether to start health checks immediately (default: true) */
  autoStart?: boolean;
}

/**
 * Return type for the health check hook
 */
export interface UseHealthCheckReturn {
  /** Current health status as connection state */
  healthStatus: ConnectionState;
  /** Whether a health check is currently in progress */
  isChecking: boolean;
  /** Last error encountered during health check */
  error: Error | null;
  /** Manually trigger a health check */
  checkHealth: () => Promise<boolean>;
  /** Start periodic health checks */
  startHealthChecks: () => void;
  /** Stop periodic health checks */
  stopHealthChecks: () => void;
  /** Clear any error state */
  clearError: () => void;
}

/**
 * Hook for monitoring API health status
 *
 * Performs periodic health checks against the /api/healthz endpoint
 * and provides connection state based on health status.
 */
export function useHealthCheck({
  endpoint,
  apiKey,
  interval = 30000,
  autoStart = true,
}: UseHealthCheckConfig): UseHealthCheckReturn {
  const [healthStatus, setHealthStatus] = useState<ConnectionState>(autoStart ? "connecting" : "disconnected");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const isStartedRef = useRef(false);

  // Perform a single health check
  const checkHealth = useCallback(async (): Promise<boolean> => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setIsChecking(true);
      setError(null);
      setHealthStatus("connecting");

      const healthUrl = `${endpoint}${API_ENDPOINTS.HEALTH_CHECK}`;

      const response = await fetch(healthUrl, {
        method: "GET",
        signal: abortController.signal,
      });

      // Update state for successful response, regardless of mount status
      if (response.status === HTTP_STATUS.OK) {
        setHealthStatus("connected");
        setError(null);
        return true;
      } else {
        const errorMessage = `Health check failed with status ${response.status}: ${response.statusText}`;
        const healthError = new Error(errorMessage);
        setError(healthError);
        setHealthStatus("error");
        return false;
      }
    } catch (err) {
      // Don't treat abort errors as real errors
      if (err instanceof Error && err.name === "AbortError") {
        return false;
      }

      const healthError =
        err instanceof Error
          ? new Error(`Health check failed: ${err.message}`)
          : new Error("Health check failed: Unknown error");

      // Update state regardless of mount status
      setError(healthError);
      setHealthStatus("error");
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsChecking(false);
      }

      // Clear the abort controller reference if it's the current one
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [endpoint, apiKey]);

  // Start periodic health checks
  const startHealthChecks = useCallback(() => {
    if (isStartedRef.current) {
      return;
    }

    isStartedRef.current = true;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Perform initial check
    checkHealth();

    // Set up periodic checks
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        checkHealth();
      }
    }, interval);
  }, [checkHealth, interval]);

  // Stop periodic health checks
  const stopHealthChecks = useCallback(() => {
    isStartedRef.current = false;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setHealthStatus("disconnected");
    setIsChecking(false);
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-start health checks if enabled
  useEffect(() => {
    if (autoStart) {
      // Add a delay to handle React StrictMode multiple mounting cycles
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current && !isStartedRef.current) {
          startHealthChecks();
        }
      }, 200);

      return () => {
        clearTimeout(timeoutId);
        stopHealthChecks();
      };
    }

    return () => {
      stopHealthChecks();
    };
  }, [autoStart, startHealthChecks, stopHealthChecks, interval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopHealthChecks();
    };
  }, [stopHealthChecks]);

  return {
    healthStatus,
    isChecking,
    error,
    checkHealth,
    startHealthChecks,
    stopHealthChecks,
    clearError,
  };
}
