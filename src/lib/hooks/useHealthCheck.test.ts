import { renderHook, act, waitFor } from "@testing-library/react";
import { useHealthCheck } from "./useHealthCheck";
import { API_ENDPOINTS, HTTP_STATUS } from "../utils/constants";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("useHealthCheck", () => {
  const defaultConfig = {
    endpoint: "https://promptql.ddn.hasura.app",
    interval: 1000,
    autoStart: false, // Disable auto-start for tests
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Health Check Functionality", () => {
    it("should initialize with disconnected state", () => {
      const { result } = renderHook(() => useHealthCheck(defaultConfig));

      expect(result.current.healthStatus).toBe("disconnected");
      expect(result.current.isChecking).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it("should perform successful health check", async () => {
      mockFetch.mockResolvedValueOnce({
        status: HTTP_STATUS.OK,
        statusText: "OK",
      });

      const { result } = renderHook(() => useHealthCheck(defaultConfig));

      let checkResult: boolean;
      await act(async () => {
        checkResult = await result.current.checkHealth();
      });

      expect(checkResult!).toBe(true);
      expect(result.current.healthStatus).toBe("connected");
      expect(result.current.error).toBe(null);
      expect(mockFetch).toHaveBeenCalledWith(
        `${defaultConfig.endpoint}${API_ENDPOINTS.HEALTH_CHECK}`,
        expect.objectContaining({
          method: "GET",
          signal: expect.any(AbortSignal),
        })
      );
    });

    it("should handle failed health check", async () => {
      mockFetch.mockResolvedValueOnce({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        statusText: "Internal Server Error",
      });

      const { result } = renderHook(() => useHealthCheck(defaultConfig));

      let checkResult: boolean;
      await act(async () => {
        checkResult = await result.current.checkHealth();
      });

      expect(checkResult!).toBe(false);
      expect(result.current.healthStatus).toBe("error");
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain("Health check failed with status 500");
    });

    it("should handle network errors", async () => {
      const networkError = new Error("Network error");
      mockFetch.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useHealthCheck(defaultConfig));

      let checkResult: boolean;
      await act(async () => {
        checkResult = await result.current.checkHealth();
      });

      expect(checkResult!).toBe(false);
      expect(result.current.healthStatus).toBe("error");
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain("Health check failed: Network error");
    });

    it("should clear error state", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useHealthCheck(defaultConfig));

      await act(async () => {
        await result.current.checkHealth();
      });

      expect(result.current.error).toBeInstanceOf(Error);

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe("Periodic Health Checks", () => {
    it("should start and stop periodic health checks", async () => {
      mockFetch.mockResolvedValue({
        status: HTTP_STATUS.OK,
        statusText: "OK",
      });

      const { result } = renderHook(() => useHealthCheck(defaultConfig));

      // Start periodic checks
      act(() => {
        result.current.startHealthChecks();
      });

      // Should perform initial check
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Advance timer to trigger periodic check
      act(() => {
        jest.advanceTimersByTime(defaultConfig.interval);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      // Stop periodic checks
      act(() => {
        result.current.stopHealthChecks();
      });

      expect(result.current.healthStatus).toBe("disconnected");
    });

    it("should auto-start when autoStart is true", async () => {
      mockFetch.mockResolvedValue({
        status: HTTP_STATUS.OK,
        statusText: "OK",
      });

      const configWithAutoStart = { ...defaultConfig, autoStart: true };
      renderHook(() => useHealthCheck(configWithAutoStart));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Cleanup", () => {
    it("should cleanup on unmount", () => {
      const { result, unmount } = renderHook(() => useHealthCheck(defaultConfig));

      // Start health checks
      act(() => {
        result.current.startHealthChecks();
      });

      // Should have made initial call
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Unmount should stop health checks
      unmount();

      // Advance timer - should not trigger any more calls
      act(() => {
        jest.advanceTimersByTime(defaultConfig.interval * 2);
      });

      // Should not have made additional calls after unmount
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
