'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getAllUsersAdmin, updateUserRole, getUserActivity, adminAddMoney } from '@/app/actions/admin';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Search, ChevronDown, ChevronRight, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'balance_high' | 'rating_high'>('newest');

  // UI state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [userActivityCache, setUserActivityCache] = useState<Record<string, any>>({});
  
  const [balanceModalUser, setBalanceModalUser] = useState<any>(null);
  const [balanceAmount, setBalanceAmount] = useState<string>('');

  const { data: users, loading, refetch } = useAsyncData<any[]>({
    fetchFn: async () => {
      const response = await getAllUsersAdmin({
        search: debouncedSearch,
        role: roleFilter,
        sortBy
      });
      return { success: true, data: response };
    },
    defaultValue: [],
    errorMessage: 'Failed to load users'
  });

  useEffect(() => {
    refetch();
  }, [debouncedSearch, roleFilter, sortBy]);

  const toggleRow = async (userId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
      // Fetch activity if not cached
      if (!userActivityCache[userId]) {
        try {
          const activity = await getUserActivity(userId);
          setUserActivityCache(prev => ({ ...prev, [userId]: activity }));
        } catch (e) {
          toast.error("Failed to load user activity");
        }
      }
    }
    setExpandedRows(newExpanded);
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      toast.success(`Role updated to ${newRole}`);
      await refetch();
    } catch (e) {
      toast.error('Failed to update role');
    }
  };

  const handleAddBalance = async () => {
    if (!balanceModalUser || !balanceAmount) return;
    try {
      const amount = parseFloat(balanceAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
      await adminAddMoney(balanceModalUser.id, amount);
      toast.success(`Added $${amount.toFixed(2)} to ${balanceModalUser.full_name}'s balance.`);
      setBalanceModalUser(null);
      setBalanceAmount('');
      await refetch();
    } catch (e) {
      toast.error('Failed to add balance');
    }
  };

  // Helpers
  const roleStyles: Record<string, string> = {
    customer: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
    employee: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200',
    admin: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200'
  };

  const avatarStyles: Record<string, string> = {
    customer: 'bg-blue-500',
    employee: 'bg-green-500',
    admin: 'bg-purple-500'
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <NavigationDrawer isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopAppBar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} title="Manage Users" />
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* Filter Bar */}
              <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="w-full md:w-1/3">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Search Users</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Name..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Filter by Role</label>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'customer', 'employee', 'admin'].map(r => (
                      <button
                        key={r}
                        onClick={() => setRoleFilter(r)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize transition-colors ${
                          roleFilter === r ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Sort By</label>
                  <select 
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="balance_high">Balance: High → Low</option>
                    <option value="rating_high">Rating: High → Low</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl shadow-[var(--md-elevation-1)] border border-slate-200 overflow-visible z-0">
                <div className="overflow-x-auto min-h-[60vh]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-4 w-12 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rating</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <tr key={`loading-${i}`}>
                            <td colSpan={7} className="p-4"><Skeleton className="h-12 w-full rounded" /></td>
                          </tr>
                        ))
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">No users found.</td>
                        </tr>
                      ) : (
                        users.map((user) => {
                          const initials = (user.full_name || 'U').substring(0, 2).toUpperCase();
                          return (
                            <React.Fragment key={user.id}>
                              <tr className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => toggleRow(user.id)}>
                                <td className="p-4 text-center">
                                  <div className={`w-8 h-8 rounded-full text-white inline-flex items-center justify-center font-bold text-xs ${avatarStyles[user.role] || 'bg-slate-400'}`}>
                                    {initials}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <p className="font-semibold text-slate-900 text-sm">{user.full_name || 'Anonymous'}</p>
                                  <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
                                </td>
                                <td className="p-4">
                                  <Badge variant="outline" className={`capitalize px-2 py-0.5 text-xs font-medium border-0 ${roleStyles[user.role] || 'bg-slate-100'}`}>
                                    {user.role}
                                  </Badge>
                                </td>
                                <td className="p-4 font-semibold text-slate-700 text-sm">${(user.money_balance || 0).toFixed(2)}</td>
                                <td className="p-4">
                                  {user.rating ? (
                                    <div className="flex items-center text-yellow-500 font-medium text-sm">
                                      <Star className="w-3 h-3 fill-current mr-1" /> {user.rating.toFixed(1)}
                                    </div>
                                  ) : <span className="text-slate-400">—</span>}
                                </td>
                                <td className="p-4 text-xs text-slate-500">
                                  {user.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true }) : 'Unknown'}
                                </td>
                                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 text-xs font-medium border-blue-200 text-blue-700 hover:bg-blue-50"
                                      onClick={() => setBalanceModalUser(user)}
                                    >
                                      Add Balance
                                    </Button>
                                    
                                    <select
                                      className="h-8 px-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      value={user.role}
                                      onChange={(e) => {
                                        if(window.confirm(`Change ${user.full_name}'s role to ${e.target.value}?`)) {
                                          handleChangeRole(user.id, e.target.value);
                                        }
                                      }}
                                    >
                                      <option value="customer">Customer</option>
                                      <option value="employee">Employee</option>
                                      <option value="admin">Admin</option>
                                    </select>
                                  </div>
                                </td>
                              </tr>
                              
                              {expandedRows.has(user.id) && (
                                <tr className="bg-slate-50 border-t border-slate-100 shadow-inner">
                                  <td colSpan={7} className="p-0">
                                    <div className="p-6">
                                      {!userActivityCache[user.id] ? (
                                        <div className="flex items-center gap-2 text-slate-400"><Skeleton className="h-4 w-40" /></div>
                                      ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                          <div>
                                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Customer Activity</h4>
                                            <div className="bg-white p-3 rounded border border-slate-200 text-sm space-y-1">
                                              <p><strong>Jobs Requested:</strong> {userActivityCache[user.id].customerJobs.length}</p>
                                              <p><strong>Active Jobs:</strong> {userActivityCache[user.id].customerJobs.filter((j:any) => ['OPEN', 'IN_PROGRESS'].includes(j.status)).length}</p>
                                              <p><strong>Total Spent:</strong> ${Number(userActivityCache[user.id].totalSpent).toFixed(2)}</p>
                                              <Button 
                                                variant="link" 
                                                className="px-0 pt-2 h-auto text-blue-600"
                                                onClick={() => router.push(`/admin/jobs?search=${user.id}`)}
                                              >
                                                View their jobs →
                                              </Button>
                                            </div>
                                          </div>
                                          {user.role === 'employee' || userActivityCache[user.id].workerJobs.length > 0 ? (
                                            <div>
                                              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Worker Activity</h4>
                                              <div className="bg-white p-3 rounded border border-slate-200 text-sm space-y-1">
                                                <p><strong>Jobs Worked:</strong> {userActivityCache[user.id].workerJobs.length}</p>
                                                <p><strong>Active Jobs:</strong> {userActivityCache[user.id].workerJobs.filter((j:any) => ['OPEN', 'IN_PROGRESS'].includes(j.status)).length}</p>
                                                <p><strong>Total Earned:</strong> ${Number(userActivityCache[user.id].totalEarned).toFixed(2)}</p>
                                                <Button 
                                                  variant="link" 
                                                  className="px-0 pt-2 h-auto text-blue-600"
                                                  onClick={() => router.push(`/admin/jobs?search=${user.id}`)}
                                                >
                                                  View assigned jobs →
                                                </Button>
                                              </div>
                                            </div>
                                          ) : null}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>

      <Modal
        isOpen={balanceModalUser !== null}
        onClose={() => { setBalanceModalUser(null); setBalanceAmount(''); }}
        title="Add Promotional Balance"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 flex items-center justify-between">
            <span>Target User: <strong>{balanceModalUser?.full_name}</strong></span>
            <span>Current Balance: <strong>${balanceModalUser?.money_balance?.toFixed(2)}</strong></span>
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount in Dollars ($)</label>
            <input 
              type="number"
              min="0"
              step="0.01"
              value={balanceAmount}
              onChange={e => setBalanceAmount(e.target.value)}
              placeholder="e.g. 50.00"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setBalanceModalUser(null); setBalanceAmount(''); }}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleAddBalance}>
              Add Funds
            </Button>
          </div>
        </div>
      </Modal>

    </ProtectedRoute>
  );
}
