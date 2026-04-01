'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { BookingForm } from '@/components/booking/BookingForm';

export default function OrderPage() {
  return (
    <ProtectedRoute>
      <MainLayout
        title="Request a cleaning"
        subtitle="Size, location, urgency — then authorize payment. Funds are held in escrow until you approve."
        breadcrumb="Service Booking"
      >
        <BookingForm />
      </MainLayout>
    </ProtectedRoute>
  );
}
