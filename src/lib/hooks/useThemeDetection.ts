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
 */
export function useThemeDetection(): UseThemeDetectionReturn {
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

  // Listen for system theme changes
  useEffect(() => {
    if (!supportsMediaQuery()) return;

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
  }, [supportsMediaQuery, detectSystemTheme, updateTheme]);

  return {
    theme,
    isDark,
    toggleTheme,
  };
}
