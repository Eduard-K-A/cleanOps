'use client';

import React from 'react';
import { Search, Bell } from 'lucide-react';
import { UserProfileButton } from './UserProfileButton';

interface TopAppBarProps {
  onMenuClick?: () => void;
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
}

export function TopAppBar({ 
  onMenuClick, 
  title = 'Dashboard',
  subtitle = '',
  showSearch = true,
  showNotifications = true 
}: TopAppBarProps) {


  return (
    <header
      className="flex items-center justify-between px-4 lg:px-6"
      style={{
        height: '64px',
        backgroundColor: 'var(--md-surface)',
        boxShadow: 'var(--md-elevation-1)',
        fontFamily: 'var(--md-font-body)',
        borderBottom: `1px solid var(--md-divider)`
      }}
    >
      {/* Left section */}
      <div className="flex items-center gap-4">
       
        {/* Page title and subtitle */}
        <div>
          <h1 
            className="text-xl font-semibold"
            style={{ 
              color: 'var(--md-on-surface)',
              fontFamily: 'var(--md-font-display)'
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p 
              className="text-sm"
              style={{ 
                color: 'var(--md-on-surface-muted)',
                marginTop: '4px'
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Search */}
        {showSearch && (
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border">
            <Search size={18} style={{ color: 'var(--md-on-surface-muted)' }} />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm w-64"
              style={{ color: 'var(--md-on-surface)' }}
            />
          </div>
        )}

        {/* Notifications */}
        {showNotifications && (
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors relative"
            style={{ color: 'var(--md-on-surface)' }}
          >
            <Bell size={20} />
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--md-error)' }}
            />
          </button>
        )}

        {/* User profile */}
        <div className="pl-2 border-l" style={{ borderColor: 'var(--md-divider)' }}>
          <UserProfileButton />
        </div>
      </div>
    </header>
  );
}
