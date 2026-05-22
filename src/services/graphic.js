import { api } from '@/lib/api'
import { supabase } from './supabase'

/**
 * Service de diseño gráfico — llama al backend LetMCsound API.
 * Uploads siguen usando Supabase Storage directamente.
 */
export const graphicService = {
  async getDesigns({ limit = 50, style = null } = {}) {
    return api.get('/graphics', { params: { limit, style } })
  },

  async searchDesigns(q, limit = 20) {
    return api.get('/graphics/search', { params: { q, limit } })
  },

  async getDesignsBySeller(sellerId) {
    return api.get(`/graphics/seller/${sellerId}`)
  },

  async createDesign(design) {
    return api.post('/graphics', design, { auth: true })
  },

  async updateDesign(id, updates) {
    return api.put(`/graphics/${id}`, updates, { auth: true })
  },

  async deleteDesign(id) {
    return api.delete(`/graphics/${id}`, { auth: true })
  },

  async uploadCover(file, id) {
    const ext = file.name.split('.').pop()
    const path = `covers/graphic-${id}.${ext}`
    const { error } = await supabase.storage.from('beats-media').upload(path, file, { upsert: true })
    if (error) return { url: null, error }
    const { data } = supabase.storage.from('beats-media').getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  }
}
