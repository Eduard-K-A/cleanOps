"use client";
import { useEffect, useState } from 'react';
import { api } from '@root/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const router = useRouter();

  // Basic Auth Check
  useEffect(() => {
    if (!localStorage.getItem('adminToken')) router.push('/admin/login');
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const res = await api.get('/orders'); // Get all orders
    setOrders(res.data);
  };

  const handleAction = async (id: string, action: 'accept' | 'decline') => {
    try {
      await api.post(`/orders/${id}/${action}`);
      toast.success(`Order ${action}ed`);
      fetchOrders();
    } catch (e) {
      toast.error(`Failed to ${action}`);
    }
  };

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold text-blue-900 mb-8">Admin Dashboard</h1>
      
      <div className="grid gap-4">
        {orders.map((order: any) => (
          <div key={order.id} className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
            <div>
              <p className="font-bold text-lg">{order.serviceType}</p>
              <p className="text-gray-600">{order.name} - {order.email}</p>
              <p className="text-sm text-gray-400">Status: 
                <span className={`font-bold ml-1 ${
                  order.status === 'Confirmed' ? 'text-green-600' : 
                  order.status === 'Canceled' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {order.status}
                </span>
              </p>
            </div>
            
            {order.status === 'Pending' && (
              <div className="space-x-2">
                <button 
                  onClick={() => handleAction(order.id, 'accept')}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                  Accept
                </button>
                <button 
                  onClick={() => handleAction(order.id, 'decline')}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                  Decline
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
