'use client';

import React, { useState } from 'react';
import { MapPin, Clock, Bookmark } from 'lucide-react';

interface JobCardProps {
  id: string;
  company: string;
  postedDate: string;
  title: string;
  location: string;
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  salaryRange: string;
  skills: string[];
  status: 'active' | 'urgent' | 'featured';
  isSaved?: boolean;
  isApplied?: boolean;
  onSave?: (id: string) => void;
  onApply?: (id: string) => void;
}

export function JobCard({
  id,
  company,
  postedDate,
  title,
  location,
  workMode,
  salaryRange,
  skills,
  status,
  isSaved = false,
  isApplied = false,
  onSave,
  onApply
}: JobCardProps) {
  const [saved, setSaved] = useState(isSaved);
  const [applied, setApplied] = useState(isApplied);

  const handleSave = () => {
    setSaved(!saved);
    onSave?.(id);
  };

  const handleApply = () => {
    setApplied(true);
    onApply?.(id);
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
    <div className="relative bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header section */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 line-clamp-2 mb-1">{title}</h3>
            <p className="text-xs text-slate-600">{company}</p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className={`shrink-0 p-2 rounded-lg transition-colors ${
              saved
                ? 'bg-slate-200 text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Bookmark className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50">
          <span className="text-xs font-semibold text-slate-700">
            {status === 'urgent' ? 'Urgent' : status === 'featured' ? 'Featured' : 'Active'}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 space-y-3">
        {/* Location and mode */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-slate-700">
            <MapPin className="h-4 w-4 text-slate-400" />
            {location}
          </div>
          <span className="text-xs text-slate-600 px-2 py-1 rounded border border-slate-200 bg-slate-50">
            {workMode}
          </span>
        </div>

        {/* Salary range */}
        <div>
          <p className="text-xs text-slate-600 font-medium uppercase tracking-wide mb-1">Salary Range</p>
          <p className="text-sm font-semibold text-slate-900">{salaryRange}</p>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <p className="text-xs text-slate-600 font-medium uppercase tracking-wide mb-2">Required Skills</p>
            <div className="flex flex-wrap gap-1">
              {skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-1 text-xs font-medium text-slate-700 border border-slate-200 bg-slate-50 rounded-md"
                >
                  {skill}
                </span>
              ))}
              {skills.length > 3 && (
                <span className="px-2 py-1 text-xs font-medium text-slate-600 border border-slate-200 bg-slate-50 rounded-md">
                  +{skills.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Posted date */}
        <div className="flex items-center gap-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <Clock className="h-3.5 w-3.5" />
          Posted {formatDate(postedDate)}
        </div>
      </div>

      {/* Action button */}
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <button
          type="button"
          onClick={handleApply}
          disabled={applied}
          className={`w-full py-2 px-4 rounded-lg font-semibold text-sm transition-colors ${
            applied
              ? 'bg-slate-300 text-slate-700 cursor-not-allowed'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {applied ? 'Applied' : 'Apply Now'}
        </button>
      </div>
    </div>
  );
}
