'use client';

import React, { useState, useEffect } from 'react';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { AnalyticsMetricCards } from '@/components/dashboard/AnalyticsMetricCards';
import { JobsCreatedChart } from '@/components/dashboard/JobsCreatedChart';
import { SpendingBreakdownChart } from '@/components/dashboard/SpendingBreakdownChart';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { QuickStatsRow } from '@/components/dashboard/QuickStatsRow';
import { useAuth } from '@/lib/authContext';
import { Sun, Cloud, CloudRain } from 'lucide-react';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', icon: Sun };
  if (hour < 18) return { text: 'Good afternoon', icon: Cloud };
  return { text: 'Good evening', icon: CloudRain };
}

export default function Dashboard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { profile, user } = useAuth();
  const [greeting, setGreeting] = useState({ text: 'Welcome', icon: Sun });
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    // Set greeting based on current time (client-side only)
    setGreeting(getGreeting());
    // Set current date (client-side only)
    setCurrentDate(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
  }, []);

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'there';
  const firstWord = userName.split(' ')[0];

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
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-2xl p-8 shadow-lg text-white overflow-hidden relative">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <greeting.icon className="w-8 h-8" />
                  <span className="text-lg font-semibold text-blue-100">{greeting.text}</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold mb-2 leading-tight">
                  Welcome back,{' '}
                  <span className="text-blue-200 block md:inline text-6xl md:text-8xl font-extrabold">
                    {firstWord}
                  </span>
                  !
                </h1>
                <p className="text-blue-100 text-lg">
                  {currentDate ? `Today is ${currentDate}` : 'Loading date...'}
                </p>
              </div>
            </div>

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
