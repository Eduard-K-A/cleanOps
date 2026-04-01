"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { ModernCleaningJobCard } from "@/components/jobs/ModernCleaningJobCard";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Job } from "@/types";
import toast from "react-hot-toast";
import {
  Loader2,
  RefreshCw,
  Filter,
  Search,
  ArrowUpDown,
  Grid3X3,
  List,
} from "lucide-react";
import type { JobStatus } from "@/types";

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
  const [sortBy, setSortBy] = useState("recent");
  const [statusFilter, setStatusFilter] = useState<string>("OPEN"); // Default to show open requests

  useEffect(() => {
    fetchJobs();

    // Auto-refresh jobs every 5 seconds to sync status changes - always fetch all jobs for accurate counts
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []); // Empty dependency - fetch all jobs regardless of filter changes

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

  const filteredJobs = jobs.filter((job) => {
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      job.tasks.some((task) =>
        task.toLowerCase().includes(searchQuery.toLowerCase()),
      ) ||
      job.location_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
      toast.success("Job cancelled successfully.");
      await fetchJobs();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error ?? "Failed to cancel job");
    } finally {
      setCancelling(null);
    }
  }

  return (
    <ProtectedRoute>
      <MainLayout
        title="My Requests"
        subtitle="Track and manage all your cleaning service jobs"
        breadcrumb="Service Management"
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
              placeholder="Search requests…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="toolbar-spacer"></div>
          <button className="btn-sort">
            <ArrowUpDown className="h-4 w-4" />
            Most Recent
          </button>
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
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
          </div>
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
                  isCancelling={cancelling === job.id}
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
      </MainLayout>
    </ProtectedRoute>
  );
}
