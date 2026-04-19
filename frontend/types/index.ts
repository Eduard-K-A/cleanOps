export type JobStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED' | 'CANCELLED';
export type JobUrgency = 'LOW' | 'NORMAL' | 'HIGH';
export type BookingStep = 'TASKS' | 'LOCATION' | 'URGENCY' | 'PRICE' | 'REVIEW';

export interface Profile {
  id: string;
  role: 'customer' | 'employee' | 'admin';
  money_balance: number; // Mock money balance
  rating?: number | null;
  location_lat?: number | null;
  location_lng?: number | null;
  full_name?: string | null;
  phone_number?: string | null;
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
  money_transaction_id?: string | null;
  location_address?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  distance?: number | null;
  tasks: string[];
  proof_of_work: string[];
  created_at: string;
  updated_at: string;
  customer_profile?: Pick<Profile, 'id' | 'full_name'> | null;
  worker_profile?: Pick<Profile, 'id' | 'full_name'> | null;
  worker_name?: string | null;
}

export interface ApiError {
  success: false;
  error: string;
  code: number;
}

export interface CreateJobBody {
  size?: string;
  distance?: number;
  urgency: JobUrgency;
  tasks: string[];
  price_amount: number;
}

export interface CreateJobRequest {
  urgency: JobUrgency;
  price_amount: number;
  address: string;
  distance: number;
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
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  job: Job & {
    customer_profile: Pick<Profile, 'id' | 'full_name'>;
    worker_profile: Pick<Profile, 'id' | 'full_name'> | null;
  };
  last_message: Message | null;
  unread_count: number;
}

export interface JobApplication {
  id: string;
  job_id: string;
  employee_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at: string;
  updated_at: string;
  employee_profile?: Pick<Profile, 'id' | 'full_name' | 'rating'> | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 
    | 'JOB_ASSIGNED' 
    | 'JOB_UPDATED' 
    | 'MESSAGE_RECEIVED' 
    | 'PAYMENT_RECEIVED' 
    | 'DISPATCH_ALERT' 
    | 'JOB_REPORTED'
    | 'money_added'
    | 'payout_received'
    | 'payout_sent'
    | 'job_claimed'
    | 'job_completed'
    | 'new_job_nearby'
    | 'APPLICATION_RECEIVED'
    | 'APPLICATION_ACCEPTED'
    | 'APPLICATION_REJECTED';
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



