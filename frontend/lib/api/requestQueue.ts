/**
 * Request queue manager with prioritization
 * Handles request batching, throttling, and priority-based execution
 */

export enum RequestPriority {
  CRITICAL = 0, // Auth, critical user actions
  HIGH = 1,    // User-initiated actions, visible content
  MEDIUM = 2,  // Below-fold content, prefetched data
  LOW = 3,     // Analytics, background tasks
}

export interface QueuedRequest {
  id: string;
  priority: RequestPriority;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

export interface QueueConfig {
  maxConcurrent?: number;
  batchWindow?: number; // milliseconds to wait before batching
  throttleDelay?: number; // milliseconds between requests
}

const DEFAULT_CONFIG: Required<QueueConfig> = {
  maxConcurrent: 6,
  batchWindow: 50,
  throttleDelay: 0,
};

export class RequestQueueManager {
  private queue: QueuedRequest[] = [];
  private running = 0;
  private config: Required<QueueConfig>;
  private batchTimer: NodeJS.Timeout | null = null;
  private lastRequestTime = 0;

  constructor(config: QueueConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add request to queue
   */
  async enqueue<T>(
    execute: () => Promise<T>,
    priority: RequestPriority = RequestPriority.MEDIUM
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest = {
        id: `${Date.now()}-${Math.random()}`,
        priority,
        execute,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      this.queue.push(request);
      this.queue.sort((a, b) => a.priority - b.priority);
      this.processQueue();
    });
  }

  /**
   * Process queue
   */
  private async processQueue(): Promise<void> {
    // Throttle if needed
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.config.throttleDelay) {
      const delay = this.config.throttleDelay - timeSinceLastRequest;
      setTimeout(() => this.processQueue(), delay);
      return;
    }

    // Check if we can process more requests
    if (this.running >= this.config.maxConcurrent || this.queue.length === 0) {
      return;
    }

    // Get next request (highest priority)
    const request = this.queue.shift();
    if (!request) return;

    this.running++;
    this.lastRequestTime = Date.now();

    // Execute request
    request
      .execute()
      .then((result) => {
        request.resolve(result);
      })
      .catch((error) => {
        request.reject(error);
      })
      .finally(() => {
        this.running--;
        // Process next request
        setTimeout(() => this.processQueue(), 0);
      });
  }

  /**
   * Batch multiple requests together
   */
  async batch<T>(
    requests: Array<() => Promise<T>>,
    priority: RequestPriority = RequestPriority.MEDIUM
  ): Promise<T[]> {
    return Promise.all(requests.map((req) => this.enqueue(req, priority)));
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue.forEach((req) => {
      req.reject(new Error('Request queue cleared'));
    });
    this.queue = [];
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      running: this.running,
      maxConcurrent: this.config.maxConcurrent,
    };
  }
}

// Singleton instance
export const requestQueueManager = new RequestQueueManager();
