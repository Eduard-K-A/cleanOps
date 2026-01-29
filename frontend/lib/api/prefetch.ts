/**
 * Prefetching and preloading utilities
 * Provides helpers for predictive data loading
 */

import { cacheManager } from './cache';
import { requestQueueManager, RequestPriority } from './requestQueue';

export interface PrefetchConfig {
  priority?: RequestPriority;
  ttl?: number;
  prefetchOnHover?: boolean;
}

/**
 * Prefetch data and store in cache
 */
export async function prefetch<T>(
  url: string,
  fetchFn: () => Promise<T>,
  config: PrefetchConfig = {}
): Promise<T | null> {
  const { priority = RequestPriority.LOW, ttl } = config;

  // Check cache first
  const cached = cacheManager.get<T>(url);
  if (cached) {
    return cached;
  }

  // Fetch in background with low priority
  try {
    const data = await requestQueueManager.enqueue(fetchFn, priority);
    cacheManager.set(url, data, undefined, ttl);
    return data;
  } catch (error) {
    // Silently fail for prefetch
    console.warn('Prefetch failed', url, error);
    return null;
  }
}

/**
 * Prefetch on hover
 */
export function createHoverPrefetch<T>(
  url: string,
  fetchFn: () => Promise<T>,
  config: PrefetchConfig = {}
) {
  let prefetched = false;
  let timeoutId: NodeJS.Timeout | null = null;

  return {
    onMouseEnter: () => {
      if (prefetched) return;
      
      // Debounce hover
      if (timeoutId) clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        prefetch(url, fetchFn, { ...config, priority: RequestPriority.MEDIUM });
        prefetched = true;
      }, 200); // 200ms hover delay
    },
    onMouseLeave: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}

/**
 * Prefetch next page for pagination
 */
export function prefetchNextPage<T>(
  currentPage: number,
  fetchPageFn: (page: number) => Promise<T>,
  config: PrefetchConfig = {}
): void {
  const nextPage = currentPage + 1;
  const url = `page_${nextPage}`;
  
  prefetch(url, () => fetchPageFn(nextPage), {
    ...config,
    priority: RequestPriority.LOW,
  });
}

/**
 * Prefetch related resources
 */
export async function prefetchRelated<T>(
  baseUrl: string,
  relatedUrls: string[],
  fetchFn: (url: string) => Promise<T>,
  config: PrefetchConfig = {}
): Promise<void> {
  // Prefetch all related resources in parallel
  await Promise.all(
    relatedUrls.map((url) =>
      prefetch(`${baseUrl}_related_${url}`, () => fetchFn(url), config)
    )
  );
}

/**
 * Prefetch during idle time
 */
export function prefetchOnIdle<T>(
  url: string,
  fetchFn: () => Promise<T>,
  config: PrefetchConfig = {}
): void {
  if (typeof window === 'undefined' || !('requestIdleCallback' in window)) {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      prefetch(url, fetchFn, config);
    }, 2000);
    return;
  }

  requestIdleCallback(
    () => {
      prefetch(url, fetchFn, config);
    },
    { timeout: 5000 }
  );
}
