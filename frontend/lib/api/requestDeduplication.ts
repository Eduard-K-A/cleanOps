/**
 * Request deduplication manager
 * Prevents duplicate concurrent requests by returning the same promise
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

export class RequestDeduplicationManager {
  private pendingRequests = new Map<string, PendingRequest>();
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

  /**
   * Generate request fingerprint
   */
  private getFingerprint(
    method: string,
    url: string,
    params?: Record<string, any>,
    data?: any,
    headers?: Record<string, any>
  ): string {
    // Only include relevant headers (exclude auth tokens, timestamps, etc.)
    const relevantHeaders = headers ? {
      'content-type': headers['content-type'],
    } : {};
    
    return JSON.stringify({
      method: method.toUpperCase(),
      url,
      params: params ? JSON.stringify(params) : '',
      data: data ? JSON.stringify(data) : '',
      headers: relevantHeaders,
    });
  }

  /**
   * Check if request is already in flight
   */
  getPendingRequest<T>(
    method: string,
    url: string,
    params?: Record<string, any>,
    data?: any,
    headers?: Record<string, any>
  ): Promise<T> | null {
    const fingerprint = this.getFingerprint(method, url, params, data, headers);
    const pending = this.pendingRequests.get(fingerprint);

    if (pending) {
      // Check if request is still valid (not timed out)
      if (Date.now() - pending.timestamp < this.REQUEST_TIMEOUT) {
        return pending.promise as Promise<T>;
      } else {
        // Remove stale request
        this.pendingRequests.delete(fingerprint);
      }
    }

    return null;
  }

  /**
   * Register a new pending request
   */
  registerRequest<T>(
    method: string,
    url: string,
    promise: Promise<T>,
    params?: Record<string, any>,
    data?: any,
    headers?: Record<string, any>
  ): Promise<T> {
    const fingerprint = this.getFingerprint(method, url, params, data, headers);
    
    // Clean up after request completes
    promise.finally(() => {
      this.pendingRequests.delete(fingerprint);
    });

    this.pendingRequests.set(fingerprint, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Get number of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

// Singleton instance
export const requestDeduplicationManager = new RequestDeduplicationManager();
