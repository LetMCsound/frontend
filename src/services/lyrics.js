import { supabase } from './supabase'

export const lyricsService = {
  async getLyrics({ limit = 50, genre = null, language = null } = {}) {
    let query = supabase
      .from('lyrics')
      .select('*')
      .eq('is_published', true)
      .order('likes', { ascending: false })
      .limit(limit)
    if (genre)    query = query.eq('genre', genre)
    if (language) query = query.eq('language', language)
    return query
  },

  async getLyricById(id) {
    return supabase.from('lyrics').select('*').eq('id', id).single()
  },

  async searchLyrics(query, limit = 20) {
    return supabase
      .from('lyrics')
      .select('*')
      .eq('is_published', true)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,genre.ilike.%${query}%`)
      .limit(limit)
  },

  async createLyric(lyric) {
    return supabase.from('lyrics').insert([lyric]).select().single()
  },

  async updateLyric(id, updates) {
    return supabase.from('lyrics').update(updates).eq('id', id).select().single()
  },

  async uploadCover(file, id) {
    const ext = file.name.split('.').pop()
    const path = `covers/lyric-${id}.${ext}`
    const { error } = await supabase.storage.from('beats-media').upload(path, file, { upsert: true })
    if (error) return { url: null, error }
    const { data } = supabase.storage.from('beats-media').getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  },

  async uploadAudio(file, id) {
    const ext = file.name.split('.').pop()
    const path = `audio/lyric-${id}.${ext}`
    const { error } = await supabase.storage.from('beats-media').upload(path, file, { upsert: true, contentType: file.type })
    if (error) return { url: null, error }
    const { data } = supabase.storage.from('beats-media').getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  }
}
