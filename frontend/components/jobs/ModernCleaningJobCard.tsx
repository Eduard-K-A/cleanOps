'use client';

import { MapPin, Eye, MessageCircle, Zap, AlertCircle, PlayCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { Job } from '@/types';

interface ModernCleaningJobCardProps {
  job: Job;
  onView: (id: string) => void;
  onCancel: (id: string) => Promise<void>;
  isCancelling: boolean;
  customerName?: string | null;
  workerName?: string | null;
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

const URGENCY_CONFIG = {
  LOW: {
    label: 'Low',
    color: 'bg-slate-100 text-slate-700'
  },
  NORMAL: {
    label: 'Normal',
    color: 'bg-blue-100 text-blue-700'
  },
  HIGH: {
    label: 'High',
    color: 'bg-red-100 text-red-700',
    icon: true
  }
} as const;

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function ModernCleaningJobCard({
  job,
  onView,
  onCancel,
  isCancelling,
  customerName,
  workerName,
}: ModernCleaningJobCardProps) {
  const tasks = Array.isArray(job.tasks) ? job.tasks : [];
  const statusConfig = STATUS_CONFIG[job.status];
  const urgencyConfig = URGENCY_CONFIG[job.urgency];
  const StatusIcon = statusConfig.icon;

  return (
    <article className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 overflow-hidden">
      
      {/* Header with status */}
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-100">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
            {job.location_address || 'Cleaning Service'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Job ID: {job.id.slice(-6).toUpperCase()}
          </p>
        </div>

        <div className={`inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${statusConfig.color}`}>
          <span className={`p-0.5 rounded ${statusConfig.iconBg}`}>
            <StatusIcon className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-semibold">{statusConfig.label}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-4 p-4">
        
        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Amount</p>
            <p className="text-sm font-bold text-slate-900">{formatPrice(job.price_amount)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Priority</p>
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${urgencyConfig.color} font-semibold text-xs w-fit`}>
              {job.urgency === 'HIGH' && <Zap className="h-3 w-3" />}
              {urgencyConfig.label}
            </div>
          </div>
        </div>

        {/* Location */}
        {job.location_address && (
          <div className="flex gap-2">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700 line-clamp-2">{job.location_address}</p>
          </div>
        )}

        {/* People info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Posted by</p>
            <p className="font-medium text-slate-900">{customerName || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Assigned to</p>
            <p className="font-medium text-slate-900">{workerName || '—'}</p>
          </div>
        </div>

        {/* Tasks */}
        {tasks.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">Tasks</p>
            <div className="flex flex-wrap gap-1">
              {tasks.slice(0, 3).map((task, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs font-medium text-slate-700 border border-slate-200 bg-slate-50 rounded-md"
                >
                  {task}
                </span>
              ))}
              {tasks.length > 3 && (
                <span className="px-2 py-1 text-xs font-medium text-slate-600 border border-slate-200 bg-slate-50 rounded-md">
                  +{tasks.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer with timestamp and actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">{formatDate(job.created_at)}</p>
          
          <div className="flex gap-2">
            {job.status === 'IN_PROGRESS' && job.worker_id && (
              <a
                href={`/customer/messages?job=${job.id}`}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            )}

            <button
              type="button"
              onClick={() => onView(job.id)}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
