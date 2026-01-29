/**
 * Optimized data fetching hook with SWR-like pattern
 * Features: caching, deduplication, revalidation, error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { optimizedApi } from '@/lib/api/optimizedClient';
import { cacheManager } from '@/lib/api/cache';
import type { ApiResponse } from '@/types';

export interface UseOptimizedDataOptions<T> {
  endpoint: string;
  params?: Record<string, any>;
  fetchFn?: () => Promise<ApiResponse<T>>;
  defaultValue: T;
  cacheTTL?: number;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  revalidateInterval?: number; // milliseconds, 0 to disable
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

export function useOptimizedData<T>({
  endpoint,
  params,
  fetchFn,
  defaultValue,
  cacheTTL,
  revalidateOnFocus = true,
  revalidateOnReconnect = true,
  revalidateInterval = 0,
  onSuccess,
  onError,
  enabled = true,
}: UseOptimizedDataOptions<T>) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Get fetch function
  const getFetchFn = useCallback(() => {
    if (fetchFn) return fetchFn;
    return () => optimizedApi.get<T>(endpoint, params, { cacheTTL });
  }, [endpoint, params, fetchFn, cacheTTL]);

  // Fetch data
  const fetchData = useCallback(
    async (skipCache = false) => {
      if (!enabled) return;

      try {
        setIsValidating(true);
        setError(null);

        // Try cache first if not skipping
        if (!skipCache) {
          const cached = cacheManager.get<T>(endpoint, params);
          if (cached) {
            setData(cached);
            setLoading(false);
            setIsValidating(false);
            // Still fetch in background for revalidation
            if (revalidateInterval > 0 || revalidateOnFocus || revalidateOnReconnect) {
              // Continue to fetch fresh data
            } else {
              return;
            }
          }
        }

        const response = await getFetchFn()();
        
        if (response.success && response.data !== undefined) {
          setData(response.data);
          setLoading(false);
          onSuccess?.(response.data);
        } else {
          throw new Error(response.error || 'Failed to fetch data');
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch data');
        setError(error);
        setLoading(false);
        onError?.(error);
      } finally {
        setIsValidating(false);
      }
    },
    [endpoint, params, getFetchFn, enabled, onSuccess, onError, revalidateInterval, revalidateOnFocus, revalidateOnReconnect]
  );

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [enabled]); // Only run when enabled changes

  // Revalidate on focus
  useEffect(() => {
    if (!revalidateOnFocus || !enabled) return;

    const handleFocus = () => {
      fetchData(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidateOnFocus, enabled, fetchData]);

  // Revalidate on reconnect
  useEffect(() => {
    if (!revalidateOnReconnect || !enabled) return;

    const handleOnline = () => {
      fetchData(true);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [revalidateOnReconnect, enabled, fetchData]);

  // Revalidate interval
  useEffect(() => {
    if (revalidateInterval <= 0 || !enabled) return;

    intervalRef.current = setInterval(() => {
      fetchData(true);
    }, revalidateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [revalidateInterval, enabled, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const mutate = useCallback(
    async (newData?: T | ((prev: T) => T), shouldRevalidate = true) => {
      if (newData !== undefined) {
        setData((prev) => {
          if (typeof newData === 'function') {
            return (newData as (prev: T) => T)(prev);
          }
          return newData;
        });
      }
      if (shouldRevalidate) {
        await fetchData(true);
      }
    },
    [fetchData]
  );

  return {
    data,
    loading,
    error,
    isValidating,
    mutate,
    refetch: () => fetchData(true),
  };
}
