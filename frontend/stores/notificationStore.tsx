import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { Notification } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Bell, 
  MessageSquare, 
  DollarSign, 
  Briefcase, 
  AlertCircle,
  CheckCircle2,
  MapPin,
  UserPlus
} from 'lucide-react';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: string) => void;
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

  dismissNotification: (id: string) => {
    set((state) => {
      const updatedNotifications = state.notifications.filter((n) => n.id !== id);
      return {
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.is_read).length,
      };
    });
  },

  addNotification: (notification: Notification) => {
    set((state) => {
      // Check if it already exists to avoid duplicates (Supabase might send insert event twice in some rare cases)
      if (state.notifications.some(n => n.id === notification.id)) return state;
      
      const updatedNotifications = [notification, ...state.notifications].slice(0, 50);
      
      // Trigger toast for new notification
      if (!notification.is_read) {
        const skipViewButton = [
          'money_added', 
          'payout_received', 
          'payout_sent'
        ].includes(notification.type);
        
        const iconData = getNotificationIcon(notification.type);

        toast(getNotificationTitle(notification), {
          description: getNotificationDescription(notification),
          icon: <div className={cn("p-1 rounded-md", iconData.bg)}>{iconData.icon}</div>,
          action: skipViewButton ? undefined : {
            label: 'View',
            onClick: () => {
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

// Centralized Notification Content Helpers
export function getNotificationIcon(type: string) {
  switch (type) {
    case 'money_added':
    case 'payout_received':
    case 'payout_sent':
      return {
        icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
        bg: 'bg-emerald-50',
        border: 'border-emerald-100'
      };
    case 'job_claimed':
    case 'APPLICATION_ACCEPTED':
    case 'JOB_CREATED':
      return {
        icon: <CheckCircle2 className="w-5 h-5 text-blue-600" />,
        bg: 'bg-blue-50',
        border: 'border-blue-100'
      };
    case 'job_completed':
      return {
        icon: <Briefcase className="w-5 h-5 text-indigo-600" />,
        bg: 'bg-indigo-50',
        border: 'border-indigo-100'
      };
    case 'MESSAGE_RECEIVED':
      return {
        icon: <MessageSquare className="w-5 h-5 text-purple-600" />,
        bg: 'bg-purple-50',
        border: 'border-purple-100'
      };
    case 'JOB_REPORTED':
    case 'APPLICATION_REJECTED':
    case 'JOB_CANCELLED':
      return {
        icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
        bg: 'bg-rose-50',
        border: 'border-rose-100'
      };
    case 'new_job_nearby':
      return {
        icon: <MapPin className="w-5 h-5 text-amber-600" />,
        bg: 'bg-amber-50',
        border: 'border-amber-100'
      };
    case 'APPLICATION_RECEIVED':
      return {
        icon: <UserPlus className="w-5 h-5 text-cyan-600" />,
        bg: 'bg-cyan-50',
        border: 'border-cyan-100'
      };
    default:
      return {
        icon: <Bell className="w-5 h-5 text-slate-400" />,
        bg: 'bg-slate-50',
        border: 'border-slate-100'
      };
  }
}

export function getNotificationTitle(notification: Notification): string {
  const { payload } = notification;
  const isNegative = payload && typeof payload.amount === 'number' && payload.amount < 0;

  switch (notification.type) {
    case 'money_added': return isNegative ? 'Funds Withdrawn' : 'Balance Updated';
    case 'job_claimed': return 'Job Claimed';
    case 'job_completed': return 'Job Completed';
    case 'payout_received': return 'Payout Received';
    case 'payout_sent': return 'Payout Sent';
    case 'MESSAGE_RECEIVED': return 'New Message';
    case 'JOB_REPORTED': return 'Job Reported';
    case 'new_job_nearby': return 'New Job Nearby';
    case 'APPLICATION_RECEIVED': return 'New Application';
    case 'APPLICATION_ACCEPTED': return 'Application Approved';
    case 'APPLICATION_REJECTED': return 'Application Declined';
    case 'JOB_CREATED': return 'Booking Listed';
    case 'JOB_CANCELLED': return 'Booking Cancelled';
    default: return 'New Notification';
  }
}

export function getNotificationDescription(notification: Notification): string {
  const { payload } = notification;
  const isNegative = payload && typeof payload.amount === 'number' && payload.amount < 0;
  const displayAmount = isNegative ? Math.abs(payload.amount) : payload.amount;

  switch (notification.type) {
    case 'money_added': 
      return isNegative 
        ? `$${displayAmount} has been withdrawn from your balance.`
        : `$${displayAmount} has been added to your balance.`;
    case 'job_claimed': return `Your job has been claimed by a professional.`;
    case 'job_completed': return `Cleaning job has been marked as completed.`;
    case 'payout_received': return `You received a payout of $${payload.amount}.`;
    case 'payout_sent': return `Payment of $${payload.amount} has been released.`;
    case 'MESSAGE_RECEIVED': return `You have a new message regarding a job.`;
    case 'JOB_REPORTED': return `A new issue has been reported: ${payload.reason}`;
    case 'new_job_nearby': return `A new cleaning job is available in your area!`;
    case 'APPLICATION_RECEIVED': return `A professional has applied to your job.`;
    case 'APPLICATION_ACCEPTED': return `Your application for ${payload.location_address || 'a cleaning job'} was approved!`;
    case 'APPLICATION_REJECTED': return `Your application for a job was not selected.`;
    case 'JOB_CREATED': return `Your cleaning job has been successfully listed.`;
    case 'JOB_CANCELLED': return `The cleaning job has been cancelled.`;
    default: return 'You have a new update in CleanOps.';
  }
}
