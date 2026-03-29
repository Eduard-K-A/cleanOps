import { useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import type { Database } from '../../lib/supabase/database.types'

type Job = Database['public']['Tables']['jobs']['Row']

export function useJobUpdates(jobId: string, onUpdate: (job: Job) => void) {
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`job:${jobId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `id=eq.${jobId}` },
        (payload) => onUpdate(payload.new as Job)
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [jobId, onUpdate])
}
