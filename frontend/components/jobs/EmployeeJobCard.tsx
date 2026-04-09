'use client';

import { MapPin, DollarSign, Clock, Zap, Eye, Loader2, CheckCircle, XCircle, PlayCircle, AlertCircle } from 'lucide-react';
import type { Job } from '@/types';

interface EmployeeJobCardProps {
  job: Job;
  onView: (id: string) => void;
  onClaim: (id: string) => void;
  showClaim?: boolean;
  isClaiming?: boolean;
  customerName?: string | null;
}

const STATUS_CONFIG = {
  OPEN:           { label: 'Open',           classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200',  Icon: AlertCircle },
  IN_PROGRESS:    { label: 'In Progress',    classes: 'bg-amber-50  text-amber-700  ring-amber-200',      Icon: PlayCircle  },
  PENDING_REVIEW: { label: 'Pending Review', classes: 'bg-orange-50 text-orange-700 ring-orange-200',     Icon: Clock       },
  COMPLETED:      { label: 'Completed',      classes: 'bg-sky-50    text-sky-700    ring-sky-200',        Icon: CheckCircle },
  CANCELLED:      { label: 'Cancelled',      classes: 'bg-red-50    text-red-600    ring-red-200',        Icon: XCircle     },
} as const;

const URGENCY_CONFIG = {
  LOW:    { label: 'Low',    classes: 'bg-slate-100 text-slate-600' },
  NORMAL: { label: 'Normal', classes: 'bg-blue-50   text-blue-600'  },
  HIGH:   { label: 'Urgent', classes: 'bg-red-50    text-red-600'   },
} as const;

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function EmployeeJobCard({
  job,
  onView,
  onClaim,
  showClaim = true,
  isClaiming = false,
  customerName,
}: EmployeeJobCardProps) {
  const status  = STATUS_CONFIG[job.status]  ?? STATUS_CONFIG.OPEN;
  const urgency = URGENCY_CONFIG[job.urgency] ?? URGENCY_CONFIG.NORMAL;
  const StatusIcon = status.Icon;
  const tasks = Array.isArray(job.tasks) ? job.tasks : [];
  const canClaim = job.status === 'OPEN' && !isClaiming;

  return (
    <article className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden">

      {/* Urgency accent bar */}
      <div className={`h-1 w-full ${job.urgency === 'HIGH' ? 'bg-red-400' : job.urgency === 'NORMAL' ? 'bg-blue-400' : 'bg-slate-200'}`} />

      <div className="flex flex-col gap-3 p-4">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Cleaning Job</p>
            <h3 className="font-semibold text-slate-900 truncate">
              {job.location_address ?? 'Address on confirmation'}
            </h3>
          </div>

          {/* Status badge */}
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.classes}`}>
            <StatusIcon className="h-3 w-3" aria-hidden="true" />
            {status.label}
          </span>
        </div>

        {/* ── Key metrics row ── */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50 text-center">
          <div className="px-2 py-2">
            <p className="text-base font-bold text-slate-900">{formatPrice(job.price_amount)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Payout</p>
          </div>
          <div className="px-2 py-2">
            <p className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${urgency.classes}`}>
              {job.urgency === 'HIGH' && <Zap className="h-2.5 w-2.5" aria-hidden="true" />}
              {urgency.label}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Priority</p>
          </div>
          <div className="px-2 py-2">
            <p className="text-[11px] font-semibold text-slate-700">{timeAgo(job.created_at)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Posted</p>
          </div>
        </div>

        {/* ── Location ── */}
        {job.location_address && (
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="line-clamp-2">{job.location_address}</span>
          </div>
        )}

        {/* ── Posted by ── */}
        {customerName && (
          <p className="text-xs text-slate-500 mt-0.5">
            Posted by {customerName}
          </p>
        )}

        {/* ── Tasks ── */}
        {tasks.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tasks.slice(0, 3).map((task, i) => (
              <span key={i} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                {task}
              </span>
            ))}
            {tasks.length > 3 && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                +{tasks.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => onView(job.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Details
          </button>

          {showClaim && (
            <button
              type="button"
              onClick={() => onClaim(job.id)}
              disabled={!canClaim}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isClaiming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Claiming…
                </>
              ) : (
                'Claim Job'
              )}
            </button>
          )}
        </div>

      </div>
    </article>
  );
}
