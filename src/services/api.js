/**
 * Servicio centralizado para llamadas al backend REST API
 * Los endpoints de auth y realtime siguen usando Supabase directo
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.188:3000/api'

async function request(endpoint, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || data.error || `Error ${response.status}`)
  }

  return data
}

// Helper para obtener token del localStorage/Supabase
async function getToken() {
  const { supabase } = await import('./supabase')
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token || null
}

export const api = {
  // ── Beats ──────────────────────────────────────────
  async getBeats(params = {}) {
    const query = new URLSearchParams(params).toString()
    return request(`/beats${query ? '?' + query : ''}`)
  },

  async getPopularBeats(limit = 4) {
    return request(`/beats/popular?limit=${limit}`)
  },

  async getBeatsBySeller(sellerId) {
    return request(`/beats/seller/${sellerId}`)
  },

  async searchBeats(q) {
    return request(`/beats/search?q=${encodeURIComponent(q)}`)
  },

  async createBeat(data) {
    const token = await getToken()
    return request('/beats', { method: 'POST', body: JSON.stringify(data) }, token)
  },

  async updateBeat(id, data) {
    const token = await getToken()
    return request(`/beats/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token)
  },

  async deleteBeat(id) {
    const token = await getToken()
    return request(`/beats/${id}`, { method: 'DELETE' }, token)
  },

  async likeBeat(id) {
    return request(`/beats/${id}/like`, { method: 'POST' })
  },

  async playBeat(id) {
    return request(`/beats/${id}/play`, { method: 'POST' })
  },

  // ── Lyrics ─────────────────────────────────────────
  async getLyrics(params = {}) {
    const query = new URLSearchParams(params).toString()
    return request(`/lyrics${query ? '?' + query : ''}`)
  },

  async getLyricsBySeller(sellerId) {
    return request(`/lyrics/seller/${sellerId}`)
  },

  async searchLyrics(q) {
    return request(`/lyrics/search?q=${encodeURIComponent(q)}`)
  },

  async createLyric(data) {
    const token = await getToken()
    return request('/lyrics', { method: 'POST', body: JSON.stringify(data) }, token)
  },

  async updateLyric(id, data) {
    const token = await getToken()
    return request(`/lyrics/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token)
  },

  async deleteLyric(id) {
    const token = await getToken()
    return request(`/lyrics/${id}`, { method: 'DELETE' }, token)
  },

  // ── Musicians ──────────────────────────────────────
  async getMusicians(params = {}) {
    const query = new URLSearchParams(params).toString()
    return request(`/musicians${query ? '?' + query : ''}`)
  },

  async getMusicianBySlug(slug) {
    return request(`/musicians/slug/${slug}`)
  },

  async getMyProfile() {
    const token = await getToken()
    return request('/musicians/me', {}, token)
  },

  async updateMyProfile(data) {
    const token = await getToken()
    const { supabase } = await import('./supabase')
    const { data: { user } } = await supabase.auth.getUser()
    return request(`/musicians/${user.id}`, { method: 'PUT', body: JSON.stringify(data) }, token)
  },

  async searchMusicians(q) {
    return request(`/musicians/search?q=${encodeURIComponent(q)}`)
  },

  // ── Ventas ─────────────────────────────────────────
  async createVenta(data) {
    const token = await getToken()
    return request('/ventas', { method: 'POST', body: JSON.stringify(data) }, token)
  },

  async getMyVentas() {
    const token = await getToken()
    return request('/ventas/me', {}, token)
  },

  // ── Contratos PDF ──────────────────────────────────
  async generarContrato(data) {
    const token = await getToken()
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const response = await fetch(`${supabaseUrl}/functions/v1/generar-contrato`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseKey,
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Error generando contrato')
    }
    return response.blob()
  },
}
