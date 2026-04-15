'use server'

import { createClient } from '@/lib/supabase/server'

interface UploadResult {
  url: string
  path: string
}

export async function uploadProofOfWork(
  jobId: string,
  file: File
): Promise<UploadResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify the user is the worker for this job
  const { data: job, error: jobError } = await (supabase as any)
    .from('jobs')
    .select('worker_id')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found')
  }

  if (job.worker_id !== user.id) {
    throw new Error('You can only upload proof for jobs you are assigned to')
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.')
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.')
  }

  // Generate unique filename
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const extension = file.name.split('.').pop() || 'jpg'
  const fileName = `${timestamp}-${randomString}.${extension}`
  const filePath = `${jobId}/${fileName}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('proof-of-work')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    throw new Error('Failed to upload file')
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('proof-of-work')
    .getPublicUrl(filePath)

  return {
    url: publicUrl,
    path: filePath,
  }
}

export async function deleteProofOfWork(
  filePath: string
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase.storage
    .from('proof-of-work')
    .remove([filePath])

  if (error) {
    console.error('Storage delete error:', error)
    throw new Error('Failed to delete file')
  }
}
