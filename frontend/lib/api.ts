import axios, { type AxiosInstance } from 'axios';
import { supabase } from './supabase';
import { ApiResponse, CreateJobRequest, Job, Message, Notification, Profile } from '@/types';

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.NODE_ENV === 'development') return 'http://localhost:5000/api';
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0') return 'http://localhost:5000/api';
  }
  return 'https://cleanops-8epb.onrender.com/api';
}

// Create a reusable axios instance with interceptor
const apiClient: AxiosInstance = axios.create({ baseURL: getApiBaseUrl() });

apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const api = {
  // Generic methods for raw API calls
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const response = await apiClient.get(endpoint, { params });
    return response.data;
  },

  async patch<T = any>(endpoint: string, data?: Record<string, any>): Promise<ApiResponse<T>> {
    const response = await apiClient.patch(endpoint, data);
    return response.data;
  },

  async post<T = any>(endpoint: string, data?: Record<string, any>): Promise<ApiResponse<T>> {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  },

  // Jobs
  async createJob(data: CreateJobRequest): Promise<ApiResponse<{ job: Job; client_secret: string }>> {
    const response = await apiClient.post('/jobs', data);
    return response.data;
  },

  async getJobs(status?: string, role?: string): Promise<ApiResponse<Job[]>> {
    const response = await apiClient.get('/jobs', {
      params: { status, role },
    });
    return response.data;
  },

  async getJobFeed(): Promise<ApiResponse<Job[]>> {
    const response = await apiClient.get('/jobs/feed');
    return response.data;
  },

  async claimJob(job_id: string): Promise<ApiResponse<Job>> {
    const response = await apiClient.post('/jobs/claim', { job_id });
    return response.data;
  },

  async updateJobStatus(
    job_id: string,
    status: Job['status'],
    proof_of_work?: string[]
  ): Promise<ApiResponse<Job>> {
    const response = await apiClient.patch(`/jobs/${job_id}/status`, {
      status,
      proof_of_work,
    });
    return response.data;
  },

  async approveJob(job_id: string): Promise<ApiResponse<Job>> {
    const response = await apiClient.post(`/jobs/${job_id}/approve`);
    return response.data;
  },

  // Messages
  async getMessages(job_id: string): Promise<ApiResponse<Message[]>> {
    const response = await apiClient.get(`/messages/job/${job_id}`);
    return response.data;
  },

  async sendMessage(job_id: string, content: string): Promise<ApiResponse<Message>> {
    const response = await apiClient.post('/messages', { job_id, content });
    return response.data;
  },

  // Notifications
  async getNotifications(is_read?: boolean): Promise<ApiResponse<Notification[]>> {
    const response = await apiClient.get('/notifications', {
      params: { is_read },
    });
    return response.data;
  },

  async markNotificationRead(id: string): Promise<ApiResponse<Notification>> {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllNotificationsRead(): Promise<ApiResponse> {
    const response = await apiClient.post('/notifications/read-all');
    return response.data;
  },

  // Auth
  async getProfile(): Promise<ApiResponse<Profile>> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }
};
