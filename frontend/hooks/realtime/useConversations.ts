'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getConversations } from '@/app/actions/messages'
import type { Conversation, Message } from '@/types'

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = async () => {
    try {
      const data = await getConversations()
      setConversations(data)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true)
      await refetch()
      setLoading(false)
    }

    loadConversations()

    const supabase = createClient()
    
    // Subscribe to new messages (INSERT)
    const messagesChannel = supabase
      .channel('user-conversations-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: any) => {
          const newMessage = payload.new as Message
          // Update the conversation with the new message
          setConversations(prev => {
            const updated = [...prev]
            const index = updated.findIndex(c => c.job.id === newMessage.job_id)
            if (index !== -1) {
              updated[index].last_message = newMessage
              // Re-sort by last message time
              return updated.sort((a, b) => {
                const timeA = a.last_message?.created_at ? new Date(a.last_message.created_at).getTime() : 0
                const timeB = b.last_message?.created_at ? new Date(b.last_message.created_at).getTime() : 0
                return timeB - timeA
              })
            }
            return updated
          })
        }
      )
      .subscribe()

    // Subscribe to job updates (when worker_id changes)
    const jobsChannel = supabase
      .channel('user-conversations-jobs')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'jobs' },
        (payload: any) => {
          // Refetch conversations when a job is updated (worker_id might change)
          refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(jobsChannel)
    }
  }, [])

  return { conversations, loading, refetch }
}
