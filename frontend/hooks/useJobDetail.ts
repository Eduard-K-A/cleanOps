import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { Job } from '@/types';
import toast from 'react-hot-toast';

export function useJobDetail() {
  const params = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    const id = params?.id as string;
    if (!id) {
      setLoading(false);
      return;
    }

    (async () => {
      console.debug('useJobDetail: fetching job', { id });
      try {
        const response = await api.get<Job>(`/jobs/${id}`);
        setJob(response.data ?? null);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { error?: string } } };
        const message = err?.response?.data?.error ?? 'Failed to load job';
        console.error('useJobDetail fetch error', { id, err });
        toast.error(message);
        setJob(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [params?.id]);

  const handleApprove = async () => {
    if (!job) return;
    try {
      setApproving(true);
      await api.approveJob(job.id);
      toast.success('Job approved. Payout completed.');
      setJob((j) => (j ? { ...j, status: 'COMPLETED' as const } : null));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error ?? 'Failed to approve');
    } finally {
      setApproving(false);
    }
  };

  return { job, loading, approving, handleApprove };
}
