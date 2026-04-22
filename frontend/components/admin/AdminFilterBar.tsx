'use client';

import React from 'react';
import { Search, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilterOption {
  label: string;
  value: string;
}

interface AdminFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  // For categorical filters (pills or select)
  filters?: {
    label: string;
    value: string;
    options: string[];
    onChange: (value: any) => void;
    type: 'pills' | 'select';
  }[];
  
  // Custom slots for additional controls (like Sort)
  children?: React.ReactNode;
  
  onReset?: () => void;
  summary?: React.ReactNode;
}

export function AdminFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  children,
  onReset,
  summary
}: AdminFilterBarProps) {
  return (
    <div className="bg-slate-50 border-b border-slate-200 z-20">
      <div className="max-w-7xl mx-auto p-6 pb-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          
          {/* Search Section */}
          <div className="w-full md:w-1/4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Dynamic Filters */}
          {filters.map((filter, idx) => (
            <div key={idx} className={filter.type === 'pills' ? 'flex-1 flex flex-col' : 'flex flex-col'}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{filter.label}</label>
              {filter.type === 'pills' ? (
                <div className="flex flex-wrap gap-2">
                  {filter.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => filter.onChange(opt)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        filter.value === opt 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              ) : (
                <select 
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filter.value}
                  onChange={e => filter.onChange(e.target.value)}
                >
                  {filter.options.map(opt => (
                    <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1).toLowerCase().replace('_', ' ')}</option>
                  ))}
                </select>
              )}
            </div>
          ))}

          {/* Custom children (e.g. Sort) */}
          {children}

          {/* Reset Button */}
          {onReset && (
            <div className="flex items-end h-full">
              <Button variant="outline" size="sm" onClick={onReset} className="text-slate-500 border-slate-300 hover:bg-slate-100 px-3 h-9">
                <FilterX className="w-4 h-4 mr-2" /> Reset
              </Button>
            </div>
          )}

        </div>

        {/* Summary Bar */}
        {summary && (
          <div className="bg-blue-50 text-blue-800 text-sm font-medium px-4 py-2 rounded-lg border border-blue-100 flex justify-between">
            {summary}
          </div>
        )}
      </div>
    </div>
  );
}
