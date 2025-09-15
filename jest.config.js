export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(svg|png|jpg|jpeg|gif)$": "<rootDir>/src/__mocks__/fileMock.js",
    "^react-syntax-highlighter/dist/esm/styles/prism/(.*)$": "<rootDir>/src/__mocks__/prismStyleMock.js",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transformIgnorePatterns: [
    "node_modules/(?!(remark-gfm|react-syntax-highlighter|react-markdown|@babel/runtime|micromark|mdast-util|unist-util|vfile|bail|trough|unified|is-plain-obj|property-information|hast-util|space-separated-tokens|comma-separated-tokens|web-namespaces|zwitch|html-void-elements|ccount|markdown-table|repeat-string|longest-streak|decode-named-character-reference|character-entities)/)",
  ],
  testMatch: ["<rootDir>/src/**/__tests__/**/*.(ts|tsx)", "<rootDir>/src/**/*.(test|spec).(ts|tsx)"],
  collectCoverageFrom: [
    "src/lib/**/*.(ts|tsx)",
    "!src/lib/**/*.d.ts",
    "!src/lib/**/*.stories.*",
    "!src/lib/**/index.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
};
