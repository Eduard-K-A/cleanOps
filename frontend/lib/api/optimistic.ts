/**
 * Optimistic update utilities
 * Provides helpers for implementing optimistic UI updates
 */

export interface OptimisticUpdateConfig<T> {
  // Current data (may be undefined/null when calling optimistic update)
  currentData?: T | null;

  // Optimistic update function receives possibly-missing current value
  optimisticUpdate: (current?: T | null) => T;

  // Actual API call
  apiCall: () => Promise<T>;

  // Rollback function (called on error)
  rollback?: (original?: T | null) => void;

  // Success callback
  onSuccess?: (result: T) => void;

  // Error callback
  onError?: (error: any, original?: T | null) => void;
}

/**
 * Execute optimistic update
 */
export async function executeOptimisticUpdate<T>(config: OptimisticUpdateConfig<T>): Promise<T> {
  const { currentData, optimisticUpdate, apiCall, rollback, onSuccess, onError } = config;

  // Store original data for rollback
  const originalData = currentData;

  // Apply optimistic update immediately
  let optimisticData: T;
  try {
    optimisticData = optimisticUpdate(currentData);
  } catch (error) {
    // If optimistic update fails, don't proceed
    throw new Error('Optimistic update failed');
  }

  try {
    // Execute actual API call
    const result = await apiCall();
    
    // Success - call success callback
    onSuccess?.(result);
    
    return result;
  } catch (error) {
    // Error - rollback to original data
    if (rollback) {
      rollback(originalData);
    }

    // Call error callback
    onError?.(error, originalData);
    
    // Re-throw error
    throw error;
  }
}

/**
 * Create optimistic update handler for React state
 */
export function createOptimisticHandler<T>(
  setState: (data: T | ((prev: T | null) => T)) => void,
  apiCall: () => Promise<T>
) {
  return async (optimisticUpdate: (current: T | null) => T) => {
    // Get current state
    let currentData: T | null | undefined;
    setState((prev: any) => {
      currentData = prev;
      return optimisticUpdate(prev ?? null);
    });

    try {
      const result = await apiCall();
      setState(result);
      return result;
    } catch (error) {
      // Rollback on error
      setState(currentData as any);
      throw error;
    }
  };
}
