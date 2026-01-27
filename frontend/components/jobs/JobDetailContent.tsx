'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/authContext';
import { useJobDetail } from '@/hooks/useJobDetail';

interface JobDetailContentProps {
  backPath: string;
  backLabel: string;
  showApprove?: boolean;
}

export function JobDetailContent({ backPath, backLabel, showApprove = false }: JobDetailContentProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { job, loading, approving, handleApprove } = useJobDetail();

  if (loading) {
    return (
      <ProtectedRoute>
        <LoadingSpinner size="lg" className="min-h-[40vh]" />
      </ProtectedRoute>
    );
  }

  if (!job) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-md px-4 py-8">
          <p className="text-slate-600">Job not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push(backPath)}>
            Back to {backLabel}
          </Button>
        </div>
      </ProtectedRoute>
    );
  }

  const isCustomer = user?.id === job.customer_id;
  const isWorker = user?.id === job.worker_id;
  const canApprove = showApprove && isCustomer && job.status === 'PENDING_REVIEW';

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
        <div className="mx-auto max-w-2xl px-4">
          <Button variant="ghost" className="mb-4" onClick={() => router.push(backPath)}>
            ← Back to {backLabel}
          </Button>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <CardTitle>Job details</CardTitle>
              <Badge>{job.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p><strong>Amount:</strong> ${(job.price_amount / 100).toFixed(2)}</p>
              <p><strong>Urgency:</strong> {job.urgency}</p>
              {Array.isArray(job.tasks) && job.tasks.length > 0 && (
                <p><strong>Tasks:</strong> {job.tasks.join(', ')}</p>
              )}
              {Array.isArray(job.proof_of_work) && job.proof_of_work.length > 0 && (
                <div>
                  <p className="font-medium">Proof of work</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {job.proof_of_work.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-sky-600 hover:underline"
                      >
                        View
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {showApprove && isCustomer && job.status === 'IN_PROGRESS' && (
                <p className="text-sm text-slate-600">
                  Worker is completing this job. You'll be able to approve when proof is submitted.
                </p>
              )}
              {!showApprove && isWorker && job.status === 'IN_PROGRESS' && (
                <p className="text-sm text-slate-600">You claimed this job. Submit proof of work from the app.</p>
              )}
              {canApprove && (
                <Button className="w-full" onClick={handleApprove} disabled={approving}>
                  {approving ? 'Approving…' : 'Approve & complete'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </ProtectedRoute>
  );
}
