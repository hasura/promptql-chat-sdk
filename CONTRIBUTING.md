# Contributing to PromptQL Chat SDK

Thank you for your interest in contributing to the PromptQL Chat SDK. This guide will help you get started with
development, testing, and submitting contributions.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

### Getting Started

1. **Fork and clone the repository:**

   ```bash
   git clone https://github.com/hasura/promptql-chat-sdk.git
   cd promptql-chat-sdk
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env.local` file in the root directory:

   ```bash
   # Optional - API endpoint (defaults to https://promptql.ddn.hasura.app)
   VITE_API_ENDPOINT=your_dataplane_url
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   ```

   This starts the Vite dev server at `http://localhost:5173` with example applications showcasing the SDK.

5. **Run tests:**

   ```bash
   npm test
   ```

## Project Structure

```
src/
├── lib/                    # SDK source code
│   ├── components/         # React components
│   │   ├── PromptQLChat/   # Main SDK component
│   │   ├── ChatFAB/        # Floating action button
│   │   ├── ChatModal/      # Modal container
│   │   ├── ChatInterface/  # Chat layout orchestration
│   │   ├── MessageList/    # Message container
│   │   ├── MessageItem/    # Individual messages
│   │   ├── ChatInput/      # Message input
│   │   └── ConnectionIndicator/ # Connection status
│   ├── hooks/              # Custom React hooks
│   │   ├── usePromptQLAPI.ts      # API client hook
│   │   ├── useSSEConnection.ts    # Real-time streaming hook
│   │   ├── useThreadPersistence.ts # State persistence hook
│   │   ├── useThemeDetection.ts   # Theme management hook
│   │   └── usePromptQLChat.ts     # Headless hook
│   ├── styles/             # Component styles
│   ├── types/              # TypeScript definitions
│   ├── utils/              # Utility functions
│   └── index.ts            # Main library export
└── App.tsx                 # Main example app

dist/                       # Built library output (generated)
tests/                      # Test files
```

## Development Workflow

### Available Scripts

- `npm run dev` - Start development server with example app
- `npm run build` - Build example app for production
- `npm run build:lib` - Build SDK library for NPM distribution
- `npm test` - Run test suite
- `npm test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Making Changes

1. **Create a feature branch:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** to improve the SDK

3. **Add or update tests** for your changes

4. **Run tests** to ensure everything works:

   ```bash
   npm test
   npm run lint
   ```

5. **Build the library** to ensure it compiles:

   ```bash
   npm run build:lib
   ```

## Testing

The project uses Jest with React Testing Library for comprehensive testing.

### Test Structure

- **Unit tests**: `src/**/*.test.ts` or `src/**/*.test.tsx`
- **Integration tests**: Test hooks and component interactions
- **Component tests**: Test UI components, accessibility, and user interactions

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- MessageList.test.tsx
```

### Writing Tests

When adding new features:

1. **Write unit tests** for utility functions
2. **Write component tests** for React components
3. **Write integration tests** for hooks
4. **Test accessibility** features
5. **Test error scenarios**

Example test structure:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { YourComponent } from "./YourComponent";

describe("YourComponent", () => {
  it("should render correctly", () => {
    render(<YourComponent />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should handle user interactions", () => {
    const onClickMock = jest.fn();
    render(<YourComponent onClick={onClickMock} />);

    fireEvent.click(screen.getByRole("button"));
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
});
```

## Getting Help

- **Issues**: Check existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Refer to the README and code comments

Thank you for contributing to PromptQL Chat SDK!
