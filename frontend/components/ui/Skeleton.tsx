/**
 * Skeleton loading components for better perceived performance
 */

import { cn } from '@/lib/utils';

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
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: width ?? (variant === 'text' ? '100%' : undefined),
        height: height ?? (variant === 'text' ? '1em' : undefined),
        ...style,
      }}
      {...props}
    />
  );
}

/**
 * Skeleton for job card
 */
export function JobCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3 ">
      <div className="flex items-start justify-between">
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="circular" width={24} height={24} />
      </div>
      <Skeleton variant="text" width="40%" height={20} />
      <Skeleton variant="text" width="100%" height={16} />
      <Skeleton variant="text" width="80%" height={16} />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" width={80} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    </div>
  );
}

/**
 * Skeleton for list items
 */
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

/**
 * Skeleton for table rows
 */
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

/**
 * Skeleton for navbar
 */
export function NavbarSkeleton() {
  return (
    <header className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
        {/* Logo skeleton */}
        <Skeleton variant="rectangular" width={80} height={24} />
        
        {/* Nav items skeleton */}
        <nav className="flex items-center gap-1">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" width={64} height={32} />
          ))}
        </nav>
        
        {/* Auth button skeleton */}
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    </header>
  );
}

/**
 * Skeleton for page content
 */
export function PageSkeleton() {
  return (
    <main className="mx-auto max-w-5xl p-5">
      <div className="space-y-4">
        {/* Header skeleton */}
        <Skeleton variant="text" width="50%" height={32} />
        <Skeleton variant="text" width="40%" height={20} />
        
        {/* Content skeleton */}
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

/**
 * Skeleton for dashboard page
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton variant="text" width="300px" height={32} />
        <Skeleton variant="text" width="450px" height={20} />
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="60%" height={16} />
              <Skeleton variant="text" width="40%" height={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <Skeleton variant="text" width="120px" height={24} />
              <Skeleton variant="text" width="80px" height={20} />
            </div>
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {i === 2 && <Skeleton variant="circular" width={40} height={40} />}
                    <div className="flex-1 space-y-1">
                      <Skeleton variant="text" width="70%" height={16} />
                      <Skeleton variant="text" width="40%" height={12} />
                    </div>
                  </div>
                  <Skeleton variant="rectangular" width={60} height={20} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for analytics page
 */
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <Skeleton variant="text" width="250px" height={28} />
          <Skeleton variant="text" width="350px" height={20} />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" width={48} height={32} />
          ))}
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="space-y-2">
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="40%" height={32} />
            </div>
            <Skeleton variant="text" width="30%" height={16} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80">
            <Skeleton variant="text" width="150px" height={24} className="mb-6" />
            <Skeleton variant="rectangular" width="100%" height="80%" />
          </div>
        ))}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart placeholder */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[450px]">
          <Skeleton variant="text" width="180px" height={24} className="mb-6" />
          <div className="flex flex-col items-center justify-center space-y-8">
            <Skeleton variant="circular" width={180} height={180} />
            <div className="grid grid-cols-2 gap-4 w-full">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rectangular" width="100%" height={32} />
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboards */}
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm h-[450px] overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <Skeleton variant="text" width="160px" height={24} />
            </div>
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton variant="circular" width={32} height={32} />
                    <div className="flex-1 space-y-1">
                      <Skeleton variant="text" width="60%" height={16} />
                      <Skeleton variant="text" width="40%" height={12} />
                    </div>
                  </div>
                  <Skeleton variant="text" width="50px" height={20} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
