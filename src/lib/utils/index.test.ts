import {
  generateId,
  getUserTimezone,
  createStorageKey,
  parseSSEData,
  createPromptQLError,
  isNetworkError,
  getDefaultTheme,
  getThemeAwareFallbacks,
  mergeThemeColors,
  calculateBackoffDelay,
  isValidThreadId,
  sanitizeUserInput,
  formatTimestamp,
  supportsEventSource,
  getPrismTheme,
} from "./index";

describe("Utility Functions", () => {
  describe("generateId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe("string");
      expect(id1.length).toBeGreaterThan(0);
    });
  });

  describe("getUserTimezone", () => {
    it("should return a valid timezone string", () => {
      const timezone = getUserTimezone();
      expect(typeof timezone).toBe("string");
      expect(timezone.length).toBeGreaterThan(0);
    });
  });

  describe("createStorageKey", () => {
    it("should create a storage key with project ID", () => {
      const projectId = "test-project";
      const key = createStorageKey(projectId);

      expect(key).toBe("promptql-thread-test-project");
    });
  });

  describe("parseSSEData", () => {
    it("should parse valid JSON data", () => {
      const data = '{"message": "hello"}';
      const parsed = parseSSEData(data);

      expect(parsed).toEqual({ message: "hello" });
    });

    it("should return null for invalid JSON", () => {
      const data = "invalid json";
      const parsed = parseSSEData(data);

      expect(parsed).toBeNull();
    });
  });

  describe("createPromptQLError", () => {
    it("should create an error with additional properties", () => {
      const error = createPromptQLError("Test error", {
        code: "TEST_ERROR",
        status: 400,
        threadId: "thread-123",
      });

      expect(error.message).toBe("Test error");
      expect(error.name).toBe("PromptQLError");
      expect(error.code).toBe("TEST_ERROR");
      expect(error.status).toBe(400);
      expect(error.threadId).toBe("thread-123");
    });
  });

  describe("isNetworkError", () => {
    it("should identify network errors", () => {
      const networkError = new Error("fetch failed");
      const regularError = new Error("something else");

      expect(isNetworkError(networkError)).toBe(true);
      expect(isNetworkError(regularError)).toBe(false);
    });
  });

  describe("getDefaultTheme", () => {
    it("should return light theme", () => {
      const theme = getDefaultTheme("light");

      expect(theme.mode).toBe("light");
      expect(theme.colors.background).toBe("#ffffff");
      expect(theme.colors.text).toBe("#111827");
    });

    it("should return dark theme", () => {
      const theme = getDefaultTheme("dark");

      expect(theme.mode).toBe("dark");
      expect(theme.colors.background).toBe("#1f2937");
      expect(theme.colors.text).toBe("#f9fafb");
    });
  });

  describe("getThemeAwareFallbacks", () => {
    // Mock window.matchMedia for testing
    const mockMatchMedia = (matches: boolean) => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    };

    it("should return light theme colors when system prefers light", () => {
      mockMatchMedia(false); // prefers-color-scheme: dark = false

      const fallbacks = getThemeAwareFallbacks();

      expect(fallbacks.background).toBe("#ffffff");
      expect(fallbacks.text).toBe("#111827");
      expect(fallbacks.surface).toBe("#f9fafb");
    });

    it("should return dark theme colors when system prefers dark", () => {
      mockMatchMedia(true); // prefers-color-scheme: dark = true

      const fallbacks = getThemeAwareFallbacks();

      expect(fallbacks.background).toBe("#1f2937");
      expect(fallbacks.text).toBe("#f9fafb");
      expect(fallbacks.surface).toBe("#374151");
    });

    it("should handle missing window.matchMedia gracefully", () => {
      // Store original matchMedia
      const originalMatchMedia = window.matchMedia;

      // Mock undefined matchMedia
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: undefined,
      });

      const fallbacks = getThemeAwareFallbacks();

      // Should default to light theme when matchMedia is unavailable
      expect(fallbacks.background).toBe("#ffffff");
      expect(fallbacks.text).toBe("#111827");

      // Restore matchMedia
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: originalMatchMedia,
      });
    });
  });

  describe("mergeThemeColors", () => {
    it("should merge custom colors with base theme", () => {
      const baseTheme = getDefaultTheme("light");
      const customColors = {
        primaryColor: "#ff0000",
        backgroundColor: "#000000",
      };

      const mergedTheme = mergeThemeColors(baseTheme, customColors);

      expect(mergedTheme.colors.primary).toBe("#ff0000");
      expect(mergedTheme.colors.background).toBe("#000000");
      expect(mergedTheme.colors.text).toBe("#111827"); // unchanged
    });
  });

  describe("calculateBackoffDelay", () => {
    it("should calculate exponential backoff", () => {
      const delay1 = calculateBackoffDelay(0);
      const delay2 = calculateBackoffDelay(1);
      const delay3 = calculateBackoffDelay(2);

      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThan(3000); // with jitter
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
    });

    it("should respect max delay", () => {
      const delay = calculateBackoffDelay(10, 1000, 5000);
      expect(delay).toBeLessThanOrEqual(6000); // max + jitter
    });
  });

  describe("isValidThreadId", () => {
    it("should validate UUID v4 format", () => {
      const validId = "123e4567-e89b-12d3-a456-426614174000";
      const invalidId = "not-a-uuid";

      expect(isValidThreadId(validId)).toBe(true);
      expect(isValidThreadId(invalidId)).toBe(false);
    });
  });

  describe("sanitizeUserInput", () => {
    it("should trim and limit input length", () => {
      const input = "  hello world  ";
      const longInput = "a".repeat(20000);

      expect(sanitizeUserInput(input)).toBe("hello world");
      expect(sanitizeUserInput(longInput)).toHaveLength(10000);
    });
  });

  describe("formatTimestamp", () => {
    it("should format recent timestamps", () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);
      const oneHourAgo = new Date(now.getTime() - 3600000);

      expect(formatTimestamp(now)).toBe("Just now");
      expect(formatTimestamp(oneMinuteAgo)).toBe("1m ago");
      expect(formatTimestamp(oneHourAgo)).toBe("1h ago");
    });
  });

  describe("supportsEventSource", () => {
    it("should check EventSource support", () => {
      const supported = supportsEventSource();
      expect(typeof supported).toBe("boolean");
    });
  });

  describe("getPrismTheme", () => {
    const lightTheme = getDefaultTheme("light");
    const darkTheme = getDefaultTheme("dark");

    it("should return prismThemeLight for light theme", () => {
      const result = getPrismTheme(lightTheme, "tomorrow", "okaidia");
      expect(result).toBe("tomorrow");
    });

    it("should return prismThemeDark for dark theme", () => {
      const result = getPrismTheme(darkTheme, "tomorrow", "okaidia");
      expect(result).toBe("okaidia");
    });

    it("should use legacy prismTheme when provided", () => {
      const result = getPrismTheme(lightTheme, "tomorrow", "okaidia", "twilight");
      expect(result).toBe("twilight");
    });

    it("should use default light theme when prismThemeLight is not provided", () => {
      const result = getPrismTheme(lightTheme);
      expect(result).toBe("prism");
    });

    it("should use default dark theme when prismThemeDark is not provided", () => {
      const result = getPrismTheme(darkTheme);
      expect(result).toBe("dark");
    });
  });
});
