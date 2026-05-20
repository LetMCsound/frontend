import { supabase } from './supabase'

export const profileService = {

  async getMyProfile(userId) {
    return supabase
      .from('musicians')
      .select('*')
      .eq('user_id', userId)
      .single()
  },

  async updateProfile(userId, updates) {
    return supabase
      .from('musicians')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
  },

  async uploadAvatar(file, userId) {
    const ext = file.name.split('.').pop()
    const path = `avatars/${userId}.${ext}`
    const { error } = await supabase.storage
      .from('beats-media')
      .upload(path, file, { upsert: true })
    if (error) return { url: null, error }
    const { data } = supabase.storage.from('beats-media').getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  },

  async uploadCover(file, userId) {
    const ext = file.name.split('.').pop()
    const path = `covers/profile-${userId}.${ext}`
    const { error } = await supabase.storage
      .from('beats-media')
      .upload(path, file, { upsert: true })
    if (error) return { url: null, error }
    const { data } = supabase.storage.from('beats-media').getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  }
}
