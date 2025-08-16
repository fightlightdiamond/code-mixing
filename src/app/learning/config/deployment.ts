/**
 * Deployment configuration for the learning application
 */

import type { NextConfig } from "next";
import type { Configuration as WebpackConfig } from "webpack";

export interface DeploymentConfig {
  environment: "development" | "staging" | "production";
  apiBaseUrl: string;
  cdnUrl: string;
  features: {
    offlineMode: boolean;
    analytics: boolean;
    errorReporting: boolean;
    performanceMonitoring: boolean;
    accessibility: boolean;
  };
  performance: {
    enableServiceWorker: boolean;
    enableCodeSplitting: boolean;
    enableImageOptimization: boolean;
    enableBundleAnalysis: boolean;
  };
  security: {
    enableCSP: boolean;
    enableHSTS: boolean;
    enableCORS: boolean;
  };
}

const baseConfig: Omit<
  DeploymentConfig,
  "environment" | "apiBaseUrl" | "cdnUrl"
> = {
  features: {
    offlineMode: true,
    analytics: true,
    errorReporting: true,
    performanceMonitoring: true,
    accessibility: true,
  },
  performance: {
    enableServiceWorker: true,
    enableCodeSplitting: true,
    enableImageOptimization: true,
    enableBundleAnalysis: false,
  },
  security: {
    enableCSP: true,
    enableHSTS: true,
    enableCORS: true,
  },
};

export const deploymentConfigs: Record<string, DeploymentConfig> = {
  development: {
    ...baseConfig,
    environment: "development",
    apiBaseUrl: "http://localhost:3000",
    cdnUrl: "http://localhost:3000",
    features: {
      ...baseConfig.features,
      analytics: false,
      errorReporting: false,
    },
    performance: {
      ...baseConfig.performance,
      enableBundleAnalysis: true,
    },
    security: {
      ...baseConfig.security,
      enableCSP: false, // Disable for easier development
    },
  },

  staging: {
    ...baseConfig,
    environment: "staging",
    apiBaseUrl: "https://staging-api.example.com",
    cdnUrl: "https://staging-cdn.example.com",
    performance: {
      ...baseConfig.performance,
      enableBundleAnalysis: true,
    },
  },

  production: {
    ...baseConfig,
    environment: "production",
    apiBaseUrl: "https://api.example.com",
    cdnUrl: "https://cdn.example.com",
  },
};

// Get current deployment config
export const getDeploymentConfig = (): DeploymentConfig => {
  const env = process.env.NODE_ENV || "development";
  const deploymentEnv = process.env.DEPLOYMENT_ENV || env;

  return deploymentConfigs[deploymentEnv] || deploymentConfigs.development;
};

// Environment-specific optimizations
export const getOptimizationConfig = () => {
  const config = getDeploymentConfig();

  return {
    // Next.js configuration
    nextConfig: {
      // Enable experimental features for better performance
      experimental: {
        optimizeCss: config.environment === "production",
        optimizePackageImports: ["lucide-react", "@tanstack/react-query"],
      },

      // Image optimization
      images: {
        domains: [new URL(config.cdnUrl).hostname],
        formats: ["image/webp", "image/avif"],
        minimumCacheTTL: config.environment === "production" ? 86400 : 60,
      },

      // Compression
      compress: config.environment === "production",

      // Bundle analyzer
      ...(config.performance.enableBundleAnalysis && {
        webpack: ((config: WebpackConfig): WebpackConfig => {
          if (process.env.ANALYZE === "true") {
            const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
            config.plugins = config.plugins || [];
            config.plugins.push(
              new BundleAnalyzerPlugin({
                analyzerMode: "static",
                openAnalyzer: false,
              })
            );
          }
          return config;
        }) as NextConfig["webpack"],
      }),
    },

    // Service Worker configuration
    serviceWorker: {
      enabled: config.performance.enableServiceWorker,
      cacheStrategies: {
        // Cache API responses
        api: {
          urlPattern: /^https:\/\/.*\/api\/.*/,
          handler: "NetworkFirst",
          options: {
            cacheName: "api-cache",
            networkTimeoutSeconds: 10,
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },

        // Cache static assets
        static: {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
          handler: "CacheFirst",
          options: {
            cacheName: "images-cache",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            },
          },
        },

        // Cache audio files
        audio: {
          urlPattern: /\.(?:mp3|wav|ogg|m4a)$/,
          handler: "CacheFirst",
          options: {
            cacheName: "audio-cache",
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
            },
          },
        },
      },
    },

    // Security headers
    securityHeaders: config.security.enableCSP
      ? [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              "media-src 'self' blob:",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          ...(config.security.enableHSTS
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ]
      : [],
  };
};

// Performance budgets
export const performanceBudgets = {
  development: {
    maxBundleSize: "5MB",
    maxChunkSize: "1MB",
    maxAssetSize: "500KB",
  },
  staging: {
    maxBundleSize: "3MB",
    maxChunkSize: "500KB",
    maxAssetSize: "250KB",
  },
  production: {
    maxBundleSize: "2MB",
    maxChunkSize: "250KB",
    maxAssetSize: "100KB",
  },
};

// Monitoring configuration
export const getMonitoringConfig = () => {
  const config = getDeploymentConfig();

  return {
    // Error reporting
    errorReporting: {
      enabled: config.features.errorReporting,
      dsn: process.env.SENTRY_DSN,
      environment: config.environment,
      tracesSampleRate: config.environment === "production" ? 0.1 : 1.0,
    },

    // Analytics
    analytics: {
      enabled: config.features.analytics,
      googleAnalyticsId: process.env.GA_MEASUREMENT_ID,
      trackingEvents: [
        "story_read",
        "exercise_completed",
        "vocabulary_learned",
        "audio_played",
        "settings_changed",
      ],
    },

    // Performance monitoring
    performance: {
      enabled: config.features.performanceMonitoring,
      webVitalsEndpoint: "/api/web-vitals",
      reportingThreshold: {
        FCP: 2000, // First Contentful Paint
        LCP: 2500, // Largest Contentful Paint
        FID: 100, // First Input Delay
        CLS: 0.1, // Cumulative Layout Shift
      },
    },
  };
};

// Build-time optimizations
export const getBuildOptimizations = () => {
  const config = getDeploymentConfig();

  return {
    // Tree shaking
    treeShaking: config.environment === "production",

    // Minification
    minification: {
      enabled: config.environment === "production",
      options: {
        removeComments: true,
        removeConsoleStatements: true,
        removeDebugStatements: true,
      },
    },

    // Code splitting
    codeSplitting: {
      enabled: config.performance.enableCodeSplitting,
      chunks: {
        vendor: ["react", "react-dom", "@tanstack/react-query"],
        ui: ["lucide-react", "@/components/ui"],
        learning: ["./src/app/learning"],
      },
    },

    // Asset optimization
    assets: {
      images: {
        enabled: config.performance.enableImageOptimization,
        formats: ["webp", "avif"],
        quality: config.environment === "production" ? 80 : 90,
      },
      fonts: {
        preload: ["Inter"],
        display: "swap",
      },
    },
  };
};

export default {
  getDeploymentConfig,
  getOptimizationConfig,
  getMonitoringConfig,
  getBuildOptimizations,
  performanceBudgets,
};
