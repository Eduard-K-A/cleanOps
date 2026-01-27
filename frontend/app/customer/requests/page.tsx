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

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      setLoading(true);
      const response = await api.getJobs();
      setJobs(response.data ?? []);
    } catch {
      toast.error('Failed to load requests');
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

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
              <p className="text-slate-600">No jobs yet. Create one from the order page.</p>
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
