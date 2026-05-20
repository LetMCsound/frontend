import { api } from '@/lib/api'
import { supabase } from './supabase'

/**
 * Service de comentarios — CRUD via backend, realtime via Supabase directo.
 */
export const commentsService = {
  async getComments(contentId, contentType) {
    return api.get('/comments', { params: { contentId, contentType } })
  },

  async addComment({ userId, userName, contentId, contentType, text }) {
    return api.post('/comments', { contentId, contentType, text }, { auth: true })
  },

  async deleteComment(id) {
    return api.delete(`/comments/${id}`, { auth: true })
  },

  // ── Realtime: sigue usando Supabase directo (los WebSockets no pueden ir por REST) ──
  subscribe(contentId, contentType, callback) {
    return supabase
      .channel(`comments:${contentId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'comments',
        filter: `content_id=eq.${contentId}`
      }, payload => callback(payload.new))
      .subscribe()
  },

  unsubscribe(channel) {
    if (channel) supabase.removeChannel(channel)
  }
}
