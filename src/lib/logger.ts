/**
 * Centralized logging system for the application
 * Replaces scattered console.log statements with structured logging
 */

import * as Sentry from "@sentry/nextjs";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

export interface LogContext {
  module?: string;
  userId?: string;
  tenantId?: string;
  requestId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  timestamp: string;
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

    if (!this.isDevelopment && process.env.SENTRY_DSN) {
      Sentry.init({ dsn: process.env.SENTRY_DSN });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";

    return `[${timestamp}] ${levelStr}: ${message}${contextStr}`;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
  ): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug("🔍", formattedMessage);
        }
        break;
      case LogLevel.INFO:
        console.info("ℹ️", formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn("⚠️", formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error("❌", formattedMessage);
        if (error) {
          console.error("Stack:", error.stack);
        }
        break;
    }

    // Send high-severity logs to external service in production
    if (
      !this.isDevelopment &&
      level >= LogLevel.ERROR &&
      process.env.SENTRY_DSN
    ) {
      if (error) {
        Sentry.captureException(error, { extra: context });
      } else {
        Sentry.captureMessage(message, {
          level: "error",
          extra: context,
        });
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Specialized logging methods for common use cases
  auth(message: string, userId?: string, context?: LogContext): void {
    this.debug(message, { ...context, module: "AUTH", userId });
  }

  api(message: string, endpoint?: string, context?: LogContext): void {
    this.debug(message, { ...context, module: "API", endpoint });
  }

  db(message: string, query?: string, context?: LogContext): void {
    this.debug(message, { ...context, module: "DB", query });
  }

  ssr(message: string, route?: string, context?: LogContext): void {
    this.debug(message, { ...context, module: "SSR", route });
  }

  performance(message: string, duration?: number, context?: LogContext): void {
    this.info(message, { ...context, module: "PERF", duration });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for easier migration
export const log = {
  debug: (message: string, context?: LogContext) =>
    logger.debug(message, context),
  info: (message: string, context?: LogContext) =>
    logger.info(message, context),
  warn: (message: string, context?: LogContext) =>
    logger.warn(message, context),
  error: (message: string, context?: LogContext, error?: Error) =>
    logger.error(message, context, error),
  auth: (message: string, userId?: string, context?: LogContext) =>
    logger.auth(message, userId, context),
  api: (message: string, endpoint?: string, context?: LogContext) =>
    logger.api(message, endpoint, context),
  db: (message: string, query?: string, context?: LogContext) =>
    logger.db(message, query, context),
  ssr: (message: string, route?: string, context?: LogContext) =>
    logger.ssr(message, route, context),
  performance: (message: string, duration?: number, context?: LogContext) =>
    logger.performance(message, duration, context),
};

export default logger;
