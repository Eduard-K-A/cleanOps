'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { JobCard } from '@/components/jobs/JobCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAsyncData } from '@/hooks/useAsyncData';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import type { Job } from '@/types';
import toast from 'react-hot-toast';

export default function EmployeeHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [markingDone, setMarkingDone] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [proofDescription, setProofDescription] = useState('');
  const [proofUrls, setProofUrls] = useState<string[]>(['']);

  const { data: allJobs, loading, refetch } = useAsyncData<Job[]>({
    fetchFn: () => api.getJobs(),
    defaultValue: [],
    errorMessage: 'Failed to load history',
  });

  // Filter jobs explicitly to only those claimed by this worker
  const historyJobs = allJobs.filter((job) => job.worker_id === user?.id);

  function handleMarkDone(job: Job) {
    setSelectedJob(job);
    setProofDescription('');
    setProofUrls(['']);
    setModalOpen(true);
  }

  function addProofUrl() {
    setProofUrls([...proofUrls, '']);
  }

  function updateProofUrl(index: number, value: string) {
    const newUrls = [...proofUrls];
    newUrls[index] = value;
    setProofUrls(newUrls);
  }

  function removeProofUrl(index: number) {
    if (proofUrls.length > 1) {
      setProofUrls(proofUrls.filter((_, i) => i !== index));
    }
  }

  function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  async function submitMarkDone() {
    if (!selectedJob) return;

    const validUrls = proofUrls.map((url) => url.trim()).filter((url) => url !== '');
    if (validUrls.length === 0) {
      toast.error('Please provide at least one proof of work URL');
      return;
    }

    const invalidUrl = validUrls.find((url) => !isValidUrl(url));
    if (invalidUrl) {
      toast.error('One or more proof URLs are invalid. Please enter valid URLs (https://...)');
      return;
    }

    try {
      setMarkingDone(selectedJob.id);
      await api.updateJobStatus(selectedJob.id, 'PENDING_REVIEW', validUrls);
      toast.success('Job submitted for review');
      setModalOpen(false);
      await refetch();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error ?? 'Failed to submit job');
    } finally {
      setMarkingDone(null);
    }
  }

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
                  <div key={job.id}>
                    <JobCard
                      job={job}
                      showClaim={false}
                      onView={(id) => router.push(`/employee/jobs/${id}`)}
                    />
                    {job.status === 'IN_PROGRESS' && (
                      <Button
                        className="mt-2 w-full"
                        onClick={() => handleMarkDone(job)}
                        disabled={!!markingDone}
                      >
                        Mark as Done
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Mark Job as Done"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Please provide proof of work completed. Add URLs to photos or descriptions of the work done.
          </p>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe the work completed..."
              value={proofDescription}
              onChange={(e) => setProofDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label>Proof of Work URLs</Label>
            <div className="space-y-2">
              {proofUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="https://example.com/photo.jpg"
                    value={url}
                    onChange={(e) => updateProofUrl(index, e.target.value)}
                  />
                  {proofUrls.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeProofUrl(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addProofUrl}
              className="mt-2"
            >
              Add Another URL
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitMarkDone}
              disabled={markingDone === selectedJob?.id}
            >
              {markingDone === selectedJob?.id ? 'Submitting…' : 'Submit for Review'}
            </Button>
          </div>
        </div>
      </Modal>
    </ProtectedRoute>
  );
}
