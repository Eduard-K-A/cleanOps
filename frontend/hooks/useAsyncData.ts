import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UseAsyncDataOptions<T> {
  fetchFn: () => Promise<{ data?: T; success?: boolean }>;
  defaultValue: T;
  errorMessage?: string;
  onSuccess?: (data: T) => void;
  autoFetch?: boolean;
}

export function useAsyncData<T>({
  fetchFn,
  defaultValue,
  errorMessage = 'Failed to load data',
  onSuccess,
  autoFetch = true,
}: UseAsyncDataOptions<T>) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    console.debug('useAsyncData: refetch starting');
    try {
      setLoading(true);
      setError(null);
      const response = await fetchFn();
      console.debug('useAsyncData: fetchFn response', { response });
      // Support both raw data and ApiResponse wrappers
      // If response has a `data` field, prefer it; otherwise assume response is the payload
      const payload = (response && typeof response === 'object' && 'data' in response)
        ? (response as any).data
        : response;
      const result = (payload ?? defaultValue) as T;
      console.debug('useAsyncData: setting data', { length: Array.isArray(result) ? (result as any).length : undefined });
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      console.error('useAsyncData: fetch error', err);
      const errorObj = err instanceof Error ? err : new Error(errorMessage);
      setError(errorObj);
      toast.error(errorMessage);
      setData(defaultValue);
      return defaultValue;
    } finally {
      setLoading(false);
      console.debug('useAsyncData: refetch finished');
    }
  }, [fetchFn, defaultValue, errorMessage, onSuccess]);

  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
  }, []); // Only run on mount if autoFetch is true

  return { data, loading, error, refetch };
}
