"use client";
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import type { Job } from '@/types';

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Basic Auth Check
  useEffect(() => {
    if (!localStorage.getItem('adminToken')) router.push('/admin/login');
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await api.getJobs();
      setJobs(response.data ?? []);
    } catch (e) {
      toast.error('Failed to load jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'accept' | 'decline') => {
    try {
      if (action === 'accept') {
        await api.updateJobStatus(id, 'IN_PROGRESS');
      } else {
        await api.updateJobStatus(id, 'CANCELLED');
      }
      toast.success(`Job ${action}ed`);
      await fetchJobs();
    } catch (e) {
      toast.error(`Failed to ${action}`);
    }
  };

  if (loading) {
    return (
      <div className="p-10 bg-slate-50 min-h-screen">
        <h1 className="text-3xl font-bold text-blue-900 mb-8">Admin Dashboard</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold text-blue-900 mb-8">Admin Dashboard</h1>
      
      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <p className="text-gray-600">No jobs found</p>
        ) : (
          jobs.map((job: Job) => (
            <div key={job.id} className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
              <div>
                <p className="font-bold text-lg">Job #{job.id.slice(0, 8)}</p>
                <p className="text-gray-600">${job.price_amount / 100}</p>
                <p className="text-sm text-gray-400">Status: 
                  <span className={`font-bold ml-1 ${
                    job.status === 'COMPLETED' ? 'text-green-600' : 
                    job.status === 'CANCELLED' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {job.status}
                  </span>
                </p>
              </div>
              
              {job.status === 'OPEN' && (
                <div className="space-x-2">
                  <button 
                    onClick={() => handleAction(job.id, 'accept')}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                    Approve
                  </button>
                  <button 
                    onClick={() => handleAction(job.id, 'decline')}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
