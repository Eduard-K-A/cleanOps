'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: {
  email: string
  password: string
  fullName: string
  role: 'customer' | 'employee'
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName,
        role: formData.role,
      }
    }
  })
  if (error) throw error
  if (data.user) {
    // Create profile using service role to bypass RLS
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        full_name: formData.fullName,
        role: formData.role,
      } as any)
    if (profileError) throw profileError
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

export async function createProfile(profileData: {
  id: string
  fullName: string
  role: 'customer' | 'employee'
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: profileData.id,
      full_name: profileData.fullName, 
      role: profileData.role,
    } as any)
    .select()
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true, data }
}
