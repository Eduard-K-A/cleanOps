/**
 * Optimistic update utilities
 * Provides helpers for implementing optimistic UI updates
 */

export interface OptimisticUpdateConfig<T> {
  // Current data
  currentData: T;
  
  // Optimistic update function
  optimisticUpdate: (current: T) => T;
  
  // Actual API call
  apiCall: () => Promise<T>;
  
  // Rollback function (called on error)
  rollback?: (original: T) => void;
  
  // Success callback
  onSuccess?: (result: T) => void;
  
  // Error callback
  onError?: (error: any, original: T) => void;
}

/**
 * Execute optimistic update
 */
export async function executeOptimisticUpdate<T>(
  config: OptimisticUpdateConfig<T>
): Promise<T> {
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
  setState: (data: T | ((prev: T) => T)) => void,
  apiCall: () => Promise<T>
) {
  return async (optimisticUpdate: (current: T) => T) => {
    // Get current state
    let currentData: T;
    setState((prev) => {
      currentData = prev;
      return optimisticUpdate(prev);
    });

    try {
      const result = await apiCall();
      setState(result);
      return result;
    } catch (error) {
      // Rollback on error
      setState(currentData!);
      throw error;
    }
  };
}
