'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { useAsyncData } from '@/hooks/useAsyncData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { 
  getJobsByDay, 
  getRevenueByWeek, 
  getJobStatusBreakdown, 
  getTopEmployees, 
  getTopCustomers, 
  getKpiTrend 
} from '@/app/actions/admin';
import { JobsCreatedChart } from '@/components/dashboard/JobsCreatedChart';
import { SpendingBreakdownChart } from '@/components/dashboard/SpendingBreakdownChart';
import { TrendingUp, TrendingDown, Users, Briefcase, Clock, DollarSign } from 'lucide-react';
import { AnalyticsSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/lib/authContext';

export default function AdminAnalyticsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [periodDays, setPeriodDays] = useState<number>(30);
  const { mounted, loading: authLoading, isLoggedIn, profile } = useAuth();

  const { data: analytics } = useAsyncData({
    fetchFn: async () => {
      const [
        jobsData, 
        revenueData, 
        statusData, 
        topEmployees, 
        topCustomers, 
        kpi
      ] = await Promise.all([
        getJobsByDay(periodDays),
        getRevenueByWeek(Math.round(periodDays / 7)),
        getJobStatusBreakdown(),
        getTopEmployees(5),
        getTopCustomers(5),
        getKpiTrend(periodDays)
      ]);
      return { 
        success: true, 
        data: {
          jobsData,
          revenueData,
          statusData,
          topEmployees,
          topCustomers,
          kpi
        } 
      };
    },
    defaultValue: null,
    errorMessage: 'Failed to fully load analytics.',
    enabled: mounted && !authLoading && isLoggedIn && profile?.role === 'admin',
    cacheKey: `admin-analytics:${periodDays}`,
    cacheTTL: 2 * 60 * 1000,
  });

  // Color mapping
  const STATUS_COLORS: Record<string, string> = {
    'OPEN': '#3b82f6', // blue
    'IN_PROGRESS': '#f59e0b', // amber
    'PENDING_REVIEW': '#f97316', // orange
    'COMPLETED': '#22c55e', // green
    'CANCELLED': '#ef4444' // red
  };

  const getTrendStyle = (current: number, previous: number) => {
    if (previous === 0) return { percent: '+100%', isUp: true, color: 'text-green-600' };
    const change = ((current - previous) / previous) * 100;
    const isUp = change >= 0;
    return {
      percent: `${isUp ? '+' : ''}${change.toFixed(1)}%`,
      isUp,
      color: isUp ? 'text-green-600' : 'text-red-600'
    };
  };

  if (!analytics) return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <NavigationDrawer isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopAppBar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} title="Analytics" />
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              <AnalyticsSkeleton />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <NavigationDrawer isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopAppBar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} title="Analytics" />
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* Header block with Interval Buttons */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Performance Summary</h2>
                  <p className="text-sm text-slate-500">Compare metrics across custom periods.</p>
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                  {[7, 30, 90].map(days => (
                    <button
                      key={days}
                      onClick={() => setPeriodDays(days)}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                        periodDays === days 
                          ? 'bg-blue-50 text-blue-700 shadow-sm' 
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {days}D
                    </button>
                  ))}
                </div>
              </div>

              {/* KPI STATS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {[
                  { label: 'Total Jobs', val: analytics.kpi.current.totalJobs, prev: analytics.kpi.previous.totalJobs, icon: <Briefcase className="w-5 h-5 text-blue-500" /> },
                  { label: 'Total Revenue', val: `$${analytics.kpi.current.totalRevenue.toFixed(2)}`, prev: analytics.kpi.previous.totalRevenue, icon: <DollarSign className="w-5 h-5 text-blue-500" />, isCurrency: true },
                  { label: 'Platform Earnings', val: `$${analytics.kpi.current.platformRevenue.toFixed(2)}`, prev: analytics.kpi.previous.platformRevenue, icon: <TrendingUp className="w-5 h-5 text-emerald-500" />, isCurrency: true },
                  { label: 'Active Employees', val: analytics.kpi.current.activeEmployees, prev: analytics.kpi.previous.activeEmployees, icon: <Users className="w-5 h-5 text-purple-500" /> },
                  { label: 'Pending Reviews', val: analytics.kpi.current.pendingReviews, prev: analytics.kpi.previous.pendingReviews, icon: <Clock className="w-5 h-5 text-orange-500" /> }
                ].map((stat, i) => {
                  const trend = getTrendStyle(
                    typeof stat.val === 'string' ? parseFloat(stat.val.replace(/[^0-9.-]+/g,"")) : stat.val, 
                    stat.prev
                  );
                  return (
                    <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">{stat.icon}</div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">{stat.label}</p>
                        <h4 className="text-xl font-bold text-slate-900">{stat.val}</h4>
                      </div>
                      <div className="mt-4 flex items-center gap-1">
                        {trend.isUp ? <TrendingUp className={`w-3.5 h-3.5 ${trend.color}`} /> : <TrendingDown className={`w-3.5 h-3.5 ${trend.color}`} />}
                        <span className={`text-xs font-bold ${trend.color}`}>{trend.percent}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CHARTS ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <JobsCreatedChart data={analytics.jobsData} />
                <SpendingBreakdownChart data={analytics.revenueData} />
              </div>

              {/* BOTTOM ROW (Status + Leaderboards) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* STATUS BREAKDOWN */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                  <h3 className="text-lg font-semibold text-slate-800 mb-6">Job Status Distribution</h3>
                  <div className="h-64 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.statusData}
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="status"
                        >
                          {analytics.statusData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#cbd5e1'} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    {analytics.statusData.map((status: any) => {
                      const total = analytics.statusData.reduce((s:number, i:any) => s + i.count, 0);
                      const pct = total === 0 ? 0 : Math.round((status.count / total) * 100);
                      return (
                        <div key={status.status} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded border border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status.status] || '#cbd5e1' }} />
                            <span className="font-semibold text-slate-700">{status.status.replace('_', ' ')}</span>
                          </div>
                          <span className="text-slate-500 font-mono">{pct}% ({status.count})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TOP EMPLOYEES */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm pd-6">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">Top Performers (Workers)</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {analytics.topEmployees.length === 0 && <div className="p-4 text-sm text-slate-500 text-center">No data</div>}
                    {analytics.topEmployees.map((emp: any, i: number) => (
                      <div key={emp.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-6 text-center font-bold text-slate-400 text-sm">#{i + 1}</div>
                          <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs">
                            {(emp.full_name || 'U').substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{emp.full_name}</p>
                            <p className="text-xs text-slate-500">{emp.completedJobs} jobs completed</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">${emp.totalEarned.toFixed(2)}</p>
                          <p className="text-[10px] text-slate-400 font-medium tracking-tight">Cut: ${emp.platformCut.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TOP CUSTOMERS */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm pd-6">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">Top Buyers (Customers)</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {analytics.topCustomers.length === 0 && <div className="p-4 text-sm text-slate-500 text-center">No data</div>}
                    {analytics.topCustomers.map((cust: any, i: number) => (
                      <div key={cust.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-6 text-center font-bold text-slate-400 text-sm">#{i + 1}</div>
                          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">
                            {(cust.full_name || 'U').substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{cust.full_name}</p>
                            <p className="text-xs text-slate-500">{cust.jobsCreated} jobs created</p>
                          </div>
                        </div>
                        <div className="text-right text-sm font-bold text-blue-600">
                          ${cust.totalSpent.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
