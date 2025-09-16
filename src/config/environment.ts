/**
 * Environment-based configuration for PromptQL Chat SDK
 * Handles different endpoints and settings for development vs production
 */

export interface EnvironmentConfig {
  apiEndpoint: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Get the appropriate API endpoint based on the current environment
 */
function getApiEndpoint(): string {
  // In development, use the Vite proxy
  if (import.meta.env.DEV) {
    return "/api";
  }

  // In production, use the full URL
  // Environment variables can be used to override the default endpoint
  return import.meta.env.VITE_API_ENDPOINT || "";
}

/**
 * Environment configuration object
 */
export const environment: EnvironmentConfig = {
  apiEndpoint: getApiEndpoint(),
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

/**
 * Default configuration values that can be overridden by environment variables
 */
export const defaultConfig = {
  primaryColor: import.meta.env.VITE_PRIMARY_COLOR || "#3b82f6",
  backgroundColor: import.meta.env.VITE_BACKGROUND_COLOR || "#ffffff",
  textColor: import.meta.env.VITE_TEXT_COLOR || "#111827",
} as const;
