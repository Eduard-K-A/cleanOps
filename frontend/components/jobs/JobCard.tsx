'use client';

import React, { useState } from 'react';
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  Bookmark, 
  Building,
  Home
} from 'lucide-react';

interface JobCardProps {
  id: string;
  company: string;
  companyLogo?: string;
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
  companyLogo,
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

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'var(--md-primary-500)';
      case 'urgent':
        return 'var(--md-error)';
      case 'featured':
        return 'var(--md-warning)';
      default:
        return 'var(--md-primary-500)';
    }
  };

  const getWorkModeIcon = () => {
    switch (workMode) {
      case 'Remote':
        return <Home size={14} />;
      case 'Hybrid':
        return <Building size={14} />;
      case 'On-site':
        return <MapPin size={14} />;
      default:
        return <MapPin size={14} />;
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
    <div
      className={`relative bg-white rounded-xl overflow-hidden transition-all duration-200 cursor-pointer
        ${saved ? 'border-2' : ''}
        ${applied ? '' : 'hover:shadow-lg'}
      `}
      style={{
        backgroundColor: applied ? 'var(--md-primary-50)' : 'var(--md-surface)',
        boxShadow: 'var(--md-elevation-1)',
        borderLeft: `4px solid ${getStatusColor()}`,
        borderColor: saved ? 'var(--md-primary-300)' : 'transparent',
        borderRadius: 'var(--md-radius-lg)',
        transition: 'all var(--md-duration-short) var(--md-motion-standard)'
      }}
      onMouseEnter={(e) => {
        if (!applied) {
          e.currentTarget.style.boxShadow = 'var(--md-elevation-3)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!applied) {
          e.currentTarget.style.boxShadow = 'var(--md-elevation-1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* Card Content */}
      <div className="p-6">
        {/* Header: Company Logo + Name + Posted Date */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Company Logo */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
              style={{ 
                backgroundColor: companyLogo ? 'transparent' : 'var(--md-primary-100)',
                color: companyLogo ? 'inherit' : 'var(--md-primary-700)'
              }}
            >
              {companyLogo ? (
                <img src={companyLogo} alt={company} className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                company.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
              )}
            </div>
            
            {/* Company Name */}
            <div>
              <p 
                className="font-medium text-sm"
                style={{ color: 'var(--md-on-surface)' }}
              >
                {company}
              </p>
              <p 
                className="text-xs"
                style={{ color: 'var(--md-on-surface-muted)' }}
              >
                {formatDate(postedDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Job Title */}
        <h3 
          className="font-bold text-lg mb-3 line-clamp-2"
          style={{ 
            color: 'var(--md-on-surface)',
            fontFamily: 'var(--md-font-display)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {title}
        </h3>

        {/* Location + Work Mode Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Location Chip */}
          <div
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border"
            style={{
              backgroundColor: 'var(--md-surface)',
              borderColor: 'var(--md-divider)',
              color: 'var(--md-on-surface-muted)'
            }}
          >
            <MapPin size={14} />
            {location}
          </div>

          {/* Work Mode Chip */}
          <div
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border"
            style={{
              backgroundColor: 'var(--md-surface)',
              borderColor: 'var(--md-divider)',
              color: 'var(--md-on-surface-muted)'
            }}
          >
            {getWorkModeIcon()}
            {workMode}
          </div>
        </div>

        {/* Salary Range */}
        <div className="flex items-center gap-2 mb-4">
          <DollarSign 
            size={16} 
            style={{ color: 'var(--md-primary-600)' }}
          />
          <span 
            className="font-bold text-base"
            style={{ color: 'var(--md-primary-600)' }}
          >
            {salaryRange}
          </span>
          <span 
            className="text-sm"
            style={{ color: 'var(--md-on-surface-muted)' }}
          >
            per year
          </span>
        </div>

        {/* Skill Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {skills.slice(0, 5).map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: 'var(--md-primary-50)',
                color: 'var(--md-primary-800)',
                fontSize: '11px'
              }}
            >
              {skill}
            </span>
          ))}
          {skills.length > 5 && (
            <span
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: 'var(--md-surface-variant)',
                color: 'var(--md-on-surface-muted)',
                fontSize: '11px'
              }}
            >
              +{skills.length - 5}
            </span>
          )}
        </div>

        {/* Horizontal Divider */}
        <div 
          className="h-px mb-4"
          style={{ backgroundColor: 'var(--md-divider)' }}
        />

        {/* Footer Row */}
        <div className="flex items-center justify-between">
          {/* Apply Button or Applied Status */}
          {applied ? (
            <div
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: 'var(--md-success)',
                color: 'white'
              }}
            >
              Applied
            </div>
          ) : (
            <button
              onClick={handleApply}
              className="px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{
                backgroundColor: 'var(--md-primary-500)',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--md-primary-600)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--md-primary-500)';
              }}
            >
              Apply Now
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--md-surface-variant)',
              color: saved ? 'var(--md-primary-500)' : 'var(--md-on-surface-muted)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--md-primary-50)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--md-surface-variant)';
            }}
          >
            {saved ? <Bookmark size={20} /> : <Bookmark size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
