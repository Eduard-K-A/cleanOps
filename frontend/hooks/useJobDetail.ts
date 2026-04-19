import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import { approveJobCompletion } from '../app/actions/jobs';
import type { Job } from '../types';
import type { Database } from '../lib/supabase/database.types';
import toast from 'react-hot-toast';
import { useJobUpdates } from './realtime/useJobUpdates';

export function useJobDetail() {
  const params = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const supabase = createClient();

  const fetchJob = useCallback(async () => {
    const id = params?.id as string;
    if (!id) return;

    console.debug('useJobDetail: fetching job', { id });
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, customer_profile:profiles!customer_id(id, full_name), worker_profile:profiles!worker_id(id, full_name)')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (!data) {
        throw new Error('Job not found');
      }
      
      // Type cast to Database type
      const jobData = data as any;
      
      // Transform Supabase data to match Job type
      const transformedJob: Job = {
        id: jobData.id,
        customer_id: jobData.customer_id,
        worker_id: jobData.worker_id,
        worker_name: jobData.worker_name,
        status: jobData.status as Job['status'],
        urgency: jobData.urgency as Job['urgency'],
        price_amount: jobData.price_amount,
        money_transaction_id: jobData.money_transaction_id,
        location_address: jobData.location_address,
        distance: jobData.distance ?? null,
        tasks: (jobData.tasks as any)?.map?.((task: any) => task.name || task) || [],
        proof_of_work: (jobData.proof_of_work as any)?.map?.((proof: any) => proof.url || proof) || [],
        created_at: jobData.created_at,
        updated_at: jobData.updated_at,
        customer_profile: jobData.customer_profile,
        worker_profile: jobData.worker_profile,
      };
      
      setJob(transformedJob);
    } catch (e: unknown) {
      const err = e as any;
      const message = err?.message ?? 'Failed to load job';
      console.error('useJobDetail fetch error', { id, err });
      toast.error(message);
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [params?.id, supabase]);

  useEffect(() => {
    if (params?.id) {
      fetchJob();
    } else {
      setLoading(false);
    }
  }, [params?.id, fetchJob]);

  // Use real-time updates instead of polling
  useJobUpdates(params?.id as string, (updatedJob) => {
    fetchJob(); // Re-fetch to get joined profile data properly
  });

  const handleApprove = async () => {
    if (!job) return;
    try {
      setApproving(true);
      await approveJobCompletion(job.id);
      toast.success('Job approved. Payout completed.');
      setJob((j) => (j ? { ...j, status: 'COMPLETED' as const } : null));
    } catch (e: unknown) {
      const defaultMsg = 'Failed to approve';
      if (e instanceof Error) {
        toast.error(e.message || defaultMsg);
      } else {
        const err = e as any;
        toast.error(err?.message || defaultMsg);
      }
    } finally {
      setApproving(false);
    }
  };

  return { job, loading, approving, handleApprove, refetch: fetchJob };
}
