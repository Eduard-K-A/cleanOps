'use client';

import React from 'react';
import { Menu, Search, Bell, User } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

interface TopAppBarProps {
  onMenuClick?: () => void;
  title?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
}

export function TopAppBar({ 
  onMenuClick, 
  title = 'Dashboard', 
  showSearch = true,
  showNotifications = true 
}: TopAppBarProps) {
  const { profile } = useAuth();

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
        {/* Menu button - mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
          style={{ color: 'var(--md-on-surface)' }}
        >
          <Menu size={20} />
        </button>

        {/* Page title */}
        <h1 
          className="text-xl font-semibold"
          style={{ 
            color: 'var(--md-on-surface)',
            fontFamily: 'var(--md-font-display)'
          }}
        >
          {title}
        </h1>
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
        <div className="flex items-center gap-3 pl-2 border-l" style={{ borderColor: 'var(--md-divider)' }}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium" style={{ color: 'var(--md-on-surface)' }}>
              {(profile as any)?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs" style={{ color: 'var(--md-on-surface-muted)' }}>
              {profile?.role || 'Guest'}
            </p>
          </div>
          <button className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
              style={{ backgroundColor: 'var(--md-primary-500)' }}
            >
              {(profile as any)?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
