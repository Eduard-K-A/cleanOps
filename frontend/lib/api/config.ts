/**
 * API optimization configuration
 */

import { RequestPriority } from './requestQueue';

export interface ApiOptimizationConfig {
  // Caching
  cache: {
    defaultTTL: number; // milliseconds
    maxMemoryEntries: number;
    enableLocalStorage: boolean;
  };

  // Request queue
  queue: {
    maxConcurrent: number;
    throttleDelay: number; // milliseconds
  };

  // Retry
  retry: {
    maxRetries: number;
    initialDelay: number; // milliseconds
    maxDelay: number; // milliseconds
  };

  // Performance monitoring
  performance: {
    enabled: boolean;
    logSlowRequests: boolean;
    slowRequestThreshold: number; // milliseconds
  };

  // Request priorities by endpoint pattern
  priorities: Record<string, RequestPriority>;
}

export const defaultConfig: ApiOptimizationConfig = {
  cache: {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxMemoryEntries: 100,
    enableLocalStorage: true,
  },
  queue: {
    maxConcurrent: 6,
    throttleDelay: 0,
  },
  retry: {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
  },
  performance: {
    enabled: true,
    logSlowRequests: true,
    slowRequestThreshold: 2000, // 2 seconds
  },
  priorities: {
    '/auth/': RequestPriority.CRITICAL,
    '/jobs/feed': RequestPriority.HIGH,
    '/jobs': RequestPriority.HIGH,
    '/messages': RequestPriority.HIGH,
    '/notifications': RequestPriority.MEDIUM,
  },
};

// Get priority for endpoint
export function getPriorityForEndpoint(endpoint: string): RequestPriority {
  for (const [pattern, priority] of Object.entries(defaultConfig.priorities)) {
    if (endpoint.includes(pattern)) {
      return priority;
    }
  }
  return RequestPriority.MEDIUM;
}
