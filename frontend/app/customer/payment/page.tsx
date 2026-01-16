"use client";
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState, Suspense } from 'react';
import toast from 'react-hot-toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/` },
      redirect: "if_required"
    });

    if (error) {
      toast.error(error.message || "Payment Failed");
    } else {
      toast.success("Payment Authorized! Awaiting Admin Confirmation.");
      // Redirect to home or success page
      window.location.href = '/';
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <PaymentElement />
      <button disabled={!stripe || loading} className="w-full mt-4 bg-blue-600 text-white p-3 rounded">
        {loading ? 'Processing...' : 'Authorize Payment'}
      </button>
    </form>
  );
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const clientSecret = searchParams.get('clientSecret');

  if (!clientSecret) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded">
        <div className="text-center text-red-600 font-semibold">Invalid Payment Session</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded">
      <h2 className="text-xl font-bold mb-4">Complete Payment</h2>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm />
      </Elements>
    </div>
  );
}

function PaymentLoadingFallback() {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
        <p className="text-gray-600 font-medium">Loading payment form...</p>
      </div>
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