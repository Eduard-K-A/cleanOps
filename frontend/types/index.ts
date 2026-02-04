export type JobStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED' | 'CANCELLED';
export type JobUrgency = 'LOW' | 'NORMAL' | 'HIGH';
export type BookingStep = 'TASKS' | 'LOCATION' | 'URGENCY' | 'PRICE' | 'REVIEW';

export interface Profile {
  id: string;
  role: 'customer' | 'employee';
  stripe_account_id?: string | null;
  rating?: number | null;
  location_lat?: number | null;
  location_lng?: number | null;
  full_name?: string | null;
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Job {
  id: string;
  customer_id: string;
  worker_id?: string | null;
  status: JobStatus;
  urgency: JobUrgency;
  price_amount: number;
  stripe_payment_intent_id?: string | null;
  location_coordinates?: unknown;
  location_address?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  tasks: string[];
  proof_of_work: string[];
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  success: false;
  error: string;
  code: number;
}

export interface CreateJobBody {
  size?: string;
  location_lat: number;
  location_lng: number;
  urgency: JobUrgency;
  tasks: string[];
  price_amount: number;
}

export interface CreateJobRequest {
  urgency: JobUrgency;
  price_amount: number;
  // Client now only collects an address string; lat/lng may be resolved later.
  address: string;
  tasks: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
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
  type: 'JOB_ASSIGNED' | 'JOB_UPDATED' | 'MESSAGE_RECEIVED' | 'PAYMENT_RECEIVED' | 'DISPATCH_ALERT';
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



