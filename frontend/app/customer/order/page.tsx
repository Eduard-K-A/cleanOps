"use client";
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { api } from '@root/lib/api';
import toast from 'react-hot-toast';


export default function OrderPage() {
  const { register, handleSubmit } = useForm();
  const router = useRouter();

  const onSubmit = async (data: any) => {
    try {
      // Hardcoding price for demo: $50.00
      const payload = { ...data, amount: 5000 }; 
      const res = await api.post('/orders', payload);
      
      // Redirect to payment with details
      router.push(`/payment?clientSecret=${res.data.clientSecret}&amount=5000`);
    } catch (e) {
      toast.error("Failed to create order");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-black shadow-lg rounded-lg border border-blue-100">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">Book a Cleaning</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input {...register('name')} placeholder="Full Name" className="w-full p-2 border rounded" required />
        <input {...register('email')} type="email" placeholder="Email" className="w-full p-2 border rounded" required />
        <select {...register('serviceType')} className="w-full p-2 border rounded">
          <option value="Home Cleaning">Home Cleaning ($50)</option>
          <option value="Office Cleaning">Office Cleaning ($50)</option>
          <option value="Deep Cleaning">Deep Cleaning ($50)</option>
        </select>
        <input {...register('date')} type="datetime-local" className="w-full p-2 border rounded" required />
        <textarea {...register('address')} placeholder="Address" className="w-full p-2 border rounded" required />
        <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white p-3 rounded font-bold">
          Proceed to Payment
        </button>
      </form>
    </div>
  );
}