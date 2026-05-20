import { supabase } from './supabase'

export const chatService = {

  // ── Conversations ────────────────────────────────────────────

  async getMyConversations(userId) {
    return supabase
      .from('conversations')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false })
  },

  async getOrCreateConversation({ buyerId, sellerId, buyerName, sellerName, productId = null, productType = null, productTitle = null }) {
    // Buscar si ya existe una conversación entre estos dos sobre este producto
    let query = supabase
      .from('conversations')
      .select('*')
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId)
      .eq('status', 'open')

    if (productId) query = query.eq('product_id', productId)

    const { data: existing } = await query.limit(1).single()
    if (existing) return { data: existing, error: null }

    // Crear nueva conversación
    return supabase
      .from('conversations')
      .insert([{
        buyer_id: buyerId,
        seller_id: sellerId,
        buyer_name: buyerName,
        seller_name: sellerName,
        product_id: productId,
        product_type: productType,
        product_title: productTitle,
        status: 'open'
      }])
      .select()
      .single()
  },

  async updateConversationStatus(conversationId, status, finalPrice = null) {
    const updates = { status }
    if (finalPrice !== null) updates.final_price = finalPrice
    return supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single()
  },

  async signContract(conversationId, role) {
    // role: 'buyer' | 'seller'
    const field = role === 'buyer' ? 'buyer_signed' : 'seller_signed'
    const { data: conv } = await supabase
      .from('conversations')
      .select('buyer_signed, seller_signed')
      .eq('id', conversationId)
      .single()

    const updates = { [field]: true }
    const otherSigned = role === 'buyer' ? conv?.seller_signed : conv?.buyer_signed
    if (otherSigned) {
      updates.status = 'completed'
      updates.contract_signed_at = new Date().toISOString()
    }

    return supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single()
  },

  // ── Messages ─────────────────────────────────────────────────

  async getMessages(conversationId) {
    return supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
  },

  async sendMessage({ conversationId, senderId, senderName, content, type = 'text', offerAmount = null }) {
    return supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        sender_id: senderId,
        sender_name: senderName,
        content,
        type,
        offer_amount: offerAmount,
        offer_status: type === 'offer' ? 'pending' : null
      }])
      .select()
      .single()
  },

  async respondToOffer(messageId, status, conversationId, amount) {
    // Actualizar estado de la oferta
    await supabase
      .from('messages')
      .update({ offer_status: status })
      .eq('id', messageId)

    // Si se acepta, actualizar la conversación
    if (status === 'accepted') {
      await supabase
        .from('conversations')
        .update({ status: 'accepted', final_price: amount })
        .eq('id', conversationId)
    }
  },

  // ── Realtime ─────────────────────────────────────────────────

  subscribeToMessages(conversationId, callback) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => callback(payload.new)
      )
      .subscribe()
  },

  subscribeToConversation(conversationId, callback) {
    return supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`
        },
        (payload) => callback(payload.new)
      )
      .subscribe()
  },

  unsubscribe(channel) {
    if (channel) supabase.removeChannel(channel)
  }
}
