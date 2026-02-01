'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function PaymentContent() {
  const [data, setData] = useState<{ jobId: string; clientSecret: string } | null | 'loading'>('loading');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

  const handleAuthorize = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, clientSecret }),
      });
      if (!res.ok) throw new Error('Authorization failed');
      sessionStorage.removeItem('cleanops_payment');
      toast.success('Payment authorized (mock). Funds are held in escrow until you approve the job.');
      router.push('/customer/requests');
    } catch (err: any) {
      console.error('Authorize error:', err);
      toast.error(err?.message || 'Authorization failed');
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
            Job <code className="rounded bg-slate-100 px-1">{jobId.slice(0, 8)}…</code>. Funds are held in escrow until you approve the work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-slate-600">This environment uses a mock payment flow; no card details are required.</p>
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
      <PaymentContent />
    </ProtectedRoute>
  );
}
