'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { EmployeeJobCard } from '@/components/jobs/EmployeeJobCard';
import { FeedPageSkeleton } from '@/components/ui/Skeleton';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useJobFeed } from '@/hooks/realtime/useJobFeed';
import { api } from '@/lib/api';
import type { Job, Profile } from '@/types';
import toast from 'react-hot-toast';
import { MapPin, RefreshCw, Briefcase } from 'lucide-react';



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
  const [applying, setApplying] = useState<string | null>(null);
  const [jobsList, setJobsList] = useState<Job[]>([]);
  const [userApplications, setUserApplications] = useState<string[]>([]); // Store job IDs the user applied to

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

  // Fetch applications for this employee to show "Applied" status
  const fetchApplications = useCallback(async () => {
    try {
      const { data: apps } = await api.get('job_applications', { 
        filters: { employee_id: profile?.id } 
      });
      if (apps) {
        setUserApplications((apps as any[]).map(a => a.job_id));
      }
    } catch (e) {
      console.error('Failed to fetch applications', e);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id) {
      fetchApplications();
    }
  }, [profile?.id, fetchApplications]);

  // Realtime: prepend new jobs, deduplicated
  useJobFeed((newJob) => {
    const job = newJob as unknown as Job;
    setJobsList((prev) => prev.some((j) => j.id === job.id) ? prev : [job, ...prev]);
  });

  useEffect(() => { setJobsList(jobs); }, [jobs]);

  const handleApply = useCallback(async (id: string) => {
    if (applying) return;
    try {
      setApplying(id);
      await api.applyForJob(id);
      toast.success('Application sent to customer!');
      setUserApplications(prev => [...prev, id]);
      await refetch();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      toast.error(err?.response?.data?.error || err?.message || 'Failed to apply for job');
    } finally {
      setApplying(null);
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
            <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">

              {/* Page header */}
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      

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
                <FeedPageSkeleton />
              ) : jobsList.length === 0 ? (
                <EmptyState onRefresh={refetch} isRefreshing={loading} />
              ) : (
                <div className={`transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {jobsList.map((job) => (
                      <EmployeeJobCard
                        key={job.id}
                        job={job}
                        showClaim
                        isClaiming={applying === job.id}
                        onClaim={handleApply}
                        onView={handleView}
                        customerName={job.customer_profile?.full_name}
                        hasApplied={userApplications.includes(job.id)}
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
