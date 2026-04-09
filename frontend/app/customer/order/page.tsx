'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { BookingForm } from '@/components/booking/BookingForm';

export default function OrderPage() {
  return (
    <ProtectedRoute>
      <MainLayout
        title="Request a cleaning"
      >
        <BookingForm />
      </MainLayout>
    </ProtectedRoute>
  );
}
