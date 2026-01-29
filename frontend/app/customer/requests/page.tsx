'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { JobCard } from '@/components/jobs/JobCard';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { Job } from '@/types';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function RequestsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getJobs();
      setJobs(response.data ?? []);
    } catch (e: unknown) {
      const err = e as {
        code?: string;
        message?: string;
        response?: { data?: { error?: string } };
      };
      const isNetworkError =
        err?.code === 'ERR_NETWORK' ||
        err?.message?.includes('Network Error') ||
        err?.message?.includes('ERR_CONNECTION_REFUSED');

      const message = isNetworkError
        ? 'Cannot reach the backend server. Make sure it is running on http://localhost:5000 and that NEXT_PUBLIC_API_URL is set correctly.'
        : err?.response?.data?.error ?? 'Failed to load your requests.';

      setError(message);
      toast.error(message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      setApproving(id);
      await api.approveJob(id);
      toast.success('Job approved. Payout completed.');
      await fetchJobs();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error ?? 'Failed to approve');
    } finally {
      setApproving(null);
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">My requests</h1>
          <p className="mb-8 text-slate-600">Track and manage your cleaning jobs.</p>

          {error && !loading && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-12 text-center space-y-4">
              <p className="text-slate-600">You don&apos;t have any job requests yet.</p>
              <Button onClick={() => router.push('/customer/order')}>
                Create your first order
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {jobs.map((job) => (
                <div key={job.id} className="relative">
                  <JobCard
                    job={job}
                    onView={(id) => router.push(`/customer/jobs/${id}`)}
                  />
                  {job.status === 'PENDING_REVIEW' && (
                    <Button
                      className="mt-2 w-full"
                      onClick={() => handleApprove(job.id)}
                      disabled={!!approving}
                    >
                      {approving === job.id ? 'Approving…' : 'Approve & complete'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
