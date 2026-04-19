'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getKpiTrend, getAllJobsAdmin, getAllUsersAdmin } from '@/app/actions/admin';
import { Briefcase, DollarSign, Users, Clock, ArrowRight, UserCheck } from 'lucide-react';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function AdminDashboardPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch KPI data for 30d window
  const { data: dashboard, loading } = useAsyncData({
    fetchFn: async () => {
      const [kpi, jobsRes, usersRes] = await Promise.all([
        getKpiTrend(30),
        getAllJobsAdmin({ status: 'ALL', limit: 5 }),
        getAllUsersAdmin({ role: 'ALL' })
      ]);
      return { success: true, data: { kpi, jobs: jobsRes.data?.jobs || [], users: usersRes } };
    },
    defaultValue: null
  });

  if (!dashboard && loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="flex h-screen overflow-hidden bg-slate-50">
          <NavigationDrawer isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopAppBar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} title="Dashboard Overview" />
            <main className="flex-1 overflow-auto p-6">
              <div className="max-w-7xl mx-auto">
                <DashboardSkeleton />
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Ensure robust fallback rendering
  const kpi = dashboard?.kpi;
  const recentJobs = dashboard?.jobs || [];
  const recentUsers = dashboard?.users || [];

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <NavigationDrawer isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopAppBar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} title="Dashboard Overview" />
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Header */}
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Welcome back, Admin</h1>
                <p className="text-sm text-slate-500 mt-1">Here is what is happening in the CleanOps marketplace today.</p>
              </div>

              {/* KPI STATS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Jobs (30d)', val: kpi?.current.totalJobs || 0, icon: <Briefcase className="w-5 h-5 text-blue-500" /> },
                  { label: 'Revenue (30d)', val: `$${(kpi?.current.totalRevenue || 0).toFixed(2)}`, icon: <DollarSign className="w-5 h-5 text-green-500" /> },
                  { label: 'Employees', val: kpi?.current.activeEmployees || 0, icon: <Users className="w-5 h-5 text-purple-500" /> },
                  { label: 'Pending Queue', val: kpi?.current.pendingReviews || 0, icon: <Clock className="w-5 h-5 text-orange-500" /> }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-0.5">{stat.label}</p>
                      <h4 className="text-2xl font-bold text-slate-900">{stat.val}</h4>
                    </div>
                  </div>
                ))}
              </div>

              {/* TWO COLUMN ARIA */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* RECENT JOBS */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Recent Jobs</h2>
                    <Link href="/admin/jobs" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      View all <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {recentJobs.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center p-6">No recent jobs found.</p>
                    ) : (
                      recentJobs.map((job: any) => (
                        <div key={job.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="max-w-[60%]">
                            <p className="text-sm font-bold text-slate-800 line-clamp-1">{job.location_address}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
                              <span>#{job.id.slice(0,8)}</span>
                              <span>•</span>
                              <span>${Number(job.price_amount).toFixed(2)}</span>
                              </div>                          </div>
                          <div>
                            <span className="px-2.5 py-1 rounded bg-slate-100 text-xs font-semibold text-slate-600 border border-slate-200">
                              {job.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* RECENT USERS */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">New Profiles</h2>
                    <Link href="/admin/users" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      View directory <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {recentUsers.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center p-6">No recent users found.</p>
                    ) : (
                      recentUsers.map((user: any) => (
                        <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white" 
                               style={{ backgroundColor: user.role === 'customer' ? '#3b82f6' : user.role === 'employee' ? '#22c55e' : '#a855f7' }}>
                               {user.full_name?.substring(0, 2).toUpperCase() || 'U'}
                             </div>
                             <div>
                               <p className="text-sm font-bold text-slate-800">{user.full_name || 'Anonymous'}</p>
                               <p className="text-xs text-slate-500">{user.email || 'No email associated'}</p>
                             </div>
                           </div>
                           <div>
                             <span className={`px-2.5 py-1 border rounded text-xs font-semibold capitalize ${
                                user.role === 'customer' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                user.role === 'employee' ? 'bg-green-50 text-green-700 border-green-200' :
                                'bg-purple-50 text-purple-700 border-purple-200'
                             }`}>
                                {user.role}
                             </span>
                           </div>
                        </div>
                      ))
                    )}
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
