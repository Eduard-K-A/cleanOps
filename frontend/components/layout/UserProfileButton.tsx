'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  DollarSign,
  LogOut,
  MapPin,
  Pencil,
  Phone,
  User as UserIcon,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

// Helper to format currency consistently with /profile page
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/modal';
import { PaymentSimulation, TransactionType } from '@/components/payment/PaymentSimulation';

// ─── EditableField ────────────────────────────────────────────────────────────

interface EditableFieldProps {
  label: string;
  value: string;
  readOnly?: boolean;
  onSave?: (next: string) => Promise<void> | void;
}

function EditableField({ label, value, readOnly, onSave }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  async function handleSave() {
    if (!onSave || draft.trim() === value.trim()) {
      setEditing(false);
      return;
    }
    try {
      setSaving(true);
      await onSave(draft.trim());
      setEditing(false);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      {editing && !readOnly ? (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); void handleSave(); }
              if (e.key === 'Escape') { e.preventDefault(); setEditing(false); setDraft(value); }
            }}
          />
          <Button type="button" size="sm" loading={saving} onClick={() => void handleSave()}>Save</Button>
          <Button type="button" size="sm" variant="ghost" disabled={saving}
            onClick={() => { setEditing(false); setDraft(value); }}>
            Cancel
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && setEditing(true)}
          className={cn(
            'group flex w-full items-center justify-between rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors',
            !readOnly && 'hover:border-slate-200 hover:bg-slate-50'
          )}
        >
          <span className={cn('text-sm text-slate-900', !value && 'italic text-slate-400')}>
            {value || (readOnly ? 'Not available' : 'Add value')}
          </span>
          {!readOnly && (
            <Pencil className="h-3.5 w-3.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </button>
      )}
    </div>
  );
}

// ─── BalanceSection ───────────────────────────────────────────────────────────

interface BalanceSectionProps {
  balance: number;
  onAction: (type: TransactionType) => void;
}

function BalanceSection({ balance, onAction }: BalanceSectionProps) {
  return (
    <div className="space-y-3">
      {/* Balance display */}
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 shadow-sm ring-4 ring-green-50">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{formatCurrency(balance)}</div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Available Funds</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onAction('DEPOSIT')}
          className="flex items-center justify-center gap-1.5 h-9 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
        >
          <ArrowDownLeft className="h-3.5 w-3.5" />
          Deposit
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onAction('WITHDRAWAL')}
          className="flex items-center justify-center gap-1.5 h-9 border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
          Withdraw
        </Button>
      </div>
    </div>
  );
}

// ─── UserProfileButton ────────────────────────────────────────────────────────

export function UserProfileButton() {
  const router = useRouter();
  const { user, profile, mounted, logout, refetchProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simType, setSimType] = useState<TransactionType>('DEPOSIT');

  const email = user?.email ?? 'Unknown user';
  // Use dollars directly from the DB
  const balance = profile?.money_balance ?? 0;

  const displayName = useMemo(() => {
    if (profile?.full_name && profile.full_name.trim().length > 0) return profile.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  }, [profile?.full_name, user?.email]);

  const initials = useMemo(() => {
    const fromName = (profile?.full_name || email || 'User')
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join('');
    return fromName || 'U';
  }, [profile?.full_name, email]);

  // Use state with lazy initializer for location label to avoid 'setState in effect' 
  // while still allowing setter access.
  const [locationLabel, setLocationLabel] = useState(() => {
    if (typeof window === 'undefined' || !profile?.id) return '';
    return window.localStorage.getItem(`cleanops_location_label_${profile.id}`) || '';
  });

  const phoneNumber = profile?.phone_number || '';

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  async function handleSaveName(next: string) {
    if (!next || !profile) return;
    await api.updateProfile({ id: profile.id, full_name: next });
    await refetchProfile();
  }

  async function handleSaveLocation(next: string) {
    if (!profile || typeof window === 'undefined') return;
    window.localStorage.setItem(`cleanops_location_label_${profile.id}`, next.trim());
    setLocationLabel(next.trim());
  }

  async function handleSavePhone(next: string) {
    if (!profile || !next) return;
    
    // Philippines phone validation
    // Valid formats: 09XX XXX XXXX (11 digits starting with 09) or +63 XXX XXX XXXX
    // Landlines: 0XX XXXXXXX (area code + 7-8 digits)
    const phone = next.trim();
    
    // Remove all non-digit characters except leading +
    const cleaned = phone.startsWith('+') 
      ? '+' + phone.replace(/\D/g, '') 
      : phone.replace(/\D/g, '');
    
    // Validation regex
    const philippinesMobileRegex = /^(09\d{9}|\+63\d{10})$/;
    const philippinesLandlineRegex = /^(0\d{1,2}\d{7,8})$/;
    
    const isValidMobile = philippinesMobileRegex.test(cleaned);
    const isValidLandline = philippinesLandlineRegex.test(cleaned);
    
    if (!isValidMobile && !isValidLandline) {
      throw new Error('Please enter a valid Philippines phone number (e.g., 09171234567 or +639171234567)');
    }
    
    await api.updateProfile({ id: profile.id, phone_number: cleaned });
    await refetchProfile();
  }

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

  const handleAction = (type: TransactionType) => {
    setSimType(type);
    setIsSimulating(true);
  };

  if (!mounted || !user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white">
          {initials}
        </div>
        <div className="hidden flex-col text-left text-xs sm:flex">
          <span className="max-w-40 truncate font-medium text-slate-900">{displayName}</span>
          <span className="max-w-40 truncate text-[11px] text-slate-500">{email}</span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-0.5 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 ring-1 ring-green-200">
          <span className="text-green-500">$</span>
          {balance.toFixed(2)}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-xl border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-black/5"
          role="menu"
        >
          {/* Header */}
          <div className="mb-3 flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-900">{displayName}</div>
              <div className="truncate text-xs text-slate-500">{email}</div>
            </div>
            {profile?.role && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                {profile.role}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {/* Name */}
            <EditableField label="Name" value={displayName} onSave={handleSaveName} />

            {/* Phone Number */}
            <div className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Phone Number</div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <Phone className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1">
                  <EditableField label="" value={phoneNumber} onSave={handleSavePhone} />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Location</div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <MapPin className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1">
                  <EditableField label="" value={locationLabel} onSave={handleSaveLocation} />
                </div>
              </div>
              {profile?.location_lat != null && profile.location_lng != null && (
                <div className="pl-10 text-[11px] text-slate-400">
                  Approx. {profile.location_lat.toFixed(3)}, {profile.location_lng.toFixed(3)}
                </div>
              )}
            </div>

            {/* Balance — Deposit / Withdraw */}
            <div className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Account Balance</div>
              <BalanceSection balance={balance} onAction={handleAction} />
            </div>

            {/* Sign out */}
            <div className="border-t border-slate-100 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                loading={isLoggingOut}
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isSimulating}
        onClose={() => setIsSimulating(false)}
        title={
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            <span>{simType === 'DEPOSIT' ? 'Deposit Funds' : 'Withdraw Funds'}</span>
          </div>
        }
      >
        <PaymentSimulation
          type={simType}
          currentBalance={balance}
          onCancel={() => setIsSimulating(false)}
          onSuccess={() => {
            void refetchProfile();
          }}
        />
      </Modal>
    </div>
  );
}
