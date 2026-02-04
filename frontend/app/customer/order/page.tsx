'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { BookingForm } from '@/components/booking/BookingForm';

export default function OrderPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-linear-to-b from-slate-50 to-white py-8">
        <div className="mx-auto max-w-2xl px-4">
          <h1 className="mb-2 text-2xl font-bold text-slate-900">Request a cleaning</h1>
          <p className="mb-6 text-slate-600">
            Size, location, urgency — then authorize payment. Funds are held in escrow until you approve.
          </p>
          <BookingForm />
        </div>
      </main>
    </ProtectedRoute>
  );
}
