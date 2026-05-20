import { api } from '@/lib/api'

/**
 * Service de favoritos — llama al backend LetMCsound API.
 * Compatibilidad: mantiene la misma firma de funciones que la versión Supabase.
 */
export const favoritesService = {
  async isFavorite(userId, contentId) {
    const { data } = await api.get(`/favorites/check/${contentId}`, { auth: true })
    return data?.isFavorite ?? false
  },

  async addFavorite(userId, contentId, contentType) {
    return api.post('/favorites', { contentId, contentType }, { auth: true })
  },

  async removeFavorite(userId, contentId) {
    return api.delete(`/favorites/${contentId}`, { auth: true })
  },

  async getMyFavorites(userId, contentType = null) {
    return api.get('/favorites', { params: { contentType }, auth: true })
  }
}
