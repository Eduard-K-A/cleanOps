'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CleaningJobCard } from '@/components/jobs/CleaningJobCard';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { Job } from '@/types';
import toast from 'react-hot-toast';
import { Loader2, RefreshCw, Filter } from 'lucide-react';
import type { JobStatus } from '@/types';

const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'all', label: 'All Requests', color: 'bg-slate-100' },
  { value: 'OPEN', label: 'Open', color: 'bg-blue-100' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-100' },
  { value: 'PENDING_REVIEW', label: 'Pending Review', color: 'bg-orange-100' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-green-100' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100' },
];

export default function RequestsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('OPEN'); // Default to show open requests

  useEffect(() => {
    fetchJobs();
    
    // Auto-refresh jobs every 5 seconds to sync status changes
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [statusFilter]); // Re-fetch when filter changes

  async function fetchJobs() {
    try {
      setError(null);
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const response = await api.getJobs(status, 'customer'); // Pass status filter and customer role
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
      setJobs([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchJobs();
  }

  async function handleApprove(id: string) {
    try {
      setApproving(id);
      await api.approveJob(id);
      toast.success('Job approved. Payout completed.');
      await fetchJobs();
    } catch (e: unknown) {
      const defaultMsg = 'Failed to approve';
      if (e instanceof Error) {
        toast.error(e.message || defaultMsg);
      } else {
        const err = e as { response?: { data?: { error?: string } } };
        toast.error(err?.response?.data?.error ?? defaultMsg);
      }
    } finally {
      setApproving(null);
    }
  }

  async function handleCancel(id: string) {
    try {
      setCancelling(id);
      await api.updateJobStatus(id, 'CANCELLED');
      toast.success('Job cancelled successfully.');
      await fetchJobs();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error ?? 'Failed to cancel job');
    } finally {
      setCancelling(null);
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="mb-2 text-3xl font-bold text-slate-900">My requests</h1>
                <p className="text-slate-600">Track and manage your cleaning jobs.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing…' : 'Refresh'}
              </Button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 mb-6">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Filter by status:</span>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === option.value
                        ? `${option.color} ring-2 ring-offset-2 ring-slate-400`
                        : `${option.color} hover:opacity-80`
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

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
              <p className="text-slate-600">
                {statusFilter === 'all' 
                  ? "You don't have any job requests yet."
                  : `You don't have any ${STATUS_OPTIONS.find(opt => opt.value === statusFilter)?.label.toLowerCase()} requests.`
                }
              </p>
              {statusFilter === 'all' && (
                <Button onClick={() => router.push('/customer/order')}>
                  Create your first order
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {jobs.map((job) => (
                <div key={job.id} className="relative">
                  <CleaningJobCard
                    job={job}
                    onView={(id) => router.push(`/customer/jobs/${id}`)}
                    onCancel={handleCancel}
                    isCancelling={cancelling === job.id}
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
