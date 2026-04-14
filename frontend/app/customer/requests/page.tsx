"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { ModernCleaningJobCard } from "@/components/jobs/ModernCleaningJobCard";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { RequestsPageSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import type { Job } from "@/types";
import toast from "react-hot-toast";
import {
  RefreshCw,
  Filter,
  Search,
  ArrowUpDown,
  Grid3X3,
  List,
  Flag,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import type { JobStatus } from "@/types";

// Sort options configuration
const SORT_OPTIONS = [
  { value: "recent", label: "Most Recent", icon: "📅" },
  { value: "oldest", label: "Oldest First", icon: "📅" },
  { value: "price_high", label: "Price: High to Low", icon: "💰" },
  { value: "price_low", label: "Price: Low to High", icon: "💰" },
  { value: "urgency_high", label: "Urgency: High First", icon: "⚡" },
  { value: "urgency_low", label: "Urgency: Low First", icon: "🐢" },
] as const;

type SortOption = typeof SORT_OPTIONS[number]["value"];

const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: "all", label: "All Requests", color: "bg-slate-100" },
  { value: "OPEN", label: "Open", color: "bg-blue-100" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-yellow-100" },
  { value: "PENDING_REVIEW", label: "Pending Review", color: "bg-orange-100" },
  { value: "COMPLETED", label: "Completed", color: "bg-green-100" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-red-100" },
];

export default function RequestsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [statusFilter, setStatusFilter] = useState<string>("OPEN"); // Default to show open requests
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedJobForReport, setSelectedJobForReport] = useState<Job | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  useEffect(() => {
    fetchJobs();

    // Auto-refresh jobs every 5 seconds to sync status changes - always fetch all jobs for accurate counts
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []); // Empty dependency - fetch all jobs regardless of filter changes

  // Close sort dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.sort-dropdown-container')) {
        setIsSortDropdownOpen(false);
      }
    }

    if (isSortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSortDropdownOpen]);

  async function fetchJobs() {
    try {
      setError(null);
      // Always fetch ALL jobs (no status filter) to calculate accurate counts
      const response = await api.getJobs(undefined, "customer");
      setJobs(response.data ?? []);
    } catch (e: unknown) {
      const err = e as {
        code?: string;
        message?: string;
        response?: { data?: { error?: string } };
      };
      const isNetworkError =
        err?.code === "ERR_NETWORK" ||
        err?.message?.includes("Network Error") ||
        err?.message?.includes("ERR_CONNECTION_REFUSED");

      const message = isNetworkError
        ? "Cannot reach the backend server. Make sure it is running on http://localhost:5000 and that NEXT_PUBLIC_API_URL is set correctly."
        : (err?.response?.data?.error ?? "Failed to load your requests.");

      setError(message);
      setJobs([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  // Sorting function
  const sortJobs = (jobsToSort: Job[]): Job[] => {
    const sorted = [...jobsToSort];
    switch (sortBy) {
      case "recent":
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "oldest":
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "price_high":
        return sorted.sort((a, b) => b.price_amount - a.price_amount);
      case "price_low":
        return sorted.sort((a, b) => a.price_amount - b.price_amount);
      case "urgency_high":
        const urgencyOrderHigh = { HIGH: 3, NORMAL: 2, LOW: 1 };
        return sorted.sort((a, b) => urgencyOrderHigh[b.urgency] - urgencyOrderHigh[a.urgency]);
      case "urgency_low":
        const urgencyOrderLow = { HIGH: 3, NORMAL: 2, LOW: 1 };
        return sorted.sort((a, b) => urgencyOrderLow[a.urgency] - urgencyOrderLow[b.urgency]);
      default:
        return sorted;
    }
  };

  const filteredJobs = sortJobs(
    jobs.filter((job) => {
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      const matchesSearch =
        searchQuery === "" ||
        job.tasks.some((task) =>
          task.toLowerCase().includes(searchQuery.toLowerCase()),
        ) ||
        job.location_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    })
  );

  const getStatusCounts = () => {
    const counts = {
      total: jobs.length,
      open: jobs.filter((j) => j.status === "OPEN").length,
      progress: jobs.filter((j) => j.status === "IN_PROGRESS").length,
      pending: jobs.filter((j) => j.status === "PENDING_REVIEW").length,
      completed: jobs.filter((j) => j.status === "COMPLETED").length,
      cancelled: jobs.filter((j) => j.status === "CANCELLED").length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchJobs();
  }

  async function handleApprove(id: string) {
    try {
      setApproving(id);
      await api.approveJob(id);
      toast.success("Job approved. Payout completed.");
      await fetchJobs();
    } catch (e: unknown) {
      const defaultMsg = "Failed to approve";
      if (e instanceof Error) {
        toast.error(e.message || defaultMsg);
      } else {
        const err = e as { response?: { data?: { error?: string } } };
        toast.error(err?.response?.data?.error ?? defaultMsg);
      }
    } finally {
      setApproving(null);
    }
  }

  async function handleCancel(id: string) {
    try {
      setCancelling(id);
      await api.updateJobStatus(id, "CANCELLED");
      toast.success("Job cancelled successfully. Refund will be processed to your account.");
      await fetchJobs();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error ?? "Failed to cancel job");
    } finally {
      setCancelling(null);
    }
  }

  // Handle opening report modal
  const handleOpenReport = (job: Job) => {
    setSelectedJobForReport(job);
    setReportModalOpen(true);
    setReportReason("");
    setReportDetails("");
  };

  // Handle submitting report
  const handleSubmitReport = async () => {
    if (!selectedJobForReport || !reportReason.trim()) {
      toast.error("Please select a reason for the report");
      return;
    }

    try {
      setIsSubmittingReport(true);
      // Submit report to admin via API
      const { submitJobReport } = await import('@/app/actions/reports');
      await submitJobReport({
        jobId: selectedJobForReport.id,
        reason: reportReason,
        details: reportDetails,
        reportedBy: selectedJobForReport.customer_id,
      });
      toast.success("Report submitted successfully. Admin will review shortly.");
      setReportModalOpen(false);
      setSelectedJobForReport(null);
      setReportReason("");
      setReportDetails("");
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err?.message ?? "Failed to submit report");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout
        title="My Requests"
      >
        {error && !loading && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 flex-wrap bg-gray-100/70 border border-gray-200/60 rounded-xl p-1.5">
            <button
              onClick={() => setStatusFilter("all")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm transition-all duration-100 whitespace-nowrap
        ${
          statusFilter === "all"
            ? "bg-white border border-gray-200 shadow-sm font-medium text-gray-900"
            : "text-gray-500 hover:bg-white/60 hover:text-gray-800"
        }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
              All requests
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 leading-tight">
                {statusCounts.total}
              </span>
            </button>

            <div className="w-px h-5 bg-gray-300 mx-0.5 shrink-0" />

            {[
              {
                value: "OPEN",
                label: "Open",
                count: statusCounts.open,
                dot: "bg-blue-500",
                pill: "bg-blue-50 text-blue-800",
              },
              {
                value: "IN_PROGRESS",
                label: "In progress",
                count: statusCounts.progress,
                dot: "bg-amber-400",
                pill: "bg-amber-50 text-amber-900",
              },
              {
                value: "PENDING_REVIEW",
                label: "Pending review",
                count: statusCounts.pending,
                dot: "bg-pink-500",
                pill: "bg-pink-50 text-pink-900",
              },
              {
                value: "COMPLETED",
                label: "Completed",
                count: statusCounts.completed,
                dot: "bg-green-500",
                pill: "bg-green-50 text-green-900",
              },
              {
                value: "CANCELLED",
                label: "Cancelled",
                count: statusCounts.cancelled,
                dot: "bg-red-500",
                pill: "bg-red-50 text-red-800",
              },
            ].map(({ value, label, count, dot, pill }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm transition-all duration-100 whitespace-nowrap
          ${
            statusFilter === value
              ? "bg-white border border-gray-200 shadow-sm font-medium text-gray-900"
              : "text-gray-500 hover:bg-white/60 hover:text-gray-800"
          }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
                {label}
                <span
                  className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full leading-tight ${pill}`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
        {/* Toolbar */}
        <div className="toolbar mb-6">
          <div className="search-wrap">
            <Search className="search-icon h-5 w-5" />
            <input
              className="search-input"
              type="text"
              placeholder="Search requests by location or tasks…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="toolbar-spacer"></div>
          {/* Sort Dropdown */}
          <div className="relative sort-dropdown-container">
            <button
              className="btn-sort"
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            >
              <ArrowUpDown className="h-4 w-4" />
              {SORT_OPTIONS.find(o => o.value === sortBy)?.label || "Sort"}
              <ChevronDown className={`h-3 w-3 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSortDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-50 py-1">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setIsSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                      sortBy === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'
                    }`}
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="btn-view active" title="Grid view">
            <Grid3X3 className="h-5 w-5" />
          </button>
          <button className="btn-view" title="List view">
            <List className="h-5 w-5" />
          </button>
          <button className="btn-refresh ripple-parent" onClick={handleRefresh}>
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Cards Grid or Empty State */}
        {loading ? (
          <RequestsPageSkeleton />
        ) : filteredJobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">
              <Filter className="h-12 w-12" />
            </div>
            <div className="empty-title">No requests found</div>
            <p className="empty-sub">
              {searchQuery || statusFilter !== "all"
                ? "There are no jobs matching your current filter. Try another status or search term."
                : "You don't have any job requests yet."}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <button
                className="btn-primary"
                onClick={() => router.push("/customer/order")}
              >
                Create your first request
              </button>
            )}
            {(searchQuery || statusFilter !== "all") && (
              <button
                className="btn-primary"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="cards-grid">
            {filteredJobs.map((job, index) => (
              <div key={job.id} style={{ animationDelay: `${index * 50}ms` }}>
                <ModernCleaningJobCard
                  job={job}
                  onView={(id: string) => router.push(`/customer/jobs/${id}`)}
                  onCancel={handleCancel}
                  onReport={handleOpenReport}
                  isCancelling={cancelling === job.id}
                  customerName={job.customer_profile?.full_name}
                  workerName={job.worker_profile?.full_name}
                />
                {job.status === "PENDING_REVIEW" && (
                  <Button
                    className="mt-2 w-full"
                    onClick={() => handleApprove(job.id)}
                    disabled={!!approving}
                  >
                    {approving === job.id ? "Approving…" : "Approve & complete"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Report Modal */}
        <Modal
          isOpen={reportModalOpen}
          onClose={() => {
            setReportModalOpen(false);
            setSelectedJobForReport(null);
            setReportReason("");
            setReportDetails("");
          }}
          title={
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>Report Job Issue</span>
            </div>
          }
        >
          <div className="space-y-4">
            {selectedJobForReport && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 uppercase font-medium">Job ID</p>
                <p className="text-sm font-mono text-slate-700">{selectedJobForReport.id.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-slate-500 uppercase font-medium mt-2">Location</p>
                <p className="text-sm text-slate-700">{selectedJobForReport.location_address || 'Not specified'}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Reason for Report <span className="text-red-500">*</span>
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select a reason...</option>
                <option value="worker_no_show">Worker did not show up</option>
                <option value="incomplete_work">Work was not completed satisfactorily</option>
                <option value="property_damage">Property damage occurred</option>
                <option value="rude_behavior">Worker was rude or unprofessional</option>
                <option value="overcharged">Feel I was overcharged</option>
                <option value="safety_concern">Safety concern</option>
                <option value="other">Other issue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Additional Details
              </label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Please provide more details about the issue..."
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <Flag className="h-3 w-3 inline mr-1" />
                This report will be sent to the admin for review. False reports may result in account suspension.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => {
                  setReportModalOpen(false);
                  setSelectedJobForReport(null);
                  setReportReason("");
                  setReportDetails("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReport}
                disabled={!reportReason || isSubmittingReport}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isSubmittingReport ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </div>
        </Modal>
      </MainLayout>
    </ProtectedRoute>
  );
}
