'use client';

import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  Inbox,
  Settings,
  MoreHorizontal,
  Info,
  ArrowUpRight,
  ArrowDownLeft,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useNotificationStore,
  getNotificationTitle,
  getNotificationDescription,
} from '@/stores/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Notification } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a dollar amount out of the notification description, e.g. "$1,000" */
function parseAmount(description: string): { amount: string; isCredit: boolean; label: string } | null {
  const match = description.match(/\$([\d,]+(?:\.\d{2})?)/);
  if (!match) return null;
  
  // Custom labels based on keywords
  let label = 'Transaction';
  const isCredit = /added|received|deposit/i.test(description) && !/withdrawn/i.test(description);
  
  if (/added|deposit/i.test(description)) label = 'Deposit Success';
  else if (/received/i.test(description)) label = 'Payout Received';
  else if (/released|sent|withdrawn/i.test(description)) label = 'Funds Withdrawn';
  else if (isCredit) label = 'Credit Added';
  else label = 'Funds Reduced';

  return { amount: match[0], isCredit, label };
}

// ---------------------------------------------------------------------------
// NotificationItem
// ---------------------------------------------------------------------------

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

const NotificationItem = ({ notification, onRead, onDismiss }: NotificationItemProps) => {
  const isUnread = !notification.is_read;
  const description = getNotificationDescription(notification);
  const amountData = parseAmount(description);

  return (
    <DropdownMenuItem
      className={cn(
        'group relative flex gap-3 px-4 py-3.5 cursor-pointer outline-none transition-colors duration-150',
        'border-b border-slate-50 last:border-b-0',
        isUnread ? 'bg-blue-50/30 hover:bg-blue-50/60' : 'bg-white hover:bg-slate-50/60',
      )}
      onClick={(e) => {
        if (isUnread) {
          e.preventDefault();
          onRead(notification.id);
        }
      }}
    >
      {/* Left: icon bubble — Blue & White Theme */}
      <div className="shrink-0 mt-0.5">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center border',
            isUnread 
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
              : 'bg-blue-50 text-blue-600 border-blue-100'
          )}
        >
          {amountData ? (
            amountData.isCredit ? (
              <ArrowDownLeft className="w-4 h-4" strokeWidth={2.5} />
            ) : (
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
            )
          ) : (
            <Info className="w-4 h-4" strokeWidth={2.5} />
          )}
        </div>
      </div>

      {/* Right: content */}
      <div className="flex-1 min-w-0 pr-6">
        {/* Row 1 – title + timestamp */}
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              'text-sm leading-snug',
              isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-600',
            )}
          >
            {getNotificationTitle(notification)}
          </span>
          <span className="shrink-0 text-[10px] font-medium text-slate-400 whitespace-nowrap mt-px bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Row 2 – description */}
        <p className={cn(
          "mt-0.5 text-xs line-clamp-2 leading-relaxed",
          isUnread ? "text-slate-700" : "text-slate-500"
        )}>
          {description}
        </p>

        {/* Row 3 – amount badge — Professional Blue Labels */}
        {amountData && (
          <div className="flex items-center gap-2 mt-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border',
                amountData.isCredit
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200',
              )}
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  amountData.isCredit ? 'bg-blue-600 shadow-[0_0_4px_rgba(37,99,235,0.4)]' : 'bg-slate-400',
                )}
              />
              {amountData.label}: {amountData.amount}
            </span>
          </div>
        )}
      </div>

      {/* Dismiss Action */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss(notification.id);
        }}
        className="absolute right-2 top-2 p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
        title="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
      )}
    </DropdownMenuItem>
  );
};

// ---------------------------------------------------------------------------
// NotificationPopover
// ---------------------------------------------------------------------------

export function NotificationPopover() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    loading,
  } = useNotificationStore();

  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMarkingAllRead) return;
    setIsMarkingAllRead(true);
    try {
      await markAllAsRead();
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  return (
    <DropdownMenu modal={false}>
      {/* ── Trigger ── */}
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-blue-50 transition-all duration-300 relative focus:outline-none group active:scale-95"
          aria-label="Notifications"
        >
          <Bell size={20} className="text-slate-500 group-hover:text-blue-600 transition-colors duration-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in duration-300">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      {/* ── Panel ── */}
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 bg-white border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between bg-white border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Activity</h3>
            <p className="text-[11px] font-medium mt-px">
              {unreadCount > 0 ? (
                <span className="text-blue-600">{unreadCount} new updates</span>
              ) : (
                <span className="text-slate-400 font-normal italic">All caught up</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllRead}
                className="h-8 px-3 text-[11px] font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-50 rounded-lg transition-all flex items-center gap-1.5 border border-transparent hover:border-blue-100"
              >
                {isMarkingAllRead ? (
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                Mark all read
              </button>
            )}
            <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable list */}
        <div
          className="max-h-[440px] overflow-y-auto bg-white custom-scrollbar"
        >
          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: #e2e8f0;
              border-radius: 99px;
            }
          `}</style>

          {loading && notifications.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Updating...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-20 px-8 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner">
                <Inbox className="w-8 h-8 text-blue-200" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 tracking-tight">Nothing here yet</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-[200px] mx-auto">
                  When you have new activity, it will show up here.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onRead={markAsRead}
                  onDismiss={dismissNotification}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50/50 border-t border-slate-100">
          <button className="w-full py-2.5 text-[10px] font-black text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] border border-transparent hover:border-slate-200 hover:shadow-sm">
            <MoreHorizontal className="w-4 h-4" />
            Activity History
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
