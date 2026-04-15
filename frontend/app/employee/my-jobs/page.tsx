'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { EmployeeJobCard } from '@/components/jobs/EmployeeJobCard';
import { HistoryPageSkeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAsyncData } from '@/hooks/useAsyncData';
import { api } from '@/lib/api';
import type { Job } from '@/types';
import toast from 'react-hot-toast';
import { PlayCircle, ClipboardCheck, X, Upload, ImageIcon } from 'lucide-react';

export default function EmployeeMyJobsPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [markingDone, setMarkingDone] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [proofDescription, setProofDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; path: string; name: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch only IN_PROGRESS jobs (employee's active jobs)
  const { data: myJobs, loading, refetch } = useAsyncData<Job[]>({
    fetchFn: () => api.getEmployeeJobs('IN_PROGRESS'),
    defaultValue: [],
    errorMessage: 'Failed to load your jobs',
  });

  function handleMarkDone(job: Job) {
    setSelectedJob(job);
    setProofDescription('');
    setUploadedFiles([]);
    setModalOpen(true);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Validate file count (max 5 images)
    if (uploadedFiles.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    Array.from(files).forEach(async (file) => {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid image type`);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return;
      }

      if (!selectedJob) return;

      try {
        setUploading(true);
        const response = await api.uploadProofOfWork(selectedJob.id, file);
        
        if (response.success && response.data) {
          setUploadedFiles(prev => [...prev, {
            url: response.data!.url,
            path: response.data!.path,
            name: file.name
          }]);
          toast.success(`${file.name} uploaded successfully`);
        } else {
          toast.error(response.error || `Failed to upload ${file.name}`);
        }
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setUploading(false);
      }
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function removeUploadedFile(index: number) {
    const file = uploadedFiles[index];
    if (!file) return;

    try {
      const response = await api.deleteProofOfWork(file.path);
      if (response.success) {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
        toast.success('Image removed');
      } else {
        toast.error('Failed to remove image');
      }
    } catch (error) {
      toast.error('Failed to remove image');
    }
  }

  async function submitMarkDone() {
    if (!selectedJob) return;

    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one proof of work image');
      return;
    }

    const proofUrls = uploadedFiles.map(file => file.url);

    try {
      setMarkingDone(selectedJob.id);
      await api.updateJobStatus(selectedJob.id, 'PENDING_REVIEW', proofUrls);
      toast.success('Job submitted for review');
      setModalOpen(false);
      setUploadedFiles([]);
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
      <div className="flex h-screen overflow-hidden" style={{ fontFamily: 'var(--md-font-body)' }}>
        {/* Navigation Drawer */}
        <NavigationDrawer />

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          {/* Top App Bar */}
          <TopAppBar
            onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title="My Jobs"
          />

          {/* Page Content */}
          <main
            className="flex-1 overflow-auto p-6"
            style={{
              backgroundColor: 'var(--md-background)',
              padding: 'var(--md-space-6)',
            }}
          >
            <div className="mx-auto max-w-7xl">
              {/* Header with stats */}
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <PlayCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Active Jobs</h1>
                  <p className="text-sm text-gray-500">
                    {myJobs.length} {myJobs.length === 1 ? 'job' : 'jobs'} in progress
                  </p>
                </div>
              </div>

              {loading && myJobs.length === 0 ? (
                <HistoryPageSkeleton />
              ) : myJobs.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-12 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                      <ClipboardCheck className="h-8 w-8 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-slate-700">No active jobs</p>
                    <p className="text-slate-500 mt-1">
                      You don&apos;t have any jobs in progress. Visit the Jobs Feed to claim new jobs.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                    onClick={() => router.push('/employee/feed')}
                  >
                    Browse Jobs Feed
                  </button>
                </div>
              ) : (
                <div className={`relative ${loading ? 'opacity-70' : ''}`}>
                  {loading && (
                    <div className="absolute right-0 top-0 mr-2 mt-1 text-sm text-slate-500">Refreshing…</div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {myJobs.map((job) => (
                      <div key={job.id}>
                        <EmployeeJobCard
                          job={job}
                          showClaim={false}
                          onClaim={() => {}}
                          onView={(id: string) => router.push(`/employee/jobs/${id}`)}
                        />
                        <Button
                          className="mt-2 w-full"
                          onClick={() => handleMarkDone(job)}
                          disabled={!!markingDone}
                        >
                          {markingDone === job.id ? 'Processing…' : 'Mark as Done'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

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
            <Label>Proof of Work Photos</Label>
            <p className="text-xs text-slate-500 mb-2">
              Upload up to 5 images (JPEG, PNG, WebP, max 5MB each)
            </p>
            
            {/* Image Preview Grid */}
            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                    <img
                      src={file.url}
                      alt={`Proof ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeUploadedFile(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={uploading}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {uploadedFiles.length < 5 && (
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  multiple
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Uploading…
                    </>
                  ) : (
                    <>
                      <ImageIcon size={16} className="mr-2" />
                      {uploadedFiles.length === 0 ? 'Add Photos' : 'Add More Photos'}
                    </>
                  )}
                </Button>
              </div>
            )}
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
