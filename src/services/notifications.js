import { supabase } from './supabase'

export const notificationsService = {

  async getNotifications(userId) {
    return supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
  },

  async markAsRead(id) {
    return supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
  },

  async markAllAsRead(userId) {
    return supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
  },

  async createNotification({ userId, type, title, body, conversationId = null }) {
    return supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type,
        title,
        body,
        conversation_id: conversationId
      }])
  },

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
