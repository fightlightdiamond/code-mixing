import { logger } from '@/lib/logger';
// Performance monitoring and analytics for React Query
interface QueryMetrics {
  queryKey: readonly unknown[];
  duration: number;
  status: 'success' | 'error' | 'loading';
  cacheHit: boolean;
  timestamp: number;
  errorMessage?: string;
}

interface MutationMetrics {
  mutationKey?: readonly unknown[];
  duration: number;
  status: 'success' | 'error' | 'loading';
  timestamp: number;
  errorMessage?: string;
  optimisticUpdate: boolean;
}

class QueryMonitor {
  private queryMetrics: QueryMetrics[] = [];
  private mutationMetrics: MutationMetrics[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics

  // Track query performance
  trackQuery(metrics: QueryMetrics) {
    this.queryMetrics.push(metrics);
    if (this.queryMetrics.length > this.maxMetrics) {
      this.queryMetrics.shift();
    }
    
    // Send to analytics service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics('query', metrics);
    }
  }

  // Track mutation performance
  trackMutation(metrics: MutationMetrics) {
    this.mutationMetrics.push(metrics);
    if (this.mutationMetrics.length > this.maxMetrics) {
      this.mutationMetrics.shift();
    }
    
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics('mutation', metrics);
    }
  }

  // Get performance statistics
  getQueryStats() {
    const total = this.queryMetrics.length;
    const successful = this.queryMetrics.filter(m => m.status === 'success').length;
    const errors = this.queryMetrics.filter(m => m.status === 'error').length;
    const cacheHits = this.queryMetrics.filter(m => m.cacheHit).length;
    
    const durations = this.queryMetrics
      .filter(m => m.status === 'success')
      .map(m => m.duration);
    
    const avgDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    return {
      total,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      errorRate: total > 0 ? (errors / total) * 100 : 0,
      cacheHitRate: total > 0 ? (cacheHits / total) * 100 : 0,
      avgDuration: Math.round(avgDuration),
      p95Duration: this.calculatePercentile(durations, 95),
      p99Duration: this.calculatePercentile(durations, 99),
    };
  }

  getMutationStats() {
    const total = this.mutationMetrics.length;
    const successful = this.mutationMetrics.filter(m => m.status === 'success').length;
    const errors = this.mutationMetrics.filter(m => m.status === 'error').length;
    const optimistic = this.mutationMetrics.filter(m => m.optimisticUpdate).length;
    
    const durations = this.mutationMetrics
      .filter(m => m.status === 'success')
      .map(m => m.duration);
    
    const avgDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    return {
      total,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      errorRate: total > 0 ? (errors / total) * 100 : 0,
      optimisticUpdateRate: total > 0 ? (optimistic / total) * 100 : 0,
      avgDuration: Math.round(avgDuration),
    };
  }

  // Get slow queries (above threshold)
  getSlowQueries(thresholdMs = 1000) {
    return this.queryMetrics
      .filter(m => m.duration > thresholdMs)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
  }

  // Get error patterns
  getErrorPatterns() {
    const errors = this.queryMetrics.filter(m => m.status === 'error');
    const errorCounts: Record<string, number> = {};
    
    errors.forEach(error => {
      const key = error.errorMessage || 'Unknown error';
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });
    
    return Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return Math.round(sorted[index] || 0);
  }

  private sendToAnalytics(type: 'query' | 'mutation', metrics: QueryMetrics | MutationMetrics) {
    // Implement your analytics service integration here
    // Example: send to DataDog, New Relic, custom analytics, etc.
    logger.info(`Analytics: ${type}`, metrics);
  }

  // Clear metrics (useful for testing)
  clear() {
    this.queryMetrics = [];
    this.mutationMetrics = [];
  }
}

// Singleton instance
export const queryMonitor = new QueryMonitor();

// React Query plugin for automatic monitoring
export const createMonitoringPlugin = () => ({
  onQueryStart: (query: any) => {
    query._startTime = performance.now();
  },
  
  onQuerySuccess: (query: any) => {
    const duration = performance.now() - (query._startTime || 0);
    queryMonitor.trackQuery({
      queryKey: query.queryKey,
      duration,
      status: 'success',
      cacheHit: query.state.dataUpdatedAt === query.state.dataUpdateCount,
      timestamp: Date.now(),
    });
  },
  
  onQueryError: (query: any, error: Error) => {
    const duration = performance.now() - (query._startTime || 0);
    queryMonitor.trackQuery({
      queryKey: query.queryKey,
      duration,
      status: 'error',
      cacheHit: false,
      timestamp: Date.now(),
      errorMessage: error.message,
    });
  },
});

// Development tools
export const devTools = {
  getStats: () => ({
    queries: queryMonitor.getQueryStats(),
    mutations: queryMonitor.getMutationStats(),
  }),
  
  getSlowQueries: (threshold?: number) => queryMonitor.getSlowQueries(threshold),
  getErrorPatterns: () => queryMonitor.getErrorPatterns(),
  
  // Export metrics for external analysis
  exportMetrics: () => ({
    queries: queryMonitor['queryMetrics'],
    mutations: queryMonitor['mutationMetrics'],
    timestamp: Date.now(),
  }),
};
