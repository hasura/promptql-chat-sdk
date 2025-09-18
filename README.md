# PromptQL Chat SDK

A flexible React SDK for integrating PromptQL-powered chat interfaces into your applications. Whether you need a quick
drop-in solution, custom component layouts, or complete UI control, this SDK adapts to your integration requirements.

**Three ways to integrate:**

- **Drop-in Component** - Add a complete chat interface, with custom branding, with a single component
- **Component Library** - Mix and match individual components for custom layouts
- **Headless Hook** - Build any UI while leveraging our state management and API integration

All integration approaches include SSE-powered real-time responses, thread persistence across sessions, customizable
theming, and comprehensive TypeScript support.

## Installation

Install the PromptQL Chat SDK:

```bash
npm install promptql-chat-sdk
```

### Prerequisites

- React 18+
- Node.js 18+

## Usage Patterns

> [!NOTE]
>
> Before running the examples below, start a proxy server that forwards requests to the PromptQL API. See
> [Authentication](#authentication) for context and setup, or jump straight to the
> [proxy examples](./proxy-examples/README.md).

The SDK supports three levels of customization to meet your various integration needs:

### 1. Drop-in Component

The simplest way to get started is with the drop-in component:

```tsx
import { PromptQLChat } from "promptql-chat-sdk";

function App() {
  return (
    <div>
      <h1>My Application</h1>

      <PromptQLChat endpoint="http://localhost:8080" />
    </div>
  );
}
```

This renders a floating action button in the bottom-right corner that opens a full-featured chat modal when clicked. The
endpoint prop listed above is the _only_ required prop.

### 2. Component Library

Use individual components for custom layouts and positioning:

```tsx
import { ChatFAB, ChatModal, ChatInterface, getDefaultTheme } from "promptql-chat-sdk";
import { useState } from "react";

function CustomLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const theme = getDefaultTheme("light");

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <ChatFAB
          isOpen={isOpen}
          onClick={() => setIsOpen(true)}
          theme={theme}
          className="sidebar-chat-button"
          ariaLabel="Open support chat"
        />
      </aside>

      <main className="content">{/* Your app content */}</main>

      <ChatModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        theme={theme}
        title="Customer Support"
        className="custom-modal-styling">
        <div className="custom-chat-header">
          <h3>How can we help you today?</h3>
        </div>

        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          connectionState={connectionState}
          theme={theme}
          onSendMessage={sendMessage}
          onCancelMessage={cancelMessage}
        />

        <div className="custom-chat-footer">
          <small>Powered by PromptQL</small>
        </div>
      </ChatModal>
    </div>
  );
}
```

### 3. Headless Hook Pattern

Maximum flexibility - build any UI you want while leveraging the SDK's state management and API integration:

```tsx
import { usePromptQLChat } from "promptql-chat-sdk";

function CompletelyCustomChat() {
  const {
    // Modal state
    isModalOpen,
    isFullscreen,
    toggleModal,
    closeModal,
    toggleFullscreen,

    // Chat state
    messages,
    isLoading,
    connectionState,
    currentThreadId,

    // Actions
    sendMessage,
    cancelMessage,
    startNewThread,

    // Theme
    theme,
    isDarkMode,

    // Error handling
    error,
    clearError,
  } = usePromptQLChat({
    endpoint: "http://localhost:8080", // Your proxy server

    primaryColor: "#10b981",
    onThreadStart: (threadId) => {
      console.log("New conversation:", threadId);
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  return (
    <div className="custom-chat-app">
      <header>
        <h1>My Custom Chat Interface</h1>
        <button onClick={toggleModal} className="chat-trigger" style={{ backgroundColor: theme.colors.primary }}>
          Chat ({connectionState}) {messages.length > 0 && `(${messages.length})`}
        </button>
      </header>

      {isModalOpen && (
        <div className="custom-modal-overlay">
          <div className={`custom-modal ${isFullscreen ? "fullscreen" : ""}`}>
            <div className="modal-header">
              <h2>AI Assistant</h2>
              <div className="header-actions">
                <button onClick={toggleFullscreen}>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</button>
                <button onClick={closeModal}>Close</button>
              </div>
            </div>

            <div className="modal-body">
              {error && (
                <div className="error-banner">
                  <p>Error: {error.message}</p>
                  <button onClick={clearError}>Dismiss</button>
                </div>
              )}

              <div className="messages-container">
                {messages.map((message, index) => (
                  <div key={index} className={`message ${message.role}`}>
                    <div className="message-content">{message.content}</div>
                    <div className="message-meta">
                      {message.role} • {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="loading-indicator">
                    <div className="typing-dots">AI is thinking...</div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <div className="chat-actions">
                <button onClick={startNewThread}>New Conversation</button>
                <span className="connection-status">Status: {connectionState}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Theming and Customization

### Theme Mode Control

The SDK automatically detects your system's theme preference (light/dark mode), but you can override this behavior using the `themeMode` prop. This is especially useful for integration with documentation sites like Docusaurus:

```tsx
import { PromptQLChat } from "promptql-chat-sdk";

function App() {
  return (
    <div>
      {/* Auto-detect system theme (default) */}
      <PromptQLChat endpoint="/api" themeMode="auto" />

      {/* Force light theme */}
      <PromptQLChat endpoint="/api" themeMode="light" />

      {/* Force dark theme */}
      <PromptQLChat endpoint="/api" themeMode="dark" />
    </div>
  );
}
```

#### Docusaurus Integration

For Docusaurus sites, you can sync the chat theme with your site's theme:

```tsx
import { useColorMode } from '@docusaurus/theme-common';
import { PromptQLChat } from "promptql-chat-sdk";

function DocusaurusChat() {
  const { colorMode } = useColorMode();

  return (
    <PromptQLChat
      endpoint="/api"
      themeMode={colorMode} // 'light' or 'dark'
      title="Documentation Assistant"
    />
  );
}
```

### Custom Colors

You can customize the primary colors while maintaining theme consistency:

```tsx
<PromptQLChat
  endpoint="/api"
  themeMode="auto"
  primaryColor="#10b981"
  backgroundColor="#f8fafc"
  textColor="#1e293b"
/>
```

### Headless Hook Theming

The headless hook also supports theme mode control:

```tsx
import { usePromptQLChat } from "promptql-chat-sdk";

function CustomChat() {
  const { theme, isDarkMode } = usePromptQLChat({
    endpoint: "/api",
    themeMode: "dark", // Force dark mode
    primaryColor: "#3b82f6"
  });

  // Use theme.colors for styling your custom components
  return (
    <div style={{ backgroundColor: theme.colors.background }}>
      {/* Your custom UI */}
    </div>
  );
}
```

## Authentication

The SDK requires a proxy server to handle authentication. The proxy server should add the necessary headers for
authentication and forward requests to the PromptQL API. This proxy server can be implemented using any technology, but
we recommend using a lightweight solution like nginx or — if already using Next.js — a simple API route.

See the [proxy examples documentation](./proxy-examples/README.md) for more information.

## API Reference

### Components

```tsx
// Drop-in component
import { PromptQLChat } from "promptql-chat-sdk";

// Individual components
import {
  ChatFAB,
  ChatModal,
  ChatInterface,
  MessageList,
  MessageItem,
  ChatInput,
  ConnectionIndicator,
} from "promptql-chat-sdk";

// Headless hook
import { usePromptQLChat } from "promptql-chat-sdk";

// Utilities
import { getDefaultTheme, mergeThemeColors, applyThemeToElement } from "promptql-chat-sdk";
```

### Types

```tsx
import type {
  // Main component props
  PromptQLChatProps,

  // Individual component props
  ChatFABProps,
  ChatModalProps,
  ChatInterfaceProps,
  MessageListProps,
  MessageItemProps,
  ChatInputProps,
  ConnectionIndicatorProps,

  // Headless hook types
  UsePromptQLChatConfig,
  UsePromptQLChatReturn,

  // Core types
  Theme,
  Message,
  Thread,
  ConnectionState,
  PromptQLError,
} from "promptql-chat-sdk";
```

### Hooks

```tsx
// Individual hooks (advanced usage)
import {
  usePromptQLAPI, // HTTP client for PromptQL API
  useSSEConnection, // Real-time streaming
  useThreadPersistence, // Cross-session state
  useThemeDetection, // System theme integration
} from "promptql-chat-sdk";
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on how to get started.
