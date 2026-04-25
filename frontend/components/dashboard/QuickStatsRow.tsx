'use client';

import React from 'react';
import {
  TrendingUp,
  Star,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Job } from '@/types';

export function QuickStatsRow({ jobs = [] }: { jobs?: Job[] }) {
  const activeCount = jobs.filter(j => j.status === 'OPEN' || j.status === 'IN_PROGRESS').length;
  const pendingReviewCount = jobs.filter(j => j.status === 'PENDING_REVIEW').length;
  const completedCount = jobs.filter(j => j.status === 'COMPLETED').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Active Orders */}
      <div
        className="bg-white rounded-xl p-6"
        style={{
          backgroundColor: 'var(--md-surface)',
          borderRadius: 'var(--md-radius-lg)',
          boxShadow: 'var(--md-elevation-1)',
          padding: 'var(--md-space-6)'
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Clock size={20} />
          </div>
          <h4 className="font-semibold text-sm text-gray-900">Active Orders</h4>
        </div>
        
        <div>
          <p className="text-3xl font-bold text-gray-900">{activeCount}</p>
          <p className="text-xs text-gray-500 mt-1">Currently being handled</p>
        </div>
      </div>

      {/* Pending Review */}
      <div
        className="bg-white rounded-xl p-6"
        style={{
          backgroundColor: 'var(--md-surface)',
          borderRadius: 'var(--md-radius-lg)',
          boxShadow: 'var(--md-elevation-1)',
          padding: 'var(--md-space-6)'
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <AlertCircle size={20} />
          </div>
          <h4 className="font-semibold text-sm text-gray-900">Pending Review</h4>
        </div>
        
        <div>
          <p className="text-3xl font-bold text-gray-900">{pendingReviewCount}</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting your approval</p>
        </div>
      </div>

      {/* Completed Jobs */}
      <div
        className="bg-white rounded-xl p-6"
        style={{
          backgroundColor: 'var(--md-surface)',
          borderRadius: 'var(--md-radius-lg)',
          boxShadow: 'var(--md-elevation-1)',
          padding: 'var(--md-space-6)'
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle size={20} />
          </div>
          <h4 className="font-semibold text-sm text-gray-900">Completed</h4>
        </div>
        
        <div>
          <p className="text-3xl font-bold text-gray-900">{completedCount}</p>
          <p className="text-xs text-gray-500 mt-1">Successfully finished</p>
        </div>
      </div>
    </div>
  );
}
