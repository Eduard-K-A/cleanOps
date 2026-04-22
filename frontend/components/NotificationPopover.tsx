'use client';

import React from 'react';
import { 
  Bell, 
  CheckCheck, 
  Circle, 
  MessageSquare, 
  DollarSign, 
  Briefcase, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '@/types';
import { cn } from '@/lib/utils';

export function NotificationPopover() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    loading 
  } = useNotificationStore();

  const [isMarkingAllRead, setIsMarkingAllRead] = React.useState(false);

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isMarkingAllRead) return;
    setIsMarkingAllRead(true);
    try {
      await markAllAsRead();
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'money_added':
      case 'payout_received':
      case 'payout_sent':
        return (
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
        );
      case 'job_claimed':
      case 'job_completed':
      case 'new_job_nearby':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
            <Briefcase className="w-5 h-5 text-blue-600" />
          </div>
        );
      case 'MESSAGE_RECEIVED':
        return (
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
            <MessageSquare className="w-5 h-5 text-purple-600" />
          </div>
        );
      case 'JOB_REPORTED':
        return (
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
            <AlertCircle className="w-5 h-5 text-rose-600" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
            <Bell className="w-5 h-5 text-slate-400" />
          </div>
        );
    }
  };

  const getTitle = (notification: Notification): string => {
    switch (notification.type) {
      case 'money_added': return 'Balance Updated';
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
      default: return 'New Notification';
    }
  };

  const getDescription = (notification: Notification): string => {
    const { payload } = notification;
    switch (notification.type) {
      case 'money_added': return `$${payload.amount} added to balance.`;
      case 'job_claimed': return `A professional claimed your job.`;
      case 'job_completed': return `Cleaning job completed successfully.`;
      case 'payout_received': return `Payout of $${payload.amount} received.`;
      case 'payout_sent': return `Payment of $${payload.amount} released.`;
      case 'MESSAGE_RECEIVED': return `New message about your job.`;
      case 'JOB_REPORTED': return `New issue reported: ${payload.reason}`;
      case 'new_job_nearby': return `New cleaning job available nearby!`;
      case 'APPLICATION_RECEIVED': return `A professional applied to your job.`;
      case 'APPLICATION_ACCEPTED': return `Your application for a job was approved!`;
      case 'APPLICATION_REJECTED': return `Your application for a job was not selected.`;
      default: return 'New update available.';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-50 transition-all duration-200 relative focus:outline-none group active:scale-95"
          aria-label="Notifications"
        >
          <Bell size={20} className="text-slate-500 group-hover:text-blue-600 transition-colors" />
          {unreadCount > 0 && (
            <span
              className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in duration-300"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 sm:w-[400px] p-0 bg-white shadow-2xl border border-slate-200/60 rounded-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200"
      >
        <DropdownMenuLabel className="px-5 py-4 flex items-center justify-between bg-slate-50/40 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-slate-800 text-base">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {unreadCount} New
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllRead}
              className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 font-semibold flex items-center gap-1.5 transition-colors group"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{isMarkingAllRead ? 'Marking...' : 'Mark all read'}</span>
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0 bg-slate-100" />
        
        <div className="max-h-[440px] overflow-y-auto custom-scrollbar">
          {loading && notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-10 h-10 text-blue-100 animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-400">Fetching updates...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Bell className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-base font-bold text-slate-800">All caught up!</p>
              <p className="text-sm text-slate-500 mt-1 max-w-[200px] mx-auto">No new notifications at this time.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem 
                key={notif.id}
                className={cn(
                  "px-5 py-4 flex gap-4 cursor-pointer focus:bg-slate-50/80 border-b border-slate-50 last:border-0 transition-colors duration-200 outline-none",
                  !notif.is_read && "bg-blue-50/25"
                )}
                onClick={() => !notif.is_read && markAsRead(notif.id)}
              >
                {getIcon(notif.type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className={cn(
                      "text-sm truncate",
                      !notif.is_read ? "font-bold text-slate-900" : "font-semibold text-slate-600"
                    )}>
                      {getTitle(notif)}
                    </p>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 ml-2">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: false })}
                    </span>
                  </div>
                  <p className={cn(
                    "text-xs line-clamp-2 leading-relaxed",
                    !notif.is_read ? "text-slate-700" : "text-slate-500"
                  )}>
                    {getDescription(notif)}
                  </p>
                  {!notif.is_read && (
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <Circle className="w-1.5 h-1.5 fill-blue-600 text-blue-600 shadow-[0_0_4px_rgba(37,99,235,0.4)]" />
                      <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">Unread</span>
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        
        <DropdownMenuSeparator className="m-0 bg-slate-100" />
        <div className="p-3 bg-white">
          <button className="w-full py-2.5 text-[11px] font-bold text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all uppercase tracking-[0.1em]">
            View Activity History
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
