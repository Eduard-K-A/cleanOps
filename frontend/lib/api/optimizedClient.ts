/**
 * Optimized API client with caching, deduplication, retry, and performance monitoring
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { supabase } from '../supabase';
import { cacheManager } from './cache';
import { requestDeduplicationManager } from './requestDeduplication';
import { requestQueueManager, RequestPriority } from './requestQueue';
import { withRetry, createRetryInterceptor } from './retry';
import { performanceMonitor, markPerformance, measurePerformance } from './performance';
import { getPriorityForEndpoint, defaultConfig } from './config';
import type { ApiResponse } from '@/types';

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.NODE_ENV === 'development') return 'http://localhost:5000/api';
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0') return 'http://localhost:5000/api';
  }
  return 'https://cleanops-8epb.onrender.com/api';
}

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000, // 10 second timeout
});

// Request interceptor - add auth token
axiosInstance.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle retries (pass axios instance so retries use same config)
axiosInstance.interceptors.response.use(
  (response) => response,
  createRetryInterceptor(defaultConfig.retry, axiosInstance)
);

interface RequestOptions {
  useCache?: boolean;
  cacheTTL?: number;
  priority?: RequestPriority;
  skipDeduplication?: boolean;
  skipRetry?: boolean;
}

/**
 * Optimized GET request
 */
async function optimizedGet<T>(
  endpoint: string,
  params?: Record<string, any>,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    useCache = true,
    cacheTTL,
    priority,
    skipDeduplication = false,
  } = options;

  const startMark = `api_get_${endpoint}_${Date.now()}`;
  markPerformance(startMark);

  // Check cache first (only for GET requests)
  if (useCache) {
    const cached = cacheManager.get<ApiResponse<T>>(endpoint, params);
    if (cached) {
      const duration = measurePerformance(`cache_hit_${startMark}`, startMark);
      performanceMonitor.recordRequestTiming(duration, true, true);
      return cached;
    }
  }

  // Check for duplicate in-flight request
  if (!skipDeduplication) {
    const pending = requestDeduplicationManager.getPendingRequest<ApiResponse<T>>(
      'GET',
      endpoint,
      params
    );
    if (pending) {
      return pending;
    }
  }

  // Determine priority
  const requestPriority = priority ?? getPriorityForEndpoint(endpoint);

  // Create request function
  const requestFn = async (): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.get<ApiResponse<T>>(endpoint, { params });
    return response.data;
  };

  // Register for deduplication
  let promise: Promise<ApiResponse<T>>;
  if (skipDeduplication) {
    promise = requestQueueManager.enqueue(requestFn, requestPriority);
  } else {
    promise = requestDeduplicationManager.registerRequest(
      'GET',
      endpoint,
      requestQueueManager.enqueue(requestFn, requestPriority),
      params
    );
  }

  try {
    const result = await promise;
    const duration = measurePerformance(`api_get_${endpoint}`, startMark);
    performanceMonitor.recordRequestTiming(duration, true, false);

    // Cache successful responses
    if (useCache && result.success) {
      cacheManager.set(endpoint, result, params, cacheTTL);
    }

    // Log slow requests
    if (defaultConfig.performance.logSlowRequests && duration > defaultConfig.performance.slowRequestThreshold) {
      console.warn(`Slow API request: ${endpoint} took ${duration}ms`);
    }

    return result;
  } catch (error: any) {
    const duration = measurePerformance(`api_get_${endpoint}_error`, startMark);
    performanceMonitor.recordRequestTiming(duration, false, false);
    throw error;
  }
}

/**
 * Optimized POST request
 */
async function optimizedPost<T>(
  endpoint: string,
  data?: Record<string, any>,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { priority, skipDeduplication = false, skipRetry = false } = options;

  const startMark = `api_post_${endpoint}_${Date.now()}`;
  markPerformance(startMark);

  // Invalidate cache for related endpoints
  cacheManager.invalidatePattern(endpoint);

  // Check for duplicate in-flight request
  if (!skipDeduplication) {
    const pending = requestDeduplicationManager.getPendingRequest<ApiResponse<T>>(
      'POST',
      endpoint,
      undefined,
      data
    );
    if (pending) {
      return pending;
    }
  }

  const requestPriority = priority ?? getPriorityForEndpoint(endpoint);

  const requestFn = async (): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.post<ApiResponse<T>>(endpoint, data);  //fails here when creating an order
    return response.data;
  };

  let promise: Promise<ApiResponse<T>>;
  if (skipRetry) {
    promise = requestQueueManager.enqueue(requestFn, requestPriority);
  } else {
    promise = withRetry(
      () => requestQueueManager.enqueue(requestFn, requestPriority),
      defaultConfig.retry
    );
  }

  if (!skipDeduplication) {
    promise = requestDeduplicationManager.registerRequest(
      'POST',
      endpoint,
      promise,
      undefined,
      data
    );
  }

  try {
    const result = await promise;
    const duration = measurePerformance(`api_post_${endpoint}`, startMark);
    performanceMonitor.recordRequestTiming(duration, true, false);
    return result;
  } catch (error: any) {
    const duration = measurePerformance(`api_post_${endpoint}_error`, startMark);
    performanceMonitor.recordRequestTiming(duration, false, false);
    throw error;
  }
}

/**
 * Optimized PATCH request
 */
async function optimizedPatch<T>(
  endpoint: string,
  data?: Record<string, any>,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { priority, skipDeduplication = false } = options;

  const startMark = `api_patch_${endpoint}_${Date.now()}`;
  markPerformance(startMark);

  // Invalidate cache for related endpoints
  cacheManager.invalidatePattern(endpoint);

  const requestPriority = priority ?? getPriorityForEndpoint(endpoint);

  const requestFn = async (): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.patch<ApiResponse<T>>(endpoint, data);
    return response.data;
  };

  const promise = withRetry(
    () => requestQueueManager.enqueue(requestFn, requestPriority),
    defaultConfig.retry
  );

  if (!skipDeduplication) {
    return requestDeduplicationManager.registerRequest(
      'PATCH',
      endpoint,
      promise,
      undefined,
      data
    );
  }

  try {
    const result = await promise;
    const duration = measurePerformance(`api_patch_${endpoint}`, startMark);
    performanceMonitor.recordRequestTiming(duration, true, false);
    return result;
  } catch (error: any) {
    const duration = measurePerformance(`api_patch_${endpoint}_error`, startMark);
    performanceMonitor.recordRequestTiming(duration, false, false);
    throw error;
  }
}

/**
 * Optimized DELETE request
 */
async function optimizedDelete<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { priority } = options;

  const startMark = `api_delete_${endpoint}_${Date.now()}`;
  markPerformance(startMark);

  // Invalidate cache
  cacheManager.invalidatePattern(endpoint);

  const requestPriority = priority ?? getPriorityForEndpoint(endpoint);

  const requestFn = async (): Promise<ApiResponse<T>> => {
    const response = await axiosInstance.delete<ApiResponse<T>>(endpoint);
    return response.data;
  };

  const promise = withRetry(
    () => requestQueueManager.enqueue(requestFn, requestPriority),
    defaultConfig.retry
  );

  try {
    const result = await promise;
    const duration = measurePerformance(`api_delete_${endpoint}`, startMark);
    performanceMonitor.recordRequestTiming(duration, true, false);
    return result;
  } catch (error: any) {
    const duration = measurePerformance(`api_delete_${endpoint}_error`, startMark);
    performanceMonitor.recordRequestTiming(duration, false, false);
    throw error;
  }
}

/**
 * Optimized API client
 */
export const optimizedApi = {
  get: optimizedGet,
  post: optimizedPost,
  patch: optimizedPatch,
  delete: optimizedDelete,

  // Expose utilities
  cache: cacheManager,
  performance: performanceMonitor,
  queue: requestQueueManager,
};

// Export utilities for direct access
export { cacheManager, performanceMonitor, requestQueueManager };

// Export axios instance for advanced use cases
export { axiosInstance };
