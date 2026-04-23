'use client';

import { useState, useMemo, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { useAsyncData } from '@/hooks/useAsyncData';
import { EmployeeDashboardSkeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import type { Job } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CheckCircle, TrendingUp, Award, Zap, Target } from 'lucide-react';
import { StripeConnect } from '@/components/StripeConnect';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation';

// Helper function to generate earnings trend
function generateEarningsTrend(jobs: Job[]) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  });

  return last7Days.map((day) => ({
    day,
    earnings: Math.floor(Math.random() * 200) + (jobs.length % 5) * 20, // Mock data
  }));
}

// Helper function to generate urgency distribution
function generateUrgencyDistribution(jobs: Job[]) {
  const low = jobs.filter(j => j.urgency === 'LOW').length;
  const normal = jobs.filter(j => j.urgency === 'NORMAL').length;
  const high = jobs.filter(j => j.urgency === 'HIGH').length;

  return [
    { name: 'Low', value: low || 0 },
    { name: 'Normal', value: normal || 0, fill: '#3b82f6' },
    { name: 'High', value: high || 0 }
  ].filter(item => item.value > 0);
}

export default function EmployeeDashboardPage() {
  const { profile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { navigate, warmupRoutes } = useOptimizedNavigation();

  const { data: myJobs, loading } = useAsyncData<Job[]>({
    fetchFn: () => api.getEmployeeJobs(),
    defaultValue: [],
    errorMessage: 'Failed to load dashboard data',
  });

  useEffect(() => {
    return warmupRoutes([
      '/employee/feed',
      '/employee/history',
      ...myJobs.slice(0, 5).map((job) => `/employee/jobs/${job.id}`),
    ]);
  }, [myJobs, warmupRoutes]);

  // Filter jobs by status
  const activeJobs = myJobs.filter((job) => job.status === 'IN_PROGRESS');
  const completedJobs = myJobs.filter((job) => job.status === 'COMPLETED');
  const pendingReviewJobs = myJobs.filter((job) => job.status === 'PENDING_REVIEW');
  const allJobs = myJobs.filter((job) => job.status !== 'CANCELLED');

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    // Total earnings: 85% of completed job prices
    const totalEarnings = completedJobs.reduce((sum, job) => sum + Math.round(job.price_amount * 0.85), 0);
    
    // Average job price
    const avgJobPrice = allJobs.length > 0 
      ? allJobs.reduce((sum, job) => sum + job.price_amount, 0) / allJobs.length 
      : 0;
    
    // Completion rate
    const completionRate = allJobs.length > 0 
      ? Math.round((completedJobs.length / allJobs.length) * 100) 
      : 0;
    
    // Jobs completed this month (mock - based on current jobs)
    const jobsThisMonth = completedJobs.length;
    
    // Average earnings per job
    const avgEarningsPerJob = completedJobs.length > 0 
      ? Math.round(totalEarnings / completedJobs.length) 
      : 0;

    // Generate earnings trend data (mock)
    const earningsTrend = generateEarningsTrend(completedJobs);
    
    // Job distribution by urgency
    const urgencyDistribution = generateUrgencyDistribution(completedJobs);
    
    // Job status breakdown for pie chart
    const jobStatusBreakdown = [
      { name: 'Completed', value: completedJobs.length, color: '#10b981' },
      { name: 'In Progress', value: activeJobs.length, color: '#3b82f6' },
      { name: 'Pending Review', value: pendingReviewJobs.length, color: '#f59e0b' }
    ].filter(item => item.value > 0);

    // Performance goal: complete 20 jobs per month
    const monthlyTarget = 20;
    const progressTowardsGoal = Math.min((jobsThisMonth / monthlyTarget) * 100, 100);

    return {
      totalEarnings,
      avgJobPrice,
      completionRate,
      jobsThisMonth,
      avgEarningsPerJob,
      monthlyTarget,
      progressTowardsGoal,
      earningsTrend,
      urgencyDistribution,
      jobStatusBreakdown,
      balance: profile?.money_balance || 0
    };
  }, [completedJobs, activeJobs, pendingReviewJobs, allJobs, profile?.money_balance]);

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
            title="Dashboard"
          />

          {/* Page Content */}
          <main 
            className="flex-1 overflow-auto p-6"
            style={{ 
              backgroundColor: 'var(--md-background)',
              padding: 'var(--md-space-6)'
            }}
          >
            <div className="mx-auto max-w-7xl">
              {loading ? <EmployeeDashboardSkeleton /> : <>

              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Welcome back!</h1>
                <p className="text-slate-600 mt-1">Here&apos;s your work summary and earnings overview.</p>
              </div>

              {/* Primary KPI Stats - 4 column grid */}
              <div className="grid gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Earnings */}
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-900">Total Earnings</CardTitle>
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-emerald-900">${analytics.totalEarnings.toFixed(2)}</div>
                    <p className="text-xs text-emerald-700 mt-1">85% of job prices (after 15% platform fee)</p>
                  </CardContent>
                </Card>

                {/* Completion Rate */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-900">Completion Rate</CardTitle>
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-900">{analytics.completionRate}%</div>
                    <p className="text-xs text-blue-700 mt-1">{completedJobs.length} of {allJobs.length} jobs</p>
                  </CardContent>
                </Card>

                {/* Active Jobs */}
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-amber-900">Active Jobs</CardTitle>
                    <Zap className="h-5 w-5 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-900">{activeJobs.length}</div>
                    <p className="text-xs text-amber-700 mt-1">{pendingReviewJobs.length} awaiting review</p>
                  </CardContent>
                </Card>

                {/* Monthly Goal Progress */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-900">Monthly Goal</CardTitle>
                    <Target className="h-5 w-5 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-900">{analytics.jobsThisMonth}/{analytics.monthlyTarget}</div>
                    <div className="mt-2 h-2 bg-purple-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 transition-all" style={{ width: `${analytics.progressTowardsGoal}%` }}></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stripe Account Connection */}
              <div className="mb-8">
                <StripeConnect />
              </div>

              {/* Charts Section - Two Column */}
              <div className="grid gap-6 mb-8 lg:grid-cols-2">
                {/* Earnings Trend Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      Earnings Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.earningsTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={analytics.earningsTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="day" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }}
                            formatter={(value) => `$${value}`}
                          />
                          <Line type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-slate-500">No earnings data yet</div>
                    )}
                  </CardContent>
                </Card>

                {/* Job Status Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-blue-600" />
                      Jobs Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.jobStatusBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={analytics.jobStatusBreakdown}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analytics.jobStatusBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value} jobs`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-slate-500">No job data yet</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Performance Metrics */}
              <div className="grid gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Avg. Job Price</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${analytics.avgJobPrice.toFixed(2)}</div>
                    <p className="text-xs text-slate-500 mt-1">Based on all your jobs</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Avg. Earning/Job</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${analytics.avgEarningsPerJob.toFixed(2)}</div>
                    <p className="text-xs text-slate-500 mt-1">Your 85% share per job</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${analytics.balance.toFixed(2)}</div>
                    <p className="text-xs text-slate-500 mt-1">Ready to withdraw</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Recent Activity */}
              <div className="grid gap-6 mb-8 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => navigate('/employee/feed')}
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Browse Available Jobs
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => navigate('/employee/history')}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      View My Jobs
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {myJobs.length === 0 ? (
                      <p className="text-slate-500 text-sm">No recent activity</p>
                    ) : (
                      <div className="space-y-2">
                        {myJobs.slice(0, 5).map((job) => (
                          <div key={job.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={job.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                {job.status.replace('_', ' ')}
                              </Badge>
                              <span className="text-sm text-slate-600">
                                ${Number(job.price_amount).toFixed(2)}
                              </span>
                            </div>                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/employee/jobs/${job.id}`)}
                            >
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </> }
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
