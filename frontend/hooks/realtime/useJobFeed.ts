import { useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import type { Database } from '../../lib/supabase/database.types'

type Job = Database['public']['Tables']['jobs']['Row']

export function useJobFeed(onNewJob: (job: Job) => void) {
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('job-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'jobs', filter: `status=eq.OPEN` },
        (payload: any) => onNewJob(payload.new as Job)
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [onNewJob])
}
