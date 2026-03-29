'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: { email: string; password: string; fullName: string; role: 'customer' | 'employee' }) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
  })
  if (error) throw error
  if (data.user) {
    // @ts-expect-error - Supabase SDK type limitation, runtime is valid
    const { error: insertError } = await supabase.from('profiles').insert([
      {
        id: data.user.id,
        full_name: formData.fullName,
        role: formData.role,
      },
    ])
    if (insertError) throw insertError
  }
  redirect('/dashboard')
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
