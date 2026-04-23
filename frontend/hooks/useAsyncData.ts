import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { cacheManager } from '@/lib/api/cache';
import { requestDeduplicationManager } from '@/lib/api/requestDeduplication';

interface UseAsyncDataOptions<T> {
  fetchFn: () => Promise<{ data?: T; success?: boolean; error?: string }>;
  defaultValue: T;
  errorMessage?: string;
  onSuccess?: (data: T) => void;
  autoFetch?: boolean;
  enabled?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
  revalidateOnMount?: boolean;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
}

function hasWindow() {
  return typeof window !== 'undefined';
}

function buildCacheKey(cacheKey?: string) {
  return cacheKey ? `async-data:${cacheKey}` : null;
}

export function invalidateAsyncDataCache(pattern: string | RegExp) {
  const cachePattern =
    typeof pattern === 'string' ? `async-data:${pattern}` : new RegExp(`async-data:${pattern.source}`);

  cacheManager.invalidatePattern(cachePattern);
}

export function useAsyncData<T>({
  fetchFn,
  defaultValue,
  errorMessage = 'Failed to load data',
  onSuccess,
  autoFetch = true,
  enabled = true,
  cacheKey,
  cacheTTL = 5 * 60 * 1000,
  revalidateOnMount = true,
  revalidateOnFocus = false,
  revalidateOnReconnect = true,
}: UseAsyncDataOptions<T>) {
  const resolvedCacheKey = useMemo(() => buildCacheKey(cacheKey), [cacheKey]);
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(autoFetch && enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasHydratedCacheRef = useRef(false);
  const hasResolvedOnceRef = useRef(false);
  const fetchFnRef = useRef(fetchFn);
  const defaultValueRef = useRef(defaultValue);
  const errorMessageRef = useRef(errorMessage);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    defaultValueRef.current = defaultValue;
  }, [defaultValue]);

  useEffect(() => {
    errorMessageRef.current = errorMessage;
  }, [errorMessage]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const applyResult = useCallback((result: T) => {
    setData(result);
    setError(null);
    setLoading(false);
    setRefreshing(false);
    hasResolvedOnceRef.current = true;
    onSuccessRef.current?.(result);
  }, []);

  const readCache = useCallback(() => {
    if (!resolvedCacheKey || !hasWindow()) return null;
    return cacheManager.get<T>(resolvedCacheKey) ?? null;
  }, [resolvedCacheKey]);

  const writeCache = useCallback((result: T) => {
    if (!resolvedCacheKey) return;
    cacheManager.set(resolvedCacheKey, result, undefined, cacheTTL);
  }, [resolvedCacheKey, cacheTTL]);

  const fetchFresh = useCallback(async (background = false) => {
    if (!enabled) {
      setLoading(false);
      setRefreshing(false);
      return defaultValueRef.current;
    }

    console.debug('useAsyncData: refetch starting', { cacheKey: resolvedCacheKey, background });

    const dedupeKey = resolvedCacheKey ?? `anonymous:${errorMessageRef.current}`;

    try {
      const shouldUseRefreshState = background || hasResolvedOnceRef.current;

      if (shouldUseRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const pending = requestDeduplicationManager.getPendingRequest<{ data?: T; success?: boolean; error?: string }>(
        'GET',
        dedupeKey
      );

      const response = pending
        ?? requestDeduplicationManager.registerRequest(
          'GET',
          dedupeKey,
          fetchFnRef.current()
        );

      const result = await response;

      if (result && typeof result === 'object' && 'success' in result && result.success === false) {
        throw new Error(result.error || errorMessageRef.current);
      }

      const payload = (result && typeof result === 'object' && 'data' in result)
        ? result.data
        : result;

      const nextData = (payload ?? defaultValueRef.current) as T;
      applyResult(nextData);
      writeCache(nextData);
      return nextData;
    } catch (err) {
      console.error('useAsyncData: fetch error', err);
      const errorObj = err instanceof Error ? err : new Error(errorMessageRef.current);
      setError(errorObj);
      setLoading(false);
      setRefreshing(false);

      if (!background) {
        toast.error(errorMessageRef.current);
      }

      const cached = readCache();
      if (cached !== null) {
        hasResolvedOnceRef.current = true;
        setData(cached);
        return cached;
      }

      setData(defaultValueRef.current);
      return defaultValueRef.current;
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.debug('useAsyncData: refetch finished', { cacheKey: resolvedCacheKey, background });
    }
  }, [applyResult, enabled, readCache, resolvedCacheKey, writeCache]);

  const refetch = useCallback(async () => {
    return fetchFresh(false);
  }, [fetchFresh]);

  useEffect(() => {
    hasHydratedCacheRef.current = false;
    hasResolvedOnceRef.current = false;
    setRefreshing(false);
    setLoading(autoFetch && enabled);
  }, [autoFetch, enabled, resolvedCacheKey]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    if (!resolvedCacheKey) {
      if (!autoFetch) {
        setLoading(false);
      }
      return;
    }

    const cached = readCache();
    if (cached !== null) {
      hasHydratedCacheRef.current = true;
      hasResolvedOnceRef.current = true;
      applyResult(cached);
      return;
    }

    if (!autoFetch) {
      setLoading(false);
    }
  }, [applyResult, autoFetch, enabled, readCache, resolvedCacheKey]);

  useEffect(() => {
    if (!autoFetch || !enabled) return;

    const shouldBackgroundFetch = hasHydratedCacheRef.current;
    if (!revalidateOnMount && shouldBackgroundFetch) return;

    fetchFresh(shouldBackgroundFetch);
  }, [autoFetch, enabled, fetchFresh, revalidateOnMount, resolvedCacheKey]);

  useEffect(() => {
    if (!revalidateOnFocus || !autoFetch || !enabled) return;

    const handleFocus = () => {
      fetchFresh(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [autoFetch, enabled, fetchFresh, revalidateOnFocus]);

  useEffect(() => {
    if (!revalidateOnReconnect || !autoFetch || !enabled) return;

    const handleReconnect = () => {
      fetchFresh(true);
    };

    window.addEventListener('online', handleReconnect);
    return () => window.removeEventListener('online', handleReconnect);
  }, [autoFetch, enabled, fetchFresh, revalidateOnReconnect]);

  return { data, loading, refreshing, error, refetch };
}
