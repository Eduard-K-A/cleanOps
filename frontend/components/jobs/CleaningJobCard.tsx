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
  Loader2
} from 'lucide-react';
import type { Job, JobStatus } from '@/types';
import { Button } from '@/components/ui/button';

interface CleaningJobCardProps {
  job: Job;
  onView: (id: string) => void;
  onCancel: (id: string) => Promise<void>;
  isCancelling: boolean;
}

export function CleaningJobCard({ job, onView, onCancel, isCancelling }: CleaningJobCardProps) {
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

  const getStatusColor = () => {
    switch (job.status) {
      case 'OPEN':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'IN_PROGRESS':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'PENDING_REVIEW':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'COMPLETED':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'CANCELLED':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyColor = () => {
    switch (job.urgency) {
      case 'LOW':
        return 'text-green-600 bg-green-50';
      case 'NORMAL':
        return 'text-blue-600 bg-blue-50';
      case 'HIGH':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
              {getStatusIcon()}
              {job.status.replace('_', ' ')}
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor()}`}>
              {job.urgency} Priority
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Posted {formatDate(job.created_at)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">${job.price_amount}</p>
        </div>
      </div>

      {/* Location */}
      {job.location_address && (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          {job.location_address}
        </div>
      )}

      {/* Tasks */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Tasks:</h4>
        <ul className="space-y-1">
          {job.tasks.map((task, index) => (
            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              {task}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(job.id)}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
        
        {(job.status === 'OPEN' || job.status === 'IN_PROGRESS') && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onCancel(job.id)}
            disabled={isCancelling}
            className="flex-1"
          >
            {isCancelling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
