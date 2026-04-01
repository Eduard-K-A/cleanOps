'use client';

import React from 'react';
import { 
  Briefcase, 
  DollarSign, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  progress?: {
    current: number;
    total: number;
  };
  topBorderColor?: string;
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  trend, 
  progress,
  topBorderColor = 'var(--md-primary-500)' 
}: MetricCardProps) {
  return (
    <div
      className="bg-white rounded-xl p-6 relative overflow-hidden transition-all duration-200 hover:shadow-lg"
      style={{
        backgroundColor: 'var(--md-surface)',
        borderRadius: 'var(--md-radius-lg)',
        boxShadow: 'var(--md-elevation-1)',
        borderTop: `4px solid ${topBorderColor}`
      }}
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
        style={{ 
          backgroundColor: 'var(--md-primary-50)',
          color: 'var(--md-primary-600)'
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="space-y-2">
        {/* Label */}
        <p 
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--md-on-surface-muted)' }}
        >
          {title}
        </p>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          <p 
            className="text-3xl font-bold"
            style={{ 
              color: 'var(--md-on-surface)',
              fontFamily: 'var(--md-font-body)',
              fontSize: '32px'
            }}
          >
            {value}
          </p>

          {/* Trend indicator */}
          {trend && (
            <div className="flex items-center gap-1">
              {trend.isUp ? (
                <TrendingUp size={16} style={{ color: 'var(--md-success)' }} />
              ) : (
                <TrendingDown size={16} style={{ color: 'var(--md-error)' }} />
              )}
              <span 
                className="text-sm font-medium"
                style={{ 
                  color: trend.isUp ? 'var(--md-success)' : 'var(--md-error)' 
                }}
              >
                {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>

        {/* Progress ring for active jobs */}
        {progress && (
          <div className="flex items-center gap-3 mt-3">
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="var(--md-divider)"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="var(--md-primary-500)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress.current / progress.total)}`}
                  className="transition-all duration-500"
                />
              </svg>
              <span 
                className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                style={{ color: 'var(--md-on-surface)' }}
              >
                {Math.round((progress.current / progress.total) * 100)}%
              </span>
            </div>
            <div>
              <p 
                className="text-xs"
                style={{ color: 'var(--md-on-surface-muted)' }}
              >
                {progress.current} of {progress.total} active
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AnalyticsMetricCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Jobs Created */}
      <MetricCard
        title="Total Jobs Created"
        value={284}
        icon={<Briefcase size={24} />}
        trend={{
          value: 12.5,
          isUp: true
        }}
        topBorderColor="var(--md-primary-500)"
      />

      {/* Total Spent */}
      <MetricCard
        title="Total Spent"
        value="$12,450"
        icon={<DollarSign size={24} />}
        trend={{
          value: 8.2,
          isUp: true
        }}
        topBorderColor="var(--md-success)"
      />

      {/* Active Jobs */}
      <MetricCard
        title="Active Jobs"
        value={47}
        icon={<CheckCircle size={24} />}
        progress={{
          current: 47,
          total: 284
        }}
        trend={{
          value: 3.1,
          isUp: false
        }}
        topBorderColor="var(--md-warning)"
      />

      {/* Avg. Time to Fill */}
      <MetricCard
        title="Avg. Time to Fill"
        value="2.4 days"
        icon={<Clock size={24} />}
        trend={{
          value: 15.3,
          isUp: false
        }}
        topBorderColor="var(--md-info)"
      />
    </div>
  );
}
