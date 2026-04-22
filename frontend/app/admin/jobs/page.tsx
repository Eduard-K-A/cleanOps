'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getAllJobsAdmin } from '@/app/actions/admin';
import { adminApproveJobCompletion, adminUpdateJobStatus } from '@/app/actions/jobs';
import type { Job, JobStatus, JobUrgency } from '@/types';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  FilterX, 
  Copy
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AdminFilterBar } from '@/components/admin/AdminFilterBar';

import { Suspense } from 'react';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function AdminJobsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AdminJobsContent />
    </Suspense>
  );
}

function AdminJobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'All'>('All');
  const [urgencyFilter, setUrgencyFilter] = useState<JobUrgency | 'All'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_high' | 'price_low'>('newest');
  const [page, setPage] = useState(parseInt(searchParams?.get('page') || '1'));
  
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [modalAction, setModalAction] = useState<'complete' | 'cancel' | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Sync page to URL
  useEffect(() => {
    const urlPage = parseInt(searchParams?.get('page') || '1');
    if (urlPage !== page && !isNaN(urlPage)) {
      setPage(urlPage);
    }
  }, [searchParams]);

  const updatePageInUrl = (newPage: number) => {
    setPage(newPage);
    router.push(`/admin/jobs?page=${newPage}`);
  };

  // Data Fetching
  const { data, loading, refetch } = useAsyncData<{ jobs: any[], total: number }>({
    fetchFn: async () => {
      return await getAllJobsAdmin({
        search: debouncedSearch,
        status: statusFilter,
        urgency: urgencyFilter,
        sortBy,
        page,
        limit: 20
      });
    },
    defaultValue: { jobs: [], total: 0 },
    errorMessage: 'Failed to load jobs',
    autoFetch: false
  });

  // Refetch when filters change
  useEffect(() => {
    refetch();
  }, [debouncedSearch, statusFilter, urgencyFilter, sortBy, page]);

  // Actions
  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Job ID copied!');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setUrgencyFilter('All');
    setSortBy('newest');
    updatePageInUrl(1);
  };

  const executeAction = async () => {
    if (!selectedJob || !modalAction || isActionLoading) return;

    setIsActionLoading(true);
    try {
      if (modalAction === 'cancel') {
        await adminUpdateJobStatus(selectedJob.id, 'CANCELLED');
        toast.success(`Job CANCELLED successfully.`);
      } else if (modalAction === 'complete') {
        await adminApproveJobCompletion(selectedJob.id);
        toast.success(`Job FORCE COMPLETED. Escrow released.`);
      }
      await refetch();
      setSelectedJob(null);
      setModalAction(null);
    } catch (e: any) {
      toast.error(e.message || `Failed to modify job`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Helpers
  const statusColors: Record<string, string> = {
    'COMPLETED': 'bg-green-100 text-green-800',
    'CANCELLED': 'bg-red-100 text-red-800',
    'OPEN': 'bg-blue-100 text-blue-800',
    'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
    'PENDING_REVIEW': 'bg-purple-100 text-purple-800'
  };

  const totalValue = data.jobs.reduce((sum, j) => sum + (Number(j.price_amount) || 0), 0);
  const totalPages = Math.ceil(data.total / 20);

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <NavigationDrawer isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopAppBar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} title="Manage Jobs" />
          
          <AdminFilterBar
            searchQuery={searchQuery}
            onSearchChange={(v) => { setSearchQuery(v); setPage(1); }}
            searchPlaceholder="Address or Job ID..."
            filters={[
              {
                label: 'Status',
                value: statusFilter,
                options: ['All', 'OPEN', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED', 'CANCELLED'],
                onChange: (v) => { setStatusFilter(v); setPage(1); },
                type: 'pills'
              },
              {
                label: 'Urgency',
                value: urgencyFilter,
                options: ['All', 'LOW', 'NORMAL', 'HIGH'],
                onChange: (v) => { setUrgencyFilter(v); setPage(1); },
                type: 'select'
              }
            ]}
            onReset={resetFilters}
            summary={
              <>
                <span>Showing {data.jobs.length} of {data.total} jobs matching criteria</span>
                <span>Displayed Value: ${totalValue.toFixed(2)}</span>
              </>
            }
          >
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Sort</label>
              <select 
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={sortBy}
                onChange={e => { setSortBy(e.target.value as any); setPage(1); }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_high">Price: High → Low</option>
                <option value="price_low">Price: Low → High</option>
              </select>
            </div>
          </AdminFilterBar>

          <main className="flex-1 overflow-auto p-6 pt-0">
            <div className="max-w-7xl mx-auto py-6">
              
              {/* Table */}
              <div className="bg-white rounded-xl shadow-[var(--md-elevation-1)] border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="p-4 w-12"></th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job ID</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Worker</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Urgency</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Age</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={`loading-${i}`}>
                            <td colSpan={9} className="p-4"><Skeleton className="h-10 w-full rounded" /></td>
                          </tr>
                        ))
                      ) : data.jobs.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-500">No jobs found matching filters.</td>
                        </tr>
                      ) : (
                        data.jobs.map((job) => (
                          <React.Fragment key={job.id}>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                <button onClick={() => toggleRow(job.id)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200">
                                  {expandedRows.has(job.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{job.id.slice(0, 8)}</span>
                                  <button onClick={() => copyToClipboard(job.id)} className="text-slate-400 hover:text-blue-500 transition-colors" title="Copy Full ID">
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="p-4 text-sm font-medium text-slate-900">{job.customer?.full_name || 'Unknown'}</td>
                              <td className="p-4 text-sm text-slate-600 font-medium">
                                {job.worker ? job.worker.full_name : <span className="text-slate-400 italic">Unassigned</span>}
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${statusColors[job.status] || 'bg-slate-100 text-slate-800'}`}>
                                  {job.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="p-4">
                                <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider ${
                                  job.urgency === 'HIGH' ? 'border-red-200 text-red-600 bg-red-50' :
                                  job.urgency === 'LOW' ? 'border-green-200 text-green-600 bg-green-50' : 'border-slate-200 text-slate-600 bg-slate-50'
                                }`}>
                                  {job.urgency}
                                </Badge>
                              </td>
                              <td className="p-4 text-sm font-semibold text-slate-700">${Number(job.price_amount).toFixed(2)}</td>
                              <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                                {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {job.status === 'IN_PROGRESS' && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50 px-2"
                                      onClick={() => { setSelectedJob(job); setModalAction('complete'); }}
                                    >
                                      Force Complete
                                    </Button>
                                  )}
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-50 px-2 disabled:opacity-50"
                                    onClick={() => { setSelectedJob(job); setModalAction('cancel'); }}
                                    disabled={job.status === 'COMPLETED' || job.status === 'CANCELLED'}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Expandable Details Row */}
                            {expandedRows.has(job.id) && (
                              <tr className="bg-slate-50 shadow-inner">
                                <td colSpan={9} className="p-0">
                                  <div className="p-6 border-b border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Location</h4>
                                      <p className="text-sm text-slate-800 bg-white p-3 rounded border border-slate-200 shadow-sm">
                                        {job.location_address || 'No address provided'}
                                        {job.distance && <span className="block mt-1 text-slate-500 text-xs">{job.distance} KM from City Hall</span>}
                                      </p>
                                      
                                      <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Tasks Breakdown</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {Array.isArray(job.tasks) && job.tasks.map((task: any, i: number) => (
                                          <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium border border-blue-200">
                                            {typeof task === 'string' ? task : task?.name || task?.value || 'Task'}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Customer Profile</h4>
                                        <p className="text-sm font-medium text-slate-800">{job.customer?.full_name}</p>
                                        <p className="text-xs text-slate-500 font-mono mt-0.5" title="Customer ID">{job.customer_id}</p>
                                      </div>
                                      <div>
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Worker Profile</h4>
                                        {job.worker_id ? (
                                          <>
                                            <p className="text-sm font-medium text-slate-800">{job.worker?.full_name}</p>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5" title="Worker ID">{job.worker_id}</p>
                                          </>
                                        ) : (
                                          <p className="text-sm text-slate-400 italic">Not assigned yet</p>
                                        )}
                                      </div>
                                      <div>
                                          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">System Timestamps</h4>
                                          <div className="text-xs text-slate-500 grid grid-cols-2 gap-2">
                                            <div>Created:</div><div className="text-slate-800">{new Date(job.created_at).toLocaleString()}</div>
                                            <div>Last Update:</div><div className="text-slate-800">{new Date(job.updated_at).toLocaleString()}</div>
                                          </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                  <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-700">
                          Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to <span className="font-medium">{Math.min(page * 20, data.total)}</span> of <span className="font-medium">{data.total}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px text-sm" aria-label="Pagination">
                          <button
                            onClick={() => updatePageInUrl(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            Previous
                          </button>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, i, arr) => (
                            <React.Fragment key={p}>
                              {i > 0 && arr[i - 1] !== p - 1 && (
                                <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700">
                                  ...
                                </span>
                              )}
                              <button
                                onClick={() => updatePageInUrl(p)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === p ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {p}
                              </button>
                            </React.Fragment>
                          ))}

                          <button
                            onClick={() => updatePageInUrl(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
            </div>
          </main>
        </div>
      </div>

      <Modal 
        isOpen={modalAction !== null && selectedJob !== null} 
        onClose={() => { setModalAction(null); setSelectedJob(null); }}
        title={modalAction === 'cancel' ? 'Cancel Job' : 'Force Complete Job'}
      >
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">
            {modalAction === 'cancel' 
              ? `Cancel Job #${selectedJob?.id.slice(0,8)}? The customer will need to be refunded manually.` 
              : `Mark Job #${selectedJob?.id.slice(0,8)} as completed and release escrow? This bypasses customer approval.`
            }
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => { setModalAction(null); setSelectedJob(null); }}>
              Back
            </Button>
            <Button 
              variant={modalAction === 'cancel' ? 'destructive' : 'default'}
              onClick={executeAction}
              loading={isActionLoading}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </ProtectedRoute>
  );
}
