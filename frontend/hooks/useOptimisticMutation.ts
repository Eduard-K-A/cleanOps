/**
 * Hook for optimistic mutations with rollback on error
 */

import { useState, useCallback } from 'react';
import { executeOptimisticUpdate } from '@/lib/api/optimistic';
import type { ApiResponse } from '@/types';

export interface UseOptimisticMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>;
  onSuccess?: (data: NonNullable<TData>) => void;
  onError?: (error: any) => void;
  optimisticUpdate?: (variables: TVariables, currentData?: NonNullable<TData> | null) => NonNullable<TData>;
}

export function useOptimisticMutation<TData, TVariables = void>({
  mutationFn,
  onSuccess,
  onError,
  optimisticUpdate,
}: UseOptimisticMutationOptions<TData, TVariables>) {
  type Data = NonNullable<TData>;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<Data | null>(null);

  const mutate = useCallback(
    async (variables: TVariables, currentData?: Data | null) => {
      setIsLoading(true);
      setError(null);

      try {
        // If no optimistic update provided, just execute mutation
        if (!optimisticUpdate || !currentData) {
          const response = await mutationFn(variables);
          if (response.success && response.data) {
            const result = response.data as Data;
            setData(result);
            onSuccess?.(result);
          } else {
            throw new Error(response.error || 'Mutation failed');
          }
          return;
        }

        // Execute with optimistic update
        const result = await executeOptimisticUpdate({
          currentData,
          optimisticUpdate: (current) => optimisticUpdate(variables, current),
          apiCall: () =>
            mutationFn(variables).then((res) => {
              if (res.success && res.data) {
                return res.data as Data;
              }
              throw new Error(res.error || 'Mutation failed');
            }),
          onSuccess: (result) => {
            setData(result);
            onSuccess?.(result);
          },
          onError: (err) => {
            setError(err);
            onError?.(err);
          },
        });

        setData(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Mutation failed');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn, optimisticUpdate, onSuccess, onError]
  );

  return {
    mutate,
    isLoading,
    error,
    data,
  };
}
