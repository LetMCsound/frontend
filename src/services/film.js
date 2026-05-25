import { api } from '@/lib/api'
import { supabase } from './supabase'

/**
 * Service de films — llama al backend LetMCsound API.
 * Uploads de archivos siguen usando Supabase Storage directamente.
 */
export const filmService = {
  async getFilms({ limit = 50, genre = null } = {}) {
    return api.get('/films', { params: { limit, genre } })
  },

  async searchFilms(q, limit = 20) {
    return api.get('/films/search', { params: { q, limit } })
  },

  async getFilmById(id) {
    return api.get(`/films/${id}`)
  },

  async getFilmsBySeller(sellerId) {
    return api.get(`/films/seller/${sellerId}`)
  },

  async createFilm(film) {
    return api.post('/films', film, { auth: true })
  },

  async updateFilm(id, updates) {
    return api.put(`/films/${id}`, updates, { auth: true })
  },

  async deleteFilm(id) {
    return api.delete(`/films/${id}`, { auth: true })
  },

  async incrementViews(id) {
    return api.post(`/films/${id}/view`)
  },

  async uploadThumbnail(file, id) {
    const ext = file.name.split('.').pop()
    const path = `covers/film-${id}.${ext}`
    const { error } = await supabase.storage.from('beats-media').upload(path, file, { upsert: true })
    if (error) return { url: null, error }
    const { data } = supabase.storage.from('beats-media').getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  },

  async uploadVideo(file, id) {
    const ext = file.name.split('.').pop()
    const path = `audio/film-${id}.${ext}`
    const { error } = await supabase.storage.from('beats-media').upload(path, file, { upsert: true, contentType: file.type })
    if (error) return { url: null, error }
    const { data } = supabase.storage.from('beats-media').getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  }
}
