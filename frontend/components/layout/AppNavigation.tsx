'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { 
  Home, 
  Calendar, 
  FileText, 
  BarChart3, 
  Sparkles,
  ChevronDown,
  LogOut,
  Settings,
  User
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  requiredRole?: 'customer' | 'employee';
}

const getNavItems = (role?: string): NavItem[] => {
  const customerItems: NavItem[] = [
    { href: '/homepage', label: 'Home', icon: <Home className="h-5 w-5" /> },
    { href: '/customer/order', label: 'Book', icon: <Calendar className="h-5 w-5" />, requiredRole: 'customer' },
    { href: '/customer/requests', label: 'My requests', icon: <FileText className="h-5 w-5" />, requiredRole: 'customer' },
    { href: '/dashboard', label: 'Dashboard', icon: <BarChart3 className="h-5 w-5" /> },
  ];

  const employeeItems: NavItem[] = [
    { href: '/homepage', label: 'Home', icon: <Home className="h-5 w-5" /> },
    { href: '/employee/feed', label: 'Jobs', icon: <FileText className="h-5 w-5" />, requiredRole: 'employee' },
    { href: '/employee/history', label: 'History', icon: <BarChart3 className="h-5 w-5" />, requiredRole: 'employee' },
    { href: '/dashboard', label: 'Dashboard', icon: <BarChart3 className="h-5 w-5" /> },
  ];

  return role === 'employee' ? employeeItems : customerItems;
};

export function AppNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user, isLoggedIn, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const navItems = getNavItems(profile?.role);
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

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const filteredNavItems = navItems.filter(item => 
    !item.requiredRole || item.requiredRole === profile?.role
  );

  return (
    <nav className="topnav">
      <Link href="/homepage" className="nav-brand">
        <div className="nav-brand-icon">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className="nav-brand-text">CleanOps</span>
      </Link>

      <div className="nav-links">
        {filteredNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ripple-parent ${
              pathname === item.href ? 'active' : ''
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>

      <div className="nav-user" ref={userMenuRef}>
        <div className="nav-avatar">{userInitial}</div>
        <div className="nav-user-info">
          <div className="nav-user-name">
            {profile?.full_name || 'User'}
          </div>
          <div className="nav-user-email">
            {user?.email || 'user@example.com'}
          </div>
        </div>
        <div 
          className="nav-chevron cursor-pointer"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <ChevronDown className="h-4 w-4" />
        </div>
        
        {showUserMenu && (
          <div className="absolute right-4 top-16 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
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
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
