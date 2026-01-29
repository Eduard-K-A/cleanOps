/**
 * Performance monitoring utilities
 * Tracks API response times, cache hit rates, and other metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface PerformanceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  cacheHitRate: number;
  cacheHits: number;
  cacheMisses: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private requestTimes: number[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private readonly MAX_METRICS = 1000;

  /**
   * Record a metric
   */
  record(name: string, value: number, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);

    // Limit metrics array size
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }
  }

  /**
   * Record API request timing
   */
  recordRequestTiming(duration: number, success: boolean, cached: boolean): void {
    this.requestTimes.push(duration);
    
    if (success) {
      this.successfulRequests++;
    } else {
      this.failedRequests++;
    }

    if (cached) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }

    // Limit array size
    if (this.requestTimes.length > this.MAX_METRICS) {
      this.requestTimes.shift();
    }
  }

  /**
   * Calculate percentile
   */
  private percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    const totalRequests = this.successfulRequests + this.failedRequests;
    const totalCacheRequests = this.cacheHits + this.cacheMisses;
    const cacheHitRate = totalCacheRequests > 0 
      ? (this.cacheHits / totalCacheRequests) * 100 
      : 0;

    const avgResponseTime = this.requestTimes.length > 0
      ? this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length
      : 0;

    return {
      totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      averageResponseTime: avgResponseTime,
      p50ResponseTime: this.percentile(this.requestTimes, 50),
      p95ResponseTime: this.percentile(this.requestTimes, 95),
      p99ResponseTime: this.percentile(this.requestTimes, 99),
      cacheHitRate,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
    };
  }

  /**
   * Get metrics by name
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.requestTimes = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
  }

  /**
   * Export metrics for analysis
   */
  export(): {
    metrics: PerformanceMetric[];
    stats: PerformanceStats;
  } {
    return {
      metrics: [...this.metrics],
      stats: this.getStats(),
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance marks for Web Vitals
 */
export function markPerformance(name: string): void {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(name);
  }
}

export function measurePerformance(name: string, startMark: string, endMark?: string): number {
  if (typeof window !== 'undefined' && 'performance' in window) {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
      const measure = performance.getEntriesByName(name, 'measure')[0];
      return measure.duration;
    } catch (e) {
      console.warn('Performance measurement failed', e);
      return 0;
    }
  }
  return 0;
}
