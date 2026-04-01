'use client';

import React from 'react';
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  Eye,
  Loader2,
  User,
  Calendar,
  MessageCircle,
  MoreHorizontal,
  ArrowRight
} from 'lucide-react';
import type { Job, JobStatus } from '@/types';
import { Button } from '@/components/ui/button';

interface ModernCleaningJobCardProps {
  job: Job;
  onView: (id: string) => void;
  onCancel: (id: string) => Promise<void>;
  isCancelling: boolean;
}

export function ModernCleaningJobCard({ job, onView, onCancel, isCancelling }: ModernCleaningJobCardProps) {
  const getStatusIcon = () => {
    switch (job.status) {
      case 'OPEN':
        return <AlertCircle className="h-4 w-4" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="h-4 w-4" />;
      case 'PENDING_REVIEW':
        return <Clock className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusClass = () => {
    switch (job.status) {
      case 'OPEN':
        return 'open';
      case 'IN_PROGRESS':
        return 'progress';
      case 'PENDING_REVIEW':
        return 'pending';
      case 'COMPLETED':
        return 'completed';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'open';
    }
  };

  const getStatusBarClass = () => {
    switch (job.status) {
      case 'OPEN':
        return 'status-open';
      case 'IN_PROGRESS':
        return 'status-progress';
      case 'PENDING_REVIEW':
        return 'status-pending';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return 'status-open';
    }
  };

  const getChipClass = () => {
    switch (job.status) {
      case 'OPEN':
        return 'chip-open';
      case 'IN_PROGRESS':
        return 'chip-progress';
      case 'PENDING_REVIEW':
        return 'chip-pending';
      case 'COMPLETED':
        return 'chip-completed';
      case 'CANCELLED':
        return 'chip-cancelled';
      default:
        return 'chip-open';
    }
  };

  const getStatusLabel = () => {
    switch (job.status) {
      case 'OPEN':
        return 'Open';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'PENDING_REVIEW':
        return 'Pending Review';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Open';
    }
  };

  const getProgressPercentage = () => {
    switch (job.status) {
      case 'OPEN':
        return 0;
      case 'IN_PROGRESS':
        return 65;
      case 'PENDING_REVIEW':
        return 90;
      case 'COMPLETED':
        return 100;
      case 'CANCELLED':
        return 0;
      default:
        return 0;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const progress = getProgressPercentage();

  return (
    <div className="job-card">
      <div className={`card-status-bar ${getStatusBarClass()}`}></div>
      <div className="card-body">
        <div className="card-header">
          <div className="card-logo">🏠</div>
          <div className="card-title-group">
            <div className="card-title">
              {job.tasks.length > 0 ? job.tasks[0] : 'Cleaning Service'}
              {job.tasks.length > 1 && ` +${job.tasks.length - 1} more`}
            </div>
            <div className="card-id">CLN-{job.id.slice(-6).toUpperCase()}</div>
          </div>
          <div className={`status-chip ${getChipClass()}`}>
            <span className="dot"></span>
            {getStatusLabel()}
          </div>
        </div>

        <div className="card-meta">
          <div className="meta-item">
            <div className="meta-label">Location</div>
            <div className="meta-value">
              <MapPin className="h-4 w-4" />
              {job.location_address || 'Location TBD'}
            </div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Cleaner</div>
            <div className="meta-value">
              <User className="h-4 w-4" />
              {job.worker_id ? 'Assigned' : 'Pending Assignment'}
            </div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Service Cost</div>
            <div className="meta-value">
              <DollarSign className="h-4 w-4" />
              ${job.price_amount}
            </div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Scheduled</div>
            <div className="meta-value">
              <Calendar className="h-4 w-4" />
              {formatDate(job.created_at)}
            </div>
          </div>
        </div>

        {progress > 0 && (
          <div className="card-progress-row">
            <div className="progress-header">
              <span className="progress-label">Completion</span>
              <span className="progress-pct">{progress}%</span>
            </div>
            <div className="progress-track">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="card-tags">
          <span className="tag">{job.urgency} Priority</span>
          {job.tasks.slice(0, 3).map((task, index) => (
            <span key={index} className="tag">{task}</span>
          ))}
          {job.tasks.length > 3 && (
            <span className="tag">+{job.tasks.length - 3} more</span>
          )}
        </div>
      </div>

      <div className="card-footer">
        <div className="footer-date">
          <Clock className="h-4 w-4" />
          {job.urgency === 'HIGH' ? 'Urgent service requested' : 'Standard service'}
        </div>
        <div className="footer-actions">
          <button className="btn-icon" title="Message">
            <MessageCircle className="h-4 w-4" />
          </button>
          <button className="btn-icon" title="More options">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <button 
            className="btn-detail ripple-parent" 
            onClick={() => onView(job.id)}
          >
            View 
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
