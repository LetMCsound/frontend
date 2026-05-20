import { supabase } from './supabase'

export const graphicService = {
  async getDesigns({ limit = 50, style = null } = {}) {
    let query = supabase
      .from('graphic_design')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (style) query = query.eq('style', style)
    return query
  },

  async searchDesigns(q, limit = 20) {
    return supabase
      .from('graphic_design')
      .select('*')
      .eq('is_published', true)
      .or(`title.ilike.%${q}%,description.ilike.%${q}%,style.ilike.%${q}%`)
      .limit(limit)
  },

  async createDesign(design) {
    return supabase.from('graphic_design').insert([design]).select().single()
  },

  async uploadCover(file, id) {
    const ext = file.name.split('.').pop()
    const path = `covers/graphic-${id}.${ext}`
    const { error } = await supabase.storage
      .from('beats-media')
      .upload(path, file, { upsert: true })
    if (error) return { url: null, error }
    const { data } = supabase.storage.from('beats-media').getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  }
}
