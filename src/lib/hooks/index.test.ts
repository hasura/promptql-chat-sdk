import { renderHook, act, waitFor } from "@testing-library/react";
import {
  usePromptQLAPI,
  useSSEConnection,
  useThreadPersistence,
  useModalPersistence,
  useThemeDetection,
} from "./index";

// Mock fetch globally
global.fetch = jest.fn();

// Mock EventSource
class MockEventSource {
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  readyState: number = 0;

  constructor(url: string) {
    this.url = url;
    this.readyState = 1; // CONNECTING
    setTimeout(() => {
      this.readyState = 2; // OPEN
      if (this.onopen) {
        this.onopen(new Event("open"));
      }
    }, 0);
  }

  close() {
    this.readyState = 3; // CLOSED
  }

  addEventListener(type: string, listener: (event: any) => void) {
    if (type === "open") this.onopen = listener;
    if (type === "error") this.onerror = listener;
    if (type === "message") this.onmessage = listener;
  }

  removeEventListener() {
    // Mock implementation
  }
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock window.matchMedia
const matchMediaMock = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockClear();

  // Setup localStorage mock
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  });

  // Setup EventSource mock
  (global as any).EventSource = MockEventSource;

  // Setup matchMedia mock
  Object.defineProperty(window, "matchMedia", {
    value: matchMediaMock,
    writable: true,
  });

  matchMediaMock.mockReturnValue({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  });
});

describe("usePromptQLAPI", () => {
  const mockEndpoint = "https://api.test.com";

  it("should initialize with default state", () => {
    const { result } = renderHook(() => usePromptQLAPI(mockEndpoint));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.startThread).toBe("function");
    expect(typeof result.current.continueThread).toBe("function");
    expect(typeof result.current.cancelThread).toBe("function");
    expect(typeof result.current.getThread).toBe("function");
  });

  it("should start a thread successfully", async () => {
    const mockResponse = { thread_id: "123e4567-e89b-12d3-a456-426614174000" };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => usePromptQLAPI(mockEndpoint));

    let threadId: string;
    await act(async () => {
      threadId = await result.current.startThread("Hello world");
    });

    expect(threadId!).toBe(mockResponse.thread_id);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should handle API errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: () => Promise.resolve('{"message": "Invalid request"}'),
    });

    const { result } = renderHook(() => usePromptQLAPI(mockEndpoint));

    await act(async () => {
      try {
        await result.current.startThread("Hello world");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should validate thread ID format", async () => {
    const { result } = renderHook(() => usePromptQLAPI(mockEndpoint));

    await act(async () => {
      try {
        await result.current.continueThread("invalid-thread-id", "Hello");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    expect(result.current.error).toBeDefined();
  });
});

describe("useSSEConnection", () => {
  const testEndpoint = "https://test-api.example.com";

  beforeEach(() => {
    // Mock fetch for SSE connections
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/threads/v2/")) {
        // Create a mock readable stream
        const mockReader = {
          read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
          cancel: jest.fn(),
        };

        return Promise.resolve({
          ok: true,
          body: {
            getReader: () => mockReader,
          },
        });
      }
      return Promise.reject(new Error("Unexpected fetch call"));
    });
  });

  it("should initialize with disconnected state", () => {
    const { result } = renderHook(() => useSSEConnection(testEndpoint));

    expect(result.current.connectionState).toBe("disconnected");
    expect(result.current.error).toBe(null);
    expect(typeof result.current.connect).toBe("function");
    expect(typeof result.current.disconnect).toBe("function");
  });

  it("should connect to SSE endpoint", async () => {
    const { result } = renderHook(() => useSSEConnection(testEndpoint));

    act(() => {
      result.current.connect("123e4567-e89b-12d3-a456-426614174000");
    });

    await waitFor(() => {
      expect(result.current.connectionState).toBe("connected");
    });
  });

  it("should handle invalid thread ID", () => {
    const { result } = renderHook(() => useSSEConnection(testEndpoint));

    act(() => {
      result.current.connect("invalid-thread-id");
    });

    expect(result.current.connectionState).toBe("error");
    expect(result.current.error).toBeDefined();
  });

  it("should disconnect properly", async () => {
    const { result } = renderHook(() => useSSEConnection(testEndpoint));

    act(() => {
      result.current.connect("123e4567-e89b-12d3-a456-426614174000");
    });

    await waitFor(() => {
      expect(result.current.connectionState).toBe("connected");
    });

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.connectionState).toBe("disconnected");
  });
});

describe("useThreadPersistence", () => {
  const mockProjectId = "test-project";

  it("should initialize with null thread ID", () => {
    const { result } = renderHook(() => useThreadPersistence(mockProjectId));

    expect(result.current.currentThreadId).toBe(null);
    expect(typeof result.current.setCurrentThreadId).toBe("function");
    expect(typeof result.current.getStoredThread).toBe("function");
    expect(typeof result.current.clearStoredThread).toBe("function");
  });

  it("should load thread ID from localStorage", () => {
    const mockThreadId = "123e4567-e89b-12d3-a456-426614174000";
    localStorageMock.getItem.mockReturnValue(mockThreadId);

    const { result } = renderHook(() => useThreadPersistence(mockProjectId));

    expect(result.current.currentThreadId).toBe(mockThreadId);
  });

  it("should persist thread ID to localStorage", () => {
    const { result } = renderHook(() => useThreadPersistence(mockProjectId));
    const mockThreadId = "123e4567-e89b-12d3-a456-426614174000";

    act(() => {
      result.current.setCurrentThreadId(mockThreadId);
    });

    expect(result.current.currentThreadId).toBe(mockThreadId);
    expect(localStorageMock.setItem).toHaveBeenCalledWith("promptql-thread-test-project", mockThreadId);
  });

  it("should clear stored thread", () => {
    const { result } = renderHook(() => useThreadPersistence(mockProjectId));

    act(() => {
      result.current.clearStoredThread();
    });

    expect(result.current.currentThreadId).toBe(null);
    expect(localStorageMock.removeItem).toHaveBeenCalled();
  });
});

describe("useThemeDetection", () => {
  it("should initialize with light theme", () => {
    const { result } = renderHook(() => useThemeDetection());

    expect(result.current.isDark).toBe(false);
    expect(result.current.theme.mode).toBe("light");
    expect(typeof result.current.toggleTheme).toBe("function");
  });

  it("should detect system dark mode preference", () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    });

    const { result } = renderHook(() => useThemeDetection());

    expect(result.current.isDark).toBe(true);
    expect(result.current.theme.mode).toBe("dark");
  });

  it("should toggle theme", () => {
    const { result } = renderHook(() => useThemeDetection());

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.isDark).toBe(true);
    expect(result.current.theme.mode).toBe("dark");
  });
});
