'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/authContext';
import { createClient } from '@/lib/supabase/client';
import { useNotificationStore } from '@/stores/notificationStore';
import { Notification } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

export function NotificationListener() {
  const { user, isLoggedIn } = useAuth();
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const clearNotifications = useNotificationStore((state) => state.clearNotifications);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !user) {
      clearNotifications();
      if (subscriptionRef.current) {
        const supabase = createClient();
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchNotifications();

    const supabase = createClient();

    // Subscribe to notifications for the current user
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New notification received:', payload);
          addNotification(payload.new as Notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Re-fetch on updates (like marking as read from another tab)
          fetchNotifications();
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user, isLoggedIn, fetchNotifications, addNotification, clearNotifications]);

  return null; // Headless component
}
