'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { invalidateAsyncDataCache, useAsyncData } from '@/hooks/useAsyncData';
import { getAllJobsAdmin } from '@/app/actions/admin';
import { adminApproveJobCompletion, adminUpdateJobStatus } from '@/app/actions/jobs';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/database.types';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { 
  ClipboardCheck, Search, AlertCircle, 
  MapPin, Clock, DollarSign, UserCheck, Eye, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ReviewQueueSkeleton } from '@/components/ui/Skeleton';
import { AdminFilterBar } from '@/components/admin/AdminFilterBar';
import { useAuth } from '@/lib/authContext';

export default function ReviewQueuePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{ type: 'APPROVE' | 'CANCEL', jobId: string } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { mounted, loading: authLoading, isLoggedIn, profile } = useAuth();

  // We fetch initial data via useAsyncData, but subsequent realtime updates will trigger refetch
  const { data: jobsResponse, loading, refetch } = useAsyncData({
    fetchFn: () => getAllJobsAdmin({ status: 'PENDING_REVIEW', limit: 100 }),
    defaultValue: { jobs: [], total: 0 },
    enabled: mounted && !authLoading && isLoggedIn && profile?.role === 'admin',
    cacheKey: 'admin-review-queue',
    cacheTTL: 60 * 1000,
  });

  const jobs = (jobsResponse?.jobs || []) as Database['public']['Tables']['jobs']['Row'][];

  // Filter local results slightly by strict search text
  const filteredJobs = jobs.filter(j => 
    !searchQuery || 
    (j.location_address && j.location_address.toLowerCase().includes(searchQuery.toLowerCase())) ||
    j.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Set up realtime subscription to listen for anything jumping into PENDING_REVIEW or leaving it
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel('review_queue_sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'jobs'
      }, (payload) => {
        // Broadly, if jobs change status involving PENDING_REVIEW, refetch the queue
        const oldState = payload.old as any;
        const newState = payload.new as any;
        if (
          (oldState && oldState.status === 'PENDING_REVIEW') || 
          (newState && newState.status === 'PENDING_REVIEW')
        ) {
          refetch();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const handleActionSubmit = async () => {
    if (!actionModal || isActionLoading) return;
    
    setIsActionLoading(true);
    try {
      if (actionModal.type === 'APPROVE') {
        await adminApproveJobCompletion(actionModal.jobId);
        invalidateAsyncDataCache(/^admin-(jobs|dashboard|analytics|review-queue)/);
        toast.success(`Job #${actionModal.jobId.slice(0, 8)} approved successfully. Funds released.`);
      } else {
        await adminUpdateJobStatus(actionModal.jobId, 'CANCELLED');
        invalidateAsyncDataCache(/^admin-(jobs|dashboard|analytics|review-queue)/);
        toast.success(`Job #${actionModal.jobId.slice(0, 8)} cancelled. Please process escrow refund.`);
      }
      setActionModal(null);
      await refetch();
    } catch (err) {
      toast.error('Operation failed. Check permissions.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <NavigationDrawer isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopAppBar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} title="Review Queue" />

          <AdminFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search location..."
          >
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => refetch()}
                 className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
               >
                 <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                 Sync
               </button>
            </div>
          </AdminFilterBar>

          <main className="flex-1 overflow-auto p-6 pt-0">
            <div className="max-w-7xl mx-auto py-6 space-y-4">
              
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-orange-500" />
                  Action Required
                </h2>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {jobs.length} Pending Approval
                </Badge>
              </div>

              {loading && jobs.length === 0 ? (
                <ReviewQueueSkeleton />
              ) : filteredJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
                  <ClipboardCheck className="w-16 h-16 text-slate-200 mb-4" />
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Queue is Empty</h3>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    There are no jobs pending administrative review at the moment. Good job!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredJobs.map(job => (
                    <div key={job.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden flex flex-col">
                      <div className="p-5 border-b border-slate-100 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 font-mono text-xs">
                            #{job.id.slice(0, 8)}
                          </Badge>
                          <span className="text-base font-bold text-slate-800">${Number(job.price_amount).toFixed(2)}</span>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          <div className="flex items-start gap-2 text-sm text-slate-600">
                            <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                            <span className="line-clamp-2 leading-relaxed">{job.location_address || 'Address not listed'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>Submitted {new Date(job.updated_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <UserCheck className="w-4 h-4 text-slate-400" />
                            <span>Worker ID: <span className="font-mono text-xs">{job.worker_id?.slice(0,6) || 'Unknown'}</span></span>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                           <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Tasks Completed ({Array.isArray(job.tasks) ? job.tasks.length : 0})</p>
                           <div className="flex flex-wrap gap-1">
                              {Array.isArray(job.tasks) && (job.tasks as any[]).map((t: any, i: number) => (
                                <span key={i} className="px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded text-xs">
                                  {typeof t === 'string' ? t : t.name}
                                </span>
                              ))}
                           </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 border-t border-slate-200 grid grid-cols-2 gap-3 mt-auto">
                        <Button 
                          onClick={() => setActionModal({ type: 'CANCEL', jobId: job.id })}
                          variant="outline" className="border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 w-full"
                        >
                          Cancel Job
                        </Button>
                        <Button 
                          onClick={() => setActionModal({ type: 'APPROVE', jobId: job.id })}
                          className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm"
                        >
                          Force Complete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </main>
        </div>
      </div>

      {actionModal && (
        <Modal
          isOpen={true}
          onClose={() => setActionModal(null)}
          title={actionModal.type === 'APPROVE' ? 'Force Complete Job' : 'Cancel Job & Reverse'}
        >
          <div className="p-4 space-y-4 text-sm text-slate-600">
            {actionModal.type === 'APPROVE' ? (
              <>
                <div className="bg-green-50 text-green-800 p-3 rounded flex gap-3 border border-green-200">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <p>Approving this job will release the escrowed funds to the employee instantly, applying the currently configured platform fee.</p>
                </div>
                <p>Are you sure you want to approve Job <strong>{actionModal.jobId.slice(0, 8)}</strong>?</p>
              </>
            ) : (
              <>
                <div className="bg-red-50 text-red-800 p-3 rounded flex gap-3 border border-red-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <h5 className="font-bold mb-1">Manual Refund Required</h5>
                    <p className="text-xs">Canceling this job will mark it completely cancelled in the system, but <strong>you must manually reverse the Stripe/payment charges</strong> back to the customer.</p>
                  </div>
                </div>
                <p>Are you sure you want to cancel Job <strong>{actionModal.jobId.slice(0, 8)}</strong>? This cannot be undone.</p>
              </>
            )}
            
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setActionModal(null)}>Go Back</Button>
              <Button 
                onClick={handleActionSubmit}
                loading={isActionLoading}
                className={actionModal.type === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {actionModal.type === 'APPROVE' ? 'Confirm Approval' : 'Force Cancel'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ProtectedRoute>
  );
}

const Check = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"></polyline></svg>
);
