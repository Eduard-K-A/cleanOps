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

// Compute price (in cents) based on size base, urgency multiplier and number of tasks.
function computePrice(base: number, urgency: JobUrgency, taskCount: number) {
  const mult = urgency === 'HIGH' ? 1.3 : urgency === 'LOW' ? 0.9 : 1;
  // Per-task surcharge: 12% of the base price per task (works for 0..n tasks)
  const taskMultiplier = 1 + 0.12 * taskCount;
  return Math.round(base * mult * taskMultiplier);
}
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
  const { address, setLocation, setStep } = useBookingStore();
  const [addr, setAddr] = useState(address);

  const handleNext = () => {
    if (!addr || addr.trim().length === 0) {
      toast.error('Please enter an address for the job.');
      return;
    }
    setLocation(addr.trim());
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
          <Label>Address</Label>
          <Input
            placeholder="123 Main St, City"
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-500">We only collect an address for scheduling. Geocoding is optional internally.</div>
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
  const price = computePrice(base, urgency, tasks.length);

  const toggleTask = (t: string) => {
    const newTasks = tasks.includes(t) ? tasks.filter((x) => x !== t) : [...tasks, t];
    setTasks(newTasks);
    setPriceAmount(computePrice(base, urgency, newTasks.length));
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
                  setPriceAmount(computePrice(base, u.value, tasks.length));
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
  const { address, urgency, tasks, price_amount, reset, setStep } = useBookingStore();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!address || address.trim().length === 0 || tasks.length === 0 || price_amount < 100) {
      toast.error('Missing address, tasks, or invalid price.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.createJob({
        urgency,
        price_amount,
        address: address,
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
