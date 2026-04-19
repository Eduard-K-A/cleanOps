import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { Notification } from '@/types';
import { toast } from 'sonner';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  setNotifications: (notifications: Notification[]) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const notifications = data as Notification[];
      const unreadCount = notifications.filter(n => !n.is_read).length;

      set({ notifications, unreadCount, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, loading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      const supabase = createClient();
      // Use any cast if standard typing fails due to SDK complexity
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      set((state) => {
        const updatedNotifications = state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        );
        return {
          notifications: updatedNotifications,
          unreadCount: updatedNotifications.filter(n => !n.is_read).length,
        };
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase as any)
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => {
      // Check if it already exists to avoid duplicates (Supabase might send insert event twice in some rare cases)
      if (state.notifications.some(n => n.id === notification.id)) return state;
      
      const updatedNotifications = [notification, ...state.notifications].slice(0, 50);
      
      // Trigger toast for new notification
      if (!notification.is_read) {
        toast(getNotificationTitle(notification), {
          description: getNotificationDescription(notification),
          action: {
            label: 'View',
            onClick: () => {
              // Navigation logic could go here
              get().markAsRead(notification.id);
            },
          },
        });
      }

      return {
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.is_read).length,
      };
    });
  },

  setNotifications: (notifications: Notification[]) => {
    set({
      notifications,
      unreadCount: notifications.filter(n => !n.is_read).length,
    });
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));

// Helper functions for Toast content
function getNotificationTitle(notification: Notification): string {
  switch (notification.type) {
    case 'money_added': return 'Balance Updated';
    case 'job_claimed': return 'Job Claimed';
    case 'job_completed': return 'Job Completed';
    case 'payout_received': return 'Payout Received';
    case 'payout_sent': return 'Payout Sent';
    case 'MESSAGE_RECEIVED': return 'New Message';
    case 'JOB_REPORTED': return 'Job Reported';
    case 'new_job_nearby': return 'New Job Nearby';
    default: return 'New Notification';
  }
}

function getNotificationDescription(notification: Notification): string {
  const { payload } = notification;
  switch (notification.type) {
    case 'money_added': return `$${payload.amount} has been added to your balance.`;
    case 'job_claimed': return `Your job has been claimed by a professional.`;
    case 'job_completed': return `Cleaning job has been marked as completed.`;
    case 'payout_received': return `You received a payout of $${payload.amount}.`;
    case 'payout_sent': return `Payment of $${payload.amount} has been released.`;
    case 'MESSAGE_RECEIVED': return `You have a new message regarding a job.`;
    case 'JOB_REPORTED': return `A new issue has been reported: ${payload.reason}`;
    case 'new_job_nearby': return `A new cleaning job is available in your area!`;
    default: return 'You have a new update in CleanOps.';
  }
}
