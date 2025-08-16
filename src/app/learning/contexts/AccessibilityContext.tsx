"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { HighContrastManager, AriaLiveAnnouncer } from "../utils/accessibility";

interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: "small" | "medium" | "large" | "extra-large";
  keyboardNavigation: boolean;
  screenReaderOptimized: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
  announce: (message: string, priority?: "polite" | "assertive") => void;
  isHighContrastMode: boolean;
  toggleHighContrast: () => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  fontSize: "medium",
  keyboardNavigation: true,
  screenReaderOptimized: false,
};

const AccessibilityContext = createContext<
  AccessibilityContextType | undefined
>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({
  children,
}: AccessibilityProviderProps) {
  const [settings, setSettings] =
    useState<AccessibilitySettings>(defaultSettings);
  const [isHighContrastMode, setIsHighContrastMode] = useState(false);

  // Initialize accessibility managers
  useEffect(() => {
    const highContrastManager = HighContrastManager.getInstance();
    const announcer = AriaLiveAnnouncer.getInstance();

    // Set initial high contrast state
    setIsHighContrastMode(highContrastManager.isEnabled());

    // Listen for high contrast changes
    const unsubscribe = highContrastManager.addListener((enabled) => {
      setIsHighContrastMode(enabled);
      setSettings((prev) => ({ ...prev, highContrast: enabled }));
    });

    // Detect reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSettings((prev) => ({ ...prev, reducedMotion: mediaQuery.matches }));

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setSettings((prev) => ({ ...prev, reducedMotion: e.matches }));
    };

    mediaQuery.addEventListener("change", handleReducedMotionChange);

    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem("accessibility-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn("Failed to parse saved accessibility settings:", error);
      }
    }

    return () => {
      unsubscribe();
      mediaQuery.removeEventListener("change", handleReducedMotionChange);
    };
  }, []);

  // Apply font size changes
  useEffect(() => {
    const fontSizeMap = {
      small: "14px",
      medium: "16px",
      large: "18px",
      "extra-large": "20px",
    };

    document.documentElement.style.fontSize = fontSizeMap[settings.fontSize];
  }, [settings.fontSize]);

  // Apply reduced motion
  useEffect(() => {
    if (settings.reducedMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  }, [settings.reducedMotion]);

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };

      // Save to localStorage
      localStorage.setItem(
        "accessibility-settings",
        JSON.stringify(newSettings)
      );

      return newSettings;
    });
  };

  const announce = (
    message: string,
    priority: "polite" | "assertive" = "polite"
  ) => {
    AriaLiveAnnouncer.getInstance().announce(message, priority);
  };

  const toggleHighContrast = () => {
    const highContrastManager = HighContrastManager.getInstance();
    highContrastManager.toggle();
  };

  const value: AccessibilityContextType = {
    settings,
    updateSettings,
    announce,
    isHighContrastMode,
    toggleHighContrast,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider"
    );
  }
  return context;
}

// Hook for keyboard navigation
export function useKeyboardNavigation() {
  const { settings } = useAccessibility();

  const handleKeyDown = (
    event: React.KeyboardEvent,
    handlers: {
      onEnter?: () => void;
      onSpace?: () => void;
      onEscape?: () => void;
      onArrowUp?: () => void;
      onArrowDown?: () => void;
      onArrowLeft?: () => void;
      onArrowRight?: () => void;
      onTab?: () => void;
      onHome?: () => void;
      onEnd?: () => void;
    }
  ) => {
    if (!settings.keyboardNavigation) return;

    const { key } = event;
    const handler = {
      Enter: handlers.onEnter,
      " ": handlers.onSpace,
      Escape: handlers.onEscape,
      ArrowUp: handlers.onArrowUp,
      ArrowDown: handlers.onArrowDown,
      ArrowLeft: handlers.onArrowLeft,
      ArrowRight: handlers.onArrowRight,
      Tab: handlers.onTab,
      Home: handlers.onHome,
      End: handlers.onEnd,
    }[key];

    if (handler) {
      event.preventDefault();
      handler();
    }
  };

  return { handleKeyDown, keyboardEnabled: settings.keyboardNavigation };
}

// Hook for screen reader announcements
export function useScreenReader() {
  const { announce, settings } = useAccessibility();

  const announceChange = (
    message: string,
    priority: "polite" | "assertive" = "polite"
  ) => {
    if (settings.screenReaderOptimized) {
      announce(message, priority);
    }
  };

  const announceNavigation = (location: string) => {
    announceChange(`Đã chuyển đến ${location}`, "polite");
  };

  const announceAction = (action: string) => {
    announceChange(action, "assertive");
  };

  const announceError = (error: string) => {
    announceChange(`Lỗi: ${error}`, "assertive");
  };

  const announceSuccess = (message: string) => {
    announceChange(`Thành công: ${message}`, "polite");
  };

  return {
    announceChange,
    announceNavigation,
    announceAction,
    announceError,
    announceSuccess,
    isOptimized: settings.screenReaderOptimized,
  };
}
