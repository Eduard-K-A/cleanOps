import { ApiResponse, CreateJobRequest, Job, Message, Notification, Profile } from '@/types';
import { optimizedApi, cacheManager } from './api/optimizedClient';
import { RequestPriority } from './api/requestQueue';

// Re-export optimized API utilities for advanced usage
export { optimizedApi, cacheManager, performanceMonitor, requestQueueManager } from './api/optimizedClient';
export { RequestPriority } from './api/requestQueue';

// Use optimized API client as the default
const apiClient = optimizedApi;

export const api = {
  // Generic methods using optimized client
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return apiClient.get<T>(endpoint, params);
  },

  async patch<T = any>(endpoint: string, data?: Record<string, any>): Promise<ApiResponse<T>> {
    return apiClient.patch<T>(endpoint, data);
  },

  async post<T = any>(endpoint: string, data?: Record<string, any>): Promise<ApiResponse<T>> {
    return apiClient.post<T>(endpoint, data);
  },

  // Jobs - with optimized caching and priorities
  async createJob(data: CreateJobRequest): Promise<ApiResponse<{ job: Job; client_secret: string }>> {
    const result = await apiClient.post<{ job: Job; client_secret: string }>('/jobs', data, { priority: RequestPriority.HIGH });
    // Invalidate the jobs/feed and jobs list caches since a new OPEN job has been added
    // usePattern so any query‑param variants (e.g. "/jobs{}" or "/jobs?status=...") are removed
    if (result.success) {
      cacheManager.invalidatePattern('/jobs/feed');
      cacheManager.invalidatePattern('/jobs');
    }
    return result;
  },

  async getJobs(status?: string, role?: string): Promise<ApiResponse<Job[]>> {
    return apiClient.get<Job[]>('/jobs', { status, role }, {
      useCache: true,
      cacheTTL: 2 * 60 * 1000, // 2 minutes cache
      priority: RequestPriority.HIGH,
    });
  },

  async getJobFeed(): Promise<ApiResponse<Job[]>> {
    // Use a short cache window so employees get reasonable responsiveness
    // while still refreshing frequently. The backend also has its own
    // cache, so even if the client gets a cached response the server
    // may still serve quickly.
    return apiClient.get<Job[]>('/jobs/feed', undefined, {
      useCache: true,
      cacheTTL: 10 * 1000, // 10 seconds
      priority: RequestPriority.HIGH,
    });
  },

  async claimJob(job_id: string): Promise<ApiResponse<Job>> {
    const result = await apiClient.post<Job>('/jobs/claim', { job_id }, {
      priority: RequestPriority.HIGH,
    });
    // Invalidate any cached job lists — both feed and generic queries — so the newly
    // claimed job will show up immediately in history/activities.
    if (result.success) {
      cacheManager.invalidatePattern('/jobs/feed');
      cacheManager.invalidatePattern('/jobs');
    }
    return result;
  },

  async updateJobStatus(
    job_id: string,
    status: Job['status'],
    proof_of_work?: string[]
  ): Promise<ApiResponse<Job>> {
    const result = await apiClient.patch<Job>(`/jobs/${job_id}/status`, {
      status,
      proof_of_work,
    }, {
      priority: RequestPriority.HIGH,
    });
    // Invalidate job-related caches since status changed
    if (result.success) {
      cacheManager.invalidatePattern('/jobs/feed');
      cacheManager.invalidatePattern('/jobs');
      cacheManager.invalidate(`/jobs/${job_id}`);
    }
    return result;
  },

  async approveJob(job_id: string): Promise<ApiResponse<Job>> {
    const result = await apiClient.post<Job>(`/jobs/${job_id}/approve`, undefined, {
      priority: RequestPriority.HIGH,
    });
    // Invalidate job-related caches since job is now completed
    if (result.success) {
      cacheManager.invalidatePattern('/jobs/feed');
      cacheManager.invalidatePattern('/jobs');
      cacheManager.invalidate(`/jobs/${job_id}`);
    }
    return result;
  },

  // Messages
  async getMessages(job_id: string): Promise<ApiResponse<Message[]>> {
    return apiClient.get<Message[]>(`/messages/job/${job_id}`, undefined, {
      useCache: true,
      cacheTTL: 1 * 60 * 1000, // 1 minute cache
      priority: RequestPriority.HIGH,
    });
  },

  async sendMessage(job_id: string, content: string): Promise<ApiResponse<Message>> {
    return apiClient.post<Message>('/messages', { job_id, content }, {
      priority: RequestPriority.HIGH,
    });
  },

  // Notifications
  async getNotifications(is_read?: boolean): Promise<ApiResponse<Notification[]>> {
    return apiClient.get<Notification[]>('/notifications', { is_read }, {
      useCache: true,
      cacheTTL: 30 * 1000, // 30 seconds cache
      priority: RequestPriority.MEDIUM,
    });
  },

  async markNotificationRead(id: string): Promise<ApiResponse<Notification>> {
    return apiClient.patch<Notification>(`/notifications/${id}/read`, undefined, {
      priority: RequestPriority.MEDIUM,
    });
  },

  async markAllNotificationsRead(): Promise<ApiResponse> {
    return apiClient.post('/notifications/read-all', undefined, {
      priority: RequestPriority.MEDIUM,
    });
  },

  // Auth - critical priority
  async getProfile(): Promise<ApiResponse<Profile>> {
    return apiClient.get<Profile>('/auth/me', undefined, {
      useCache: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes cache
      priority: RequestPriority.CRITICAL,
    });
  },

  async signup(email: string, password: string, role?: 'customer' | 'employee'): Promise<ApiResponse> {
    return apiClient.post('/auth/signup', {
      email,
      password,
      role,
    }, {
      priority: RequestPriority.CRITICAL,
    });
  },

  // Update current user's profile (name, location, etc.)
  async updateProfile(updates: Partial<Profile>): Promise<ApiResponse<Profile>> {
    return apiClient.patch<Profile>('/auth/me', updates as any, {
      priority: RequestPriority.HIGH,
    });
  }
};
