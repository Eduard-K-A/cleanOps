'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  ChevronRight,
  Home,
  Calendar,
  FileText,
  BarChart3,
  Sparkles,
  LogOut,
  User,
  LogOut as SignOutIcon
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  requiredRole?: 'customer' | 'employee';
}

const getNavigationItems = (role?: string): NavigationItem[] => {
  const customerItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home size={20} />,
      href: '/homepage'
    },
    {
      id: 'book',
      label: 'Book Service',
      icon: <Calendar size={20} />,
      href: '/customer/order',
      requiredRole: 'customer'
    },
    {
      id: 'requests',
      label: 'My Requests',
      icon: <FileText size={20} />,
      href: '/customer/requests',
      requiredRole: 'customer'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      href: '/dashboard'
    }
  ];

  const employeeItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home size={20} />,
      href: '/homepage'
    },
    {
      id: 'jobs',
      label: 'Jobs Feed',
      icon: <Briefcase size={20} />,
      href: '/employee/feed',
      requiredRole: 'employee'
    },
    {
      id: 'history',
      label: 'History',
      icon: <FileText size={20} />,
      href: '/employee/history',
      requiredRole: 'employee'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      href: '/employee/dashboard'
    }
  ];

  const adminItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home size={20} />,
      href: '/homepage'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      href: '/dashboard'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <TrendingUp size={20} />,
      href: '/analytics'
    },
    {
      id: 'users',
      label: 'Users',
      icon: <Users size={20} />,
      href: '/admin/users'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={20} />,
      href: '/settings'
    }
  ];

  return role === 'employee' ? employeeItems : role === 'admin' ? adminItems : customerItems;
};

export function NavigationDrawer({ isMobileOpen, setIsMobileOpen }: { isMobileOpen?: boolean; setIsMobileOpen?: (open: boolean) => void } = {}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  // Stable role: once a role is known, hold it until a *confirmed* different
  // role arrives. This prevents the nav from flickering to "customer" during
  // the brief window where profile is null mid-revalidation.
  const [stableRole, setStableRole] = useState<string | undefined>(undefined);

  const pathname = usePathname();
  const router = useRouter();
  const { profile, user, logout, loading, mounted } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Use external mobile state if provided, otherwise use internal state
  const mobileOpen = isMobileOpen !== undefined ? isMobileOpen : internalMobileOpen;
  const handleSetMobileOpen = (open: boolean) => {
    if (setIsMobileOpen) {
      setIsMobileOpen(open);
    } else {
      setInternalMobileOpen(open);
    }
  };

  // Update stableRole only when we have a confirmed role AND revalidation is done.
  // This prevents the nav from flickering during the snapshot → real profile transition.
  useEffect(() => {
    if (mounted && !loading && profile?.role) {
      setStableRole(profile.role);
    }
  }, [mounted, loading, profile?.role]);

  const drawerWidth = isCollapsed ? '72px' : '256px';
  const isActive = (href: string) => pathname === href;
  // Use stableRole so the nav doesn't flip mid-revalidation.
  const navigationItems = getNavigationItems(stableRole);
  const userInitial = profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Filter navigation items based on user role.
  // Use stableRole so the filter doesn't flip mid-revalidation.
  const filteredNavItems = navigationItems.filter(item => 
    !item.requiredRole || item.requiredRole === stableRole
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => handleSetMobileOpen(false)}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        />
      )}

      {/* Navigation Drawer */}
      <div
        className={`
          fixed left-0 top-0 h-full bg-white z-50 transform transition-transform duration-300 ease-in-out
          lg:relative lg:transform-none
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
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
          
              <span className="font-semibold text-gray-900">
                CleanOps
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
            onClick={() => handleSetMobileOpen(false)}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
            style={{ color: 'var(--md-on-surface-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2">
          {filteredNavItems.map((item: NavigationItem) => (
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
                backgroundColor: isActive(item.href) ? 'var(--blue-50)' : 'transparent',
                color: isActive(item.href) ? 'var(--blue-600)' : 'var(--gray-600)'
              }}
            >
              {/* Active indicator */}
              {isActive(item.href) && !isCollapsed && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                  style={{ backgroundColor: 'var(--blue-500)' }}
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
                        backgroundColor: 'var(--blue-100)',
                        color: 'var(--blue-700)'
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
          <div className="relative" ref={userMenuRef}>
            {!isCollapsed ? (
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                  style={{ backgroundColor: 'var(--blue-500)' }}
                >
                  {userInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-gray-900">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs truncate text-gray-500">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
                <ChevronRight 
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    showUserMenu ? 'rotate-90' : ''
                  }`} 
                />
              </div>
            ) : (
              <div 
                className="flex justify-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                  style={{ backgroundColor: 'var(--blue-500)' }}
                >
                  {userInitial}
                </div>
              </div>
            )}

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                >
                  <SignOutIcon className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
