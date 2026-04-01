'use client';

import React from 'react';
import { 
  Briefcase, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Home,
  Building
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'created' | 'filled' | 'closed' | 'pending';
  title: string;
  description: string;
  timestamp: string;
  category?: 'residential' | 'commercial';
  client?: string;
}

const getStatusConfig = (status: ActivityItem['type']) => {
  switch (status) {
    case 'filled':
      return {
        label: 'Filled',
        color: 'var(--md-success)',
        bgColor: 'var(--md-success)',
        bgColorLight: '#E8F5E8'
      };
    case 'closed':
      return {
        label: 'Closed',
        color: 'var(--md-on-surface-muted)',
        bgColor: 'var(--md-on-surface-muted)',
        bgColorLight: '#F5F5F5'
      };
    case 'pending':
      return {
        label: 'Pending',
        color: 'var(--md-warning)',
        bgColor: 'var(--md-warning)',
        bgColorLight: '#FFF3E0'
      };
    case 'created':
      return {
        label: 'Created',
        color: 'var(--md-primary-500)',
        bgColor: 'var(--md-primary-500)',
        bgColorLight: 'var(--md-primary-50)'
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

const getActivityIcon = (type: ActivityItem['type'], category?: string) => {
  const iconProps = { size: 20 };
  
  switch (type) {
    case 'created':
      return <Briefcase {...iconProps} />;
    case 'filled':
      return <CheckCircle {...iconProps} />;
    case 'closed':
      return <XCircle {...iconProps} />;
    case 'pending':
      return <Clock {...iconProps} />;
    default:
      return <Briefcase {...iconProps} />;
  }
};

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'residential':
      return <Home size={16} />;
    case 'commercial':
      return <Building size={16} />;
    default:
      return <User size={16} />;
  }
};

const formatTimestamp = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export function RecentActivityFeed() {
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'created',
      title: 'New Job Created',
      description: 'Residential deep cleaning - 3 bedroom apartment',
      timestamp: '2024-01-15T10:30:00Z',
      category: 'residential',
      client: 'Sarah Johnson'
    },
    {
      id: '2',
      type: 'filled',
      title: 'Job Assigned',
      description: 'Commercial office cleaning assigned to John Smith',
      timestamp: '2024-01-15T09:15:00Z',
      category: 'commercial',
      client: 'Tech Corp Inc.'
    },
    {
      id: '3',
      type: 'pending',
      title: 'Pending Approval',
      description: 'Window cleaning service awaiting client confirmation',
      timestamp: '2024-01-15T08:45:00Z',
      category: 'residential',
      client: 'Mike Davis'
    },
    {
      id: '4',
      type: 'closed',
      title: 'Job Completed',
      description: 'Upholstery cleaning service completed successfully',
      timestamp: '2024-01-14T16:30:00Z',
      category: 'residential',
      client: 'Emma Wilson'
    },
    {
      id: '5',
      type: 'filled',
      title: 'Job Assigned',
      description: 'Regular maintenance schedule created for client',
      timestamp: '2024-01-14T14:20:00Z',
      category: 'commercial',
      client: 'Downtown Mall'
    },
    {
      id: '6',
      type: 'created',
      title: 'New Job Created',
      description: 'Post-construction cleaning for new office space',
      timestamp: '2024-01-14T11:10:00Z',
      category: 'commercial',
      client: 'BuildRight Construction'
    }
  ];

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
      {/* Header */}
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
            Latest job updates and status changes
          </p>
        </div>
        
        {/* View all button */}
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--md-primary-50)',
            color: 'var(--md-primary-700)',
            border: '1px solid var(--md-primary-200)'
          }}
        >
          View All
        </button>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const statusConfig = getStatusConfig(activity.type);
          
          return (
            <div key={activity.id} className="flex items-start gap-4">
              {/* Timeline line */}
              {index < activities.length - 1 && (
                <div
                  className="absolute left-6 top-12 w-0.5 h-full"
                  style={{ 
                    backgroundColor: 'var(--md-divider)',
                    marginLeft: '12px'
                  }}
                />
              )}

              {/* Icon */}
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0 relative"
                style={{
                  backgroundColor: `${statusConfig.bgColor}15`,
                  color: statusConfig.color
                }}
              >
                {getActivityIcon(activity.type, activity.category)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 
                        className="font-medium text-sm"
                        style={{ color: 'var(--md-on-surface)' }}
                      >
                        {activity.title}
                      </h4>
                      
                      {/* Status chip */}
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: statusConfig.bgColorLight,
                          color: statusConfig.color
                        }}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                    
                    <p 
                      className="text-sm mb-2"
                      style={{ color: 'var(--md-on-surface-muted)' }}
                    >
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs">
                      {/* Category */}
                      <div className="flex items-center gap-1">
                        {getCategoryIcon(activity.category)}
                        <span style={{ color: 'var(--md-on-surface-muted)' }}>
                          {activity.category}
                        </span>
                      </div>
                      
                      {/* Client */}
                      {activity.client && (
                        <div className="flex items-center gap-1">
                          <User size={12} style={{ color: 'var(--md-on-surface-muted)' }} />
                          <span style={{ color: 'var(--md-on-surface-muted)' }}>
                            {activity.client}
                          </span>
                        </div>
                      )}
                      
                      {/* Timestamp */}
                      <span style={{ color: 'var(--md-on-surface-muted)' }}>
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
