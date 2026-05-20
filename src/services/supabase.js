import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Auth helpers ─────────────────────────────────────────────
export const auth = {
  async signUp(email, password) {
    return supabase.auth.signUp({ email, password })
  },
  async signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  },
  async signOut() {
    return supabase.auth.signOut()
  },
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// ── Database helpers ─────────────────────────────────────────
export const db = {
  async insertVenta(venta) {
    return supabase.from('ventas').insert([venta]).select()
  },
  async getVentas(userId) {
    return supabase
      .from('ventas')
      .select('*')
      .eq('comprador', userId)
      .order('created_at', { ascending: false })
  },
  async updateProfile(userId, updates) {
    return supabase.from('usuarios').update(updates).eq('id', userId).select()
  }
}
