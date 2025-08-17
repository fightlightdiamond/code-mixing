# Frontend Performance Optimization Guide

## Overview

This guide provides comprehensive frontend performance optimization strategies for the EdTech platform built with Next.js 15, React, and TypeScript. The optimizations focus on Core Web Vitals, bundle optimization, rendering performance, and user experience.

## Table of Contents

1. [Core Web Vitals Optimization](#core-web-vitals-optimization)
2. [Bundle Optimization](#bundle-optimization)
3. [Rendering Performance](#rendering-performance)
4. [Asset Optimization](#asset-optimization)
5. [Memory Management](#memory-management)
6. [Performance Monitoring](#performance-monitoring)

## Core Web Vitals Optimization

### Largest Contentful Paint (LCP) Optimization

```typescript
// components/performance/LCPOptimizer.tsx
import { useEffect, useRef } from 'react';
import Image from 'next/image';

interface LCPOptimizedImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  onLoad?: () => void;
}

export function LCPOptimizedImage({
  src,
  alt,
  priority = false,
  className,
  onLoad,
}: LCPOptimizedImageProps) {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Preload critical images
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [src, priority]);

  return (
    <Image
      ref={imageRef}
      src={src}
      alt={alt}
      priority={priority}
      className={className}
      quality={85}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      onLoad={onLoad}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}

// Hook for LCP monitoring
export function useLCPMonitoring() {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      if (lastEntry) {
        const lcp = lastEntry.startTime;

        // Log LCP for monitoring
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'web_vitals', {
            name: 'LCP',
            value: Math.round(lcp),
            event_category: 'Web Vitals',
          });
        }

        // Alert if LCP is poor (> 2.5s)
        if (lcp > 2500) {
          console.warn(`Poor LCP detected: ${lcp.toFixed(2)}ms`);
        }
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });

    return () => observer.disconnect();
  }, []);
}
```

### First Input Delay (FID) Optimization

```typescript
// hooks/useFIDOptimization.ts
import { useCallback, useEffect, useRef } from "react";

export function useFIDOptimization() {
  const isInputPending = useRef(false);
  const inputBuffer = useRef<(() => void)[]>([]);

  // Defer non-critical work to improve FID
  const deferWork = useCallback((work: () => void) => {
    if (isInputPending.current) {
      inputBuffer.current.push(work);
    } else {
      // Use scheduler.postTask if available, otherwise setTimeout
      if ("scheduler" in window && "postTask" in window.scheduler) {
        (window.scheduler as any).postTask(work, { priority: "background" });
      } else {
        setTimeout(work, 0);
      }
    }
  }, []);

  // Process buffered work when input is no longer pending
  const processBufferedWork = useCallback(() => {
    if (inputBuffer.current.length > 0) {
      const work = inputBuffer.current.shift();
      if (work) {
        work();
        // Process next item in next frame
        requestAnimationFrame(processBufferedWork);
      }
    }
  }, []);

  useEffect(() => {
    const handleInputStart = () => {
      isInputPending.current = true;
    };

    const handleInputEnd = () => {
      isInputPending.current = false;
      processBufferedWork();
    };

    // Listen for input events
    document.addEventListener("pointerdown", handleInputStart);
    document.addEventListener("keydown", handleInputStart);
    document.addEventListener("pointerup", handleInputEnd);
    document.addEventListener("keyup", handleInputEnd);

    return () => {
      document.removeEventListener("pointerdown", handleInputStart);
      document.removeEventListener("keydown", handleInputStart);
      document.removeEventListener("pointerup", handleInputEnd);
      document.removeEventListener("keyup", handleInputEnd);
    };
  }, [processBufferedWork]);

  return { deferWork };
}

// Optimized event handlers to reduce FID
export function useOptimizedEventHandlers() {
  const { deferWork } = useFIDOptimization();

  const createOptimizedHandler = useCallback(
    (handler: () => void, immediate: boolean = false) => {
      return () => {
        if (immediate) {
          handler();
        } else {
          deferWork(handler);
        }
      };
    },
    [deferWork]
  );

  return { createOptimizedHandler };
}
```

### Cumulative Layout Shift (CLS) Prevention

```typescript
// components/performance/CLSPrevention.tsx
import { useState, useEffect, useRef, ReactNode } from 'react';

interface StableContainerProps {
  children: ReactNode;
  minHeight?: number;
  className?: string;
}

export function StableContainer({
  children,
  minHeight = 200,
  className
}: StableContainerProps) {
  const [contentHeight, setContentHeight] = useState(minHeight);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height } = entry.contentRect;
        if (height > contentHeight) {
          setContentHeight(height);
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [contentHeight]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: contentHeight }}
    >
      {children}
    </div>
  );
}

// Hook for preventing layout shifts during dynamic content loading
export function useLayoutStabilization() {
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const measureRef = useCallback((node: HTMLElement | null) => {
    if (node) {
      const { width, height } = node.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, []);

  return { dimensions, measureRef };
}

// Skeleton loader to prevent CLS
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}

export function Skeleton({
  width = '100%',
  height = 20,
  className = '',
  variant = 'rectangular'
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200';
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      aria-label="Loading..."
    />
  );
}

// Story card with CLS prevention
export function StoryCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <Skeleton height={200} variant="rectangular" />
      <Skeleton height={24} width="80%" variant="text" />
      <Skeleton height={16} width="60%" variant="text" />
      <div className="flex space-x-2">
        <Skeleton height={20} width={60} variant="rectangular" />
        <Skeleton height={20} width={80} variant="rectangular" />
      </div>
    </div>
  );
}
```

## Bundle Optimization

### Code Splitting Strategies

```typescript
// lib/code-splitting/dynamic-imports.ts
import { lazy, ComponentType } from 'react';
import dynamic from 'next/dynamic';

// Route-based code splitting
export const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
export const LearningModule = lazy(() => import('../pages/learning/LearningModule'));
export const AnalyticsPanel = lazy(() => import('../components/analytics/AnalyticsPanel'));

// Component-based code splitting with loading states
export const StoryReader = dynamic(
  () => import('../components/learning/StoryReader'),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />,
    ssr: false, // Disable SSR for heavy interactive components
  }
);

export const AudioPlayer = dynamic(
  () => import('../components/learning/AudioPlayer'),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-16 rounded-lg" />,
    ssr: false,
  }
);

// Feature-based code splitting
export const ExercisePanel = dynamic(
  () => import('../components/learning/ExercisePanel'),
  {
    loading: () => <div>Loading exercises...</div>,
  }
);

// Conditional loading based on user permissions
export const createConditionalComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  condition: () => boolean
) => {
  return dynamic(
    async () => {
      if (condition()) {
        return await importFn();
      }
      return { default: () => null };
    },
    { ssr: false }
  );
};

// Usage example
export const AdminOnlyComponent = createConditionalComponent(
  () => import('../components/admin/AdminPanel'),
  () => {
    // Check user permissions
    const user = getCurrentUser();
    return user?.role === 'admin';
  }
);
```

### Bundle Analysis and Optimization

```typescript
// scripts/bundle-analyzer.ts
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import { NextConfig } from "next";

export const withBundleAnalyzer = (nextConfig: NextConfig = {}) => {
  return {
    ...nextConfig,
    webpack: (
      config: any,
      { buildId, dev, isServer, defaultLoaders, webpack }: any
    ) => {
      // Run bundle analyzer in production builds
      if (!dev && !isServer && process.env.ANALYZE === "true") {
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: "static",
            openAnalyzer: false,
            reportFilename: "bundle-analyzer-report.html",
          })
        );
      }

      // Optimize chunks
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            // Vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              priority: 10,
              enforce: true,
            },

            // Common components
            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              priority: 5,
              reuseExistingChunk: true,
            },

            // Learning module
            learning: {
              test: /[\\/]src[\\/](components|pages)[\\/]learning[\\/]/,
              name: "learning",
              chunks: "all",
              priority: 8,
            },

            // Admin module
            admin: {
              test: /[\\/]src[\\/](components|pages)[\\/]admin[\\/]/,
              name: "admin",
              chunks: "all",
              priority: 8,
            },

            // UI components
            ui: {
              test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
              name: "ui",
              chunks: "all",
              priority: 7,
            },
          },
        },
      };

      // Tree shaking optimization
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;

      // Minimize bundle size
      if (!dev) {
        config.optimization.minimize = true;
      }

      if (typeof nextConfig.webpack === "function") {
        return nextConfig.webpack(config, {
          buildId,
          dev,
          isServer,
          defaultLoaders,
          webpack,
        });
      }

      return config;
    },
  };
};

// Bundle size monitoring
export class BundleSizeMonitor {
  private sizeThresholds = {
    total: 2 * 1024 * 1024, // 2MB
    vendor: 1 * 1024 * 1024, // 1MB
    main: 500 * 1024, // 500KB
  };

  async checkBundleSize(): Promise<BundleSizeReport> {
    const buildDir = ".next/static/chunks";
    const fs = await import("fs");
    const path = await import("path");

    const chunks = fs
      .readdirSync(buildDir)
      .filter((file) => file.endsWith(".js"));
    const sizes: Record<string, number> = {};
    let totalSize = 0;

    for (const chunk of chunks) {
      const filePath = path.join(buildDir, chunk);
      const stats = fs.statSync(filePath);
      sizes[chunk] = stats.size;
      totalSize += stats.size;
    }

    const report: BundleSizeReport = {
      totalSize,
      chunks: sizes,
      warnings: [],
      recommendations: [],
    };

    // Check thresholds
    if (totalSize > this.sizeThresholds.total) {
      report.warnings.push(
        `Total bundle size (${this.formatSize(totalSize)}) exceeds threshold`
      );
    }

    // Check individual chunks
    for (const [chunk, size] of Object.entries(sizes)) {
      if (chunk.includes("vendor") && size > this.sizeThresholds.vendor) {
        report.warnings.push(
          `Vendor chunk ${chunk} (${this.formatSize(size)}) is too large`
        );
        report.recommendations.push("Consider splitting vendor dependencies");
      }
    }

    return report;
  }

  private formatSize(bytes: number): string {
    const kb = bytes / 1024;
    const mb = kb / 1024;

    if (mb >= 1) {
      return `${mb.toFixed(2)}MB`;
    } else {
      return `${kb.toFixed(2)}KB`;
    }
  }
}

interface BundleSizeReport {
  totalSize: number;
  chunks: Record<string, number>;
  warnings: string[];
  recommendations: string[];
}
```

### Tree Shaking Optimization

```typescript
// lib/tree-shaking/optimized-imports.ts

// ❌ Bad: Imports entire library
// import * as _ from 'lodash';

// ✅ Good: Import only what you need
import { debounce, throttle } from "lodash";

// ❌ Bad: Imports entire date library
// import moment from 'moment';

// ✅ Good: Use smaller alternatives
import { format, parseISO } from "date-fns";

// Optimized utility imports
export const optimizedUtils = {
  // Use native methods when possible
  debounce: (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  },

  // Lightweight date formatting
  formatDate: (date: string | Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  },

  // Optimized array utilities
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  // Lightweight deep clone
  deepClone: <T>(obj: T): T => {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
    if (obj instanceof Array)
      return obj.map((item) => optimizedUtils.deepClone(item)) as unknown as T;

    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = optimizedUtils.deepClone(obj[key]);
      }
    }
    return cloned;
  },
};

// Conditional imports for better tree shaking
export const conditionalImports = {
  // Load heavy libraries only when needed
  loadChartLibrary: async () => {
    const { Chart } = await import("chart.js");
    return Chart;
  },

  loadMarkdownParser: async () => {
    const { marked } = await import("marked");
    return marked;
  },

  loadImageEditor: async () => {
    const { default: ImageEditor } = await import("react-image-editor");
    return ImageEditor;
  },
};

// Webpack magic comments for better chunk naming
export const dynamicImports = {
  loadAdminModule: () =>
    import(
      /* webpackChunkName: "admin-module" */
      "../modules/admin"
    ),

  loadLearningModule: () =>
    import(
      /* webpackChunkName: "learning-module" */
      /* webpackPreload: true */
      "../modules/learning"
    ),

  loadAnalyticsModule: () =>
    import(
      /* webpackChunkName: "analytics-module" */
      /* webpackPrefetch: true */
      "../modules/analytics"
    ),
};
```

## Rendering Performance

### React Performance Optimization

```typescript
// hooks/useRenderOptimization.ts
import {
  memo,
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
  startTransition,
} from "react";

// Memoized component wrapper
export function withMemoization<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  areEqual?: (prevProps: T, nextProps: T) => boolean
) {
  return memo(Component, areEqual);
}

// Custom hook for expensive calculations
export function useExpensiveCalculation<T>(
  calculateFn: () => T,
  dependencies: React.DependencyList
): T {
  return useMemo(calculateFn, dependencies);
}

// Optimized event handlers
export function useOptimizedCallbacks() {
  const handleClick = useCallback((id: string) => {
    startTransition(() => {
      // Non-urgent updates wrapped in startTransition
      console.log("Clicked:", id);
    });
  }, []);

  const handleInputChange = useCallback((value: string) => {
    // Urgent updates (user input) not wrapped
    console.log("Input changed:", value);
  }, []);

  return { handleClick, handleInputChange };
}

// Virtual scrolling for large lists
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return { visibleItems, handleScroll };
}

// Intersection Observer for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasIntersected, options]);

  return { elementRef, isIntersecting, hasIntersected };
}
```

### Component Optimization Patterns

```typescript
// components/optimized/OptimizedStoryCard.tsx
import { memo, useCallback } from 'react';
import { LCPOptimizedImage } from '../performance/LCPOptimizer';

interface StoryCardProps {
  story: {
    id: string;
    title: string;
    level: string;
    thumbnail: string;
    duration: number;
  };
  onStoryClick: (storyId: string) => void;
  isVisible?: boolean;
}

// Memoized story card with custom comparison
export const OptimizedStoryCard = memo<StoryCardProps>(({
  story,
  onStoryClick,
  isVisible = true,
}) => {
  const handleClick = useCallback(() => {
    onStoryClick(story.id);
  }, [story.id, onStoryClick]);

  // Don't render if not visible (virtual scrolling)
  if (!isVisible) {
    return <div style={{ height: 200 }} />;
  }

  return (
    <div
      className="story-card border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}
    >
      <LCPOptimizedImage
        src={story.thumbnail}
        alt={story.title}
        className="w-full h-32 object-cover rounded"
        priority={false}
      />
      <h3 className="mt-2 font-semibold text-lg">{story.title}</h3>
      <div className="flex justify-between items-center mt-2">
        <span className="text-sm text-gray-600">{story.level}</span>
        <span className="text-sm text-gray-600">{story.duration} min</span>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.story.id === nextProps.story.id &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.onStoryClick === nextProps.onStoryClick
  );
});

OptimizedStoryCard.displayName = 'OptimizedStoryCard';

// Virtualized story list
interface VirtualizedStoryListProps {
  stories: StoryCardProps['story'][];
  onStoryClick: (storyId: string) => void;
}

export function VirtualizedStoryList({
  stories,
  onStoryClick
}: VirtualizedStoryListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { visibleItems, handleScroll } = useVirtualScrolling(
    stories,
    220, // Item height including margin
    600  // Container height
  );

  return (
    <div
      ref={containerRef}
      className="h-96 overflow-auto"
      onScroll={handleScroll}
    >
      <div style={{ height: visibleItems.totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleItems.offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.items.map((story, index) => (
            <div key={story.id} className="mb-4">
              <OptimizedStoryCard
                story={story}
                onStoryClick={onStoryClick}
                isVisible={true}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Concurrent Features Optimization

```typescript
// hooks/useConcurrentFeatures.ts
import {
  useDeferredValue,
  useTransition,
  useState,
  useCallback,
  startTransition,
} from "react";

// Deferred search results
export function useDeferredSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const handleSearchChange = useCallback((value: string) => {
    // Immediate update for input field
    setSearchTerm(value);

    // Deferred update for search results
    startTransition(() => {
      // This will trigger re-render with deferredSearchTerm
    });
  }, []);

  return {
    searchTerm,
    deferredSearchTerm,
    isPending,
    handleSearchChange,
  };
}

// Optimized data fetching with transitions
export function useOptimizedDataFetching<T>() {
  const [data, setData] = useState<T | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (fetchFn: () => Promise<T>) => {
    startTransition(async () => {
      try {
        setError(null);
        const result = await fetchFn();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  }, []);

  return { data, isPending, error, fetchData };
}

// Priority-based rendering
export function usePriorityRendering() {
  const [highPriorityData, setHighPriorityData] = useState(null);
  const [lowPriorityData, setLowPriorityData] = useState(null);
  const [isPending, startTransition] = useTransition();

  const updateHighPriority = useCallback((data: any) => {
    // Immediate update for critical UI
    setHighPriorityData(data);
  }, []);

  const updateLowPriority = useCallback((data: any) => {
    // Deferred update for non-critical UI
    startTransition(() => {
      setLowPriorityData(data);
    });
  }, []);

  return {
    highPriorityData,
    lowPriorityData,
    isPending,
    updateHighPriority,
    updateLowPriority,
  };
}
```

## Asset Optimization

### Image Optimization Strategy

```typescript
// lib/image-optimization/image-optimizer.ts
export class ImageOptimizer {
  private static instance: ImageOptimizer;
  private imageCache = new Map<string, string>();

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  // Generate responsive image URLs
  generateResponsiveUrls(baseUrl: string): ResponsiveImageUrls {
    const sizes = [320, 640, 768, 1024, 1280, 1920];
    const formats = ["webp", "avif", "jpg"];

    const urls: ResponsiveImageUrls = {
      srcSet: {},
      sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
    };

    formats.forEach((format) => {
      urls.srcSet[format] = sizes
        .map(
          (size) =>
            `${this.buildImageUrl(baseUrl, { width: size, format })} ${size}w`
        )
        .join(", ");
    });

    return urls;
  }

  // Build optimized image URL
  private buildImageUrl(baseUrl: string, options: ImageOptions): string {
    const params = new URLSearchParams();

    if (options.width) params.append("w", options.width.toString());
    if (options.height) params.append("h", options.height.toString());
    if (options.quality) params.append("q", options.quality.toString());
    if (options.format) params.append("f", options.format);

    return `${baseUrl}?${params.toString()}`;
  }

  // Preload critical images
  preloadImage(src: string, priority: "high" | "low" = "low"): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.imageCache.has(src)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.imageCache.set(src, src);
        resolve();
      };
      img.onerror = reject;

      // Set loading priority
      if ("loading" in img) {
        img.loading = priority === "high" ? "eager" : "lazy";
      }

      img.src = src;
    });
  }

  // Lazy load images with intersection observer
  setupLazyLoading(): void {
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;

            if (src) {
              img.src = src;
              img.removeAttribute("data-src");
              imageObserver.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: "50px 0px",
        threshold: 0.01,
      }
    );

    // Observe all lazy images
    document.querySelectorAll("img[data-src]").forEach((img) => {
      imageObserver.observe(img);
    });
  }

  // Generate blur placeholder
  generateBlurPlaceholder(width: number, height: number): string {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    if (ctx) {
      // Create gradient placeholder
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#f3f4f6");
      gradient.addColorStop(1, "#e5e7eb");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    return canvas.toDataURL("image/jpeg", 0.1);
  }
}

interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "avif" | "jpg" | "png";
}

interface ResponsiveImageUrls {
  srcSet: Record<string, string>;
  sizes: string;
}
```

### Font Optimization

```typescript
// lib/font-optimization/font-loader.ts
export class FontLoader {
  private loadedFonts = new Set<string>();
  private fontLoadPromises = new Map<string, Promise<void>>();

  // Preload critical fonts
  preloadFont(fontUrl: string, fontDisplay: string = "swap"): Promise<void> {
    if (this.loadedFonts.has(fontUrl)) {
      return Promise.resolve();
    }

    if (this.fontLoadPromises.has(fontUrl)) {
      return this.fontLoadPromises.get(fontUrl)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "font";
      link.type = "font/woff2";
      link.crossOrigin = "anonymous";
      link.href = fontUrl;

      link.onload = () => {
        this.loadedFonts.add(fontUrl);
        resolve();
      };

      link.onerror = reject;

      document.head.appendChild(link);
    });

    this.fontLoadPromises.set(fontUrl, promise);
    return promise;
  }

  // Load fonts with fallback
  async loadFontWithFallback(
    fontFamily: string,
    fontUrl: string,
    fallbackFonts: string[]
  ): Promise<void> {
    try {
      await this.preloadFont(fontUrl);

      // Apply font to document
      document.documentElement.style.setProperty(
        "--font-primary",
        `${fontFamily}, ${fallbackFonts.join(", ")}`
      );
    } catch (error) {
      console.warn(`Failed to load font ${fontFamily}, using fallback`);

      // Use fallback fonts
      document.documentElement.style.setProperty(
        "--font-primary",
        fallbackFonts.join(", ")
      );
    }
  }

  // Optimize font loading with font-display
  optimizeFontDisplay(): void {
    const style = document.createElement("style");
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url('/fonts/inter-regular.woff2') format('woff2');
      }
      
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 600;
        font-display: swap;
        src: url('/fonts/inter-semibold.woff2') format('woff2');
      }
    `;

    document.head.appendChild(style);
  }

  // Monitor font loading performance
  monitorFontLoading(): void {
    if ("fonts" in document) {
      document.fonts.ready.then(() => {
        console.log("All fonts loaded");

        // Measure font loading performance
        const fontEntries = performance
          .getEntriesByType("resource")
          .filter((entry) => entry.name.includes("font"));

        fontEntries.forEach((entry) => {
          console.log(`Font ${entry.name} loaded in ${entry.duration}ms`);
        });
      });
    }
  }
}

// Font loading hook
export function useFontLoading() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const fontLoader = useRef(new FontLoader());

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Promise.all([
          fontLoader.current.preloadFont("/fonts/inter-regular.woff2"),
          fontLoader.current.preloadFont("/fonts/inter-semibold.woff2"),
        ]);

        setFontsLoaded(true);
      } catch (error) {
        console.error("Font loading failed:", error);
        setFontsLoaded(true); // Continue with fallback fonts
      }
    };

    loadFonts();
    fontLoader.current.monitorFontLoading();
  }, []);

  return { fontsLoaded };
}
```

## Memory Management

### Memory Leak Prevention

```typescript
// hooks/useMemoryManagement.ts
import { useEffect, useRef, useCallback } from "react";

// Cleanup utility for preventing memory leaks
export function useCleanup() {
  const cleanupFunctions = useRef<(() => void)[]>([]);

  const addCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctions.current.push(cleanupFn);
  }, []);

  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {
          console.error("Cleanup error:", error);
        }
      });
      cleanupFunctions.current = [];
    };
  }, []);

  return { addCleanup };
}

// Memory-efficient event listeners
export function useMemoryEfficientEventListener(
  eventName: string,
  handler: EventListener,
  element: HTMLElement | Window | null = null
) {
  const { addCleanup } = useCleanup();
  const savedHandler = useRef<EventListener>();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement = element || window;
    if (!targetElement?.addEventListener) return;

    const eventListener: EventListener = (event) => {
      savedHandler.current?.(event);
    };

    targetElement.addEventListener(eventName, eventListener);

    addCleanup(() => {
      targetElement.removeEventListener(eventName, eventListener);
    });
  }, [eventName, element, addCleanup]);
}

// Memory monitoring hook
export function useMemoryMonitoring() {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatBytes = useCallback((bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }, []);

  return {
    memoryInfo,
    formatBytes,
    memoryUsagePercentage: memoryInfo
      ? (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
      : 0,
  };
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// WeakMap-based cache for memory efficiency
export class MemoryEfficientCache<K extends object, V> {
  private cache = new WeakMap<K, V>();
  private keyRegistry = new Set<WeakRef<K>>();
  private cleanupRegistry = new FinalizationRegistry<WeakRef<K>>((keyRef) => {
    this.keyRegistry.delete(keyRef);
  });

  set(key: K, value: V): void {
    this.cache.set(key, value);

    const keyRef = new WeakRef(key);
    this.keyRegistry.add(keyRef);
    this.cleanupRegistry.register(key, keyRef);
  }

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  // Get approximate size (only counts live references)
  getSize(): number {
    let count = 0;
    for (const keyRef of this.keyRegistry) {
      if (keyRef.deref()) {
        count++;
      }
    }
    return count;
  }

  // Manual cleanup of dead references
  cleanup(): void {
    const deadRefs: WeakRef<K>[] = [];

    for (const keyRef of this.keyRegistry) {
      if (!keyRef.deref()) {
        deadRefs.push(keyRef);
      }
    }

    deadRefs.forEach((ref) => this.keyRegistry.delete(ref));
  }
}
```

This comprehensive frontend performance optimization guide provides the foundation for maintaining excellent user experience and Core Web Vitals scores across the EdTech platform.
