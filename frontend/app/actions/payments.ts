'use server'
import { createClient } from '@/lib/supabase/server'

export async function addMoney(amount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.rpc('add_money', {
    user_id: user.id,
    amount,
  } as any)
  if (error) throw error
}

export async function getBalance() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase.from('profiles')
    .select('money_balance').eq('id', user.id).single()
  if (error) throw error
  return (data as any)?.money_balance ?? 0
}
