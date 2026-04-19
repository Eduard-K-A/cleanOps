import { ApiResponse, CreateJobRequest, Job, Message, Notification, Profile } from '../types';
import { supabase } from './supabase';
import { 
  applyForJob,
  getJobApplications,
  handleApplication,
  updateJobStatus, 
  approveJobCompletion,
  getNearbyJobs,
  getCustomerJobs,
  getEmployeeJobs,
  getAllOpenJobs
} from '../app/actions/jobs';
import { 
  getMessages, 
  sendMessage 
} from '../app/actions/messages';
import { 
  addMoney, 
  getBalance 
} from '../app/actions/payments';
import {
  uploadProofOfWork,
  deleteProofOfWork
} from '../app/actions/storage';


// Helper function to format Supabase responses to match API response format
function formatSupabaseResponse<T>(data: T | null, error: { message: string; code?: string } | null): ApiResponse<T> {
  if (error) {
    return {
      success: false,
      error: error.message || 'Unknown error',
      code: parseInt(error.code || '500', 10)
    };
  }
  
  if (!data) {
    return {
      success: false,
      error: 'Data not found',
      code: 404
    };
  }
  
  return {
    success: true,
    data
  };
}

export const api = {
  // Generic methods using Supabase - simplified to avoid typing issues
  async get<T = any>(table: string, params?: { 
    id?: string; 
    filters?: Record<string, any>; 
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
  }): Promise<ApiResponse<T>> {
    try {
      let query = (supabase.from(table as any) as any).select('*');
      
      if (params?.id) {
        query = query.eq('id', params.id).single();
      }
      
      if (params?.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      if (params?.orderBy) {
        query = query.order(params.orderBy.column, { ascending: params.orderBy.ascending });
      }
      
      if (params?.limit) {
        query = query.limit(params.limit);
      }
      
      const { data, error } = await query;
      return formatSupabaseResponse(data as T, error);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  async patch<T = any>(table: string, id: string, data?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const updateData = data || {};
      
      const { data: result, error } = await (supabase.from(table as any) as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      return formatSupabaseResponse(result as T, error);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  async post<T = any>(table: string, data?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const insertData = data || {};
      
      const { data: result, error } = await (supabase.from(table as any) as any)
        .insert(insertData)
        .select()
        .single();
      
      return formatSupabaseResponse(result as T, error);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  // Jobs - using API routes
  async createJob(data: CreateJobRequest): Promise<ApiResponse<{ job: Job; transactionId: string }>> {
    try {
      const response = await fetch('/api/customer/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to create job',
          code: response.status
        };
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create job';
      console.error('api.createJob critical error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  async getJobs(status?: string, role?: string): Promise<ApiResponse<Job[]>> {
    try {
      // If role is 'customer', get customer's own jobs
      if (role === 'customer') {
        const jobs = await getCustomerJobs(status);
        return {
          success: true,
          data: jobs as Job[]
        };
      }
      
      // Otherwise, get all available jobs for employees (removed distance filtering)
      const jobs = await getAllOpenJobs();
      console.debug('api.getJobs: getAllOpenJobs result', jobs);
      
      return {
        success: true,
        data: (jobs || []) as Job[]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch jobs';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  async getEmployeeJobs(status?: string): Promise<ApiResponse<Job[]>> {
    try {
      const jobs = await getEmployeeJobs(status);
      return {
        success: true,
        data: jobs as Job[]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch employee jobs';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  async getJobFeed(): Promise<ApiResponse<Job[]>> {
    try {
      const jobs = await getAllOpenJobs();
      
      return {
        success: true,
        data: (jobs || []) as Job[]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get job feed';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  async applyForJob(job_id: string): Promise<ApiResponse<null>> {
    try {
      await applyForJob(job_id);
      return { success: true, data: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply for job';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  async getJobApplications(jobId: string): Promise<ApiResponse<JobApplication[]>> {
    try {
      const apps = await getJobApplications(jobId);
      return {
        success: true,
        data: apps as JobApplication[]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get applications';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  async handleApplication(applicationId: string, status: 'ACCEPTED' | 'REJECTED'): Promise<ApiResponse<null>> {
    try {
      await handleApplication(applicationId, status);
      return { success: true, data: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to handle application';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  async updateJobStatus(
    job_id: string,
    status: Job['status'],
    proof_of_work?: string[]
  ): Promise<ApiResponse<Job>> {
    try {
      await updateJobStatus(job_id, status, proof_of_work);
      
      return {
        success: true,
        data: {} as Job
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update job status';
      return {
        success: false,
        error: errorMessage,
        code: 500 
      };
    }
  },

  async approveJob(job_id: string): Promise<ApiResponse<Job>> {
    try {
      await approveJobCompletion(job_id);
      
      return {
        success: true,
        data: {} as Job
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve job';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  // Messages - using Server Actions
  async getMessages(jobId: string): Promise<ApiResponse<Message[]>> {
    try {
      const messages = await getMessages(jobId);
      
      return {
        success: true,
        data: messages as Message[]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get messages';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  async sendMessage(jobId: string, content: string): Promise<ApiResponse<Message>> {
    try {
      await sendMessage(jobId, content);
      
      // After sending, get the updated messages to return the latest
      const messages = await getMessages(jobId);
      const latestMessage = messages[messages.length - 1];
      
      return {
        success: true,
        data: latestMessage as Message
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  // Notifications - using Supabase directly
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated',
          code: 401
        };
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data as Notification[]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get notifications';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  async markNotificationRead(notificationId: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      return {
        success: true,
        data: null
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark notification as read';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  // Profile - using Supabase directly
  async getProfile(userId?: string): Promise<ApiResponse<Profile>> {
    try {
      let finalUserId = userId;

      if (!finalUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return {
            success: false,
            error: 'User not authenticated',
            code: 401
          };
        }
        finalUserId = user.id;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', finalUserId)
        .maybeSingle(); // ✅ Use maybeSingle() instead of single()

      if (error) throw error;
      
      if (!data) {
        return {
          success: false,
          error: 'Profile not found',
          code: 404
        };
      }

      return {
        success: true,
        data: data as Profile
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get profile';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  async updateProfile(data: Partial<Profile>): Promise<ApiResponse<Profile>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated',
          code: 401
        };
      }

      const { data: result, error } = await supabase.from('profiles')
        .update(data as any)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: result as Profile
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  // Auth - using Supabase directly (Server Actions redirect, so we use client)
  async signUp(email: string, password: string, fullName: string, role: 'customer' | 'employee'): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          }
        }
      });

      if (error) throw error;
      
      let profileData = {} as Profile;
      
      if (data.user) {
        // Create profile using Server Action to avoid RLS issues
        const { createProfile } = await import('../app/actions/auth');
        const profileResult = await createProfile({
          id: data.user.id,
          fullName: fullName,
          role: role,
        });
        
        if (!profileResult.success) {
          throw new Error(profileResult.error || 'Failed to create profile');
        }
        
        if (profileResult.data) {
          profileData = profileResult.data as unknown as Profile;
        }
      }

      return {
        success: true,
        data: profileData
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  async signIn(email: string, password: string): Promise<ApiResponse<Profile>> {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;

      return {
        success: true,
        data: {} as Profile // Return empty profile, actual data will be loaded by auth context
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  async signOut(): Promise<ApiResponse<null>> {
    try {
      await supabase.auth.signOut();
      
      return {
        success: true,
        data: null
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  // Storage operations
  async uploadProofOfWork(jobId: string, file: File): Promise<ApiResponse<{ url: string; path: string }>> {
    try {
      const result = await uploadProofOfWork(jobId, file);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },

  async deleteProofOfWork(filePath: string): Promise<ApiResponse<null>> {
    try {
      await deleteProofOfWork(filePath);
      return {
        success: true,
        data: null
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';
      return {
        success: false,
        error: errorMessage,
        code: 500
      };
    }
  },
};

