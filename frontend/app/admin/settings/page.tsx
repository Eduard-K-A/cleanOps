'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { invalidateAsyncDataCache, useAsyncData } from '@/hooks/useAsyncData';
import { getPlatformConfig, upsertPlatformConfig } from '@/app/actions/admin';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, Check, Power } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

export default function AdminSettingsPage() {
  const { profile, mounted, loading: authLoading, isLoggedIn } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  // Form States Form
  const [fee, setFee] = useState(15);
  const [maxJobs, setMaxJobs] = useState(2);
  const [maintenance, setMaintenance] = useState(false);

  const { refetch } = useAsyncData({
    fetchFn: async () => {
      const config = await getPlatformConfig();
      if (config['platform_fee_pct']) setFee(parseInt(config['platform_fee_pct']));
      if (config['max_active_jobs']) setMaxJobs(parseInt(config['max_active_jobs']));
      if (config['maintenance_mode']) setMaintenance(config['maintenance_mode'] === 'true');
      return { success: true, data: config };
    },
    defaultValue: null,
    errorMessage: 'Failed to load platform configuration.',
    enabled: mounted && !authLoading && isLoggedIn && profile?.role === 'admin',
    cacheKey: 'admin-settings',
    cacheTTL: 5 * 60 * 1000,
  });

  const handleSave = async (key: string, value: string) => {
    if (savingKey === key) return;
    setSavingKey(key);
    try {
      await upsertPlatformConfig(key, value);
      invalidateAsyncDataCache('admin-settings');
      setSavedKey(key);
      toast.success('Setting updated');
      setTimeout(() => setSavedKey(null), 2000);
      await refetch();
    } catch (err) {
      toast.error('Failed to update setting');
      // Revert states loosely string-matched
      if (key === 'maintenance_mode') setMaintenance(!maintenance);
    } finally {
      setSavingKey(null);
    }
  };

  const handleMaintenanceToggle = () => {
    const newValue = !maintenance;
    if (newValue) {
      if (!window.confirm("Enable maintenance mode? Customers will not be able to create new jobs.")) {
        return;
      }
    }
    setMaintenance(newValue);
    handleSave('maintenance_mode', String(newValue));
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <NavigationDrawer isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <TopAppBar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} title="Platform Settings" />
          
          {maintenance && (
            <div className="bg-red-50 text-red-700 py-3 px-6 flex items-center gap-3 border-b border-red-200">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">Site is in maintenance mode — new job creation is disabled for customers.</p>
            </div>
          )}

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LEFT COLUMN: Settings Form */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* FINANCIAL */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Financial Setup</h3>
                      <p className="text-sm text-slate-500">Manage how revenue is split across the marketplace.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Platform Fee %</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range" min="5" max="30" step="1" 
                          value={fee} onChange={e => setFee(parseInt(e.target.value))}
                          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="relative w-20">
                          <input 
                            type="number" min="5" max="30" 
                            value={fee} onChange={e => setFee(parseInt(e.target.value))}
                            className="w-full pl-3 pr-6 py-2 border border-slate-300 rounded font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">%</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mt-2">
                        Preview: Employee receives <strong className="text-slate-800">${(100 * (1 - fee/100)).toFixed(2)}</strong> of a $100 job.
                      </p>
                    </div>

                    <div className="bg-amber-50 text-amber-800 p-3 rounded flex items-start gap-2 border border-amber-100 mt-4">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
                      <p className="text-xs">Changing this fee only affects new job completions. Existing jobs use the fee rate at time of approval.</p>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100 mt-6 items-center gap-3">
                      {savedKey === 'platform_fee_pct' && <span className="text-sm text-green-600 flex items-center gap-1 font-medium"><Check className="w-4 h-4"/> Saved</span>}
                      <Button onClick={() => handleSave('platform_fee_pct', String(fee))} loading={savingKey === 'platform_fee_pct'} className="bg-blue-600 hover:bg-blue-700">
                        {savingKey === 'platform_fee_pct' ? 'Saving...' : 'Save Financials'}
                      </Button>
                    </div>
                  </div>
                </section>

                {/* OPERATIONS */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Operations</h3>
                      <p className="text-sm text-slate-500">Configure core behavioral limits for the platform.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Max Active Jobs Per Customer</label>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setMaxJobs(Math.max(1, maxJobs - 1))} className="w-10 h-10 border border-slate-300 rounded flex items-center justify-center bg-slate-50 hover:bg-slate-100 font-medium text-slate-600 focus:outline-none">-</button>
                        <input 
                          type="number" readOnly value={maxJobs}
                          className="w-16 h-10 text-center border-y border-x-0 border-slate-300 font-semibold text-slate-800 select-none focus:outline-none"
                        />
                        <button onClick={() => setMaxJobs(Math.min(5, maxJobs + 1))} className="w-10 h-10 border border-slate-300 rounded flex items-center justify-center bg-slate-50 hover:bg-slate-100 font-medium text-slate-600 focus:outline-none">+</button>
                      </div>
                      <p className="text-sm text-slate-500 mt-2">
                        Preview: Customers can have up to <strong className="text-slate-800">{maxJobs}</strong> open or in-progress jobs at once.
                      </p>
                    </div>

                    <div className="bg-blue-50 text-blue-800 p-3 rounded flex items-start gap-2 border border-blue-100 mt-4">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                      <p className="text-xs">This setting controls a database trigger — changes require a migration to take full effect. Contact your DBA if limits strictly constrain rows.</p>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100 mt-6 items-center gap-3">
                      {savedKey === 'max_active_jobs' && <span className="text-sm text-green-600 flex items-center gap-1 font-medium"><Check className="w-4 h-4"/> Saved</span>}
                      <Button onClick={() => handleSave('max_active_jobs', String(maxJobs))} loading={savingKey === 'max_active_jobs'} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                        {savingKey === 'max_active_jobs' ? 'Saving...' : 'Save Operations'}
                      </Button>
                    </div>
                  </div>
                </section>

                {/* PLATFORM STATUS */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Platform Status</h3>
                      <p className="text-sm text-slate-500">Lock down the marketplace during critical upgrades.</p>
                    </div>
                    {savedKey === 'maintenance_mode' && <span className="text-sm text-green-600 flex items-center gap-1 font-medium bg-green-50 px-2 py-1 rounded"><Check className="w-4 h-4"/> Updated</span>}
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-xl border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${maintenance ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        <Power className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">Maintenance Mode</h4>
                        <p className="text-xs text-slate-500">{maintenance ? 'Active — Blocking new jobs' : 'Disabled — Operating normally'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleMaintenanceToggle}
                      disabled={savingKey === 'maintenance_mode'}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${maintenance ? 'bg-red-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${maintenance ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </section>
              </div>

              {/* RIGHT COLUMN: Context Panel */}
              <div className="lg:col-span-1">
                <div className="sticky top-6">
                  <div className="bg-slate-800 text-white rounded-xl shadow-lg p-6 overflow-hidden relative">
                    {/* Decorative bg element */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-700 rounded-full blur-2xl opacity-50" />
                    
                    <h4 className="text-lg font-bold mb-4 relative z-10 flex items-center gap-2">
                       <Info className="w-5 h-5 text-blue-400" />
                       Settings Log
                    </h4>
                    
                    <div className="relative z-10 space-y-4">
                      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                        <p className="text-xs text-slate-400 mb-1">Active Editor</p>
                        <p className="text-sm font-semibold">{profile?.full_name || 'Administrator'}</p>
                      </div>

                      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                        <p className="text-xs text-slate-400 mb-1">Status</p>
                        <p className="text-sm font-medium text-green-400 flex items-center gap-1">
                          <Check className="w-4 h-4" /> Live Synchronization
                        </p>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          All settings modified here take effect instantly. Certain architectural settings may still require DBA validation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
