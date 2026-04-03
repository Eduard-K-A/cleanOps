
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
import type { JobUrgency } from '@/types/index';
import { ChevronLeft, ChevronRight, MapPin, Zap, Ruler, Check, Clock, AlertCircle } from 'lucide-react';
import { validateAddressFormat } from '@/lib/mockLocations';

const SIZES = ['Small (1–2 rooms)', 'Medium (3–4 rooms)', 'Large (5+ rooms)'];
const URGENCIES: { value: JobUrgency; label: string; icon: React.ReactNode }[] = [
  { value: 'LOW', label: 'Low', icon: <Clock className="h-4 w-4" /> },
  { value: 'NORMAL', label: 'Normal', icon: <AlertCircle className="h-4 w-4" /> },
  { value: 'HIGH', label: 'High', icon: <Zap className="h-4 w-4" /> },
];
const TASKS = ['Dusting', 'Vacuuming', 'Mopping', 'Bathrooms', 'Kitchen', 'Windows'];

// Compute price (in cents) based on size base, urgency multiplier and number of tasks.
function computePrice(base: number, urgency: JobUrgency, taskCount: number) {
  const mult = urgency === 'HIGH' ? 1.3 : urgency === 'LOW' ? 0.9 : 1;
  // Per-task surcharge: 12% of base price per task (works for 0..n tasks)
  const taskMultiplier = 1 + 0.12 * taskCount;
  return Math.round(base * mult * taskMultiplier);
}

// Progress Stepper Component
function ProgressStepper({ currentStep }: { currentStep: 'size' | 'location' | 'urgency' | 'payment' }) {
  const steps = [
    { id: 'size', label: 'Size', icon: Ruler },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'urgency', label: 'Urgency & Tasks', icon: Zap },
    { id: 'payment', label: 'Payment', icon: Check },
  ];

  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
                    isCompleted
                      ? 'border-blue-600 bg-blue-600'
                      : isCurrent
                        ? 'border-blue-600 bg-white'
                        : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isCompleted
                        ? 'text-white'
                        : isCurrent
                          ? 'text-blue-600'
                          : 'text-gray-400'
                    }`}
                  />
                </div>
                <span
                  className={`mt-2 text-xs font-medium transition-colors ${
                    isCurrent || isCompleted ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 transition-colors ${
                    isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Summary Sidebar Component
function BookingSummary() {
  const { size, address, urgency, tasks, price_amount } = useBookingStore();

  return (
    <Card className="sticky top-0 h-fit border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {size && (
            <div className="p-3 rounded-lg bg-white border border-blue-100">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Size</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{size}</p>
            </div>
          )}

          {address && (
            <div className="p-3 rounded-lg bg-white border border-blue-100">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Location</p>
              <p className="text-sm font-medium text-gray-900 mt-1 line-clamp-2">{address}</p>
            </div>
          )}

          {urgency && (
            <div className="p-3 rounded-lg bg-white border border-blue-100">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Urgency</p>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className={`h-2 w-2 rounded-full ${
                    urgency === 'HIGH'
                      ? 'bg-red-500'
                      : urgency === 'NORMAL'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                />
                <p className="text-sm font-medium text-gray-900">{urgency}</p>
              </div>
            </div>
          )}

          {tasks.length > 0 && (
            <div className="p-3 rounded-lg bg-white border border-blue-100">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Tasks ({tasks.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {tasks.map((task) => (
                  <span
                    key={task}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700"
                  >
                    {task}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {price_amount > 0 && (
          <div className="mt-6 pt-4 border-t border-blue-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Estimated Total
            </p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              ${(price_amount / 100).toFixed(2)}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Held in escrow until completion
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StepSize() {
  const { size, setSize, setStep } = useBookingStore();
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Ruler className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl text-white">Property Size</CardTitle>
            <CardDescription className="text-blue-100">
              Choose the size of your cleaning job
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-900">Select your property size</Label>
          <div className="grid grid-cols-1 gap-3">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`p-4 rounded-lg border-2 transition-all text-left font-medium ${
                  size === s
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`h-5 w-5 rounded-full border-2 mr-3 flex items-center justify-center transition-all ${
                      size === s
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {size === s && <Check className="h-3 w-3 text-white" />}
                  </div>
                  {s}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button onClick={() => setStep('location')} disabled={!size} className="gap-2">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StepLocation() {
  const { address, distance, setLocation, setDistance, setStep } = useBookingStore();
  const [addr, setAddr] = useState(address);
  const [dist, setDist] = useState(distance);

  const handleNext = () => {
    // Use strict address validation
    const validation = validateAddressFormat(addr);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid address format');
      return;
    }
    
    // Distance validation
    const parsedDist = parseFloat(dist);
    if (!dist || isNaN(parsedDist) || parsedDist <= 0) {
      toast.error('Estimated distance must be a valid number greater than 0');
      return;
    }

    setLocation(addr.trim());
    setDistance(dist.trim());
    setStep('urgency');
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl text-white">Job Location</CardTitle>
            <CardDescription className="text-blue-100">
              Tell us where the cleaning job is located and its distance from City Hall
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-3">
          <Label htmlFor="address" className="text-base font-semibold text-gray-900">
            Address
          </Label>
          <Input
            id="address"
            placeholder="123 Main St, New York, 10001"
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-gray-400" />
            Format: "Street Address, City, ZIP"
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="distance" className="text-base font-semibold text-gray-900">
            Estimated Distance from City Hall (KM)
          </Label>
          <Input
            id="distance"
            type="number"
            min="0.1"
            step="0.1"
            placeholder="e.g. 5.5"
            value={dist}
            onChange={(e) => setDist(e.target.value)}
            className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 font-medium">
            ✓ Required format: "Street Address, City, ZIP"
          </p>
          <p className="text-sm text-blue-800 mt-1">Example: "123 Main St, New York, 10001"</p>
        </div>

        <div className="flex justify-between gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setStep('size')}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button onClick={handleNext} className="gap-2">
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

  const handleUrgencyChange = (u: JobUrgency) => {
    setUrgency(u);
    setPriceAmount(computePrice(base, u, tasks.length));
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl text-white">Urgency & Tasks</CardTitle>
            <CardDescription className="text-blue-100">
              Select urgency level and specific tasks needed
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {/* Urgency Section */}
        <div className="space-y-4">
          <Label className="text-base font-semibold text-gray-900">Urgency Level</Label>
          <div className="grid grid-cols-3 gap-3">
            {URGENCIES.map((u) => (
              <button
                key={u.value}
                type="button"
                onClick={() => handleUrgencyChange(u.value)}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  urgency === u.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    urgency === u.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {u.icon}
                </div>
                <span
                  className={`text-sm font-semibold ${
                    urgency === u.value ? 'text-blue-900' : 'text-gray-700'
                  }`}
                >
                  {u.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tasks Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold text-gray-900">Cleaning Tasks</Label>
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {tasks.length} selected
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {TASKS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTask(t)}
                className={`p-3 rounded-lg border-2 transition-all text-left font-medium text-sm ${
                  tasks.includes(t)
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`h-4 w-4 rounded border-2 mr-2 flex items-center justify-center transition-all ${
                      tasks.includes(t)
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {tasks.includes(t) && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                  {t}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-green-800 uppercase tracking-wide">Estimated Price</p>
          <p className="text-3xl font-bold text-green-700 mt-2">${(price / 100).toFixed(2)}</p>
          <p className="text-xs text-green-700 mt-1">Held in escrow until job completion</p>
        </div>

        <div className="flex justify-between gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setStep('location')}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            onClick={() => {
              setPriceAmount(price);
              setStep('payment');
            }}
            disabled={tasks.length === 0}
            className="gap-2"
          >
            Continue to payment <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StepPayment() {
  const { address, distance, urgency, tasks, price_amount, reset, setStep } = useBookingStore();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    // Validate address format before creating job
    const addressValidation = validateAddressFormat(address);
    if (!addressValidation.isValid) {
      toast.error(addressValidation.error || 'Invalid address format');
      return;
    }

    if (tasks.length === 0 || price_amount < 100) {
      toast.error('Missing tasks or invalid price.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.createJob({
        urgency,
        price_amount,
        address: address,
        distance: parseFloat(distance),
        tasks: tasks.map((task, index) => ({
          id: `task-${index}`,
          name: task,
        })),
      });
      if (!response.data?.job?.id || !response.data?.job?.price_amount) throw new Error('Create job failed');
      sessionStorage.setItem('cleanops_payment', JSON.stringify({ jobId: response.data.job.id, amount: response.data.job.price_amount }));
      toast.success('Job created successfully! Redirecting to payment...');
      reset();
      router.push('/customer/payment');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create job';
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Check className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl text-white">Review & Authorize Payment</CardTitle>
            <CardDescription className="text-green-100">
              Confirm your booking details before payment
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Booking Details Summary */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-gray-900">Booking Details</h3>
          <div className="grid gap-3">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tasks</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {tasks.map((task) => (
                  <span
                    key={task}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                  >
                    {task}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Location</p>
              <p className="text-sm font-medium text-gray-900 mt-2">{address}</p>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Urgency Level</p>
              <div className="flex items-center gap-2 mt-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    urgency === 'HIGH'
                      ? 'bg-red-500'
                      : urgency === 'NORMAL'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                />
                <span className="text-sm font-semibold text-gray-900">{urgency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Amount */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
          <p className="text-xs font-semibold text-blue-900 uppercase tracking-widest">Payment Amount</p>
          <p className="text-4xl font-bold text-blue-600 mt-3">${(price_amount / 100).toFixed(2)}</p>
          <div className="mt-4 space-y-2 pt-4 border-t border-blue-200">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 text-lg mt-0.5">✓</span>
              <p className="text-sm text-blue-800">
                <strong>Secure escrow:</strong> Funds held securely until job completion
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 text-lg mt-0.5">✓</span>
              <p className="text-sm text-blue-800">
                <strong>Full protection:</strong> You control payment release
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 text-lg mt-0.5">✓</span>
              <p className="text-sm text-blue-800">
                <strong>No surprises:</strong> Price is confirmed, no hidden fees
              </p>
            </div>
          </div>
        </div>

        {/* Warning Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>
              By proceeding, you authorize this payment. You'll have full control over fund release after the cleaner completes the job.
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setStep('urgency')}
            disabled={loading}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading}
            className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating job…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Create job & authorize payment
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function BookingForm() {
  const { step } = useBookingStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="mx-auto max-w-6xl">
  

        {/* Progress Stepper */}
        <ProgressStepper currentStep={step} />

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3 mt-8">
          {/* Form Content - Left Side (Takes 2 columns) */}
          <div className="lg:col-span-2">
            {step === 'size' && <StepSize />}
            {step === 'location' && <StepLocation />}
            {step === 'urgency' && <StepUrgency />}
            {step === 'payment' && <StepPayment />}
          </div>

          {/* Summary Sidebar - Right Side */}
          <div className="lg:col-span-1">
            <BookingSummary />
          </div>
        </div>

   
      </div>
    </div>
  );
}
