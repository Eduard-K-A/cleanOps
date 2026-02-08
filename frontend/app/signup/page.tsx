'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'employee'>('customer');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = (role ?? 'customer').toString().trim().toLowerCase() as 'customer' | 'employee';
    if (!normalizedEmail || !password) {
      toast.error('Email and password required');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      console.log('[DEBUG-SIGNUP] Form data received:', { email: normalizedEmail, role: normalizedRole });
      console.log('Signing up payload:', { email: normalizedEmail, role: normalizedRole });
      const response = await api.signup(normalizedEmail, password, normalizedRole);
      console.log('[DEBUG-SIGNUP] Post-save response from API:', response);
      if (!response.success) {
        toast.error(response.error ?? 'Sign up failed');
        return;
      }
      toast.success('Account created. Sign in to continue.');
      router.push('/login');
    } catch {
      toast.error('Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-100 to-white px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>CleanOps — sign up with Supabase Auth.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Account type</Label>
              <select
                id="role"
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                value={role}
                onChange={(e) => setRole(e.target.value as 'customer' | 'employee')}
              >
                <option value="customer">Customer</option>
                <option value="employee">Employee</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min 6 characters"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating…' : 'Sign up'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account? <Link href="/login" className="text-sky-600 hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
