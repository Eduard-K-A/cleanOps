'use client';

import { MapPin, Eye, Loader2, XCircle, AlertCircle, PlayCircle, Clock, CheckCircle, Zap } from 'lucide-react';
import type { Job } from '@/types';

interface CleaningJobCardProps {
  job: Job;
  onView: (id: string) => void;
  onCancel: (id: string) => Promise<void>;
  isCancelling: boolean;
}

const STATUS_CONFIG = {
  OPEN: {
    label: 'Open',
    icon: AlertCircle,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconBg: 'bg-emerald-100'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: PlayCircle,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    iconBg: 'bg-amber-100'
  },
  PENDING_REVIEW: {
    label: 'Pending Review',
    icon: Clock,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    iconBg: 'bg-blue-100'
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    iconBg: 'bg-sky-100'
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    iconBg: 'bg-slate-100'
  }
} as const;

function formatPrice(dollars: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dollars);
}

export function CleaningJobCard({
  job,
  onView,
  onCancel,
  isCancelling,
}: CleaningJobCardProps) {
  const statusConfig = STATUS_CONFIG[job.status];
  const StatusIcon = statusConfig.icon;
  const canCancel = job.status === 'OPEN' || job.status === 'IN_PROGRESS';

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 overflow-hidden">
      {/* Header with status */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${statusConfig.color}`}>
          <span className={`p-0.5 rounded ${statusConfig.iconBg}`}>
            <StatusIcon className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-semibold">{statusConfig.label}</span>
        </div>
        <p className="text-sm font-bold text-slate-900">{formatPrice(job.price_amount)}</p>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Tasks summary */}
        <p className="text-sm text-slate-700 mb-3 line-clamp-2">
          {job.tasks.join(', ') || 'Cleaning Service'}
        </p>

        {/* Location */}
        {job.location_address && (
          <div className="flex gap-2 mb-4">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600 line-clamp-1">{job.location_address}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onView(job.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
          >
            <Eye className="h-4 w-4" />
            View
          </button>
          
          {canCancel && (
            <button
              type="button"
              onClick={() => onCancel(job.id)}
              disabled={isCancelling}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 active:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-red-50"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelling
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Cancel
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
