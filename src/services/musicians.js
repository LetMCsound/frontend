import { supabase } from './supabase'

export const musiciansService = {
  async getMusicians({ limit = 50, category = null } = {}) {
    let query = supabase
      .from('musicians')
      .select('*')
      .eq('is_published', true)
      .order('followers', { ascending: false })
      .limit(limit)

    if (category) query = query.contains('categories', [category])
    return query
  },

  async getMusicianBySlug(slug) {
    return supabase
      .from('musicians')
      .select('*')
      .eq('slug', slug)
      .single()
  },

  async searchMusicians(query, limit = 20) {
    return supabase
      .from('musicians')
      .select('*')
      .eq('is_published', true)
      .or(`name.ilike.%${query}%,bio.ilike.%${query}%,location.ilike.%${query}%`)
      .limit(limit)
  }
}
