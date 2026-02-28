'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { JobCard } from '@/components/jobs/JobCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAsyncData } from '@/hooks/useAsyncData';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import type { Job } from '@/types';

export default function EmployeeHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: allJobs, loading, refetch } = useAsyncData<Job[]>({
    fetchFn: () => api.getJobs(),
    defaultValue: [],
    errorMessage: 'Failed to load history',
  });

  // Filter jobs explicitly to only those claimed by this worker
  const historyJobs = allJobs.filter((job) => job.worker_id === user?.id);

  return (
    <ProtectedRoute requiredRole="employee" redirectTo="/customer/dashboard">
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Your History</h1>
          <p className="mb-8 text-slate-600">Jobs you have claimed or completed.</p>

          {loading && historyJobs.length === 0 ? (
            <LoadingSpinner size="lg" className="py-16" />
          ) : historyJobs.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-12 text-center space-y-4">
              <p className="text-slate-600">You haven't claimed any jobs yet.</p>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                onClick={async () => { await refetch(); }}
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className={`relative ${loading ? 'opacity-70' : ''}`}>
              {loading && (
                <div className="absolute right-0 top-0 mr-2 mt-1 text-sm text-slate-500">Refreshing…</div>
              )}
              <div className="grid gap-6 sm:grid-cols-2">
                {historyJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    showClaim={false}
                    onView={(id) => router.push(`/employee/jobs/${id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
