import { supabase } from './supabase'

export const filmService = {
  async getFilms({ limit = 50, genre = null } = {}) {
    let query = supabase
      .from('film_makers')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (genre) query = query.eq('genre', genre)
    return query
  },

  async searchFilms(q, limit = 20) {
    return supabase
      .from('film_makers')
      .select('*')
      .eq('is_published', true)
      .or(`title.ilike.%${q}%,description.ilike.%${q}%,genre.ilike.%${q}%`)
      .limit(limit)
  },

  async createFilm(film) {
    return supabase.from('film_makers').insert([film]).select().single()
  },

  async updateFilm(id, updates) {
    return supabase.from('film_makers').update(updates).eq('id', id).select().single()
  },

  async incrementViews(id) {
    return supabase.rpc('increment_film_views', { film_id: id })
  },

  async uploadThumbnail(file, id) {
    const ext = file.name.split('.').pop()
    const path = `covers/film-${id}.${ext}`
    const { error } = await supabase.storage
      .from('beats-media')
      .upload(path, file, { upsert: true })
    if (error) return { url: null, error }
    const { data } = supabase.storage.from('beats-media').getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  },

  async uploadVideo(file, id) {
    const ext = file.name.split('.').pop()
    const path = `audio/film-${id}.${ext}`
    const { error } = await supabase.storage
      .from('beats-media')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (error) return { url: null, error }
    const { data } = supabase.storage.from('beats-media').getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  }
}
