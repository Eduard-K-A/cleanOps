'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { JobCard } from '@/components/jobs/JobCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAsyncData } from '@/hooks/useAsyncData';
import { api } from '@/lib/api';
import type { Job } from '@/types';
import toast from 'react-hot-toast';

export default function EmployeeFeedPage() {
  const router = useRouter();
  const [claiming, setClaiming] = useState<string | null>(null);

  const { data: jobs, loading, refetch } = useAsyncData<Job[]>({
    fetchFn: () => api.getJobFeed(),
    defaultValue: [],
    errorMessage: 'Failed to load jobs',
  });

  async function handleClaim(id: string) {
    try {
      setClaiming(id);
      await api.claimJob(id);
      toast.success('Job claimed');
      await refetch();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error ?? 'Failed to claim');
    } finally {
      setClaiming(null);
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Available jobs</h1>
          <p className="mb-8 text-slate-600">Claim jobs near you. Sorted by proximity when location is provided.</p>

          {loading ? (
            <LoadingSpinner size="lg" className="py-16" />
          ) : jobs.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-12 text-center space-y-4">
              <p className="text-slate-600">No open jobs right now. Check back later.</p>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                onClick={() => refetch()}
              >
                Refresh jobs
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  showClaim
                  isClaiming={claiming === job.id}
                  onClaim={handleClaim}
                  onView={(id) => router.push(`/employee/jobs/${id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
