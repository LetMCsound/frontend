import { supabase } from './supabase'

export const favoritesService = {
  async isFavorite(userId, contentId) {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .maybeSingle()
    return !!data
  },

  async addFavorite(userId, contentId, contentType) {
    return supabase
      .from('favorites')
      .insert([{ user_id: userId, content_id: contentId, content_type: contentType }])
  },

  async removeFavorite(userId, contentId) {
    return supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('content_id', contentId)
  },

  async getMyFavorites(userId, contentType = null) {
    let query = supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (contentType) query = query.eq('content_type', contentType)
    return query
  }
}
