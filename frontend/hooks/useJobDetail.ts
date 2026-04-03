import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const id = params?.id as string;
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchJob = async () => {
      console.debug('useJobDetail: fetching job', { id });
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        if (!data) {
          throw new Error('Job not found');
        }
        
        // Type cast to Database type
        const jobData = data as Database['public']['Tables']['jobs']['Row'];
        
        // Transform Supabase data to match Job type
        const transformedJob: Job = {
          id: jobData.id,
          customer_id: jobData.customer_id,
          worker_id: jobData.worker_id,
          status: jobData.status as Job['status'],
          urgency: jobData.urgency as Job['urgency'],
          price_amount: jobData.price_amount,
          money_transaction_id: jobData.money_transaction_id,
          location_address: jobData.location_address,
          distance: (jobData as any).distance ?? null,
          tasks: (jobData.tasks as any)?.map?.((task: any) => task.name || task) || [],
          proof_of_work: (jobData.proof_of_work as any)?.map?.((proof: any) => proof.url || proof) || [],
          created_at: jobData.created_at,
          updated_at: jobData.updated_at,
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
    };

    fetchJob();
  }, [params?.id, supabase]);

  // Use real-time updates instead of polling
  useJobUpdates(params?.id as string, (updatedJob) => {
    const transformedJob: Job = {
      id: updatedJob.id,
      customer_id: updatedJob.customer_id,
      worker_id: updatedJob.worker_id,
      status: updatedJob.status as Job['status'],
      urgency: updatedJob.urgency as Job['urgency'],
      price_amount: updatedJob.price_amount,
      money_transaction_id: updatedJob.money_transaction_id,
      location_address: updatedJob.location_address,
      distance: (updatedJob as any).distance ?? null,
      tasks: updatedJob.tasks as string[],
      proof_of_work: updatedJob.proof_of_work as string[],
      created_at: updatedJob.created_at,
      updated_at: updatedJob.updated_at,
    };
    setJob(transformedJob);
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

  return { job, loading, approving, handleApprove };
}
