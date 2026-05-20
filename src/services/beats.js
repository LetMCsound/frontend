import { supabase } from './supabase'

/**
 * Todas las queries de Supabase relacionadas con beats.
 * Las vistas y composables usan este servicio, nunca llaman
 * a supabase directamente.
 */
export const beatsService = {

  /**
   * Obtener todos los beats publicados.
   * @param {Object} options
   * @param {string} [options.sellerId]  - Filtrar por vendedor
   * @param {string} [options.type]      - 'Beat' | 'Song' | 'Sample'
   * @param {string} [options.genre]     - Filtrar por género
   * @param {number} [options.limit]     - Número máximo de resultados
   * @param {string} [options.orderBy]   - Campo de ordenación
   * @param {boolean}[options.ascending] - Dirección del orden
   */
  async getBeats({
    sellerId = null,
    type = null,
    genre = null,
    limit = 50,
    orderBy = 'created_at',
    ascending = false
  } = {}) {
    let query = supabase
      .from('beats')
      .select('*')
      .eq('is_published', true)
      .order(orderBy, { ascending })
      .limit(limit)

    if (sellerId) query = query.eq('seller_id', sellerId)
    if (type)     query = query.eq('type', type)
    if (genre)    query = query.eq('genre', genre)

    return query
  },

  /**
   * Obtener beats más populares (por likes).
   */
  async getPopular(limit = 8) {
    return supabase
      .from('beats')
      .select('*')
      .eq('is_published', true)
      .order('likes', { ascending: false })
      .limit(limit)
  },

  /**
   * Obtener un beat por su ID.
   */
  async getBeatById(id) {
    return supabase
      .from('beats')
      .select('*')
      .eq('id', id)
      .single()
  },

  /**
   * Obtener todos los beats de un vendedor concreto.
   * Incluye los no publicados (para el panel del artista).
   */
  async getBeatsBySeller(sellerId) {
    return supabase
      .from('beats')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
  },

  /**
   * Crear un nuevo beat.
   */
  async createBeat(beat) {
    return supabase
      .from('beats')
      .insert([beat])
      .select()
      .single()
  },

  /**
   * Actualizar un beat existente.
   */
  async updateBeat(id, updates) {
    return supabase
      .from('beats')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  },

  /**
   * Incrementar el contador de likes de un beat.
   */
  async incrementLikes(id) {
    return supabase.rpc('increment_beat_likes', { beat_id: id })
  },

  /**
   * Incrementar el contador de plays de un beat.
   */
  async incrementPlays(id) {
    return supabase.rpc('increment_beat_plays', { beat_id: id })
  },

  /**
   * Buscar beats por texto (título, descripción, etiquetas).
   */
  async searchBeats(query, limit = 20) {
    return supabase
      .from('beats')
      .select('*')
      .eq('is_published', true)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,genre.ilike.%${query}%`)
      .limit(limit)
  },

  /**
   * Subir una portada a Supabase Storage.
   * Devuelve la URL pública del archivo.
   */
  async uploadCover(file, beatId) {
    const ext = file.name.split('.').pop()
    const path = `covers/${beatId}.${ext}`

    const { error } = await supabase.storage
      .from('beats-media')
      .upload(path, file, { upsert: true })

    if (error) return { url: null, error }

    const { data } = supabase.storage
      .from('beats-media')
      .getPublicUrl(path)

    return { url: data.publicUrl, error: null }
  },

  /**
   * Subir un audio preview a Supabase Storage.
   */
  async uploadAudio(file, beatId) {
    const ext = file.name.split('.').pop()
    const path = `audio/${beatId}.${ext}`

    const { error } = await supabase.storage
      .from('beats-media')
      .upload(path, file, { upsert: true })

    if (error) return { url: null, error }

    const { data } = supabase.storage
      .from('beats-media')
      .getPublicUrl(path)

    return { url: data.publicUrl, error: null }
  }
}
