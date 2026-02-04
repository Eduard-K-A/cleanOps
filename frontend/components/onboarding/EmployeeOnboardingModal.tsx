"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

type Step = 'name' | 'location' | 'confirm';

export default function EmployeeOnboardingModal() {
  const { profile, mounted, refetchProfile } = useAuth();
  const router = useRouter();

  const show = mounted && profile?.role === 'employee' && !profile?.onboarding_completed;
  const [open, setOpen] = useState(show);
  useEffect(() => setOpen(show), [show]);

  // Form state
  const [step, setStep] = useState<Step>('name');
  const [fullName, setFullName] = useState<string>(profile?.full_name ?? '');
  const [locationText, setLocationText] = useState<string>('');
  const [locationLat, setLocationLat] = useState<number | null>(profile?.location_lat ?? null);
  const [locationLng, setLocationLng] = useState<number | null>(profile?.location_lng ?? null);
  const [suggestions, setSuggestions] = useState<Array<any>>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedDraftAt, setSavedDraftAt] = useState<number | null>(null);

  const nameRef = useRef<HTMLInputElement | null>(null);
  const locationRef = useRef<HTMLInputElement | null>(null);

  // Load draft from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('onboarding_draft');
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj.fullName) setFullName(obj.fullName);
        if (obj.locationText) setLocationText(obj.locationText);
        if (typeof obj.locationLat === 'number') setLocationLat(obj.locationLat);
        if (typeof obj.locationLng === 'number') setLocationLng(obj.locationLng);
        if (obj.savedAt) setSavedDraftAt(obj.savedAt);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const id = setTimeout(() => {
      const payload = {
        fullName,
        locationText,
        locationLat,
        locationLng,
        savedAt: Date.now(),
      };
      try {
        localStorage.setItem('onboarding_draft', JSON.stringify(payload));
        setSavedDraftAt(payload.savedAt);
      } catch (e) {
        // ignore
      }
    }, 500);
    return () => clearTimeout(id);
  }, [fullName, locationText, locationLat, locationLng]);

  useEffect(() => {
    if (!open) return;
    // initial focus
    setTimeout(() => nameRef.current?.focus(), 10);
  }, [open]);

  // Simple OSM Nominatim autocomplete
  async function fetchSuggestions(q: string) {
    if (!q || q.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`
      );
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (e) {
      setSuggestions([]);
    }
  }

  useEffect(() => {
    fetchSuggestions(locationText);
  }, [locationText]);

  function handleSelectSuggestion(item: any) {
    setLocationText(item.display_name || '');
    setLocationLat(parseFloat(item.lat));
    setLocationLng(parseFloat(item.lon));
    setSuggestions([]);
  }

  function validateName(): string | null {
    if (!fullName || fullName.trim().length < 2) return 'Please enter your full name.';
    return null;
  }

  function validateLocation(): string | null {
    if (!locationText || !locationLat || !locationLng) return 'Please select or enter a valid location.';
    return null;
  }

  async function handleSubmit() {
    setError(null);
    const nameErr = validateName();
    const locErr = validateLocation();
    if (nameErr) {
      setStep('name');
      setError(nameErr);
      nameRef.current?.focus();
      return;
    }
    if (locErr) {
      setStep('location');
      setError(locErr);
      locationRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        full_name: fullName.trim(),
        location_lat: locationLat,
        location_lng: locationLng,
        onboarding_completed: true,
      };
      const res = await api.patch('/auth/me', payload);
      if (!res.success) {
        setError(res.error || 'Failed to save profile');
        setLoading(false);
        return;
      }

      // Clear draft
      try {
        localStorage.removeItem('onboarding_draft');
      } catch {}

      // Refresh profile and redirect
      await refetchProfile();
      setLoading(false);
      setOpen(false);
      router.replace('/employee/dashboard');
    } catch (e: any) {
      setError(e?.message ?? 'Unexpected error');
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="fixed inset-0 bg-black opacity-50" />

      <div
        className="relative z-10 w-full max-w-2xl bg-white rounded-lg shadow-lg p-6 mx-4 sm:mx-6"
        style={{ maxHeight: '90vh', overflow: 'auto' }}
      >
        <h2 id="onboarding-title" className="text-2xl font-semibold mb-3">
          Welcome to CleanOps — Employee Onboarding
        </h2>
        <p className="text-sm text-muted mb-4">Please complete your profile to start receiving jobs.</p>

        <div className="space-y-4">
          {step === 'name' && (
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="fullName">
                Full name
              </label>
              <input
                id="fullName"
                ref={nameRef}
                aria-required
                aria-label="Full name"
                className="w-full border px-3 py-2 rounded"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setStep('location');
                }}
              />
            </div>
          )}

          {step === 'location' && (
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                ref={locationRef}
                aria-required
                aria-label="Location"
                className="w-full border px-3 py-2 rounded"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="Type an address or neighborhood"
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    // focus first suggestion if exists
                    const first = document.querySelector('[data-suggestion]') as HTMLElement | null;
                    first?.focus();
                  }
                }}
              />

              {suggestions.length > 0 && (
                <ul className="mt-2 border rounded max-h-40 overflow-auto">
                  {suggestions.map((s, i) => (
                    <li
                      key={i}
                      data-suggestion
                      tabIndex={0}
                      onClick={() => handleSelectSuggestion(s)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSelectSuggestion(s); }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {s.display_name}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-2 text-xs text-muted">You can also enter your address manually.</div>
            </div>
          )}

          {step === 'confirm' && (
            <div>
              <h3 className="font-medium">Confirm details</h3>
              <div className="mt-2">
                <div><strong>Name:</strong> {fullName}</div>
                <div><strong>Location:</strong> {locationText}</div>
              </div>
            </div>
          )}

          {error && <div role="alert" className="text-sm text-red-600">{error}</div>}

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              {step !== 'name' && (
                <button
                  type="button"
                  className="px-3 py-2 bg-gray-100 rounded"
                  onClick={() => setStep(step === 'confirm' ? 'location' : 'name')}
                >
                  Back
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {step !== 'confirm' && (
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={() => setStep(step === 'name' ? 'location' : 'confirm')}
                >
                  Next
                </button>
              )}

              {step === 'confirm' && (
                <button
                  type="button"
                  className="px-4 py-2 bg-green-600 text-white rounded flex items-center"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Finish'}
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 text-xs text-muted">Draft saved: {savedDraftAt ? new Date(savedDraftAt).toLocaleString() : 'never'}</div>
        </div>
      </div>
    </div>
  );
}
