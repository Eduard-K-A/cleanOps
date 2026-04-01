import { ApiResponse, CreateJobRequest, Job, Message, Notification, Profile } from '../types';
import { supabase } from './supabase';
import { 
  claimJob, 
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
      console.log('API response result:', result);

      if (!response.ok) {
        const errorMessage = result.error || result.details || 'Failed to create job';
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      return result;
    } catch (error: any) {
      console.error('createJob API error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create job',
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch jobs',
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch employee jobs',
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
