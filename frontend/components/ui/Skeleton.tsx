/**
 * Skeleton loading components — one per page layout.
 * All use animate-pulse for consistent shimmer behaviour.
 */

import { cn } from '@/lib/utils';

// ─── Base atom ────────────────────────────────────────────────────────────────

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  style,
  ...props
}: SkeletonProps) {
  const variantClass = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  }[variant];

  const animClass = animation === 'pulse' ? 'animate-pulse' : animation === 'wave' ? 'animate-shimmer' : '';

  return (
    <div
      className={cn('bg-slate-200', variantClass, animClass, className)}
      style={{
        width: width ?? (variant === 'text' ? '100%' : undefined),
        height: height ?? (variant === 'text' ? '1em' : undefined),
        ...style,
      }}
      {...props}
    />
  );
}

// ─── Shared atoms ─────────────────────────────────────────────────────────────

function SkeletonCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-slate-100 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

function SkeletonStatCard() {
  return (
    <SkeletonCard className="p-5 flex items-center gap-4">
      <Skeleton variant="circular" width={44} height={44} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="55%" height={13} />
        <Skeleton variant="text" width="38%" height={24} />
      </div>
    </SkeletonCard>
  );
}

// ─── Job card skeleton (matches EmployeeJobCard density) ──────────────────────

export function JobCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="h-1 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between gap-3">
          <div className="space-y-1.5 flex-1">
            <Skeleton variant="text" width="30%" height={11} animation="none" />
            <Skeleton variant="text" width="70%" height={17} animation="none" />
          </div>
          <Skeleton width={72} height={22} animation="none" className="rounded-full shrink-0" />
        </div>
        <div className="grid grid-cols-3 gap-px rounded-xl bg-slate-100 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white px-2 py-2 space-y-1.5 flex flex-col items-center">
              <Skeleton variant="text" width="65%" height={16} animation="none" />
              <Skeleton variant="text" width="45%" height={11} animation="none" />
            </div>
          ))}
        </div>
        <Skeleton variant="text" width="60%" height={13} animation="none" />
        <div className="flex gap-2 pt-0.5">
          <Skeleton height={34} className="flex-1 rounded-xl" animation="none" />
          <Skeleton height={34} className="flex-1 rounded-xl" animation="none" />
        </div>
      </div>
    </div>
  );
}

// ─── Employee Feed skeleton ────────────────────────────────────────────────────

export function FeedPageSkeleton() {
  return (
    <div className="animate-pulse mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Skeleton width={110} height={26} className="rounded-full" animation="none" />
        <Skeleton width={34} height={34} className="rounded-lg" animation="none" />
      </div>
      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Employee History skeleton ─────────────────────────────────────────────────

export function HistoryPageSkeleton() {
  return (
    <div className="animate-pulse mx-auto max-w-7xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Employee Dashboard skeleton ──────────────────────────────────────────────

export function EmployeeDashboardSkeleton() {
  return (
    <div className="animate-pulse mx-auto max-w-6xl space-y-6">
      {/* Stat cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      {/* Stripe connect placeholder */}
      <Skeleton height={80} className="rounded-xl" animation="none" />
      {/* Quick actions + activity */}
      <div className="grid gap-6 sm:grid-cols-2">
        <SkeletonCard className="p-5 space-y-3">
          <Skeleton variant="text" width="45%" height={18} animation="none" />
          <Skeleton height={36} className="rounded-lg" animation="none" />
          <Skeleton height={36} className="rounded-lg" animation="none" />
        </SkeletonCard>
        <SkeletonCard className="p-5 space-y-3">
          <Skeleton variant="text" width="45%" height={18} animation="none" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton width={80} height={22} className="rounded-full" animation="none" />
              <Skeleton width={48} height={22} className="rounded-md" animation="none" />
            </div>
          ))}
        </SkeletonCard>
      </div>
    </div>
  );
}

// ─── Customer Requests skeleton ────────────────────────────────────────────────

export function RequestsPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 bg-gray-100/70 border border-gray-200/60 rounded-xl p-1.5 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} width={i === 0 ? 90 : 80} height={30} className="rounded-lg" animation="none" />
        ))}
      </div>
      {/* Toolbar */}
      <div className="flex gap-2">
        <Skeleton height={38} className="flex-1 rounded-lg" animation="none" />
        <Skeleton width={90} height={38} className="rounded-lg" animation="none" />
        <Skeleton width={38} height={38} className="rounded-lg" animation="none" />
        <Skeleton width={38} height={38} className="rounded-lg" animation="none" />
      </div>
      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="h-1 bg-slate-200" />
            <div className="p-4 space-y-3">
              <div className="flex justify-between gap-2">
                <Skeleton variant="text" width="60%" height={16} animation="none" />
                <Skeleton width={72} height={22} className="rounded-full" animation="none" />
              </div>
              <Skeleton variant="text" width="45%" height={13} animation="none" />
              <Skeleton variant="text" width="80%" height={13} animation="none" />
              <div className="flex gap-2 pt-1">
                <Skeleton height={34} className="flex-1 rounded-lg" animation="none" />
                <Skeleton height={34} className="flex-1 rounded-lg" animation="none" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Customer/Admin Dashboard skeleton ────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Welcome banner */}
      <Skeleton height={180} className="rounded-2xl" animation="none" />
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonCard key={i} className="p-5 h-64">
            <Skeleton variant="text" width="35%" height={20} animation="none" className="mb-5" />
            <Skeleton height="80%" animation="none" />
          </SkeletonCard>
        ))}
      </div>
      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Analytics skeleton ────────────────────────────────────────────────────────

export function AnalyticsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header row */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton variant="text" width={220} height={28} animation="none" />
          <Skeleton variant="text" width={320} height={18} animation="none" />
        </div>
        <div className="flex gap-2">
          {[48, 48, 48].map((w, i) => (
            <Skeleton key={i} width={w} height={32} className="rounded-lg" animation="none" />
          ))}
        </div>
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="p-5 space-y-3">
            <Skeleton variant="circular" width={40} height={40} animation="none" />
            <div className="space-y-1.5">
              <Skeleton variant="text" width="60%" height={18} animation="none" />
              <Skeleton variant="text" width="40%" height={30} animation="none" />
            </div>
            <Skeleton variant="text" width="30%" height={14} animation="none" />
          </SkeletonCard>
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonCard key={i} className="p-5 h-72">
            <Skeleton variant="text" width={140} height={22} animation="none" className="mb-5" />
            <Skeleton height="80%" animation="none" />
          </SkeletonCard>
        ))}
      </div>
      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonCard className="p-5 h-96 flex flex-col items-center gap-6">
          <Skeleton variant="text" width={160} height={22} animation="none" className="self-start" />
          <Skeleton variant="circular" width={180} height={180} animation="none" />
          <div className="grid grid-cols-2 gap-3 w-full">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={32} className="rounded-lg" animation="none" />
            ))}
          </div>
        </SkeletonCard>
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonCard key={i} className="overflow-hidden h-96">
            <div className="p-4 border-b border-slate-100">
              <Skeleton variant="text" width={150} height={22} animation="none" />
            </div>
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton variant="circular" width={32} height={32} animation="none" />
                    <div className="flex-1 space-y-1">
                      <Skeleton variant="text" width="60%" height={14} animation="none" />
                      <Skeleton variant="text" width="40%" height={11} animation="none" />
                    </div>
                  </div>
                  <Skeleton width={50} height={18} animation="none" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}

// ─── Admin Review Queue skeleton ────────────────────────────────────────────────

export function ReviewQueueSkeleton() {
  return (
    <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex-1 space-y-4">
            <div className="flex justify-between items-start">
              <Skeleton width={80} height={20} className="rounded-md" animation="none" />
              <Skeleton width={60} height={24} animation="none" />
            </div>
            <div className="space-y-3">
              <div className="flex gap-2 items-center"><Skeleton width={16} height={16} animation="none" /><Skeleton width="80%" height={14} animation="none" /></div>
              <div className="flex gap-2 items-center"><Skeleton width={16} height={16} animation="none" /><Skeleton width="50%" height={14} animation="none" /></div>
              <div className="flex gap-2 items-center"><Skeleton width={16} height={16} animation="none" /><Skeleton width="60%" height={14} animation="none" /></div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-2">
              <Skeleton width="40%" height={12} animation="none" />
              <div className="flex flex-wrap gap-1">
                <Skeleton width={60} height={22} className="rounded" animation="none" />
                <Skeleton width={80} height={22} className="rounded" animation="none" />
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-4 border-t border-slate-200 grid grid-cols-2 gap-3">
            <Skeleton height={36} className="rounded-md" animation="none" />
            <Skeleton height={36} className="rounded-md" animation="none" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Admin Jobs / Users skeleton (Rows) ───────────────────────────────────────

export function AdminTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <Skeleton height={38} className="flex-1 rounded-lg" animation="none" />
        <Skeleton width={100} height={38} className="rounded-lg" animation="none" />
        <Skeleton width={100} height={38} className="rounded-lg" animation="none" />
      </div>
      {/* Table */}
      <SkeletonCard className="overflow-hidden">
        {/* Header */}
        <div className="flex gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50">
          {[20, 15, 15, 15, 15, 20].map((w, i) => (
            <Skeleton key={i} variant="text" width={`${w}%`} height={14} animation="none" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center px-5 py-3.5 border-b border-slate-50">
            {[20, 15, 15, 15, 15, 20].map((w, j) => (
              <Skeleton key={j} variant="text" width={`${w}%`} height={14} animation="none" />
            ))}
          </div>
        ))}
      </SkeletonCard>
    </div>
  );
}

// ─── Admin Settings skeleton ──────────────────────────────────────────────────

export function SettingsPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6 max-w-2xl">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} className="p-5 space-y-4">
          <Skeleton variant="text" width="40%" height={20} animation="none" />
          <Skeleton variant="text" width="70%" height={14} animation="none" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="space-y-1">
                <Skeleton variant="text" width="25%" height={13} animation="none" />
                <Skeleton height={38} className="rounded-lg" animation="none" />
              </div>
            ))}
          </div>
          <Skeleton width={100} height={36} className="rounded-lg" animation="none" />
        </SkeletonCard>
      ))}
    </div>
  );
}

// ─── Legacy aliases (backward compat) ────────────────────────────────────────

export function JobCardSkeletonLegacy() { return <JobCardSkeleton />; }
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-2">
          <Skeleton variant="text" width="70%" height={20} />
          <Skeleton variant="text" width="100%" height={16} />
          <Skeleton variant="text" width="50%" height={16} />
        </div>
      ))}
    </div>
  );
}
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} variant="text" width="100%" height={40} />
          ))}
        </div>
      ))}
    </div>
  );
}
export function NavbarSkeleton() {
  return (
    <header className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
        <Skeleton variant="rectangular" width={80} height={24} />
        <nav className="flex items-center gap-1">
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" width={64} height={32} />)}
        </nav>
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    </header>
  );
}
export function PageSkeleton() {
  return (
    <main className="mx-auto max-w-5xl p-5">
      <div className="space-y-4">
        <Skeleton variant="text" width="50%" height={32} />
        <Skeleton variant="text" width="40%" height={20} />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32">
              <Skeleton variant="rectangular" width="100%" height="100%" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
