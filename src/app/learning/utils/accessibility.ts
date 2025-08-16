/**
 * Accessibility utilities for the learning application
 */

// Keyboard navigation constants
export const KEYBOARD_KEYS = {
  ENTER: "Enter",
  SPACE: " ",
  ESCAPE: "Escape",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  TAB: "Tab",
  HOME: "Home",
  END: "End",
} as const;

// ARIA live region announcements
export class AriaLiveAnnouncer {
  private static instance: AriaLiveAnnouncer;
  private liveRegion: HTMLElement | null = null;

  private constructor() {
    this.createLiveRegion();
  }

  public static getInstance(): AriaLiveAnnouncer {
    if (!AriaLiveAnnouncer.instance) {
      AriaLiveAnnouncer.instance = new AriaLiveAnnouncer();
    }
    return AriaLiveAnnouncer.instance;
  }

  private createLiveRegion(): void {
    if (typeof window === "undefined") return;

    this.liveRegion = document.createElement("div");
    this.liveRegion.setAttribute("aria-live", "polite");
    this.liveRegion.setAttribute("aria-atomic", "true");
    this.liveRegion.className = "sr-only";
    this.liveRegion.style.position = "absolute";
    this.liveRegion.style.left = "-10000px";
    this.liveRegion.style.width = "1px";
    this.liveRegion.style.height = "1px";
    this.liveRegion.style.overflow = "hidden";

    document.body.appendChild(this.liveRegion);
  }

  public announce(
    message: string,
    priority: "polite" | "assertive" = "polite"
  ): void {
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute("aria-live", priority);
    this.liveRegion.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = "";
      }
    }, 1000);
  }
}

// Focus management utilities
export class FocusManager {
  private static focusStack: HTMLElement[] = [];

  public static saveFocus(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      this.focusStack.push(activeElement);
    }
  }

  public static restoreFocus(): void {
    const lastFocused = this.focusStack.pop();
    if (lastFocused && lastFocused.focus) {
      lastFocused.focus();
    }
  }

  public static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== KEYBOARD_KEYS.TAB) return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener("keydown", handleTabKey);

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    // Return cleanup function
    return () => {
      container.removeEventListener("keydown", handleTabKey);
    };
  }
}

// High contrast mode detection and management
export class HighContrastManager {
  private static instance: HighContrastManager;
  private isHighContrast = false;
  private listeners: ((enabled: boolean) => void)[] = [];

  private constructor() {
    this.detectHighContrast();
    this.setupMediaQuery();
  }

  public static getInstance(): HighContrastManager {
    if (!HighContrastManager.instance) {
      HighContrastManager.instance = new HighContrastManager();
    }
    return HighContrastManager.instance;
  }

  private detectHighContrast(): void {
    if (typeof window === "undefined") return;

    // Check for Windows high contrast mode
    const testElement = document.createElement("div");
    testElement.style.border = "1px solid";
    testElement.style.borderColor = "red green";
    document.body.appendChild(testElement);

    const computedStyle = window.getComputedStyle(testElement);
    const borderTopColor = computedStyle.borderTopColor;
    const borderRightColor = computedStyle.borderRightColor;

    this.isHighContrast = borderTopColor === borderRightColor;
    document.body.removeChild(testElement);

    // Check for forced-colors media query
    if (window.matchMedia) {
      const forcedColorsQuery = window.matchMedia("(forced-colors: active)");
      this.isHighContrast = this.isHighContrast || forcedColorsQuery.matches;
    }
  }

  private setupMediaQuery(): void {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const forcedColorsQuery = window.matchMedia("(forced-colors: active)");
    forcedColorsQuery.addEventListener("change", (e) => {
      this.isHighContrast = e.matches;
      this.notifyListeners();
    });
  }

  public isEnabled(): boolean {
    return this.isHighContrast;
  }

  public toggle(): void {
    this.isHighContrast = !this.isHighContrast;
    this.updateBodyClass();
    this.notifyListeners();
  }

  public enable(): void {
    this.isHighContrast = true;
    this.updateBodyClass();
    this.notifyListeners();
  }

  public disable(): void {
    this.isHighContrast = false;
    this.updateBodyClass();
    this.notifyListeners();
  }

  private updateBodyClass(): void {
    if (typeof document === "undefined") return;

    if (this.isHighContrast) {
      document.body.classList.add("high-contrast");
    } else {
      document.body.classList.remove("high-contrast");
    }
  }

  public addListener(callback: (enabled: boolean) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.isHighContrast));
  }
}

// Screen reader utilities
export const ScreenReaderUtils = {
  // Generate descriptive text for complex UI elements
  generateDescription: (element: {
    type: string;
    state?: string;
    value?: string | number;
    total?: number;
  }): string => {
    const { type, state, value, total } = element;

    switch (type) {
      case "progress":
        return `Tiến độ: ${value} trên ${total}. ${Math.round(((value as number) / (total as number)) * 100)}% hoàn thành.`;
      case "audio-player":
        return `Trình phát âm thanh. Trạng thái: ${state}. Thời gian hiện tại: ${value}.`;
      case "vocabulary-word":
        return `Từ vựng tiếng Anh: ${value}. Nhấn Enter hoặc Space để xem định nghĩa.`;
      case "exercise":
        return `Bài tập ${value} trên ${total}. Trạng thái: ${state}.`;
      default:
        return "";
    }
  },

  // Announce dynamic content changes
  announceChange: (
    message: string,
    priority: "polite" | "assertive" = "polite"
  ): void => {
    AriaLiveAnnouncer.getInstance().announce(message, priority);
  },

  // Generate skip link text
  generateSkipLinkText: (target: string): string => {
    const skipTexts: Record<string, string> = {
      "main-content": "Chuyển đến nội dung chính",
      navigation: "Chuyển đến điều hướng",
      "story-content": "Chuyển đến nội dung truyện",
      exercises: "Chuyển đến bài tập",
      vocabulary: "Chuyển đến từ vựng",
      "audio-controls": "Chuyển đến điều khiển âm thanh",
    };
    return skipTexts[target] || `Chuyển đến ${target}`;
  },
};

// Keyboard navigation helpers
export const KeyboardNavigation = {
  // Handle arrow key navigation in lists
  handleArrowNavigation: (
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onIndexChange: (newIndex: number) => void
  ): void => {
    const { key } = event;
    let newIndex = currentIndex;

    switch (key) {
      case KEYBOARD_KEYS.ARROW_UP:
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case KEYBOARD_KEYS.ARROW_DOWN:
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case KEYBOARD_KEYS.HOME:
        newIndex = 0;
        break;
      case KEYBOARD_KEYS.END:
        newIndex = items.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    onIndexChange(newIndex);
    items[newIndex]?.focus();
  },

  // Handle Enter/Space activation
  handleActivation: (event: KeyboardEvent, callback: () => void): void => {
    if (
      event.key === KEYBOARD_KEYS.ENTER ||
      event.key === KEYBOARD_KEYS.SPACE
    ) {
      event.preventDefault();
      callback();
    }
  },
};

// Color contrast utilities
export const ColorContrast = {
  // Calculate contrast ratio between two colors
  calculateContrastRatio: (color1: string, color2: string): number => {
    const getLuminance = (color: string): number => {
      // Simple luminance calculation (would need more robust implementation)
      const rgb = color.match(/\d+/g);
      if (!rgb) return 0;

      const [r, g, b] = rgb.map((c) => {
        const val = parseInt(c) / 255;
        return val <= 0.03928
          ? val / 12.92
          : Math.pow((val + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Check if contrast meets WCAG standards
  meetsWCAGStandards: (
    contrastRatio: number,
    level: "AA" | "AAA" = "AA"
  ): boolean => {
    return level === "AA" ? contrastRatio >= 4.5 : contrastRatio >= 7;
  },
};
