'use client';

import React from 'react';
import { Search, FilterX } from 'lucide-react';

interface EmptyStateProps {
  onClearFilters?: () => void;
}

export function EmptyState({ onClearFilters }: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      {/* Illustration */}
      <div className="flex justify-center mb-8">
        <div
          className="w-32 h-32 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--md-primary-50)' }}
        >
          <FilterX size={48} style={{ color: 'var(--md-primary-300)' }} />
        </div>
      </div>

      {/* Heading */}
      <h2 
        className="text-2xl font-bold mb-4"
        style={{ 
          color: 'var(--md-on-surface)',
          fontFamily: 'var(--md-font-display)'
        }}
      >
        No jobs match your filters
      </h2>

      {/* Description */}
      <p 
        className="text-lg mb-8 max-w-md mx-auto"
        style={{ color: 'var(--md-on-surface-muted)' }}
      >
        Try adjusting your search terms or clearing some filters to see more job opportunities.
      </p>

      {/* Clear Filters Button */}
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
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
          <FilterX size={20} />
          Clear Filters
        </button>
      )}
    </div>
  );
}
