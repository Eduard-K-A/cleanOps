'use client'

import { useEffect, useState, useRef } from 'react'
import { useJobMessages } from '@/hooks/realtime/useJobMessages'
import { sendMessage } from '@/app/actions/messages'
import { format } from 'date-fns'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

interface MessageThreadProps {
  jobId: string
  otherPartyName: string
  jobAddress: string
  currentUserId: string
  onMarkRead: (jobId: string) => void
}

export function MessageThread({
  jobId,
  otherPartyName,
  jobAddress,
  currentUserId,
  onMarkRead,
}: MessageThreadProps) {
  const [messageContent, setMessageContent] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, loading } = useJobMessages(jobId)

  // Mark thread as read on mount and when new messages arrive
  useEffect(() => {
    onMarkRead(jobId)
  }, [jobId, messages, onMarkRead])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!messageContent.trim()) return

    setSending(true)
    try {
      await sendMessage(jobId, messageContent)
      setMessageContent('')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div
      className="flex flex-col h-full rounded-lg shadow-md"
      style={{
        backgroundColor: 'var(--md-surface)',
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 border-b"
        style={{
          borderColor: 'var(--md-divider)',
        }}
      >
        <h3
          className="font-semibold text-lg"
          style={{ color: 'var(--md-on-surface)' }}
        >
          {otherPartyName}
        </h3>
        <p
          className="text-sm"
          style={{ color: 'var(--md-on-surface-muted)' }}
        >
          {jobAddress}
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p
              className="text-sm"
              style={{ color: 'var(--md-on-surface-muted)' }}
            >
              Send the first message to coordinate the job.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === currentUserId
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'rounded-br-none'
                      : 'rounded-bl-none'
                  }`}
                  style={{
                    backgroundColor: isOwn
                      ? 'var(--md-primary-500)'
                      : 'var(--md-surface-variant)',
                    color: isOwn
                      ? 'var(--md-on-primary)'
                      : 'var(--md-on-surface)',
                  }}
                >
                  {!isOwn && (
                    <p
                      className="text-xs font-semibold mb-1"
                      style={{
                        color: 'var(--md-on-surface-muted)',
                      }}
                    >
                      {otherPartyName}
                    </p>
                  )}
                  <p className="text-sm break-words">{message.content}</p>
                  <p
                    className="text-xs mt-1 opacity-70"
                  >
                    {format(new Date(message.created_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        className="border-t p-4"
        style={{
          borderColor: 'var(--md-divider)',
        }}
      >
        <div className="flex gap-2">
          <textarea
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message... (Shift+Enter for new line)"
            className="flex-1 px-4 py-2 rounded-lg border resize-none focus:outline-none focus:ring-2"
            style={{
              borderColor: 'var(--md-divider)',
              backgroundColor: 'var(--md-background)',
              color: 'var(--md-on-surface)',
              '--tw-ring-color': 'var(--md-primary-500)',
            } as React.CSSProperties}
            rows={3}
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={sending || !messageContent.trim()}
            className="h-auto"
            style={{
              backgroundColor: sending ? 'var(--md-primary-200)' : 'var(--md-primary-500)',
              color: sending ? 'var(--md-on-primary-container)' : 'var(--md-on-primary)',
            }}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
