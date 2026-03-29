/**
 * Hook for prefetching data
 */

import { useCallback } from 'react';

export function usePrefetch<T>(
  url: string,
  fetchFn: () => Promise<T>,
  options?: {
    priority?: 'low' | 'medium' | 'high' | 'critical';
    ttl?: number;
  }
) {
  const prefetchData = useCallback(() => {
    return fetchFn();
  }, [fetchFn]);

  const prefetchOnHover = useCallback(() => {
    return fetchFn();
  }, [fetchFn]);

  const prefetchIdle = useCallback(() => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => fetchFn());
    } else {
      setTimeout(() => fetchFn(), 0);
    }
  }, [fetchFn]);

  return {
    prefetch: prefetchData,
    prefetchOnHover,
    prefetchIdle,
  };
}

export function usePrefetchPagination<T>(
  fetchPageFn: (page: number) => Promise<T>,
  options?: {
    priority?: 'low' | 'medium' | 'high' | 'critical';
    ttl?: number;
  }
) {
  const prefetchNext = useCallback(
    (currentPage: number) => {
      return fetchPageFn(currentPage + 1);
    },
    [fetchPageFn]
  );

  return { prefetchNext };
}
