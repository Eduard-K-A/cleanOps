/**
 * Supabase error handler utilities
 * Provides graceful error handling for expected network failures and auth errors
 */

/**
 * List of error messages that are expected during normal operation
 * and should be handled gracefully without propagating to user-facing notifications
 */
const EXPECTED_ERROR_MESSAGES = [
  'Failed to fetch', // Network error during auth initialization
  'network error', // Network connectivity issues
  'timeout', // Request timeout
  'ECONNREFUSED', // Connection refused
  'ERR_NETWORK', // Network error
  'ERR_INSUFFICIENT_RESOURCES', // Browser resource exhaustion
  'undefined fetch', // Fetch not available (e.g., in SSR context)
];

/**
 * Check if an error is expected and should be handled gracefully
 */
export function isExpectedError(error: unknown): boolean {
  if (!error) return false;
  
  const message = 
    error instanceof Error ? error.message :
    typeof error === 'string' ? error :
    String(error);
  
  return EXPECTED_ERROR_MESSAGES.some(
    msg => message.toLowerCase().includes(msg.toLowerCase())
  );
}

/**
 * Install global error handler to suppress expected Supabase errors from console
 * This prevents "Failed to fetch" errors from polluting the browser console
 * during normal operation (e.g., auth initialization on unauthenticated pages)
 */
export function installSupabaseErrorHandler(): void {
  if (typeof window === 'undefined') return;

  // Override console.error to suppress expected errors
  const originalError = console.error;
  console.error = function(...args: any[]) {
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : 
      arg instanceof Error ? arg.message : 
      JSON.stringify(arg)
    ).join(' ');
    
    // Only suppress expected errors - log everything else
    if (!isExpectedError(message)) {
      originalError(...args);
    }
  };

  // Override console.warn to suppress expected warnings
  const originalWarn = console.warn;
  console.warn = function(...args: any[]) {
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : 
      arg instanceof Error ? arg.message : 
      JSON.stringify(arg)
    ).join(' ');
    
    // Only suppress expected errors - log everything else
    if (!isExpectedError(message)) {
      originalWarn(...args);
    }
  };

  // Also install event listeners for unhandled errors
  const { addEventListener } = window;
  
  addEventListener('error', (event: ErrorEvent) => {
    if (isExpectedError(event.message)) {
      // Suppress this error - it's expected and will be handled gracefully
      event.preventDefault();
    }
  });
  
  const { addEventListener: addUnhandledRejectionListener } = window;
  addUnhandledRejectionListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    if (isExpectedError(event.reason)) {
      // Suppress this error - it's expected and will be handled gracefully
      event.preventDefault();
    }
  });
}
