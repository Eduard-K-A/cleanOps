'use server'

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';
import type { JobStatus, JobUrgency } from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Centralized admin role verifier - uses SECURITY DEFINER function to bypass RLS
async function verifyAdmin(supabase: any, userId: string) {
  // Use the SECURITY DEFINER function we created to bypass RLS
  const { data: isAdmin, error } = await supabase
    .rpc('is_admin_user', { user_id: userId });
    
  if (error || !isAdmin) {
    throw new Error('Forbidden: Admin access required');
  }
}

/**
 * Task 4 & 9: Get All Jobs for Admin (Paginated, Filtered, Sorted)
 * Supports ilike casting on uuid via id::text
 */
export async function getAllJobsAdmin(filters: {
  status?: JobStatus | 'ALL' | 'All';
  urgency?: JobUrgency | 'ALL' | 'All';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'newest' | 'oldest' | 'price_high' | 'price_low';
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  await verifyAdmin(supabase, user.id);

  let query = (supabase as any)
    .from('jobs')
    .select('*, customer:profiles!customer_id(full_name), worker:profiles!worker_id(full_name)', { count: 'exact' });

  // Normalize to uppercase so 'All', 'all', 'ALL' are all treated the same
  const normalizedStatus = filters.status?.toUpperCase() as JobStatus | 'ALL' | undefined;
  const normalizedUrgency = filters.urgency?.toUpperCase() as JobUrgency | 'ALL' | undefined;

  // Filters
  if (normalizedStatus && normalizedStatus !== 'ALL') {
    query = query.eq('status', normalizedStatus);
  }
  if (normalizedUrgency && normalizedUrgency !== 'ALL') {
    query = query.eq('urgency', normalizedUrgency);
  }
  
  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    // PostgREST type casting syntax: column::type.operator.value
    query = query.or(`location_address.ilike.${searchTerm},id::text.ilike.${searchTerm}`);
  }

  // Sorting
  if (filters.sortBy === 'oldest') {
    query = query.order('created_at', { ascending: true });
  } else if (filters.sortBy === 'price_high') {
    query = query.order('price_amount', { ascending: false });
  } else if (filters.sortBy === 'price_low') {
    query = query.order('price_amount', { ascending: true });
  } else {
    // newest is default
    query = query.order('created_at', { ascending: false });
  }

  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  query = query.range(from, to);

  const { data, count, error } = await query;
  
  if (error) {
    console.error('getAllJobsAdmin error:', error);
    throw error;
  }

  return { success: true, data: { jobs: data || [], total: count || 0 } };
}

/**
 * Task 6: Get All Users merged with Auth email
 */
export async function getAllUsersAdmin(filters: {
  search?: string;
  role?: string;
  sortBy?: 'newest' | 'oldest' | 'balance_high' | 'rating_high';
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  await verifyAdmin(supabase, user.id);

  let query = (supabase as any).from('profiles').select('*');

  if (filters.role && filters.role.toUpperCase() !== 'ALL') {
    query = query.eq('role', filters.role.toLowerCase());
  }

  if (filters.search) {
    query = query.ilike('full_name', `%${filters.search}%`);
  }

  if (filters.sortBy === 'oldest') query = query.order('created_at', { ascending: true });
  else if (filters.sortBy === 'balance_high') query = query.order('money_balance', { ascending: false });
  else if (filters.sortBy === 'rating_high') query = query.order('rating', { ascending: false });
  else query = query.order('created_at', { ascending: false }); // newest

  const { data: profiles, error } = await query;
  if (error) throw error;

  // Use raw JS Supabase client to fetch auth.users
  const { createClient: createRawClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createRawClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) throw authError;

  // Combine
  const usersWithEmail = (profiles || []).map((profile: any) => {
    const authUser = authData.users.find(u => u.id === profile.id);
    return {
      ...profile,
      email: authUser?.email || 'No email'
    };
  });

  return usersWithEmail;
}

export async function updateUserRole(userId: string, targetRole: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  await verifyAdmin(supabase, user.id);

  const { error } = await (supabase as any)
    .from('profiles')
    .update({ role: targetRole })
    .eq('id', userId);
    
  if (error) throw error;

  // 🔄 SYNC JWT METADATA: Update JWT to match new database role
  // This ensures the user's JWT metadata reflects their new role immediately
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user && session.user.id === userId) {
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...session.user.user_metadata,
        role: targetRole,
      },
    });
    
    if (updateError) {
      console.error('[admin] Failed to update JWT metadata after role change:', updateError);
    } else {
      console.log('[admin] JWT metadata updated for role change:', targetRole);
    }
  }
}

export async function getUserActivity(userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  await verifyAdmin(supabase, user.id);

  const { data: asCustomer } = await (supabase as any).from('jobs').select('*').eq('customer_id', userId);
  const { data: asWorker } = await (supabase as any).from('jobs').select('*').eq('worker_id', userId);

  const customerJobs = (asCustomer || []) as any[];
  const workerJobs = (asWorker || []) as any[];

  const totalSpent = customerJobs.reduce((sum, j) => sum + (j.price_amount || 0), 0);
  const totalEarned = workerJobs.filter((j) => j.status === 'COMPLETED').reduce((sum, j) => sum + (j.price_amount || 0), 0);

  return {
    customerJobs,
    workerJobs,
    totalSpent,
    totalEarned
  };
}

export async function adminAddMoney(userId: string, amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  await verifyAdmin(supabase, user.id);

  // amount is in dollars
  const { error } = await (supabase as any).rpc('add_money', {
    user_id: userId,
    amount: amount
  });
  if (error) throw error;
}

/**
 * Task 7: Analytics Server Actions
 */
export async function getJobsByDay(days: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  await verifyAdmin(supabase, user.id);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await (supabase as any)
    .from('jobs')
    .select('created_at')
    .gte('created_at', startDate.toISOString());

  if (error) throw error;

  const grouped = ((data as any[]) || []).reduce((acc: Record<string, number>, job: any) => {
    const date = new Date(job.created_at).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const results = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    results.push({
      date: dateStr.slice(5),
      count: grouped[dateStr] || 0
    });
  }

  return results;
}

export async function getRevenueByWeek(weeks: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  await verifyAdmin(supabase, user.id);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (weeks * 7));

  const { data, error } = await (supabase as any)
    .from('jobs')
    .select('created_at, price_amount')
    .eq('status', 'COMPLETED')
    .gte('created_at', startDate.toISOString());

  if (error) throw error;

  const grouped = ((data as any[]) || []).reduce((acc: Record<string, number>, job: any) => {
    const jobDate = new Date(job.created_at);
    // Simple grouping by start of week date or week string
    const yearStart = new Date(Date.UTC(jobDate.getUTCFullYear(),0,1));
    const weekNo = Math.ceil(( ( (jobDate.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    const key = `W${weekNo}`;
    acc[key] = (acc[key] || 0) + Number(job.price_amount || 0);
    return acc;
  }, {});

  return Object.entries(grouped).map(([week, revenue]) => ({ week, revenue }));
}

export async function getJobStatusBreakdown() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  await verifyAdmin(supabase, user.id);

  const { data, error } = await (supabase as any).from('jobs').select('status');
  if (error) throw error;

  const grouped = ((data as any[]) || []).reduce((acc: Record<string, number>, job: any) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped).map(([status, count]) => ({ status, count }));
}

export async function getTopEmployees(limit: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  await verifyAdmin(supabase, user.id);

  const { data: employees } = await (supabase as any).from('profiles').select('id, full_name, role').eq('role', 'employee');
  const { data: jobs } = await (supabase as any).from('jobs').select('worker_id, price_amount').eq('status', 'COMPLETED');

  if (!employees || !jobs) return [];

  const stats = (employees as any[]).map((emp) => {
    const wJobs = (jobs as any[]).filter((j) => j.worker_id === emp.id);
    const totalEarned = wJobs.reduce((sum, j) => sum + (Number(j.price_amount || 0) * 0.85), 0);
    return { id: emp.id, full_name: emp.full_name, completedJobs: wJobs.length, totalEarned };
  });

  return stats.sort((a, b) => b.totalEarned - a.totalEarned).slice(0, limit);
}

export async function getTopCustomers(limit: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  await verifyAdmin(supabase, user.id);

  const { data: customers } = await (supabase as any).from('profiles').select('id, full_name, role').eq('role', 'customer');
  const { data: jobs } = await (supabase as any).from('jobs').select('customer_id, price_amount').neq('status', 'CANCELLED');

  if (!customers || !jobs) return [];

  const stats = (customers as any[]).map((cust) => {
    const cJobs = (jobs as any[]).filter((j) => j.customer_id === cust.id);
    const totalSpent = cJobs.reduce((sum, j) => sum + Number(j.price_amount || 0), 0);
    return { id: cust.id, full_name: cust.full_name, jobsCreated: cJobs.length, totalSpent };
  });

  return stats.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, limit);
}

export async function getKpiTrend(days: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  await verifyAdmin(supabase, user.id);

  const now = new Date();
  
  const currentStart = new Date();
  currentStart.setDate(now.getDate() - days);
  
  const previousStart = new Date();
  previousStart.setDate(currentStart.getDate() - days);

  const { data: currentJobs } = await (supabase as any).from('jobs').select('status, price_amount').gte('created_at', currentStart.toISOString());
  const { data: previousJobs } = await (supabase as any).from('jobs').select('status, price_amount').gte('created_at', previousStart.toISOString()).lt('created_at', currentStart.toISOString());
  
  const { count: currentEmployees } = await (supabase as any).from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'employee');

  const calcRev = (arr: { status: string; price_amount: number }[]) => arr.filter(j => j.status === 'COMPLETED').reduce((sum, j) => sum + (Number(j.price_amount) || 0), 0);
  const calcPen = (arr: { status: string }[]) => arr.filter(j => j.status === 'PENDING_REVIEW').length;

  return {
    current: {
      totalJobs: (currentJobs || []).length,
      totalRevenue: calcRev((currentJobs || []) as any),
      activeEmployees: currentEmployees || 0,
      pendingReviews: calcPen((currentJobs || []) as any)
    },
    previous: {
      totalJobs: (previousJobs || []).length,
      totalRevenue: calcRev((previousJobs || []) as any),
      activeEmployees: currentEmployees || 0, // Mocked previous employee count logic
      pendingReviews: calcPen((previousJobs || []) as any)
    }
  };
}

export async function getPlatformConfig() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  await verifyAdmin(supabase, user.id);

  const { data, error } = await (supabase as any).from('platform_config').select('*');
  if (error) throw error;
  
  return (data || []).reduce((acc: Record<string, string>, row: any) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

export async function upsertPlatformConfig(key: string, value: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  await verifyAdmin(supabase, user.id);

  const { error } = await (supabase as any).from('platform_config').upsert({
    key,
    value,
    updated_by: user.id,
    updated_at: new Date().toISOString()
  }, { onConflict: 'key' });

  if (error) throw error;
}