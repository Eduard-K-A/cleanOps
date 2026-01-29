/**
 * Central export for all API optimization utilities
 */

export { optimizedApi, axiosInstance } from './optimizedClient';
export { cacheManager, CacheManager } from './cache';
export { requestDeduplicationManager, RequestDeduplicationManager } from './requestDeduplication';
export { requestQueueManager, RequestQueueManager, RequestPriority } from './requestQueue';
export { withRetry, createRetryInterceptor } from './retry';
export { performanceMonitor, markPerformance, measurePerformance } from './performance';
export { executeOptimisticUpdate, createOptimisticHandler } from './optimistic';
export { prefetch, createHoverPrefetch, prefetchNextPage, prefetchRelated, prefetchOnIdle } from './prefetch';
export { defaultConfig, getPriorityForEndpoint } from './config';
