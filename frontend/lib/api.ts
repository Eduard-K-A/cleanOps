import { ApiResponse, CreateJobRequest, Job, Message, Notification, Profile } from '../types';
import { createClient } from '../lib/supabase/client';
import type { Database } from '../lib/supabase/database.types';
import { 
  createJob, 
  claimJob, 
  updateJobStatus, 
  approveJobCompletion,
  getNearbyJobs 
} from '../app/actions/jobs';
import { 
  getMessages, 
  sendMessage 
} from '../app/actions/messages';
import { 
  addMoney, 
  getBalance 
} from '../app/actions/payments';

const supabase = createClient();

// Helper function to format Supabase responses to match API response format
function formatSupabaseResponse<T>(data: T | null, error: any): ApiResponse<T> {
  if (error) {
    return {
      success: false,
      error: error.message || 'Unknown error',
      code: error.code || 500
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
  async get<T = any>(table: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      let query: any = supabase.from(table).select('*');
      
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
        code: 500
      };
    }
  },

  async patch<T = any>(table: string, id: string, data?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      // Bypass TypeScript type inference completely
      const supabaseAny = supabase as any;
      const updateData = data || {};
      
      const { data: result, error } = await supabaseAny
        .from(table)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      return formatSupabaseResponse(result as T, error);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
        code: 500
      };
    }
  },

  async post<T = any>(table: string, data?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      // Bypass TypeScript type inference completely
      const supabaseAny = supabase as any;
      const insertData = data || {};
      
      const { data: result, error } = await supabaseAny
        .from(table)
        .insert(insertData)
        .select()
        .single();
      
      return formatSupabaseResponse(result as T, error);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
        code: 500
      };
    }
  },

  // Jobs - using Server Actions
  async createJob(data: CreateJobRequest): Promise<ApiResponse<{ job: Job; transactionId: string }>> {
    try {
      if (!data.address || data.address.trim().length === 0) {
        throw new Error('Invalid job address');
      }
      if (!data.tasks || data.tasks.length === 0) {
        throw new Error('At least one task is required');
      }
      if (!data.price_amount || data.price_amount <= 0) {
        throw new Error('Invalid price amount');
      }

      // Convert CreateJobRequest to match Server Action expectations
      const jobData = {
        title: `Cleaning Job - ${data.tasks.map(t => t.name).join(', ')}`,
        tasks: data.tasks.map(t => t.name),
        urgency: data.urgency.toLowerCase() as 'low' | 'normal' | 'high',
        address: data.address,
        lat: 0,
        lng: 0,
        price: data.price_amount,
        platformFee: Math.round(data.price_amount * 0.15),
      };

      const job = await createJob(jobData);
      
      return {
        success: true,
        data: {
          job: job as Job,
          transactionId: (job as any)?.id || ''
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create job',
        code: 500
      };
    }
  },

  async getJobs(status?: string, role?: string): Promise<ApiResponse<Job[]>> {
    try {
      const jobs = await getNearbyJobs(0, 0); // Simple implementation
      
      return {
        success: true,
        data: jobs as Job[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch jobs',
        code: 500
      };
    }
  },

  async getJobFeed(): Promise<ApiResponse<Job[]>> {
    try {
      const jobs = await getNearbyJobs(0, 0); // Simple implementation
      
      return {
        success: true,
        data: jobs as Job[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get job feed',
        code: 500
      };
    }
  },

  async claimJob(job_id: string): Promise<ApiResponse<Job>> {
    try {
      await claimJob(job_id);
      
      // Return a simple success response
      return {
        success: true,
        data: {} as Job
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to claim job',
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update job status',
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to approve job',
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get messages',
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send message',
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get notifications',
        code: 500
      };
    }
  },

  async markNotificationRead(notificationId: string): Promise<ApiResponse<null>> {
    try {
      // @ts-expect-error - Supabase SDK type limitation, runtime is valid
      const notifUpdate = supabase.from('notifications').update({ read: true })
      const { error } = await notifUpdate.eq('id', notificationId);

      if (error) throw error;

      return {
        success: true,
        data: null
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to mark notification as read',
        code: 500
      };
    }
  },

  // Profile - using Supabase directly
  async getProfile(): Promise<ApiResponse<Profile>> {
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
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as Profile
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get profile',
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

      // @ts-expect-error - Supabase SDK type limitation, runtime is valid
      const profileUpdate = supabase.from('profiles').update(data)
      const { data: result, error } = await profileUpdate
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: result as Profile
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update profile',
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
      
      // Profile will be created by auth trigger or on first login
      // Don't create profile immediately to avoid RLS issues
      
      return {
        success: true,
        data: {} as Profile // Return empty profile, actual data will be loaded by auth context
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to sign up',
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to sign in',
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to sign out',
        code: 500
      };
    }
  },
};
