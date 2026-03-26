import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface MoneyAccountStatus {
  balance: number;
  currency: string;
}

export function StripeConnect() {
  const [status, setStatus] = useState<MoneyAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const response = await api.get<{ balance: number; currency: string }>('/payments/balance');
      setStatus(response.data ?? null);
    } catch (error) {
      console.error('Failed to load balance:', error);
      toast.error('Failed to load account balance');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mock Payment Balance</CardTitle>
          <CardDescription>Loading your mock money balance...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mock Payment Balance</CardTitle>
        <CardDescription>
          This is a mock payment system; use the profile balance input to add fake money.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-slate-700">
          Current balance: <strong>${(status?.balance ?? 0).toFixed(2)} {status?.currency || 'USD'}</strong>
        </div>
        <Button variant="outline" onClick={loadBalance} className="w-full">
          Refresh Balance
        </Button>
      </CardContent>
    </Card>
  );
}