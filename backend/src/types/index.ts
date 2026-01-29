// Shared TypeScript types for CleanOps backend

export type UserRole = 'customer' | 'employee';

export type JobStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED' | 'CANCELLED';

export type JobUrgency = 'LOW' | 'NORMAL' | 'HIGH';

export type NotificationType = 
  | 'JOB_ASSIGNED' 
  | 'JOB_UPDATED' 
  | 'MESSAGE_RECEIVED' 
  | 'PAYMENT_RECEIVED' 
  | 'DISPATCH_ALERT';

export interface Profile {
  id: string;
  role: UserRole;
  stripe_account_id?: string | null;
  rating: number;
  location_lat?: number | null;
  location_lng?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  customer_id: string;
  worker_id?: string | null;
  status: JobStatus;
  urgency: JobUrgency;
  price_amount: number;
  stripe_payment_intent_id?: string | null;
  location_coordinates: {
    lat: number;
    lng: number;
    address: string;
  };
  tasks: Task[];
  proof_of_work: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  cancelled_at?: string | null;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  completed?: boolean;
}

export interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  payload: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}

export interface CreateJobRequest {
  customer_id: string;
  urgency: JobUrgency;
  price_amount: number;
  location_coordinates: {
    lat: number;
    lng: number;
    address: string;
  };
  tasks: Task[];
}

export interface ClaimJobRequest {
  worker_id: string;
  job_id: string;
}

export interface UpdateJobStatusRequest {
  job_id: string;
  status: JobStatus;
  proof_of_work?: string[];
}

export interface CreateMessageRequest {
  job_id: string;
  sender_id: string;
  content: string;
}
