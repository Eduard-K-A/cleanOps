'use client';

import React, { useState } from 'react';
import { NavigationDrawer } from './NavigationDrawer';
import { Menu } from 'lucide-react';

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
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              {breadcrumb && (
                <div className="text-sm text-gray-500 mb-1">{breadcrumb}</div>
              )}
              {title && (
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
              )}
              {subtitle && (
                <p className="text-gray-600 mt-1">{subtitle}</p>
              )}
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
