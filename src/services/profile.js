import { api } from '@/lib/api'
import { supabase } from './supabase'

/**
 * Service de perfil — usa /api/musicians/me y /api/musicians/:id.
 * Uploads de avatar/cover siguen usando Supabase Storage.
 */
export const profileService = {
  async getMyProfile(userId) {
    return api.get('/musicians/me', { auth: true })
  },

  async updateProfile(userId, updates) {
    // Obtener primero el id del musician para poder hacer el PUT
    const { data: profile } = await api.get('/musicians/me', { auth: true })
    if (!profile?.id) {
      return { data: null, error: { message: 'Perfil no encontrado. Créalo primero.' } }
    }
    return api.put(`/musicians/${profile.id}`, updates, { auth: true })
  },

  async uploadAvatar(file, userId) {
    const ext = file.name.split('.').pop()
    const path = `avatars/${userId}.${ext}`
    const { error } = await supabase.storage.from('beats-media').upload(path, file, { upsert: true })
    if (error) return { url: null, error }
    const { data } = supabase.storage.from('beats-media').getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  },

  async uploadCover(file, userId) {
    const ext = file.name.split('.').pop()
    const path = `covers/profile-${userId}.${ext}`
    const { error } = await supabase.storage.from('beats-media').upload(path, file, { upsert: true })
    if (error) return { url: null, error }
    const { data } = supabase.storage.from('beats-media').getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  }
}
