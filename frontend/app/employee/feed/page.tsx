'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { EmployeeJobCard } from '@/components/jobs/EmployeeJobCard';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useJobFeed } from '@/hooks/realtime/useJobFeed';
import { api } from '@/lib/api';
import type { Job, Profile } from '@/types';
import toast from 'react-hot-toast';
import { MapPin, RefreshCw, Briefcase } from 'lucide-react';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="h-1 bg-slate-200" />
      <div className="p-5 space-y-4">
        <div className="flex justify-between gap-3">
          <div className="space-y-2 flex-1">
            <div className="h-3 w-16 rounded bg-slate-100" />
            <div className="h-4 w-3/4 rounded-lg bg-slate-200" />
          </div>
          <div className="h-6 w-20 rounded-full bg-slate-200" />
        </div>
        <div className="grid grid-cols-3 gap-px rounded-xl bg-slate-100 overflow-hidden">
          {[0,1,2].map(i => <div key={i} className="h-14 bg-slate-50" />)}
        </div>
        <div className="h-4 w-2/3 rounded bg-slate-100" />
        <div className="flex gap-2">
          <div className="h-10 flex-1 rounded-xl bg-slate-100" />
          <div className="h-10 flex-1 rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onRefresh, isRefreshing }: { onRefresh: () => void; isRefreshing: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border-2 border-dashed border-slate-200 bg-white px-8 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <Briefcase className="h-8 w-8 text-slate-400" aria-hidden="true" />
      </div>
      <div>
        <p className="text-base font-semibold text-slate-800">No open jobs right now</p>
        <p className="mt-1 text-sm text-slate-500">New jobs appear here in real time — check back soon.</p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
        {isRefreshing ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  );
}

// ─── Location banner ──────────────────────────────────────────────────────────
// Removed LocationBanner as distance filtering is disabled

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmployeeFeedPage() {
  const router = useRouter();
  const [claiming, setClaiming] = useState<string | null>(null);
  const [jobsList, setJobsList] = useState<Job[]>([]);

  const { data: jobs, loading, refetch } = useAsyncData<Job[]>({
    fetchFn: () => api.getJobs('OPEN'),
    defaultValue: [],
    errorMessage: 'Failed to load jobs',
  });

  const { data: profile } = useAsyncData<Profile | null>({
    fetchFn: () => api.getProfile(),
    defaultValue: null,
    errorMessage: 'Failed to load profile',
  });

  // Realtime: prepend new jobs, deduplicated
  useJobFeed((newJob) => {
    const job = newJob as unknown as Job;
    setJobsList((prev) => prev.some((j) => j.id === job.id) ? prev : [job, ...prev]);
  });

  useEffect(() => { setJobsList(jobs); }, [jobs]);

  const handleClaim = useCallback(async (id: string) => {
    try {
      setClaiming(id);
      await api.claimJob(id);
      toast.success('Job claimed!');
      setJobsList((prev) => prev.filter((j) => j.id !== id));
      await refetch();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error ?? 'Failed to claim job');
    } finally {
      setClaiming(null);
    }
  }, [refetch]);

  const handleView          = useCallback((id: string) => router.push(`/employee/jobs/${id}`), [router]);
  const handleUpdateProfile = useCallback(() => router.push('/employee/dashboard'), [router]);

  const isInitialLoad    = loading && jobsList.length === 0;

  return (
    <ProtectedRoute requiredRole="employee" redirectTo="/customer/dashboard">
      <div className="flex h-screen overflow-hidden bg-slate-50 antialiased">

        <NavigationDrawer />

        <div className="flex flex-1 flex-col overflow-hidden">
          <TopAppBar title="Available Jobs" />

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">

              {/* Page header */}
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Available Jobs</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Showing all available jobs · updates in real time
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {!isInitialLoad && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-inset ring-sky-200">
                      <span className={`h-1.5 w-1.5 rounded-full ${loading ? 'animate-pulse bg-sky-400' : 'bg-sky-500'}`} aria-hidden="true" />
                      {jobsList.length} {jobsList.length === 1 ? 'job' : 'jobs'} available
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={refetch}
                    disabled={loading}
                    aria-label="Refresh jobs"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Feed */}
              {isInitialLoad ? (
                <FeedSkeleton />
              ) : jobsList.length === 0 ? (
                <EmptyState onRefresh={refetch} isRefreshing={loading} />
              ) : (
                <div className={`transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {jobsList.map((job) => (
                      <EmployeeJobCard
                        key={job.id}
                        job={job}
                        showClaim
                        isClaiming={claiming === job.id}
                        onClaim={handleClaim}
                        onView={handleView}
                      />
                    ))}
                  </div>
                </div>
              )}

            </div>
          </main>
        </div>

      </div>
    </ProtectedRoute>
  );
}
