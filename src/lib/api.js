/**
 * Cliente HTTP unificado para el backend LetMCsound API.
 *
 * - Lee la URL del backend desde VITE_API_URL (.env)
 * - Adjunta automáticamente el JWT de Supabase si hay sesión
 * - Devuelve { data, error } al estilo Supabase para mantener compatibilidad
 *   con los consumidores existentes (vistas, composables, stores)
 */
import { supabase } from '@/services/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Realiza una petición al backend.
 * @param {string} path     Ruta relativa (ej: '/beats', '/auth/login')
 * @param {object} options  Opciones fetch + { body, params, auth }
 * @returns {Promise<{data, error}>}
 */
async function request(path, options = {}) {
  const {
    method = 'GET',
    body = null,
    params = null,
    auth = false,
    headers: extraHeaders = {},
    raw = false        // si true → devuelve la Response cruda (para PDFs, blobs...)
  } = options

  // Query string
  let url = `${API_URL}/api${path}`
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
    ).toString()
    if (qs) url += `?${qs}`
  }

  // Headers
  const headers = { 'Content-Type': 'application/json', ...extraHeaders }

  // Auth: adjuntar JWT si la ruta lo requiere o si hay sesión
  if (auth) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
    }
  }

  const config = { method, headers }
  if (body) config.body = JSON.stringify(body)

  try {
    const response = await fetch(url, config)

    if (raw) return { data: response, error: null }

    // 204 No Content
    if (response.status === 204) return { data: null, error: null }

    const json = await response.json()
    if (!response.ok) {
      return { data: null, error: { status: response.status, message: json.error || 'Error', details: json.details } }
    }
    return { data: json, error: null }
  } catch (err) {
    return { data: null, error: { message: err.message || 'Error de red' } }
  }
}

export const api = {
  get:    (path, opts = {}) => request(path, { ...opts, method: 'GET' }),
  post:   (path, body, opts = {}) => request(path, { ...opts, method: 'POST',   body }),
  put:    (path, body, opts = {}) => request(path, { ...opts, method: 'PUT',    body }),
  delete: (path, opts = {})       => request(path, { ...opts, method: 'DELETE' })
}

export { API_URL }
