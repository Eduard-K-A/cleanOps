'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, LogOut, MapPin, Pencil, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleSave();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                setEditing(false);
                setDraft(value);
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={saving}
            onClick={() => {
              setEditing(false);
              setDraft(value);
            }}
          >
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

export function UserProfileButton() {
  const { user, profile, mounted, logout, refetchProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationLabel, setLocationLabel] = useState('');

  const email = user?.email ?? 'Unknown user';

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

  // Simple, local-only label for human-readable location
  useEffect(() => {
    if (!profile?.id) return;
    if (typeof window === 'undefined') return;
    const key = `cleanops_location_label_${profile.id}`;
    const stored = window.localStorage.getItem(key);
    if (stored) setLocationLabel(stored);
  }, [profile?.id]);

  async function handleSaveName(next: string) {
    if (!next || !profile) return;
    await api.updateProfile({ id: profile.id, full_name: next });
    await refetchProfile();
  }

  async function handleSaveLocation(next: string) {
    if (!profile) return;
    if (typeof window === 'undefined') return;
    try {
      setSavingLocation(true);
      const key = `cleanops_location_label_${profile.id}`;
      window.localStorage.setItem(key, next.trim());
      setLocationLabel(next.trim());
    } finally {
      setSavingLocation(false);
    }
  }

  if (!mounted || !user) return null;

  return (
    <div className="relative">
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
          <span className="max-w-[160px] truncate font-medium text-slate-900">{displayName}</span>
          <span className="max-w-[160px] truncate text-[11px] text-slate-500">{email}</span>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-xl border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-black/5"
          role="menu"
        >
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
            <EditableField label="Name" value={displayName} onSave={handleSaveName} />

            <div className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Location</div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <MapPin className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1">
                  <EditableField
                    label=""
                    value={locationLabel}
                    onSave={handleSaveLocation}
                  />
                </div>
              </div>
              {profile?.location_lat != null && profile.location_lng != null && (
                <div className="pl-10 text-[11px] text-slate-400">
                  Approx. coordinates: {profile.location_lat.toFixed(3)}, {profile.location_lng.toFixed(3)}
                </div>
              )}
            </div>

            <div className="mt-2 border-t border-slate-100 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={async () => {
                  setOpen(false);
                  await logout();
                }}
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

