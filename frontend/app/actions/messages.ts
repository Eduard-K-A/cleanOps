'use server'
import { createClient } from '@/lib/supabase/server'
import type { Conversation, Message } from '@/types'

export async function getMessages(jobId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('messages')
    .select('*, profiles(full_name)')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function sendMessage(jobId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // @ts-expect-error - Supabase SDK type limitation, runtime is valid
  const { data, error } = await supabase.from('messages').insert([
    {
      job_id: jobId,
      sender_id: user.id,
      content,
    },
  ]).select().single()
  
  if (error) throw error
  return data
}

export async function getConversations(): Promise<Conversation[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get all jobs where user is a participant and job is claimed
  const { data: jobsData, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .or(`customer_id.eq.${user.id},worker_id.eq.${user.id}`)
    .not('worker_id', 'is', null)
    .order('updated_at', { ascending: false })

  if (jobsError) throw jobsError

  // Type the jobs array properly
  const jobs = (jobsData as any[] || []) as Array<any>

  // For each job, fetch last message and unread count
  const conversations: Conversation[] = []
  
  for (const job of jobs) {
    // Get last message
    const { data: lastMessageData } = await supabase
      .from('messages')
      .select('*')
      .eq('job_id', job.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get unread count (messages from other party)
    const { count: unreadCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', job.id)
      .eq('is_read', false)
      .neq('sender_id', user.id)

    conversations.push({
      job: {
        ...job,
        customer_profile: { id: job.customer_id, full_name: job.customer_name },
        worker_profile: { id: job.worker_id, full_name: job.worker_name },
      },
      last_message: lastMessageData as Message | null,
      unread_count: unreadCount || 0,
    } as Conversation)
  }

  return conversations.sort((a, b) => {
    const timeA = a.last_message?.created_at ? new Date(a.last_message.created_at).getTime() : 0
    const timeB = b.last_message?.created_at ? new Date(b.last_message.created_at).getTime() : 0
    return timeB - timeA
  })
}

export async function markThreadRead(jobId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Mark all messages in this thread as read for the current user (sender_id != user.id)
  const { error } = await (supabase.from('messages') as any)
    .update({ is_read: true })
    .eq('job_id', jobId)
    .eq('is_read', false)
    .neq('sender_id', user.id)

  if (error) throw error
}
