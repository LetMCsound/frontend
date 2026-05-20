import { api } from '@/lib/api'
import { supabase } from './supabase'

/**
 * Service de notificaciones — CRUD via backend, realtime via Supabase directo.
 */
export const notificationsService = {
  async getNotifications(userId) {
    return api.get('/notifications', { auth: true })
  },

  async markAsRead(id) {
    return api.patch(`/notifications/${id}/read`, null, { auth: true })
  },

  async markAllAsRead(userId) {
    return api.patch('/notifications/read-all', null, { auth: true })
  },

  async createNotification({ userId, type, title, body, conversationId = null }) {
    return api.post('/notifications', { userId, type, title, body, conversationId }, { auth: true })
  },

  // ── Realtime: sigue usando Supabase directo ──
  subscribeToNotifications(userId, callback) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => callback(payload.new)
      )
      .subscribe()
  },

  unsubscribe(channel) {
    if (channel) supabase.removeChannel(channel)
  }
}
