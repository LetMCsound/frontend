import { api } from '@/lib/api'
import { supabase } from './supabase'

/**
 * Queries de beats — llaman al backend LetMCsound API.
 * Las funciones de upload de archivos siguen usando Supabase Storage directamente
 * porque el backend no expone endpoints de storage (Supabase Storage ya es seguro
 * via RLS).
 *
 * Devuelve { data, error } al estilo Supabase para compatibilidad con los
 * composables y vistas existentes.
 */
export const beatsService = {

  /**
   * Lista pública de beats. Filtros: sellerId, type, genre, limit, orderBy, ascending.
   */
  async getBeats({
    sellerId = null,
    type = null,
    genre = null,
    limit = 50,
    orderBy = 'created_at',
    ascending = false
  } = {}) {
    return api.get('/beats', {
      params: { sellerId, type, genre, limit, orderBy, ascending }
    })
  },

  /**
   * Beats más populares (top by likes).
   */
  async getPopular(limit = 8) {
    return api.get('/beats/popular', { params: { limit } })
  },

  /**
   * Detalle de un beat.
   */
  async getBeatById(id) {
    return api.get(`/beats/${id}`)
  },

  /**
   * Beats de un vendedor concreto. Incluye los no publicados (panel artista).
   */
  async getBeatsBySeller(sellerId) {
    return api.get(`/beats/seller/${sellerId}`)
  },

  /**
   * Crea un nuevo beat. Requiere auth.
   */
  async createBeat(beat) {
    return api.post('/beats', beat, { auth: true })
  },

  /**
   * Actualiza un beat. Requiere auth y ser propietario.
   */
  async updateBeat(id, updates) {
    return api.put(`/beats/${id}`, updates, { auth: true })
  },

  /**
   * Elimina un beat.
   */
  async deleteBeat(id) {
    return api.delete(`/beats/${id}`, { auth: true })
  },

  /**
   * +1 like.
   */
  async incrementLikes(id) {
    return api.post(`/beats/${id}/like`)
  },

  /**
   * +1 play.
   */
  async incrementPlays(id) {
    return api.post(`/beats/${id}/play`)
  },

  /**
   * Búsqueda textual.
   */
  async searchBeats(query, limit = 20) {
    return api.get('/beats/search', { params: { q: query, limit } })
  },

  /**
   * Subir portada — sigue usando Supabase Storage directamente.
   */
  async uploadCover(file, beatId) {
    const ext = file.name.split('.').pop()
    const path = `covers/${beatId}.${ext}`
    const { error } = await supabase.storage
      .from('beats-media')
      .upload(path, file, { upsert: true })
    if (error) return { url: null, error }
    const { data } = supabase.storage.from('beats-media').getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  },

  /**
   * Subir audio preview — sigue usando Supabase Storage directamente.
   */
  async uploadAudio(file, beatId) {
    const ext = file.name.split('.').pop()
    const path = `audio/${beatId}.${ext}`
    const { error } = await supabase.storage
      .from('beats-media')
      .upload(path, file, { upsert: true })
    if (error) return { url: null, error }
    const { data } = supabase.storage.from('beats-media').getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  }
}
