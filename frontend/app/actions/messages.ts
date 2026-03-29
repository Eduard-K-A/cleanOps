'use server'
import { createClient } from '@/lib/supabase/server'

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
  const { error } = await supabase.from('messages').insert([
    {
      job_id: jobId,
      sender_id: user.id,
      content,
    },
  ])
  if (error) throw error
}
