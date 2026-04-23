'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { EmployeeJobCard } from '@/components/jobs/EmployeeJobCard';
import { HistoryPageSkeleton } from '@/components/ui/Skeleton';
import { useAsyncData } from '@/hooks/useAsyncData';
import { api } from '@/lib/api';
import type { Job } from '@/types';
import { CheckCircle, FileText } from 'lucide-react';
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation';

export default function EmployeeHistoryPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { navigate, warmupRoutes } = useOptimizedNavigation();

  // Fetch only COMPLETED jobs for history
  const { data: historyJobs, loading } = useAsyncData<Job[]>({
    fetchFn: () => api.getEmployeeJobs('COMPLETED'),
    defaultValue: [],
    errorMessage: 'Failed to load history',
  });

  useEffect(() => {
    return warmupRoutes(historyJobs.slice(0, 8).map((job) => `/employee/jobs/${job.id}`));
  }, [historyJobs, warmupRoutes]);

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
            title="History"
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
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Completed Jobs</h1>
                  <p className="text-sm text-gray-500">
                    {historyJobs.length} {historyJobs.length === 1 ? 'job' : 'jobs'} completed
                  </p>
                </div>
              </div>

              {loading && historyJobs.length === 0 ? (
                <HistoryPageSkeleton />
              ) : historyJobs.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-12 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                      <FileText className="h-8 w-8 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-slate-700">No completed jobs</p>
                    <p className="text-slate-500 mt-1">
                      You haven&apos;t completed any jobs yet. Visit My Jobs to see your active work.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                    onClick={() => navigate('/employee/my-jobs')}
                  >
                    Go to My Jobs
                  </button>
                </div>
              ) : (
                <div className={`relative ${loading ? 'opacity-70' : ''}`}>
                  {loading && (
                    <div className="absolute right-0 top-0 mr-2 mt-1 text-sm text-slate-500">Refreshing…</div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {historyJobs.map((job) => (
                      <div key={job.id}>
                        <EmployeeJobCard
                          job={job}
                          showClaim={false}
                          onClaim={() => {}}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
