'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-amber-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Web Signup Disabled</h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          To maintain security and best experience, new registrations are handled exclusively through our platform applications.
        </p>

        <div className="bg-blue-50 rounded-xl p-4 mb-8 flex items-start gap-3 text-left">
          <Smartphone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 font-medium">
            Please use the mobile version of CleanOps to create a new customer or employee account.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/login" className="block w-full">
            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11 rounded-lg">
              Sign in as Admin
            </Button>
          </Link>
          
          <Link href="/homepage" className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors pt-2">
            <ArrowLeft className="w-4 h-4" />
            Back to homepage
          </Link>
        </div>
      </div>
      
      <p className="mt-8 text-xs text-slate-400 uppercase tracking-widest font-semibold">
        CleanOps Management Portal
      </p>
    </div>
  );
}
