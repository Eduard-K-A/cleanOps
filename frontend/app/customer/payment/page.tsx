'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function CheckoutForm({ jobId, clientSecret }: { jobId: string; clientSecret: string }) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const card = elements.getElement(CardElement);
    if (!card) return;

    setLoading(true);
    try {
      const { error } = await stripe.confirmCardPayment(clientSecret, { payment_method: { card } });
      if (error) {
        toast.error(error.message ?? 'Payment failed');
        return;
      }
      if (typeof window !== 'undefined') sessionStorage.removeItem('cleanops_payment');
      toast.success('Payment authorized. Funds held in escrow until you approve the job.');
      router.push('/customer/requests');
    } catch {
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
        <p className="mb-2 text-sm font-medium text-slate-700">Card details</p>
        <CardElement
          options={{
            style: {
              base: { fontSize: '16px', color: '#1e293b' },
              invalid: { color: '#dc2626' },
            },
          }}
        />
      </div>
      <Button type="submit" className="w-full" disabled={!stripe || loading}>
        {loading ? 'Authorizing…' : 'Authorize payment (escrow)'}
      </Button>
    </form>
  );
}

function PaymentContent() {
  const [data, setData] = useState<{ jobId: string; clientSecret: string } | null | 'loading'>('loading');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem('cleanops_payment');
      const parsed = raw ? (JSON.parse(raw) as { jobId?: string; clientSecret?: string }) : null;
      if (parsed?.jobId && parsed?.clientSecret)
        setData({ jobId: parsed.jobId, clientSecret: parsed.clientSecret });
      else setData(null);
    } catch {
      setData(null);
    }
  }, []);

  if (data === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
      </div>
    );
  }

  if (data === null) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Invalid session</CardTitle>
          <CardDescription>Missing payment details. Start a new booking from the order page.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { jobId, clientSecret } = data;

  const options = { clientSecret, appearance: { theme: 'stripe' as const } };

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Complete payment</CardTitle>
          <CardDescription>
            Job <code className="rounded bg-slate-100 px-1">{jobId.slice(0, 8)}…</code>. Funds are held in escrow until you approve the work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stripePromise ? (
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm jobId={jobId} clientSecret={clientSecret} />
            </Elements>
          ) : (
            <p className="text-sm text-amber-700">
              Set <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to enable Stripe. Use test card 4242….
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentLoadingFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
    </div>
  );
}

export default function PaymentPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<PaymentLoadingFallback />}>
        <PaymentContent />
      </Suspense>
    </ProtectedRoute>
  );
}
