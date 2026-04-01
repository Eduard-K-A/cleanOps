'use client';

import React, { useState } from 'react';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { AnalyticsMetricCards } from '@/components/dashboard/AnalyticsMetricCards';
import { JobsCreatedChart } from '@/components/dashboard/JobsCreatedChart';
import { SpendingBreakdownChart } from '@/components/dashboard/SpendingBreakdownChart';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { QuickStatsRow } from '@/components/dashboard/QuickStatsRow';

export default function Dashboard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: 'var(--md-font-body)' }}>
      {/* Navigation Drawer */}
      <NavigationDrawer />

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top App Bar */}
        <TopAppBar 
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          title="Dashboard"
        />

        {/* Dashboard Content */}
        <main 
          className="flex-1 overflow-auto p-6"
          style={{ 
            backgroundColor: 'var(--md-background)',
            padding: 'var(--md-space-6)'
          }}
        >
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Analytics Metric Cards - Responsive 4/2/1 grid */}
            <AnalyticsMetricCards />

            {/* Charts Section - Responsive 2/1 grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <JobsCreatedChart />
              <SpendingBreakdownChart />
            </div>

            {/* Quick Stats Row - Responsive 3/1 grid */}
            <QuickStatsRow />

            {/* Recent Activity Feed - Full width */}
            <RecentActivityFeed />
          </div>
        </main>
      </div>
    </div>
  );
}
