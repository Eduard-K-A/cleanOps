'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  Users,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={20} />,
    href: '/dashboard'
  },
  {
    id: 'jobs',
    label: 'Jobs',
    icon: <Briefcase size={20} />,
    href: '/jobs'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <TrendingUp size={20} />,
    href: '/analytics'
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: <Users size={20} />,
    href: '/clients'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings size={20} />,
    href: '/settings'
  }
];

export function NavigationDrawer() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { profile } = useAuth();

  const drawerWidth = isCollapsed ? '72px' : '256px';
  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        />
      )}

      {/* Navigation Drawer */}
      <div
        className={`
          fixed left-0 top-0 h-full bg-white z-50 transform transition-transform duration-300 ease-in-out
          lg:relative lg:transform-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          width: drawerWidth,
          boxShadow: 'var(--md-elevation-2)',
          fontFamily: 'var(--md-font-body)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--md-divider)' }}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--md-primary-500)' }}
              >
                <span className="text-white font-bold text-sm">CO</span>
              </div>
              <span className="font-semibold" style={{ color: 'var(--md-on-surface)' }}>
                cleanOps
              </span>
            </div>
          )}
          
          {/* Desktop toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
            style={{ color: 'var(--md-on-surface-muted)' }}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
            style={{ color: 'var(--md-on-surface-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2">
          {navigationItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`
                relative flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-all duration-200
                ${isActive(item.href)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              style={{
                backgroundColor: isActive(item.href) ? 'var(--md-primary-50)' : 'transparent',
                color: isActive(item.href) ? 'var(--md-primary-700)' : 'var(--md-on-surface-muted)'
              }}
            >
              {/* Active indicator */}
              {isActive(item.href) && !isCollapsed && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                  style={{ backgroundColor: 'var(--md-primary-500)' }}
                />
              )}

              {item.icon}
              
              {!isCollapsed && (
                <>
                  <span className="font-medium text-sm">{item.label}</span>
                  {item.badge && (
                    <span
                      className="ml-auto text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'var(--md-primary-100)',
                        color: 'var(--md-primary-700)'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--md-divider)' }}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                style={{ backgroundColor: 'var(--md-primary-500)' }}
              >
                {(profile as any)?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--md-on-surface)' }}>
                  {(profile as any)?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--md-on-surface-muted)' }}>
                  {profile?.role || 'Guest'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                style={{ backgroundColor: 'var(--md-primary-500)' }}
              >
                {(profile as any)?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
