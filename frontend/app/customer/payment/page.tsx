'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { approveJobCompletion } from '@/app/actions/jobs';

function PaymentContent() {
  const [data, setData] = useState<{ jobId: string; amount: number } | null | 'loading'>('loading');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem('cleanops_payment');
      const parsed = raw ? (JSON.parse(raw) as { jobId?: string; amount?: number }) : null;
      if (parsed?.jobId && parsed?.amount)
        setData({ jobId: parsed.jobId, amount: parsed.amount });
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

  const { jobId, amount } = data;

  const handleAuthorize = async () => {
    setLoading(true);
    try {
      // Since we're using Server Actions and Supabase, payment is already held in escrow
      // Just approve the job completion for demo purposes
      await approveJobCompletion(jobId);
      
      sessionStorage.removeItem('cleanops_payment');
      toast.success('Payment authorized (mock). Funds are held in escrow until you approve the job.');
      router.push('/customer/requests');
    } catch (err: unknown) {
      console.error('Authorize error:', err);
      const message = err instanceof Error ? err.message : 'Authorization failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Complete payment (mock)</CardTitle>
          <CardDescription>
            Job <code className="rounded bg-slate-100 px-1">{jobId.slice(0, 8)}…</code>. Amount: <code className="rounded bg-slate-100 px-1">${(amount / 100).toFixed(2)}</code>. Funds are held in escrow until you approve the work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-slate-600">This environment uses a mock payment flow; no card details are required. Simply authorize the payment.</p>
          <div className="flex justify-end">
            <Button onClick={handleAuthorize} disabled={loading}>
              {loading ? 'Authorizing…' : 'Authorize payment (mock)'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <ProtectedRoute>
      <MainLayout
        title="Complete Payment"
        subtitle="Authorize payment for your cleaning service"
        breadcrumb="Payment"
      >
        <PaymentContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
