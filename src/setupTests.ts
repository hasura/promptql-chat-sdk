import "@testing-library/jest-dom";

// Mock EventSource for SSE testing
global.EventSource = class MockEventSource {
  url: string;
  readyState: number = 0;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = 1;
      if (this.onopen) {
        this.onopen(new Event("open"));
      }
    }, 0);
  }

  close() {
    this.readyState = 2;
  }

  // Helper method for tests to simulate messages
  simulateMessage(data: string, event?: string) {
    if (this.onmessage) {
      const messageEvent = new MessageEvent(event || "message", {
        data,
        lastEventId: "",
        origin: this.url,
      });
      this.onmessage(messageEvent);
    }
  }

  // Helper method for tests to simulate errors
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event("error"));
    }
  }
} as any;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock matchMedia for theme detection
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
