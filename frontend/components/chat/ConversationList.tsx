'use client'

import { Conversation } from '@/types'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'
import { MessageCircle } from 'lucide-react'

interface ConversationListProps {
  conversations: Conversation[]
  selectedJobId: string | null
  currentUserId: string
  onSelect: (jobId: string) => void
  loading: boolean
  isEmpty: string
}

export function ConversationList({
  conversations,
  selectedJobId,
  currentUserId,
  onSelect,
  loading,
  isEmpty,
}: ConversationListProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-slate-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <MessageCircle className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-slate-500 text-sm">{isEmpty}</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-200 overflow-y-auto">
      {conversations.map((convo) => {
        const otherPartyName =
          currentUserId === convo.job.customer_id
            ? convo.job.worker_profile?.full_name || 'Unknown Professional'
            : convo.job.customer_profile?.full_name || 'Unknown Customer'

        const isSelected = selectedJobId === convo.job.id
        const lastMessageTime = convo.last_message
          ? formatDistanceToNow(new Date(convo.last_message.created_at), {
              addSuffix: true,
            })
          : ''
        const lastMessagePreview = convo.last_message
          ? convo.last_message.content.substring(0, 40) +
            (convo.last_message.content.length > 40 ? '...' : '')
          : 'No messages yet'

        return (
          <button
            key={convo.job.id}
            onClick={() => onSelect(convo.job.id)}
            className={cn(
              'w-full text-left p-3 transition-colors',
              isSelected
                ? 'bg-slate-100 border-l-4 border-blue-500'
                : 'hover:bg-slate-50'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className="font-medium text-slate-900 truncate"
                    style={{
                      color: 'var(--md-on-surface)',
                    }}
                  >
                    {otherPartyName}
                  </p>
                  {convo.unread_count > 0 && (
                    <span
                      className="px-2 py-0.5 text-xs font-bold text-white rounded-full"
                      style={{
                        backgroundColor: 'var(--md-primary-500)',
                      }}
                    >
                      {convo.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {convo.job.location_address || 'No address'}
                </p>
                <p className="text-sm text-slate-600 truncate mt-1">
                  {lastMessagePreview}
                </p>
              </div>
              <p className="text-xs text-slate-500 shrink-0">{lastMessageTime}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
