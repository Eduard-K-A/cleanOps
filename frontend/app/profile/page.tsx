'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  User,
  MapPin,
  Phone,
  Wallet,
  Shield,
  Star,
  Calendar,
  Edit2,
  Check,
  X,
  Mail,
  Clock
} from 'lucide-react';

export default function ProfilePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile, refetchProfile } = useAuth();
  
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
    location: '',
  });
  const [saving, setSaving] = useState(false);

  const handleEdit = (field: string) => {
    setEditingField(field);
    setEditValues({
      full_name: profile?.full_name || '',
      phone_number: profile?.phone_number || '',
      location: '',
    });
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValues({
      full_name: profile?.full_name || '',
      phone_number: profile?.phone_number || '',
      location: '',
    });
  };

  const handleSave = async (field: string) => {
    if (!profile) return;
    
    try {
      setSaving(true);
      const updates: Record<string, string> = {};
      
      if (field === 'full_name') {
        updates.full_name = editValues.full_name;
      } else if (field === 'phone_number') {
        // Basic phone validation
        const sanitized = editValues.phone_number.trim().replace(/[^\d\s\-\(\)\+]/g, '');
        updates.phone_number = sanitized;
      }
      
      if (Object.keys(updates).length > 0) {
        await api.updateProfile({ id: profile.id, ...updates });
        await refetchProfile();
        toast.success('Profile updated successfully');
      }
      
      setEditingField(null);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'employee': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'customer': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'employee': return <Star className="w-4 h-4" />;
      case 'customer': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const joinDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      })
    : 'Unknown';

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-slate-50" style={{ fontFamily: 'var(--md-font-body)' }}>
        <NavigationDrawer isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopAppBar 
            onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            title="My Profile" 
          />
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-5xl mx-auto">
              {/* Header Card */}
              <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white mb-6 shadow-xl">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold border-4 border-white/30">
                      {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 px-3 py-1 rounded-full text-xs font-semibold border-2 border-white ${getRoleBadgeColor(profile?.role)}`}>
                      <span className="flex items-center gap-1">
                        {getRoleIcon(profile?.role)}
                        {profile?.role?.charAt(0).toUpperCase()}{profile?.role?.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-bold mb-1">
                      {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                    </h1>
                    <p className="text-blue-200 flex items-center justify-center md:justify-start gap-2">
                      <Mail className="w-4 h-4" />
                      {user?.email}
                    </p>
                    <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-sm text-blue-100">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Member since {joinDate}
                      </span>
                      {profile?.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          {profile.rating.toFixed(1)} rating
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Profile Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Personal Information */}
                  <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                      <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Personal Information
                      </h2>
                    </div>
                    
                    <div className="p-6 space-y-5">
                      {/* Full Name */}
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Full Name</Label>
                        <div className="mt-1.5 flex items-center gap-3">
                          {editingField === 'full_name' ? (
                            <div className="flex-1 flex items-center gap-2">
                              <Input
                                value={editValues.full_name}
                                onChange={(e) => setEditValues({ ...editValues, full_name: e.target.value })}
                                className="flex-1"
                                placeholder="Enter your full name"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSave('full_name')}
                                disabled={saving}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={saving}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <span className="text-slate-800 font-medium">
                                  {profile?.full_name || 'Not set'}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit('full_name')}
                                className="text-slate-500 hover:text-blue-600"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Phone Number</Label>
                        <div className="mt-1.5 flex items-center gap-3">
                          {editingField === 'phone_number' ? (
                            <div className="flex-1 flex items-center gap-2">
                              <Input
                                value={editValues.phone_number}
                                onChange={(e) => setEditValues({ ...editValues, phone_number: e.target.value })}
                                className="flex-1"
                                placeholder="+1 (555) 123-4567"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSave('phone_number')}
                                disabled={saving}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={saving}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <span className="text-slate-800 font-medium">
                                  {profile?.phone_number || 'Not set'}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit('phone_number')}
                                className="text-slate-500 hover:text-blue-600"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Email (read-only) */}
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Email Address</Label>
                        <div className="mt-1.5 p-3 bg-slate-100 rounded-lg border border-slate-200">
                          <span className="text-slate-600">{user?.email}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                      </div>
                    </div>
                  </section>

                  {/* Location */}
                  <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                      <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        Location
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Current Location</p>
                          <p className="text-slate-800 font-medium">
                            {profile?.location_lat && profile?.location_lng
                              ? `${profile.location_lat.toFixed(4)}, ${profile.location_lng.toFixed(4)}`
                              : 'Location not set'}
                          </p>
                          <p className="text-xs text-slate-400 mt-2">
                            Location is managed through your device settings or during job booking
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right Column - Stats & Actions */}
                <div className="space-y-6">
                  {/* Balance Card */}
                  <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Account Balance</p>
                          <p className="text-2xl font-bold text-slate-800">
                            {formatCurrency(profile?.money_balance || 0)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Button 
                          variant="outline" 
                          className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                          onClick={() => toast.success('Add money feature coming soon!')}
                        >
                          Add Money
                        </Button>
                        {profile?.role === 'employee' && (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => toast.success('Withdraw feature coming soon!')}
                          >
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Account Stats */}
                  <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        Account Stats
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Account Type</span>
                        <span className="text-sm font-medium text-slate-800 capitalize">
                          {profile?.role}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">User ID</span>
                        <span className="text-xs font-mono text-slate-600">
                          {user?.id?.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Joined</span>
                        <span className="text-sm text-slate-800">{joinDate}</span>
                      </div>
                      {profile?.rating && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">Rating</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm font-medium text-slate-800">
                              {profile.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Quick Links */}
                  <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-semibold text-slate-800">Quick Actions</h3>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-slate-600 hover:text-blue-600"
                          onClick={() => window.location.href = '/settings'}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Account Settings
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-slate-600 hover:text-blue-600"
                          onClick={() => toast.success('Password change feature coming soon!')}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Change Password
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-slate-600 hover:text-blue-600"
                          onClick={() => toast.success('Notification preferences coming soon!')}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Notifications
                        </Button>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
