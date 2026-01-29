/**
 * Hook for prefetching data
 */

import { useCallback } from 'react';
import { prefetch, createHoverPrefetch, prefetchNextPage, prefetchOnIdle } from '@/lib/api/prefetch';
import { RequestPriority } from '@/lib/api/requestQueue';

export function usePrefetch<T>(
  url: string,
  fetchFn: () => Promise<T>,
  options?: {
    priority?: RequestPriority;
    ttl?: number;
  }
) {
  const prefetchData = useCallback(() => {
    return prefetch(url, fetchFn, options);
  }, [url, fetchFn, options]);

  const prefetchOnHover = useCallback(() => {
    return createHoverPrefetch(url, fetchFn, options);
  }, [url, fetchFn, options]);

  const prefetchIdle = useCallback(() => {
    prefetchOnIdle(url, fetchFn, options);
  }, [url, fetchFn, options]);

  return {
    prefetch: prefetchData,
    prefetchOnHover,
    prefetchIdle,
  };
}

export function usePrefetchPagination<T>(
  fetchPageFn: (page: number) => Promise<T>,
  options?: {
    priority?: RequestPriority;
    ttl?: number;
  }
) {
  const prefetchNext = useCallback(
    (currentPage: number) => {
      prefetchNextPage(currentPage, fetchPageFn, options);
    },
    [fetchPageFn, options]
  );

  return { prefetchNext };
}
