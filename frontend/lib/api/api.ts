/**
 * Main API client using Supabase Server Actions
 */

import { ApiResponse, CreateJobRequest, Job, Message, Notification, Profile } from '../../types';
import { createClient } from '../../lib/supabase/client';
import type { Database } from '../../lib/supabase/database.types';
import { 
  claimJob, 
  updateJobStatus, 
  approveJobCompletion,
  getNearbyJobs 
} from '../../app/actions/jobs';
import { 
  getMessages, 
  sendMessage 
} from '../../app/actions/messages';
import { 
  addMoney, 
  getBalance 
} from '../../app/actions/payments';

const supabase = createClient();

// Helper function to format Supabase responses to match API response format
function formatSupabaseResponse<T>(data: T | null | undefined, error: any): ApiResponse<T> {
  if (error) {
    return {
      success: false,
      error: error.message || 'Unknown error',
      code: error.code || 500
    };
  }
  return {
    success: true,
    data: data || undefined
  };
}

export const api = {
  // Auth methods
  signUp: async (email: string, password: string, fullName: string, role: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      });
      
      if (error) throw error;
      return { success: true, data: data as unknown };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign up failed',
        code: 500
      };
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return { success: true, data: data as any };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign in failed',
        code: 500
      };
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign out failed',
        code: 500
      };
    }
  },

  // Profile methods
  getProfile: async (): Promise<ApiResponse<Profile>> => {
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

  updateProfile: async (data: Partial<Profile>): Promise<ApiResponse<Profile>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated',
          code: 401
        };
      }

      const updateData = {
        ...(data.full_name !== undefined && { full_name: data.full_name }),
        ...(data.location_lat !== undefined && { location_lat: data.location_lat }),
        ...(data.location_lng !== undefined && { location_lng: data.location_lng }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.onboarding_completed !== undefined && { onboarding_completed: data.onboarding_completed })
      };

      const { data: result, error } = await (supabase as any)
        .from('profiles')
        .update(updateData)
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

  // Jobs - using API routes
  createJob: async (data: CreateJobRequest): Promise<ApiResponse<{ job: Job; transactionId: string }>> => {
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
        throw new Error(result.error || 'Failed to create job');
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create job',
        code: 500
      };
    }
  },

  getJobs: async (status?: string, role?: string): Promise<ApiResponse<Job[]>> => {
    try {
      const jobs = await getNearbyJobs(0, 0); // Simple implementation
      return {
        success: true,
        data: jobs as Job[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to load jobs',
        code: 500
      };
    }
  },

  getJobFeed: async (): Promise<ApiResponse<Job[]>> => {
    try {
      const jobs = await getNearbyJobs(0, 0); // Simple implementation
      return {
        success: true,
        data: jobs as Job[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to load job feed',
        code: 500
      };
    }
  },

  claimJob: async (jobId: string): Promise<ApiResponse<void>> => {
    try {
      await claimJob(jobId);
      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to claim job',
        code: 500
      };
    }
  },

  updateJobStatus: async (jobId: string, status: string, proofOfWork?: string[]): Promise<ApiResponse<void>> => {
    try {
      await updateJobStatus(jobId, status, proofOfWork);
      return {
        success: true,
        data: undefined
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update job status',
        code: 500
      };
    }
  },

  approveJobCompletion: async (jobId: string): Promise<ApiResponse<void>> => {
    try {
      await approveJobCompletion(jobId);
      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to approve job completion',
        code: 500
      };
    }
  },

  // Messages
  getMessages: async (jobId: string): Promise<ApiResponse<Message[]>> => {
    try {
      const messages = await getMessages(jobId);
      return {
        success: true,
        data: messages as Message[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to load messages',
        code: 500
      };
    }
  },

  sendMessage: async (jobId: string, content: string): Promise<ApiResponse<Message>> => {
    try {
      const message = await sendMessage(jobId, content);
      return {
        success: true,
        data: message 
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send message',
        code: 500
      };
    }
  },

  // Payments
  addMoney: async (amount: number): Promise<ApiResponse<void>> => {
    try {
      await addMoney(amount);
      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to add money',
        code: 500
      };
    }
  },

  getBalance: async (): Promise<ApiResponse<number>> => {
    try {
      const balance = await getBalance();
      return {
        success: true,
        data: balance as number
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get balance',
        code: 500
      };
    }
  }
};
