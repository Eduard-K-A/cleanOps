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
    try {
      setLoading(true);
      setError(null);
      const response = await fetchFn();
      const result = (response.data ?? defaultValue) as T;
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(errorMessage);
      setError(error);
      toast.error(errorMessage);
      setData(defaultValue);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, defaultValue, errorMessage, onSuccess]);

  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
  }, []); // Only run on mount if autoFetch is true

  return { data, loading, error, refetch };
}
