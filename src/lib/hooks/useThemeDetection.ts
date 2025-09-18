import { useState, useCallback, useEffect } from "react";
import type {
  UseThemeDetectionReturn,
} from "../types";
import {
  getDefaultTheme,
} from "../utils";

/**
 * Hook for theme detection and management
 * Integrates with system theme preferences and provides theme state management
 * @param themeMode - Optional theme mode override: 'light', 'dark', or 'auto' (default: 'auto')
 */
export function useThemeDetection(themeMode: 'light' | 'dark' | 'auto' = 'auto'): UseThemeDetectionReturn {
  const [isDark, setIsDark] = useState(false);
  const [theme, setTheme] = useState(() => getDefaultTheme("light"));

  // Check if media queries are supported
  const supportsMediaQuery = useCallback(() => {
    return typeof window !== "undefined" && window.matchMedia;
  }, []);

  // Detect system theme preference
  const detectSystemTheme = useCallback(() => {
    if (!supportsMediaQuery()) return false;

    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  }, [supportsMediaQuery]);

  // Update theme based on dark mode state
  const updateTheme = useCallback((darkMode: boolean) => {
    const newTheme = getDefaultTheme(darkMode ? "dark" : "light");
    setTheme(newTheme);
    setIsDark(darkMode);
  }, []);

  // Toggle between light and dark themes
  const toggleTheme = useCallback(() => {
    updateTheme(!isDark);
  }, [isDark, updateTheme]);

  // Handle theme mode changes and system theme detection
  useEffect(() => {
    // Handle manual theme mode override
    if (themeMode === 'light') {
      updateTheme(false);
      return; // Don't set up system listeners for manual modes
    }

    if (themeMode === 'dark') {
      updateTheme(true);
      return; // Don't set up system listeners for manual modes
    }

    // Only set up system theme detection for 'auto' mode
    if (themeMode === 'auto' && supportsMediaQuery()) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      // Set initial theme based on system preference
      const systemIsDark = detectSystemTheme();
      updateTheme(systemIsDark);

      // Listen for changes
      const handleChange = (e: MediaQueryListEvent) => {
        updateTheme(e.matches);
      };

      // Use the modern addEventListener if available, fallback to addListener
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange);
      }

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener("change", handleChange);
        } else {
          // Fallback for older browsers
          mediaQuery.removeListener(handleChange);
        }
      };
    } else if (themeMode === 'auto') {
      // Fallback when media queries aren't supported - default to light
      updateTheme(false);
    }
  }, [themeMode, supportsMediaQuery, detectSystemTheme, updateTheme]);

  return {
    theme,
    isDark,
    toggleTheme,
  };
}
