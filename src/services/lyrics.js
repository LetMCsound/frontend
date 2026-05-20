import { api } from '@/lib/api'
import { supabase } from './supabase'

/**
 * Queries de lyrics — llaman al backend LetMCsound API.
 * Las funciones de upload siguen usando Supabase Storage directamente.
 */
export const lyricsService = {
  async getLyrics({ limit = 50, genre = null, language = null } = {}) {
    return api.get('/lyrics', { params: { limit, genre, language } })
  },

  async getLyricById(id) {
    return api.get(`/lyrics/${id}`)
  },

  async getLyricsBySeller(sellerId) {
    return api.get(`/lyrics/seller/${sellerId}`)
  },

  async searchLyrics(query, limit = 20) {
    return api.get('/lyrics/search', { params: { q: query, limit } })
  },

  async createLyric(lyric) {
    return api.post('/lyrics', lyric, { auth: true })
  },

  async updateLyric(id, updates) {
    return api.put(`/lyrics/${id}`, updates, { auth: true })
  },

  async deleteLyric(id) {
    return api.delete(`/lyrics/${id}`, { auth: true })
  },

  async uploadCover(file, id) {
    const ext = file.name.split('.').pop()
    const path = `covers/lyric-${id}.${ext}`
    const { error } = await supabase.storage
      .from('beats-media')
      .upload(path, file, { upsert: true })
    if (error) return { url: null, error }
    const { data } = supabase.storage.from('beats-media').getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  },

  async uploadAudio(file, id) {
    const ext = file.name.split('.').pop()
    const path = `audio/lyric-${id}.${ext}`
    const { error } = await supabase.storage
      .from('beats-media')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (error) return { url: null, error }
    const { data } = supabase.storage.from('beats-media').getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  }
}
