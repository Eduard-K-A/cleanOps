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
          <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>Save</Button>
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

type BalanceTab = 'deposit' | 'withdraw';
type WithdrawStep = 'input' | 'confirm';

interface BalanceSectionProps {
  balance: number;
  onRefresh: () => Promise<void>;
}

function BalanceSection({ balance, onRefresh }: BalanceSectionProps) {
  const [tab, setTab] = useState<BalanceTab>('deposit');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState<WithdrawStep>('input');
  const inputRef = useRef<HTMLInputElement>(null);

  const parsed = Number(amount);
  const isValidAmount = amount !== '' && !isNaN(parsed) && parsed > 0;
  const exceedsBalance = tab === 'withdraw' && isValidAmount && parsed > balance;

  // Reset state when switching tabs
  function switchTab(next: BalanceTab) {
    setTab(next);
    setAmount('');
    setWithdrawStep('input');
  }

  // reset confirm step if amount changes
  useEffect(() => {
    if (withdrawStep === 'confirm') setWithdrawStep('input');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  async function handleDeposit() {
    if (!isValidAmount) return;
    try {
      setBusy(true);
      const { addMoney } = await import('@/app/actions/payments');
      await addMoney(parsed);
      await onRefresh();
      toast.success(`$${parsed.toFixed(2)} deposited`);
      setAmount('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to deposit');
    } finally {
      setBusy(false);
    }
  }

  async function handleWithdraw() {
    if (!isValidAmount || exceedsBalance) return;
    if (withdrawStep === 'input') {
      setWithdrawStep('confirm');
      return;
    }
    // confirmed
    try {
      setBusy(true);
      const { withdrawMoney } = await import('@/app/actions/payments');
      await withdrawMoney(parsed);
      await onRefresh();
      toast.success(`$${parsed.toFixed(2)} withdrawn`);
      setAmount('');
      setWithdrawStep('input');
    } catch (err: any) {
      toast.error(err.message || 'Failed to withdraw');
      setWithdrawStep('input');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {/* Balance display */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
          <DollarSign className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{formatCurrency(balance)}</div>
          <div className="text-[10px] text-slate-400">Available balance</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg bg-slate-100 p-0.5">
        {(['deposit', 'withdraw'] as BalanceTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all',
              tab === t
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t === 'deposit'
              ? <ArrowDownLeft className="h-3 w-3 text-green-500" />
              : <ArrowUpRight className="h-3 w-3 text-orange-500" />
            }
            {t === 'deposit' ? 'Deposit' : 'Withdraw'}
          </button>
        ))}
      </div>

      {/* Confirm step overlay for withdraw */}
      {tab === 'withdraw' && withdrawStep === 'confirm' ? (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
            <p className="text-xs text-orange-800">
              Withdraw <span className="font-bold">${parsed.toFixed(2)}</span> from your balance?
              This cannot be undone.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="flex-1 bg-orange-600 text-white hover:bg-orange-700"
              disabled={busy}
              onClick={() => void handleWithdraw()}
            >
              {busy ? 'Withdrawing…' : 'Confirm'}
            </Button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setWithdrawStep('input')}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Amount input row */
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
            <input
              ref={inputRef}
              type="number"
              placeholder="0.00"
              value={amount}
              min="0.01"
              step="0.01"
              disabled={busy}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  tab === 'deposit' ? void handleDeposit() : void handleWithdraw();
                }
              }}
              className={cn(
                'h-8 w-full rounded-md border pl-6 pr-2 text-sm outline-none transition-colors',
                'border-slate-200 bg-white text-slate-900 placeholder-slate-400',
                'focus:border-sky-400 focus:ring-1 focus:ring-sky-400',
                exceedsBalance && 'border-red-300 focus:border-red-400 focus:ring-red-400'
              )}
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={busy || !isValidAmount || exceedsBalance}
            onClick={() => tab === 'deposit' ? void handleDeposit() : void handleWithdraw()}
            className={cn(
              'whitespace-nowrap',
              tab === 'withdraw' && 'bg-orange-600 hover:bg-orange-700 text-white'
            )}
          >
            {busy
              ? (tab === 'deposit' ? 'Adding…' : 'Next…')
              : (tab === 'deposit' ? 'Add' : 'Withdraw')
            }
          </Button>
        </div>
      )}

      {/* Validation hint */}
      {exceedsBalance && (
        <p className="text-[10px] text-red-500">
          Exceeds balance ({formatCurrency(balance)} available)
        </p>
      )}
    </div>
  );
}

// ─── UserProfileButton ────────────────────────────────────────────────────────

export function UserProfileButton() {
  const router = useRouter();
  const { user, profile, mounted, logout, refetchProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [locationLabel, setLocationLabel] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const email = user?.email ?? 'Unknown user';
  // money_balance is stored in cents, convert to dollars for display
  const balance = (profile?.money_balance ?? 0) / 100;

  const displayName = useMemo(() => {
    if (profile?.full_name && profile.full_name.trim().length > 0) return profile.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  }, [profile?.full_name, user?.email]);

  const initials = useMemo(() => {
    const fromName = (profile?.full_name || email || '')
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join('');
    return fromName || 'U';
  }, [profile?.full_name, email]);

  // Restore location label from localStorage
  useEffect(() => {
    if (!profile?.id || typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(`cleanops_location_label_${profile.id}`);
    if (stored) setLocationLabel(stored);
  }, [profile?.id]);

  // Load phone number from profile when it changes
  useEffect(() => {
    if (profile?.phone_number) {
      setPhoneNumber(profile.phone_number);
    }
  }, [profile?.phone_number]);

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

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
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
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Balance</div>
              <BalanceSection balance={balance} onRefresh={refetchProfile} />
            </div>

            {/* Sign out */}
            <div className="border-t border-slate-100 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
