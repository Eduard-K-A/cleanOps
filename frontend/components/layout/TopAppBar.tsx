'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { UserProfileButton } from './UserProfileButton';
import { NotificationPopover } from '../NotificationPopover';

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
     

        {/* Notifications */}
        {showNotifications && (
          <NotificationPopover />
        )}

        {/* User profile */}
        <div className="pl-2 border-l" style={{ borderColor: 'var(--md-divider)' }}>
          <UserProfileButton />
        </div>
      </div>
    </header>
  );
}
