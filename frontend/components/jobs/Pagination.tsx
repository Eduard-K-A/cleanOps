'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const getVisiblePages = () => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'var(--md-surface)',
          border: '1px solid var(--md-divider)',
          color: currentPage === 1 ? 'var(--md-on-surface-muted)' : 'var(--md-on-surface)'
        }}
        onMouseEnter={(e) => {
          if (currentPage !== 1) {
            e.currentTarget.style.backgroundColor = 'var(--md-primary-50)';
            e.currentTarget.style.borderColor = 'var(--md-primary-200)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--md-surface)';
          e.currentTarget.style.borderColor = 'var(--md-divider)';
        }}
      >
        <ChevronLeft size={20} />
      </button>

      {/* Page Numbers */}
      {visiblePages.map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span 
              className="px-3 py-2"
              style={{ color: 'var(--md-on-surface-muted)' }}
            >
              ...
            </span>
          ) : (
            <button
              onClick={() => onPageChange(page as number)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors font-medium text-sm ${
                currentPage === page ? 'text-white' : ''
              }`}
              style={{
                backgroundColor: currentPage === page 
                  ? 'var(--md-primary-500)' 
                  : 'var(--md-surface)',
                border: currentPage === page 
                  ? '1px solid var(--md-primary-500)' 
                  : '1px solid var(--md-divider)',
                color: currentPage === page 
                  ? 'white' 
                  : 'var(--md-on-surface)'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== page) {
                  e.currentTarget.style.backgroundColor = 'var(--md-primary-50)';
                  e.currentTarget.style.borderColor = 'var(--md-primary-200)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== page) {
                  e.currentTarget.style.backgroundColor = 'var(--md-surface)';
                  e.currentTarget.style.borderColor = 'var(--md-divider)';
                }
              }}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'var(--md-surface)',
          border: '1px solid var(--md-divider)',
          color: currentPage === totalPages ? 'var(--md-on-surface-muted)' : 'var(--md-on-surface)'
        }}
        onMouseEnter={(e) => {
          if (currentPage !== totalPages) {
            e.currentTarget.style.backgroundColor = 'var(--md-primary-50)';
            e.currentTarget.style.borderColor = 'var(--md-primary-200)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--md-surface)';
          e.currentTarget.style.borderColor = 'var(--md-divider)';
        }}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
