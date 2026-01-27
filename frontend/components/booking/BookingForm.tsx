'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/stores/bookingStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import type { JobUrgency } from '@/types';
import { ChevronLeft, ChevronRight, MapPin, Zap, Ruler } from 'lucide-react';

const SIZES = ['Small (1–2 rooms)', 'Medium (3–4 rooms)', 'Large (5+ rooms)'];
const URGENCIES: { value: JobUrgency; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'High' },
];
const TASKS = ['Dusting', 'Vacuuming', 'Mopping', 'Bathrooms', 'Kitchen', 'Windows'];

function StepSize() {
  const { size, setSize, setStep } = useBookingStore();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-5 w-5" /> Size
        </CardTitle>
        <CardDescription>Choose the size of the cleaning job.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Property size</Label>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <Button
                key={s}
                type="button"
                variant={size === s ? 'default' : 'outline'}
                onClick={() => setSize(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => setStep('location')} disabled={!size}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StepLocation() {
  const { location_lat, location_lng, address, setLocation, setStep } = useBookingStore();
  const [lat, setLat] = useState(String(location_lat ?? ''));
  const [lng, setLng] = useState(String(location_lng ?? ''));
  const [addr, setAddr] = useState(address);

  const handleNext = () => {
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (Number.isNaN(la) || Number.isNaN(ln)) {
      toast.error('Enter valid latitude and longitude.');
      return;
    }
    setLocation(la, ln, addr || undefined);
    setStep('urgency');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" /> Location
        </CardTitle>
        <CardDescription>Job location (coordinates). Mapbox/Google Maps can be wired here.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Address (optional)</Label>
          <Input
            placeholder="123 Main St, City"
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Latitude</Label>
            <Input
              type="number"
              step="any"
              placeholder="e.g. 40.7128"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Longitude</Label>
            <Input
              type="number"
              step="any"
              placeholder="e.g. -74.0060"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep('size')}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button onClick={handleNext}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StepUrgency() {
  const { urgency, setUrgency, tasks, setTasks, setStep, setPriceAmount, size } = useBookingStore();
  const base = size?.toLowerCase().includes('large') ? 15000 : size?.toLowerCase().includes('medium') ? 10000 : 6500;
  const mult = urgency === 'HIGH' ? 1.3 : urgency === 'LOW' ? 0.9 : 1;
  const price = Math.round(base * mult);

  const toggleTask = (t: string) => {
    if (tasks.includes(t)) setTasks(tasks.filter((x) => x !== t));
    else setTasks([...tasks, t]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" /> Urgency & tasks
        </CardTitle>
        <CardDescription>Select urgency and cleaning tasks.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Urgency</Label>
          <div className="flex flex-wrap gap-2">
            {URGENCIES.map((u) => (
              <Button
                key={u.value}
                type="button"
                variant={urgency === u.value ? 'default' : 'outline'}
                onClick={() => {
                  setUrgency(u.value);
                  const m = u.value === 'HIGH' ? 1.3 : u.value === 'LOW' ? 0.9 : 1;
                  setPriceAmount(Math.round(base * m));
                }}
              >
                {u.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Tasks</Label>
          <div className="flex flex-wrap gap-2">
            {TASKS.map((t) => (
              <Button
                key={t}
                type="button"
                variant={tasks.includes(t) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleTask(t)}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>
        <p className="text-sm text-slate-600">
          Estimated price: <strong>${(price / 100).toFixed(2)}</strong> (held in escrow until job completion).
        </p>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep('location')}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            onClick={() => {
              setPriceAmount(price);
              setStep('payment');
            }}
            disabled={tasks.length === 0}
          >
            Continue to payment <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StepPayment() {
  const { location_lat, location_lng, urgency, tasks, price_amount, reset, setStep } = useBookingStore();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (location_lat == null || location_lng == null || tasks.length === 0 || price_amount < 100) {
      toast.error('Missing location, tasks, or invalid price.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.createJob({
        urgency,
        price_amount,
        location_coordinates: {
          lat: location_lat,
          lng: location_lng,
          address: 'Current location',
        },
        tasks: tasks.map((task, index) => ({
          id: `task-${index}`,
          name: task,
        })),
      });
      if (!response.data?.job?.id || !response.data?.client_secret) throw new Error('Create job failed');
      sessionStorage.setItem('cleanops_payment', JSON.stringify({ jobId: response.data.job.id, clientSecret: response.data.client_secret }));
      toast.success('Job created. Redirecting to payment…');
      reset();
      router.push('/customer/payment');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review & pay</CardTitle>
        <CardDescription>Funds are held in escrow until you approve the work.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-slate-50 p-4 text-sm">
          <p><strong>Amount:</strong> ${(price_amount / 100).toFixed(2)}</p>
          <p><strong>Tasks:</strong> {tasks.join(', ')}</p>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep('urgency')} disabled={loading}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating…' : 'Create job & authorize payment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function BookingForm() {
  const { step } = useBookingStore();

  return (
    <div className="mx-auto max-w-lg">
      {step === 'size' && <StepSize />}
      {step === 'location' && <StepLocation />}
      {step === 'urgency' && <StepUrgency />}
      {step === 'payment' && <StepPayment />}
    </div>
  );
}
