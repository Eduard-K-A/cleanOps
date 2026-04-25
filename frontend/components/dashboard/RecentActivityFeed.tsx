'use client';

import React from 'react';
import { 
  Briefcase, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Home,
  Building,
  PlayCircle
} from 'lucide-react';
import { Job } from '@/types';

interface ActivityItem {
  id: string;
  type: 'created' | 'filled' | 'closed' | 'pending' | 'in_progress';
  title: string;
  description: string;
  timestamp: string;
  category?: 'residential' | 'commercial';
  client?: string;
}

const getStatusConfig = (status: ActivityItem['type']) => {
  switch (status) {
    case 'filled':
    case 'in_progress':
      return {
        label: status === 'filled' ? 'Assigned' : 'In Progress',
        color: 'var(--md-primary-600)',
        bgColor: 'var(--md-primary-500)',
        bgColorLight: 'var(--md-primary-50)'
      };
    case 'closed':
      return {
        label: 'Completed',
        color: 'var(--md-success)',
        bgColor: 'var(--md-success)',
        bgColorLight: '#E8F5E8'
      };
    case 'pending':
      return {
        label: 'Review',
        color: 'var(--md-warning)',
        bgColor: 'var(--md-warning)',
        bgColorLight: '#FFF3E0'
      };
    case 'created':
      return {
        label: 'Open',
        color: 'var(--md-info)',
        bgColor: 'var(--md-info)',
        bgColorLight: '#E3F2FD'
      };
    default:
      return {
        label: 'Unknown',
        color: 'var(--md-on-surface-muted)',
        bgColor: 'var(--md-on-surface-muted)',
        bgColorLight: '#F5F5F5'
      };
  }
};

const getActivityIcon = (type: ActivityItem['type']) => {
  const iconProps = { size: 20 };
  
  switch (type) {
    case 'created':
      return <Briefcase {...iconProps} />;
    case 'filled':
    case 'in_progress':
      return <PlayCircle {...iconProps} />;
    case 'closed':
      return <CheckCircle {...iconProps} />;
    case 'pending':
      return <Clock {...iconProps} />;
    default:
      return <Briefcase {...iconProps} />;
  }
};

const formatTimestamp = (timestamp: string) => {
  try {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  } catch (e) {
    return 'Recently';
  }
};

export function RecentActivityFeed({ jobs = [] }: { jobs?: Job[] }) {
  const activities: ActivityItem[] = jobs.map(job => {
    let type: ActivityItem['type'] = 'created';
    let title = 'Job Created';
    
    if (job.status === 'OPEN') {
      type = 'created';
      title = 'Order Scheduled';
    } else if (job.status === 'IN_PROGRESS') {
      type = 'in_progress';
      title = 'Cleaning in Progress';
    } else if (job.status === 'PENDING_REVIEW') {
      type = 'pending';
      title = 'Awaiting Your Review';
    } else if (job.status === 'COMPLETED') {
      type = 'closed';
      title = 'Order Completed';
    } else if (job.status === 'CANCELLED') {
      type = 'closed'; // or something else
      title = 'Order Cancelled';
    }

    return {
      id: job.id,
      type,
      title,
      description: job.tasks.map((t: any) => typeof t === 'string' ? t : t?.name || 'Task').join(', '),
      timestamp: job.updated_at || job.created_at,
      client: job.worker_name || (job.status === 'OPEN' ? 'Finding professional...' : 'Professional')
    };
  });

  return (
    <div
      className="bg-white rounded-xl p-6"
      style={{
        backgroundColor: 'var(--md-surface)',
        borderRadius: 'var(--md-radius-lg)',
        boxShadow: 'var(--md-elevation-1)',
        padding: 'var(--md-space-6)'
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 
            className="text-lg font-semibold mb-1"
            style={{ 
              color: 'var(--md-on-surface)',
              fontFamily: 'var(--md-font-display)'
            }}
          >
            Recent Activity
          </h3>
          <p 
            className="text-sm"
            style={{ color: 'var(--md-on-surface-muted)' }}
          >
            Latest updates on your cleaning orders
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity, index) => {
            const statusConfig = getStatusConfig(activity.type);
            
            return (
              <div key={activity.id} className="flex items-start gap-4 relative">
                {/* Timeline line */}
                {index < activities.length - 1 && (
                  <div
                    className="absolute left-6 top-12 w-0.5 h-full -z-0"
                    style={{ 
                      backgroundColor: 'var(--md-divider)',
                      marginLeft: '-1px'
                    }}
                  />
                )}

                {/* Icon */}
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0 relative z-10"
                  style={{
                    backgroundColor: `${statusConfig.bgColor}15`,
                    color: statusConfig.color,
                    border: `1px solid ${statusConfig.bgColor}30`
                  }}
                >
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 
                          className="font-medium text-sm"
                          style={{ color: 'var(--md-on-surface)' }}
                        >
                          {activity.title}
                        </h4>
                        
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: statusConfig.bgColorLight,
                            color: statusConfig.color
                          }}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                      
                      <p 
                        className="text-sm mb-2 line-clamp-1"
                        style={{ color: 'var(--md-on-surface-muted)' }}
                      >
                        {activity.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs">
                        {activity.client && (
                          <div className="flex items-center gap-1">
                            <User size={12} style={{ color: 'var(--md-on-surface-muted)' }} />
                            <span style={{ color: 'var(--md-on-surface-muted)' }}>
                              {activity.client}
                            </span>
                          </div>
                        )}
                        
                        <span style={{ color: 'var(--md-on-surface-muted)' }}>
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            No recent activity found.
          </div>
        )}
      </div>
    </div>
  );
}
