import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import type { Database } from '../../lib/supabase/database.types'

type Message = Database['public']['Tables']['messages']['Row']

export function useJobMessages(jobId: string, onMessage?: (msg: Message) => void) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    // Load initial messages
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading messages:', error)
      } else {
        setMessages(data || [])
      }
      setLoading(false)
    }

    loadMessages()

    // Listen for new messages
    const channel = supabase
      .channel(`messages:${jobId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `job_id=eq.${jobId}` },
        (payload: any) => {
          const newMessage = payload.new as Message
          setMessages(prev => [...prev, newMessage])
          onMessage?.(newMessage)
        }
      )
      .subscribe()

    return () => { 
      supabase.removeChannel(channel) 
    }
  }, [jobId, onMessage])

  return { messages, loading }
}
