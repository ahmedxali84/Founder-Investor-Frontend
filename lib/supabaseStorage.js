import { supabase } from './supabaseClient.js'

const BUCKET = 'pitch-screenshots'

/**
 * Uploads an MVP screenshot to the `pitch-screenshots` bucket (see the SQL
 * migration in frontend/supabase/schema.sql — the bucket must exist there
 * first) and returns its public URL.
 */
export async function uploadPitchScreenshot(file, userId) {
  if (!supabase) throw new Error('Supabase is not configured.')
  if (!file) return null

  const ext = file.name.split('.').pop() || 'png'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
