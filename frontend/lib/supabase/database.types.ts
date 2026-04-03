export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'customer' | 'employee' | 'admin'
          money_balance: number
          rating: number | null
          location_lat: number | null
          location_lng: number | null
          full_name: string | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          role: 'customer' | 'employee' | 'admin'
          money_balance?: number
          rating?: number | null
          location_lat?: number | null
          location_lng?: number | null
          full_name?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'customer' | 'employee' | 'admin'
          money_balance?: number
          rating?: number | null
          location_lat?: number | null
          location_lng?: number | null
          full_name?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          customer_id: string
          worker_id: string | null
          status: 'OPEN' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED' | 'CANCELLED'
          urgency: 'LOW' | 'NORMAL' | 'HIGH'
          price_amount: number
          money_transaction_id: string | null
          location_address: string | null
          distance: number | null
          tasks: Json
          proof_of_work: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          worker_id?: string | null
          status?: 'OPEN' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED' | 'CANCELLED'
          urgency?: 'LOW' | 'NORMAL' | 'HIGH'
          price_amount: number
          money_transaction_id?: string | null
          location_address?: string | null
          distance?: number | null
          tasks?: Json
          proof_of_work?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          worker_id?: string | null
          status?: 'OPEN' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED' | 'CANCELLED'
          urgency?: 'LOW' | 'NORMAL' | 'HIGH'
          price_amount?: number
          money_transaction_id?: string | null
          location_address?: string | null
          distance?: number | null
          tasks?: Json
          proof_of_work?: Json
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          job_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          payload: Json
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          payload?: Json
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          payload?: Json
          is_read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_money: {
        Args: {
          user_id: string
          amount: number
        }
        Returns: void
      }
      claim_job: {
        Args: {
          p_job_id: string
          p_employee_id: string
        }
        Returns: string
      }
      get_nearby_jobs: {
        Args: {
          lat: number
          lng: number
          radius_meters?: number
        }
        Returns: Database['public']['Tables']['jobs']['Row'][]
      }
      release_escrow: {
        Args: {
          p_job_id: string
          p_employee_id: string
          p_amount: number
          p_platform_fee: number
        }
        Returns: void
      }
    }
    Enums: {
      job_status: 'OPEN' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED' | 'CANCELLED'
      job_urgency: 'LOW' | 'NORMAL' | 'HIGH'
    }
  }
}
