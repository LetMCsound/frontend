import { supabase } from './supabase'

export const commentsService = {
  async getComments(contentId, contentType) {
    return supabase
      .from('comments')
      .select('*')
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .order('created_at', { ascending: true })
  },

  async addComment({ userId, userName, contentId, contentType, text }) {
    return supabase
      .from('comments')
      .insert([{ user_id: userId, user_name: userName, content_id: contentId, content_type: contentType, text }])
      .select()
      .single()
  },

  async deleteComment(id) {
    return supabase.from('comments').delete().eq('id', id)
  },

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
