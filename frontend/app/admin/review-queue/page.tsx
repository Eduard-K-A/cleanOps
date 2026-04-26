'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { invalidateAsyncDataCache, useAsyncData } from '@/hooks/useAsyncData';
import { adminApproveJobCompletion, adminUpdateJobStatus } from '@/app/actions/jobs';
import { getJobReports, updateReportStatus } from '@/app/actions/reports';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/database.types';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { 
  ClipboardCheck, Search, AlertCircle, 
  MapPin, Clock, DollarSign, UserCheck, Eye, RefreshCw,
  MessageSquare, Flag, CheckCircle2, XCircle, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ReviewQueueSkeleton } from '@/components/ui/Skeleton';
import { AdminFilterBar } from '@/components/admin/AdminFilterBar';
import { useAuth } from '@/lib/authContext';

export default function ReviewQueuePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [actionModal, setActionModal] = useState<{ type: 'APPROVE' | 'CANCEL' | 'RESOLVE' | 'DISMISS', jobId?: string, reportId?: string } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { mounted, loading: authLoading, isLoggedIn, profile } = useAuth();

  // Fetch reports via useAsyncData
  const { data: reports, loading, refetch } = useAsyncData({
    fetchFn: () => getJobReports(),
    defaultValue: [],
    enabled: mounted && !authLoading && isLoggedIn && profile?.role === 'admin',
    cacheKey: 'admin-review-queue-reports',
    cacheTTL: 30 * 1000,
  });

  // Filter local results slightly by strict search text
  const filteredReports = (reports || []).filter((r: any) => 
    !searchQuery || 
    (r.job?.location_address && r.job.location_address.toLowerCase().includes(searchQuery.toLowerCase())) ||
    r.job_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Set up realtime subscription to listen for new reports or status changes
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel('review_queue_reports_sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'job_reports'
      }, () => {
        refetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const handleActionSubmit = async () => {
    if (!actionModal || isActionLoading) return;
    
    setIsActionLoading(true);
    try {
      if (actionModal.type === 'APPROVE' && actionModal.jobId) {
        await adminApproveJobCompletion(actionModal.jobId);
        if (actionModal.reportId) {
          await updateReportStatus(actionModal.reportId, 'RESOLVED');
        }
        toast.success(`Job approved and report marked as resolved.`);
      } else if (actionModal.type === 'CANCEL' && actionModal.jobId) {
        await adminUpdateJobStatus(actionModal.jobId, 'CANCELLED');
        if (actionModal.reportId) {
          await updateReportStatus(actionModal.reportId, 'RESOLVED');
        }
        toast.success(`Job cancelled and report marked as resolved.`);
      } else if (actionModal.type === 'RESOLVE' && actionModal.reportId) {
        await updateReportStatus(actionModal.reportId, 'RESOLVED');
        toast.success(`Report marked as resolved.`);
      } else if (actionModal.type === 'DISMISS' && actionModal.reportId) {
        await updateReportStatus(actionModal.reportId, 'DISMISSED');
        toast.success(`Report dismissed.`);
      }

      invalidateAsyncDataCache(/^admin-(jobs|dashboard|analytics|review-queue)/);
      setActionModal(null);
      setSelectedReport(null);
      await refetch();
    } catch (err) {
      toast.error('Operation failed. Check permissions.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'INVESTIGATING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESOLVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'DISMISSED': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <NavigationDrawer isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopAppBar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} title="Reported Issues" />

          <AdminFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search reports..."
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
                  <Flag className="w-5 h-5 text-red-500" />
                  Dispute Queue
                </h2>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {reports?.filter((r: any) => r.status === 'PENDING').length || 0} New Reports
                </Badge>
              </div>

              {loading && reports?.length === 0 ? (
                <ReviewQueueSkeleton />
              ) : filteredReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
                  <CheckCircle2 className="w-16 h-16 text-slate-200 mb-4" />
                  <h3 className="text-lg font-bold text-slate-800 mb-2">No Reports Found</h3>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    There are no reported job issues at the moment. All customers seem happy!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredReports.map((report: any) => (
                    <div 
                      key={report.id} 
                      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden flex flex-col cursor-pointer"
                      onClick={() => setSelectedReport(report)}
                    >
                      <div className="p-5 border-b border-slate-100 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <Badge variant="outline" className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                          <span className="text-xs text-slate-500">{new Date(report.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <h3 className="font-bold text-slate-800 mb-2 line-clamp-1">{report.reason.replace(/_/g, ' ')}</h3>
                        
                        <div className="space-y-3 mb-4">
                          <div className="flex items-start gap-2 text-sm text-slate-600">
                            <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                            <span className="line-clamp-2 leading-relaxed">{report.job?.location_address || 'Address not listed'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <User className="w-4 h-4 text-slate-400" />
                            <span>Reporter: {report.reporter?.full_name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-mono text-[10px]">
                              Job #{report.job_id.slice(0, 8)}
                            </Badge>
                          </div>
                        </div>

                        {report.details && (
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                            <p className="text-xs text-slate-600 line-clamp-2">
                              "{report.details}"
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Click for details
                        </span>
                        <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          Review
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

      {/* Report Details Modal */}
      {selectedReport && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReport(null)}
          title={
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span>Report Details</span>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Status</p>
                <Badge className={getStatusColor(selectedReport.status)}>{selectedReport.status}</Badge>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Created</p>
                <p className="text-sm font-medium text-slate-700">{new Date(selectedReport.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">Issue Type</p>
              <p className="text-base font-semibold text-slate-800 capitalize">{selectedReport.reason.replace(/_/g, ' ')}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">Description</p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 italic text-slate-700 leading-relaxed">
                {selectedReport.details || 'No additional details provided.'}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500 uppercase font-bold mb-3">Associated Job</p>
              <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-mono text-slate-600">#{selectedReport.job_id}</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">{selectedReport.job?.status}</Badge>
                </div>
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 mt-0.5 text-slate-400" />
                  <span>{selectedReport.job?.location_address}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                   <span className="text-sm font-bold text-slate-800">${Number(selectedReport.job?.price_amount).toFixed(2)}</span>
                   <span className="text-xs text-slate-500">Worker ID: {selectedReport.job?.worker_id?.slice(0, 8) || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setActionModal({ type: 'DISMISS', reportId: selectedReport.id })}>
                Dismiss Report
              </Button>
              <Button 
                variant="outline" 
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setActionModal({ type: 'CANCEL', jobId: selectedReport.job_id, reportId: selectedReport.id })}
              >
                Cancel Job & Refund
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setActionModal({ type: 'APPROVE', jobId: selectedReport.job_id, reportId: selectedReport.id })}
              >
                Approve Anyway
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {actionModal && (
        <Modal
          isOpen={true}
          onClose={() => setActionModal(null)}
          title="Confirm Administrative Action"
        >
          <div className="p-4 space-y-4 text-sm text-slate-600">
            {actionModal.type === 'APPROVE' ? (
              <p>Are you sure you want to approve this job? The report will be marked as resolved and funds will be released to the worker.</p>
            ) : actionModal.type === 'CANCEL' ? (
              <div className="space-y-3">
                <div className="bg-red-50 text-red-800 p-3 rounded flex gap-3 border border-red-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                  <p>Canceling this job will resolve the report, but <strong>you must manually reverse the Stripe/payment charges</strong> back to the customer.</p>
                </div>
                <p>Confirm job cancellation?</p>
              </div>
            ) : actionModal.type === 'DISMISS' ? (
              <p>Dismissing this report means no action will be taken. The job status will remain unchanged.</p>
            ) : (
              <p>Are you sure you want to mark this report as resolved?</p>
            )}
            
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setActionModal(null)}>Cancel</Button>
              <Button 
                onClick={handleActionSubmit}
                loading={isActionLoading}
                className={actionModal.type === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ProtectedRoute>
  );
}
