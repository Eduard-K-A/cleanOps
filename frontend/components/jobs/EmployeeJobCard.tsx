'use client';

import { MapPin, Eye, Loader2, MessageCircle, Zap, AlertCircle, PlayCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { Job } from '@/types';

interface EmployeeJobCardProps {
  job: Job;
  onView: (id: string) => void;
  onClaim: (id: string) => void;
  showClaim?: boolean;
  isClaiming?: boolean;
  customerName?: string | null;
  hasApplied?: boolean;
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

function formatPrice(dollars: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dollars);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function EmployeeJobCard({
  job,
  onView,
  onClaim,
  showClaim = true,
  isClaiming = false,
  customerName,
  hasApplied = false,
}: EmployeeJobCardProps) {
  const tasks = Array.isArray(job.tasks) ? job.tasks : [];
  const canApply = job.status === 'OPEN' && !isClaiming && !hasApplied;
  const statusConfig = STATUS_CONFIG[job.status];
  const urgencyConfig = URGENCY_CONFIG[job.urgency];
  const StatusIcon = statusConfig.icon;

  return (
    <article className="relative flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 overflow-hidden">
      
      {/* Top bar with status indicator */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${statusConfig.color}`}>
            <span className={`p-0.5 rounded ${statusConfig.iconBg}`}>
              <StatusIcon className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-semibold">{statusConfig.label}</span>
          </div>
          {job.urgency === 'HIGH' && (
            <div className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md ${urgencyConfig.color}`}>
              <Zap className="h-3 w-3" />
              <span className="text-xs font-semibold">Urgent</span>
            </div>
          )}
          {hasApplied && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-700">
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">Applied</span>
            </div>
          )}
        </div>
        <span className="text-xs text-slate-500">{timeAgo(job.created_at)}</span>
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-4 p-4">
        
        {/* Location */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Location</h3>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-slate-700 line-clamp-2">
              {job.location_address ?? 'Address on confirmation'}
            </p>
          </div>
        </div>

        {/* Posted by and Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Posted by</p>
            <p className="text-sm font-medium text-slate-900">{customerName || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Payout</p>
            <p className="text-sm font-bold text-slate-900">{formatPrice(job.price_amount)}</p>
          </div>
        </div>

        {/* Tasks */}
        {tasks.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">Tasks</p>
            <div className="flex flex-wrap gap-1">
              {tasks.slice(0, 3).map((task, i) => (
                <span
                  key={i}
                  className="rounded-md px-2 py-1 text-xs font-medium text-slate-700 border border-slate-200 bg-slate-50"
                >
                  {typeof task === 'string' ? task : (task as any)?.name || (task as any)?.value || 'Task'}
                </span>
              ))}
              {tasks.length > 3 && (
                <span className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 border border-slate-200 bg-slate-50">
                  +{tasks.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => onView(job.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Details
          </button>

          {job.status === 'IN_PROGRESS' && (
            <a
              href={`/employee/messages?job=${job.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Message
            </a>
          )}

          {showClaim && (
            <button
              type="button"
              onClick={() => onClaim(job.id)}
              disabled={!canApply}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-900 text-sm font-semibold text-white transition-colors hover:bg-slate-800 active:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-900"
            >
              {isClaiming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Applying…
                </>
              ) : hasApplied ? (
                'Applied'
              ) : (
                'Apply Now'
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
