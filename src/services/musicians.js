import { api } from '@/lib/api'

/**
 * Queries de músicos — llaman al backend LetMCsound API.
 */
export const musiciansService = {
  async getMusicians({ limit = 50, category = null, location = null } = {}) {
    return api.get('/musicians', { params: { limit, category, location } })
  },

  async getMusicianBySlug(slug) {
    return api.get(`/musicians/slug/${slug}`)
  },

  async getMusicianById(id) {
    return api.get(`/musicians/${id}`)
  },

  async getMyProfile() {
    return api.get('/musicians/me', { auth: true })
  },

  async updateMusician(id, updates) {
    return api.put(`/musicians/${id}`, updates, { auth: true })
  },

  async searchMusicians(query, limit = 20) {
    return api.get('/musicians/search', { params: { q: query, limit } })
  }
}
