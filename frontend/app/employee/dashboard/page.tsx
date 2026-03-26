'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAsyncData } from '@/hooks/useAsyncData';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import type { Job } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { StripeConnect } from '@/components/StripeConnect';

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: allJobs, loading } = useAsyncData<Job[]>({
    fetchFn: () => api.getJobs(),
    defaultValue: [],
    errorMessage: 'Failed to load dashboard data',
  });

  // Filter jobs for this employee
  const myJobs = allJobs.filter((job) => job.worker_id === user?.id);
  const activeJobs = myJobs.filter((job) => job.status === 'IN_PROGRESS');
  const completedJobs = myJobs.filter((job) => job.status === 'COMPLETED');
  const pendingReviewJobs = myJobs.filter((job) => job.status === 'PENDING_REVIEW');

  const totalEarnings = completedJobs.reduce((sum, job) => sum + job.price_amount, 0);

  return (
    <ProtectedRoute requiredRole="employee" redirectTo="/customer/dashboard">
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600">Overview of your work and earnings.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeJobs.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingReviewJobs.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedJobs.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(totalEarnings / 100).toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Stripe Account Connection */}
          <div className="mb-8">
            <StripeConnect />
          </div>

          {/* Quick Actions */}
          <div className="grid gap-6 mb-8 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push('/employee/feed')}
                >
                  Browse Available Jobs
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push('/employee/history')}
                >
                  View My Jobs
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-slate-500">Loading...</p>
                ) : myJobs.length === 0 ? (
                  <p className="text-slate-500">No recent activity</p>
                ) : (
                  <div className="space-y-2">
                    {myJobs.slice(0, 5).map((job) => (
                      <div key={job.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={job.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {job.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-slate-600">
                            ${(job.price_amount / 100).toFixed(2)}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/employee/jobs/${job.id}`)}
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
        </div>
      </main>
    </ProtectedRoute>
  );
}