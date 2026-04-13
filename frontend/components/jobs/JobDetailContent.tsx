'use client';

import { useRouter } from 'next/navigation';
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  PlayCircle,
  MessageCircle,
  Zap,
  User,
  Calendar,
  ListTodo
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/authContext';
import { useJobDetail } from '@/hooks/useJobDetail';
import type { JobStatus } from '@/types';

interface JobDetailContentProps {
  backPath: string;
  backLabel: string;
  showApprove?: boolean;
}

const STATUS_CONFIG: Record<JobStatus, { label: string; icon: any; color: string; bgColor: string }> = {
  OPEN: { label: 'Open', icon: AlertCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  IN_PROGRESS: { label: 'In Progress', icon: PlayCircle, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  PENDING_REVIEW: { label: 'Pending Review', icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  COMPLETED: { label: 'Completed', icon: CheckCircle, color: 'text-sky-600', bgColor: 'bg-sky-50' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50' }
};

const URGENCY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  LOW: { label: 'Low', icon: AlertCircle, color: 'text-slate-600' },
  NORMAL: { label: 'Normal', icon: AlertCircle, color: 'text-blue-600' },
  HIGH: { label: 'Urgent', icon: Zap, color: 'text-red-600' }
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD' 
  }).format(cents / 100);
}

function getProgressPercentage(status: JobStatus): number {
  const progressMap: Record<JobStatus, number> = {
    OPEN: 25,
    IN_PROGRESS: 60,
    PENDING_REVIEW: 85,
    COMPLETED: 100,
    CANCELLED: 0
  };
  return progressMap[status] || 0;
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
        <MainLayout title="Job Details">
          <div className="mx-auto max-w-2xl px-4 py-8">
            <p className="text-slate-600">Job not found.</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => router.push(backPath)}
            >
              ← Back to {backLabel}
            </Button>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  const isCustomer = user?.id === job.customer_id;
  const isWorker = user?.id === job.worker_id;
  const canApprove = showApprove && isCustomer && job.status === 'PENDING_REVIEW';
  const hasWorker = !!job.worker_id;
  const canMessage = hasWorker && (isCustomer || isWorker);
  
  const statusConfig = STATUS_CONFIG[job.status];
  const urgencyConfig = URGENCY_CONFIG[job.urgency] || URGENCY_CONFIG.NORMAL;
  const StatusIcon = statusConfig.icon;
  const UrgencyIcon = urgencyConfig.icon;
  const progress = getProgressPercentage(job.status);
  const tasks = Array.isArray(job.tasks) ? job.tasks : [];
  const proofs = Array.isArray(job.proof_of_work) ? job.proof_of_work : [];

  const handleMessageClick = () => {
    const messagePath = isCustomer 
      ? `/customer/messages?job=${job.id}`
      : `/employee/messages?job=${job.id}`;
    router.push(messagePath);
  };

  return (
    <ProtectedRoute>
      <MainLayout title="Job Details">
        <div className="w-full max-w-4xl mx-auto">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={() => router.push(backPath)}
          >
            ← Back to {backLabel}
          </Button>

          {/* Header Section */}
          <div className="grid gap-6">
            {/* Main Status Card */}
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                      {job.location_address || 'Job Location TBD'}
                    </h1>
                    <p className="text-sm text-slate-500">
                      Job ID: {job.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-full inline-flex items-center gap-2 font-semibold ${statusConfig.bgColor} ${statusConfig.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig.label}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Job Progress</span>
                    <span className="text-sm text-slate-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-sky-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {formatPrice(job.price_amount)}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">Payout Amount</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <UrgencyIcon className={`w-5 h-5 ${urgencyConfig.color}`} />
                      <p className="text-2xl font-bold text-slate-900">
                        {urgencyConfig.label}
                      </p>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">Priority Level</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {formatDate(job.created_at)}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">Posted Date</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location & People */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Location */}
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Location</p>
                      <p className="font-medium text-slate-900">
                        {job.location_address || 'Location TBD'}
                      </p>
                      {(job.location_lat || job.location_lng) && (
                        <p className="text-xs text-slate-500 mt-1">
                          Coordinates: {job.location_lat?.toFixed(4)}, {job.location_lng?.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="flex gap-3 pt-3 border-t">
                    <User className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Posted By</p>
                      <p className="font-medium text-slate-900">
                        {job.customer_profile?.full_name || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {/* Worker */}
                  <div className="flex gap-3 pt-3 border-t">
                    <PlayCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Assigned To</p>
                      <p className="font-medium text-slate-900">
                        {job.worker_profile?.full_name || 'Not yet assigned'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline & Status */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Created At */}
                  <div className="flex gap-3">
                    <Calendar className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Created</p>
                      <p className="font-medium text-slate-900">
                        {formatDate(job.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Updated At */}
                  <div className="flex gap-3 pt-3 border-t">
                    <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Last Updated</p>
                      <p className="font-medium text-slate-900">
                        {formatDate(job.updated_at)}
                      </p>
                    </div>
                  </div>

                  {/* Status Description */}
                  <div className="pt-3 border-t">
                    <p className="text-sm text-slate-600 mb-2">Status Notes</p>
                    <div className="bg-slate-50 rounded-lg p-3">
                      {job.status === 'OPEN' && (
                        <p className="text-sm text-slate-700">
                          🟢 This job is waiting for an employee to claim it.
                        </p>
                      )}
                      {job.status === 'IN_PROGRESS' && (
                        <p className="text-sm text-slate-700">
                          🔄 An employee is currently working on this job.
                        </p>
                      )}
                      {job.status === 'PENDING_REVIEW' && (
                        <p className="text-sm text-slate-700">
                          ⏳ The work has been submitted and is pending customer approval.
                        </p>
                      )}
                      {job.status === 'COMPLETED' && (
                        <p className="text-sm text-slate-700">
                          ✅ This job has been successfully completed and approved.
                        </p>
                      )}
                      {job.status === 'CANCELLED' && (
                        <p className="text-sm text-slate-700">
                          ❌ This job has been cancelled.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tasks Section */}
            {tasks.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ListTodo className="w-5 h-5" />
                    Tasks ({tasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tasks.map((task, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-slate-700 py-1">{task}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Proof of Work Section */}
            {proofs.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Proof of Work</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {proofs.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 hover:border-sky-400 hover:bg-sky-50 transition-colors group"
                      >
                        <span className="text-xl">📎</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 group-hover:text-sky-600 truncate">
                            Proof {idx + 1}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {new URL(url).hostname}
                          </p>
                        </div>
                        <span className="text-sky-600 group-hover:text-sky-700">→</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {canMessage && (
                <Button 
                  onClick={handleMessageClick}
                  className="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700"
                >
                  <MessageCircle className="w-4 h-4" />
                  Send Message
                </Button>
              )}
              {canApprove && (
                <Button 
                  onClick={handleApprove} 
                  disabled={approving}
                  className="flex-1"
                >
                  {approving ? 'Approving…' : 'Approve & Complete'}
                </Button>
              )}
            </div>

            {/* Info Messages */}
            {showApprove && isCustomer && job.status === 'IN_PROGRESS' && (
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-amber-900">
                    ⏳ Employee is working on this job. You'll be able to approve when they submit proof of work.
                  </p>
                </CardContent>
              </Card>
            )}

            {!showApprove && isWorker && job.status === 'IN_PROGRESS' && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-blue-900">
                    👤 You've claimed this job. Submit proof of work from the mobile app to mark it complete.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
