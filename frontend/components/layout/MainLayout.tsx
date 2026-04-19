'use client';

import React, { useState } from 'react';
import { NavigationDrawer } from './NavigationDrawer';
import { Menu } from 'lucide-react';
import { UserProfileButton } from './UserProfileButton';
import { NotificationPopover } from '../NotificationPopover';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumb?: string;
}

export function MainLayout({ children, title, subtitle, breadcrumb }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Navigation Drawer */}
      <NavigationDrawer 
        isMobileOpen={isMobileMenuOpen} 
        setIsMobileOpen={setIsMobileMenuOpen} 
      />

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 overflow-hidden">
        <main className="h-full overflow-y-auto">
          {/* Page Header */}
          {(title || subtitle || breadcrumb) && (
            <div className="bg-white border-b border-gray-200 px-4 lg:px-6 h-16 flex items-center justify-between">
              {/* Left: breadcrumb / title / subtitle */}
              <div className="flex min-w-0 flex-col justify-center">
                {breadcrumb && (
                  <p className="text-xs text-gray-500 leading-none mb-0.5 truncate">{breadcrumb}</p>
                )}
                {title && (
                  <h1
                    className="text-xl font-semibold leading-tight truncate"
                    style={{ color: 'var(--md-on-surface)', fontFamily: 'var(--md-font-display)' }}
                  >
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm leading-none mt-0.5 truncate" style={{ color: 'var(--md-on-surface-muted)' }}>
                    {subtitle}
                  </p>
                )}
              </div>

              {/* User profile button with dropdown */}
              <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
                <NotificationPopover />
                <UserProfileButton />
              </div>
            </div>
          )}
          
          {/* Page Content */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
