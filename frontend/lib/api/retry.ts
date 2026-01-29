/**
 * Retry logic with exponential backoff
 */

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[]; // HTTP status codes to retry
  retryableErrors?: string[]; // Error messages to retry
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'Network Error'],
};

/**
 * Check if error is retryable
 */
function isRetryableError(error: any, config: Required<RetryConfig>): boolean {
  // Check HTTP status codes
  if (error?.response?.status) {
    return config.retryableStatuses.includes(error.response.status);
  }

  // Check error codes/messages
  if (error?.code) {
    return config.retryableErrors.includes(error.code);
  }

  if (error?.message) {
    return config.retryableErrors.some((retryable) =>
      error.message.includes(retryable)
    );
  }

  // Don't retry client errors (4xx except 408, 429)
  if (error?.response?.status >= 400 && error?.response?.status < 500) {
    return false;
  }

  // Retry server errors (5xx)
  if (error?.response?.status >= 500) {
    return true;
  }

  // Retry network errors
  return true;
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, config: Required<RetryConfig>): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig: Required<RetryConfig> = { ...DEFAULT_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if error is not retryable
      if (!isRetryableError(error, finalConfig)) {
        throw error;
      }

      // Don't retry if we've exhausted retries
      if (attempt >= finalConfig.maxRetries) {
        break;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, finalConfig);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Create retry wrapper for axios requests
 */
export function createRetryInterceptor(config: RetryConfig = {}) {
  return async (error: any) => {
    const finalConfig: Required<RetryConfig> = { ...DEFAULT_CONFIG, ...config };
    
    if (!isRetryableError(error, finalConfig)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    
    // Don't retry if already retried
    if (originalRequest._retryCount >= finalConfig.maxRetries) {
      return Promise.reject(error);
    }

    originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
    const delay = calculateDelay(originalRequest._retryCount - 1, finalConfig);

    await new Promise((resolve) => setTimeout(resolve, delay));

    // Retry the request
    return originalRequest;
  };
}
