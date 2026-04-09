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

export async function withdrawMoney(amount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (amount <= 0) throw new Error('Amount must be greater than zero')

  // Fetch current balance first to give a clear error message
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('money_balance')
    .eq('id', user.id)
    .single()

  if (fetchError || !profile) throw new Error('Failed to fetch balance')

  const balance = (profile as any).money_balance ?? 0
  if (amount > balance) {
    throw new Error(`Insufficient balance. Available: $${Number(balance).toFixed(2)}`)
  }

  const { error } = await supabase.rpc('add_money', {
    user_id: user.id,
    amount: -amount, // negative = deduct
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
