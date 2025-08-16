import { logger } from '@/lib/logger';

interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  [key: string]: unknown;
}

interface EventListenerElement {
  _eventListeners?: Record<string, EventListener[]>;
}
/**
 * Bundle optimization utilities for the learning application
 */

// Dynamic imports for code splitting
export const dynamicImports = {
  // Lazy load heavy components
  ExercisePanel: () => import("../components/ExercisePanel"),
  ProgressTracker: () => import("../components/ProgressTracker"),
  VocabularyProgressManager: () =>
    import("../components/VocabularyProgressManager"),
  SettingsPanel: () => import("../components/SettingsPanel"),
  AccessibilityPanel: () => import("../components/AccessibilityPanel"),

  // Lazy load utility libraries
  audioUtils: () => import("../utils/audioUtils"),
  offlineUtils: () => import("../utils/offlineUtils"),

  // Lazy load chart libraries if needed
  charts: () => import("recharts").then((module) => ({ Charts: module })),
};

// Preload critical resources
export const preloadCriticalResources = () => {
  if (typeof window === "undefined") return;

  // Preload critical CSS
  const criticalCSS = [
    "/app/learning/styles/high-contrast.css",
    "/app/learning/styles/reduced-motion.css",
  ];

  criticalCSS.forEach((href) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "style";
    link.href = href;
    document.head.appendChild(link);
  });

  // Preload critical fonts
  const criticalFonts = ["/fonts/inter-var.woff2"];

  criticalFonts.forEach((href) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "font";
    link.type = "font/woff2";
    link.crossOrigin = "anonymous";
    link.href = href;
    document.head.appendChild(link);
  });
};

// Resource hints for better performance
export const addResourceHints = () => {
  if (typeof window === "undefined") return;

  // DNS prefetch for external resources
  const dnsPrefetchDomains = [
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com",
  ];

  dnsPrefetchDomains.forEach((domain) => {
    const link = document.createElement("link");
    link.rel = "dns-prefetch";
    link.href = domain;
    document.head.appendChild(link);
  });

  // Preconnect to critical origins
  const preconnectOrigins = [
    "https://api.example.com", // Replace with actual API domain
  ];

  preconnectOrigins.forEach((origin) => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = origin;
    document.head.appendChild(link);
  });
};

// Image optimization utilities
export const imageOptimization = {
  // Generate responsive image srcSet
  generateSrcSet: (
    baseUrl: string,
    sizes: number[] = [320, 640, 1024, 1280]
  ) => {
    return sizes.map((size) => `${baseUrl}?w=${size} ${size}w`).join(", ");
  },

  // Generate sizes attribute
  generateSizes: (
    breakpoints: { [key: string]: string } = {
      "(max-width: 640px)": "100vw",
      "(max-width: 1024px)": "50vw",
      default: "33vw",
    }
  ) => {
    const entries = Object.entries(breakpoints);
    const mediaQueries = entries
      .slice(0, -1)
      .map(([query, size]) => `${query} ${size}`);
    const defaultSize = entries[entries.length - 1][1];
    return [...mediaQueries, defaultSize].join(", ");
  },

  // Lazy loading intersection observer
  createLazyLoadObserver: (
    callback: (entry: IntersectionObserverEntry) => void
  ) => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return null;
    }

    return new IntersectionObserver(
      (entries) => {
        entries.forEach(callback);
      },
      {
        rootMargin: "50px 0px",
        threshold: 0.01,
      }
    );
  },
};

// Performance monitoring
export const performanceMonitoring = {
  // Measure component render time
  measureRenderTime: (componentName: string, renderFn: () => void) => {
    if (typeof window === "undefined" || !window.performance) {
      renderFn();
      return;
    }

    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();

    logger.info(`${componentName} render time: ${endTime - startTime}ms`);

    // Send to analytics if needed
    if (window.gtag) {
      window.gtag("event", "timing_complete", {
        name: `${componentName}_render`,
        value: Math.round(endTime - startTime),
      });
    }
  },

  // Measure API response time
  measureApiTime: async <T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    if (typeof window === "undefined" || !window.performance) {
      return apiCall();
    }

    const startTime = performance.now();
    try {
      const result = await apiCall();
      const endTime = performance.now();

      logger.info(`${apiName} API time: ${endTime - startTime}ms`);

      // Send to analytics if needed
      if (window.gtag) {
        window.gtag("event", "timing_complete", {
          name: `${apiName}_api`,
          value: Math.round(endTime - startTime),
        });
      }

      return result;
    } catch (error) {
      const endTime = performance.now();
      logger.error(
        `${apiName} API error after ${endTime - startTime}ms:`,
        error
      );
      throw error;
    }
  },

  // Report Core Web Vitals
  reportWebVitals: (metric: WebVitalsMetric) => {
    if (typeof window === "undefined") return;

    logger.info(metric);

    // Send to analytics
    if (window.gtag) {
      window.gtag("event", metric.name, {
        value: Math.round(
          metric.name === "CLS" ? metric.value * 1000 : metric.value
        ),
        event_label: metric.id,
        non_interaction: true,
      });
    }
  },
};

// Memory management
export const memoryManagement = {
  // Clean up event listeners
  cleanupEventListeners: (element: HTMLElement, events: string[]) => {
    events.forEach((event) => {
      const listeners =
        (element as EventListenerElement)._eventListeners?.[event] || [];
      listeners.forEach((listener: EventListener) => {
        element.removeEventListener(event, listener);
      });
    });
  },

  // Debounce function for performance
  debounce: <T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number,
    immediate?: boolean
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;

    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };

      const callNow = immediate && !timeout;

      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);

      if (callNow) func(...args);
    };
  },

  // Throttle function for performance
  throttle: <T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;

    return function executedFunction(...args: Parameters<T>) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};

// Service Worker utilities
export const serviceWorkerUtils = {
  // Register service worker
  register: async (swUrl: string) => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(swUrl);
      logger.info("Service Worker registered successfully:", registration);
      return registration;
    } catch (error) {
      logger.error("Service Worker registration failed:", error);
      return null;
    }
  },

  // Update service worker
  update: async (registration: ServiceWorkerRegistration) => {
    try {
      await registration.update();
      logger.info("Service Worker updated successfully");
    } catch (error) {
      logger.error("Service Worker update failed:", error);
    }
  },

  // Check for updates
  checkForUpdates: (registration: ServiceWorkerRegistration) => {
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // New content is available, prompt user to refresh
            if (
              confirm(
                "Có phiên bản mới của ứng dụng. Bạn có muốn tải lại không?"
              )
            ) {
              window.location.reload();
            }
          }
        });
      }
    });
  },
};

// Initialize all optimizations
export const initializeOptimizations = () => {
  preloadCriticalResources();
  addResourceHints();

  // Register service worker
  serviceWorkerUtils.register("/sw.js").then((registration) => {
    if (registration) {
      serviceWorkerUtils.checkForUpdates(registration);
    }
  });
};

// Export for use in _app.tsx or layout.tsx
export default {
  dynamicImports,
  preloadCriticalResources,
  addResourceHints,
  imageOptimization,
  performanceMonitoring,
  memoryManagement,
  serviceWorkerUtils,
  initializeOptimizations,
};
