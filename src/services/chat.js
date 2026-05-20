import { api } from '@/lib/api'
import { supabase } from './supabase'

/**
 * Service de chat — CRUD via backend, realtime via Supabase directo.
 */
export const chatService = {
  // ── Conversations ──
  async getMyConversations(userId) {
    return api.get('/chat/conversations', { auth: true })
  },

  async getOrCreateConversation({ buyerId, sellerId, buyerName, sellerName, productId = null, productType = null, productTitle = null }) {
    return api.post('/chat/conversations', {
      sellerId, sellerName, productId, productType, productTitle
    }, { auth: true })
  },

  async updateConversationStatus(conversationId, status, finalPrice = null) {
    return api.patch(`/chat/conversations/${conversationId}/status`,
      { status, finalPrice }, { auth: true })
  },

  async signContract(conversationId, role) {
    return api.patch(`/chat/conversations/${conversationId}/sign`, { role }, { auth: true })
  },

  // ── Messages ──
  async getMessages(conversationId) {
    return api.get(`/chat/conversations/${conversationId}/messages`, { auth: true })
  },

  async sendMessage({ conversationId, senderId, senderName, content, type = 'text', offerAmount = null }) {
    return api.post(`/chat/conversations/${conversationId}/messages`,
      { content, type, offerAmount }, { auth: true })
  },

  async respondToOffer(messageId, status, conversationId, amount) {
    return api.patch(`/chat/messages/${messageId}/offer`,
      { status, conversationId, amount }, { auth: true })
  },

  // ── Realtime: sigue usando Supabase directo ──
  subscribeToMessages(conversationId, callback) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => callback(payload.new))
      .subscribe()
  },

  subscribeToConversation(conversationId, callback) {
    return supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'conversations',
        filter: `id=eq.${conversationId}`
      }, (payload) => callback(payload.new))
      .subscribe()
  },

  unsubscribe(channel) {
    if (channel) supabase.removeChannel(channel)
  }
}
