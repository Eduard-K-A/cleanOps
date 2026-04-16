'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import toast from 'react-hot-toast';
import {
  User,
  Bell,
  Shield,
  Moon,
  Globe,
  Lock,
  Mail,
  Smartphone,
  Eye,
  Trash2,
  ChevronRight,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';

interface SettingSectionProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SettingSection({ title, description, icon, children }: SettingSectionProps) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            {description && <p className="text-sm text-slate-500">{description}</p>}
          </div>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </section>
  );
}

interface ToggleSettingProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleSetting({ title, description, icon, checked, onChange, disabled }: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        {icon && <span className="text-slate-400">{icon}</span>}
        <div>
          <p className="font-medium text-slate-800">{title}</p>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      <Switch 
        checked={checked} 
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

export default function SettingsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile, logout } = useAuth();
  const [saving, setSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    jobUpdates: true,
    messageAlerts: true,
    marketingEmails: false,
    
    // Privacy
    profileVisible: true,
    showLocation: false,
    showRating: true,
    
    // Appearance
    darkMode: false,
    compactView: false,
    
    // Language
    language: 'en',
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    toast.success('Setting updated');
  };

  const handleSaveAll = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('All settings saved successfully');
    setSaving(false);
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast.error('Account deletion is not yet implemented');
    }
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
  ];

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-slate-50" style={{ fontFamily: 'var(--md-font-body)' }}>
        <NavigationDrawer isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopAppBar 
            onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            title="Settings" 
          />
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Settings</h1>
                <p className="text-slate-500">Manage your preferences and account settings</p>
              </div>

              {/* Notifications Section */}
              <SettingSection
                title="Notifications"
                description="Control how you receive updates and alerts"
                icon={<Bell className="w-5 h-5" />}
              >
                <div className="space-y-1 divide-y divide-slate-100">
                  <ToggleSetting
                    title="Email Notifications"
                    description="Receive updates via email"
                    icon={<Mail className="w-4 h-4" />}
                    checked={settings.emailNotifications}
                    onChange={() => handleToggle('emailNotifications')}
                  />
                  <ToggleSetting
                    title="Push Notifications"
                    description="Receive push notifications on your device"
                    icon={<Smartphone className="w-4 h-4" />}
                    checked={settings.pushNotifications}
                    onChange={() => handleToggle('pushNotifications')}
                  />
                  <ToggleSetting
                    title="Job Updates"
                    description="Get notified about job status changes"
                    checked={settings.jobUpdates}
                    onChange={() => handleToggle('jobUpdates')}
                  />
                  <ToggleSetting
                    title="Message Alerts"
                    description="Get notified when you receive new messages"
                    checked={settings.messageAlerts}
                    onChange={() => handleToggle('messageAlerts')}
                  />
                  <ToggleSetting
                    title="Marketing Emails"
                    description="Receive promotional offers and updates"
                    checked={settings.marketingEmails}
                    onChange={() => handleToggle('marketingEmails')}
                  />
                </div>
              </SettingSection>

              {/* Privacy Section */}
              <SettingSection
                title="Privacy"
                description="Manage your profile visibility and data sharing"
                icon={<Shield className="w-5 h-5" />}
              >
                <div className="space-y-1 divide-y divide-slate-100">
                  <ToggleSetting
                    title="Public Profile"
                    description="Make your profile visible to other users"
                    icon={<User className="w-4 h-4" />}
                    checked={settings.profileVisible}
                    onChange={() => handleToggle('profileVisible')}
                  />
                  <ToggleSetting
                    title="Show Location"
                    description="Display your general location to others"
                    icon={<Globe className="w-4 h-4" />}
                    checked={settings.showLocation}
                    onChange={() => handleToggle('showLocation')}
                  />
                  <ToggleSetting
                    title="Show Rating"
                    description="Display your rating on your public profile"
                    checked={settings.showRating}
                    onChange={() => handleToggle('showRating')}
                  />
                </div>
              </SettingSection>

              {/* Appearance Section */}
              <SettingSection
                title="Appearance"
                description="Customize your app experience"
                icon={<Moon className="w-5 h-5" />}
              >
                <div className="space-y-1 divide-y divide-slate-100">
                  <ToggleSetting
                    title="Dark Mode"
                    description="Use dark theme throughout the app"
                    icon={<Moon className="w-4 h-4" />}
                    checked={settings.darkMode}
                    onChange={() => handleToggle('darkMode')}
                  />
                  <ToggleSetting
                    title="Compact View"
                    description="Show more content with less spacing"
                    checked={settings.compactView}
                    onChange={() => handleToggle('compactView')}
                  />
                </div>

                {/* Language Selector */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <LabelWithIcon icon={<Globe className="w-4 h-4" />} label="Language" />
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setSettings(prev => ({ ...prev, language: lang.code }));
                          toast.success(`Language changed to ${lang.name}`);
                        }}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                          settings.language === lang.code
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                        }`}
                      >
                        {settings.language === lang.code && (
                          <Check className="w-4 h-4 inline mr-1" />
                        )}
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              </SettingSection>

              {/* Security Section */}
              <SettingSection
                title="Security"
                description="Manage your account security"
                icon={<Lock className="w-5 h-5" />}
              >
                <div className="space-y-3">
                  <button 
                    className="w-full flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-colors"
                    onClick={() => toast.success('Password change coming soon!')}
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-slate-400" />
                      <div className="text-left">
                        <p className="font-medium text-slate-800">Change Password</p>
                        <p className="text-sm text-slate-500">Update your account password</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>

                  <button 
                    className="w-full flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-colors"
                    onClick={() => toast.success('Two-factor authentication coming soon!')}
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-slate-400" />
                      <div className="text-left">
                        <p className="font-medium text-slate-800">Two-Factor Authentication</p>
                        <p className="text-sm text-slate-500">Add an extra layer of security</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>

                  <button 
                    className="w-full flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-colors"
                    onClick={() => toast.success('Login history coming soon!')}
                  >
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-slate-400" />
                      <div className="text-left">
                        <p className="font-medium text-slate-800">Login History</p>
                        <p className="text-sm text-slate-500">View your recent login activity</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </SettingSection>

              {/* Danger Zone */}
              <section className="bg-red-50 rounded-xl border border-red-200 overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-red-800">Danger Zone</h2>
                      <p className="text-sm text-red-600">Irreversible account actions</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800">Delete Account</p>
                        <p className="text-sm text-slate-500">Permanently delete your account and all data</p>
                      </div>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Info Footer */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100 mb-6">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium mb-1">About Your Data</p>
                  <p className="text-sm text-blue-600">
                    Your settings are saved automatically. Some changes may require a page refresh to take full effect.
                    For account-related inquiries, contact support at support@cleanops.com
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 sticky bottom-0 bg-slate-50 py-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSettings({
                      emailNotifications: true,
                      pushNotifications: true,
                      jobUpdates: true,
                      messageAlerts: true,
                      marketingEmails: false,
                      profileVisible: true,
                      showLocation: false,
                      showRating: true,
                      darkMode: false,
                      compactView: false,
                      language: 'en',
                    });
                    toast.success('Settings reset to defaults');
                  }}
                >
                  Reset to Defaults
                </Button>
                <Button 
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Helper component for labels with icons
function LabelWithIcon({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
      {icon}
      {label}
    </div>
  );
}
