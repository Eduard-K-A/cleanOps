'use client';

import React, { useState } from 'react';
import { Search, X, ChevronDown, Filter } from 'lucide-react';

interface FilterBarProps {
  filters: {
    search: string;
    jobType: string[];
    category: string[];
    salaryRange: string;
    datePosted: string;
    sortBy: string;
  };
  onFiltersChange: (filters: any) => void;
}

const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Remote'];
const categories = ['Cleaning', 'Maintenance', 'Deep Clean', 'Window', 'Upholstery'];
const salaryRanges = ['$0-30k', '$30-50k', '$50-70k', '$70k+'];
const datePostedOptions = ['Today', 'This Week', 'This Month', 'Any Time'];
const sortOptions = ['Most Recent', 'Highest Salary', 'Most Relevant'];

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleJobType = (type: string) => {
    const current = filters.jobType || [];
    const updated = current.includes(type)
      ? current.filter((t: string) => t !== type)
      : [...current, type];
    updateFilter('jobType', updated);
  };

  const toggleCategory = (category: string) => {
    const current = filters.category || [];
    const updated = current.includes(category)
      ? current.filter((c: string) => c !== category)
      : [...current, category];
    updateFilter('category', updated);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      jobType: [],
      category: [],
      salaryRange: '',
      datePosted: '',
      sortBy: 'Most Recent'
    });
  };

  const getActiveFiltersCount = () => {
    return (filters.jobType?.length || 0) + 
           (filters.category?.length || 0) + 
           (filters.salaryRange ? 1 : 0) + 
           (filters.datePosted ? 1 : 0) +
           (filters.search ? 1 : 0);
  };

  const removeActiveFilter = (filterType: string, value?: string) => {
    if (filterType === 'search') {
      updateFilter('search', '');
    } else if (filterType === 'jobType' && value) {
      toggleJobType(value);
    } else if (filterType === 'category' && value) {
      toggleCategory(value);
    } else if (filterType === 'salaryRange') {
      updateFilter('salaryRange', '');
    } else if (filterType === 'datePosted') {
      updateFilter('datePosted', '');
    }
  };

  return (
    <>
      {/* Desktop Filter Bar */}
      <div className="hidden lg:block">
        <div 
          className="sticky top-0 z-40 bg-white border-b"
          style={{ 
            backgroundColor: 'var(--md-surface)',
            borderColor: 'var(--md-divider)',
            boxShadow: 'var(--md-elevation-1)'
          }}
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search Input */}
              <div className="flex-1 min-w-[320px] max-w-md">
                <div className="relative">
                  <Search 
                    size={20} 
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--md-on-surface-muted)' }}
                  />
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border outline-none transition-colors"
                    style={{
                      borderColor: 'var(--md-divider)',
                      backgroundColor: 'var(--md-surface)',
                      color: 'var(--md-on-surface)',
                      fontFamily: 'var(--md-font-body)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--md-primary-500)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--md-divider)';
                    }}
                  />
                </div>
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Job Type Filters */}
                {jobTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleJobType(type)}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-colors border"
                    style={{
                      backgroundColor: filters.jobType?.includes(type) 
                        ? 'var(--md-primary-100)' 
                        : 'var(--md-surface)',
                      borderColor: filters.jobType?.includes(type)
                        ? 'var(--md-primary-200)'
                        : 'var(--md-divider)',
                      color: filters.jobType?.includes(type)
                        ? 'var(--md-primary-700)'
                        : 'var(--md-on-surface-muted)'
                    }}
                  >
                    {type}
                  </button>
                ))}

                {/* Category Dropdown */}
                <div className="relative">
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border flex items-center gap-2"
                    style={{
                      borderColor: 'var(--md-divider)',
                      backgroundColor: 'var(--md-surface)',
                      color: 'var(--md-on-surface-muted)'
                    }}
                  >
                    <Filter size={16} />
                    Category
                    <ChevronDown size={16} />
                  </button>
                </div>

                {/* Salary Range Dropdown */}
                <div className="relative">
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border flex items-center gap-2"
                    style={{
                      borderColor: 'var(--md-divider)',
                      backgroundColor: 'var(--md-surface)',
                      color: 'var(--md-on-surface-muted)'
                    }}
                  >
                    Salary Range
                    <ChevronDown size={16} />
                  </button>
                </div>

                {/* Date Posted Dropdown */}
                <div className="relative">
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border flex items-center gap-2"
                    style={{
                      borderColor: 'var(--md-divider)',
                      backgroundColor: 'var(--md-surface)',
                      color: 'var(--md-on-surface-muted)'
                    }}
                  >
                    Date Posted
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border flex items-center gap-2"
                  style={{
                    borderColor: 'var(--md-divider)',
                    backgroundColor: 'var(--md-surface)',
                    color: 'var(--md-on-surface-muted)'
                  }}
                >
                  Sort: {filters.sortBy}
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            {/* Active Filters */}
            {getActiveFiltersCount() > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--md-divider)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--md-on-surface-muted)' }}>
                  Active Filters:
                </span>
                
                {/* Search Filter */}
                {filters.search && (
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--md-primary-100)', color: 'var(--md-primary-700)' }}>
                    Search: {filters.search}
                    <button onClick={() => removeActiveFilter('search')} className="ml-1">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Job Type Filters */}
                {filters.jobType?.map((type: string) => (
                  <div key={type} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--md-primary-100)', color: 'var(--md-primary-700)' }}>
                    {type}
                    <button onClick={() => removeActiveFilter('jobType', type)} className="ml-1">
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {/* Clear All */}
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--md-error)',
                    color: 'white'
                  }}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Bar */}
      <div className="lg:hidden">
        <div 
          className="sticky top-0 z-40 bg-white border-b"
          style={{ 
            backgroundColor: 'var(--md-surface)',
            borderColor: 'var(--md-divider)',
            boxShadow: 'var(--md-elevation-1)'
          }}
        >
          <div className="px-4 py-3">
            {/* Mobile Search */}
            <div className="relative mb-3">
              <Search 
                size={20} 
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--md-on-surface-muted)' }}
              />
              <input
                type="text"
                placeholder="Search jobs..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border outline-none"
                style={{
                  borderColor: 'var(--md-divider)',
                  backgroundColor: 'var(--md-surface)',
                  color: 'var(--md-on-surface)'
                }}
              />
            </div>

            {/* Mobile Filter Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border flex items-center gap-2"
                style={{
                  borderColor: 'var(--md-divider)',
                  backgroundColor: 'var(--md-surface)',
                  color: 'var(--md-on-surface-muted)'
                }}
              >
                <Filter size={16} />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--md-primary-500)', color: 'white' }}>
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>

              {/* Mobile Sort */}
              <div className="relative">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border flex items-center gap-2"
                  style={{
                    borderColor: 'var(--md-divider)',
                    backgroundColor: 'var(--md-surface)',
                    color: 'var(--md-on-surface-muted)'
                  }}
                >
                  Sort: {filters.sortBy}
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filter Panel */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
            <div className="absolute top-0 left-0 right-0 bg-white h-auto max-h-[70vh] overflow-y-auto" style={{ backgroundColor: 'var(--md-surface)' }}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--md-on-surface)' }}>
                    Filters
                  </h3>
                  <button onClick={() => setShowMobileFilters(false)}>
                    <X size={20} style={{ color: 'var(--md-on-surface-muted)' }} />
                  </button>
                </div>

                {/* Mobile Filter Options */}
                <div className="space-y-6">
                  {/* Job Types */}
                  <div>
                    <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--md-on-surface)' }}>
                      Job Type
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {jobTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => toggleJobType(type)}
                          className="px-4 py-2 rounded-full text-sm font-medium transition-colors border"
                          style={{
                            backgroundColor: filters.jobType?.includes(type) 
                              ? 'var(--md-primary-100)' 
                              : 'var(--md-surface)',
                            borderColor: filters.jobType?.includes(type)
                              ? 'var(--md-primary-200)'
                              : 'var(--md-divider)',
                            color: filters.jobType?.includes(type)
                              ? 'var(--md-primary-700)'
                              : 'var(--md-on-surface-muted)'
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
