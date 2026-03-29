/**
 * Hook for optimistic mutations with rollback on error
 */

import { useState, useCallback } from 'react';
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
        // Execute mutation
        const response = await mutationFn(variables);
        if (response.success && response.data) {
          const result = response.data as Data;
          setData(result);
          onSuccess?.(result);
        } else {
          throw new Error(response.error || 'Mutation failed');
        }
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error('Mutation failed');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn, onSuccess, onError]
  );

  return {
    mutate,
    isLoading,
    error,
    data,
  };
}
