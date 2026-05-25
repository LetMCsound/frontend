import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth, supabase } from '@/services/supabase'

export const useAuthStore = defineStore('auth', () => {
  // ── State ────────────────────────────────────────────────────
  const user = ref(null)
  const session = ref(null)
  const loading = ref(true)
  const avatarUrl = ref(null)    // foto de perfil del musician
  const displayName = ref(null)  // nombre artístico del musician

  // ── Getters ──────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!session.value)
  const userEmail = computed(() => user.value?.email ?? '')
  const userDisplayName = computed(() => displayName.value || userEmail.value.split('@')[0])

  // Carga los datos básicos del perfil musician (avatar + nombre)
  async function loadMusicianProfile() {
    if (!user.value) return
    try {
      const { data } = await supabase
        .from('musicians')
        .select('name, avatar_url')
        .eq('user_id', user.value.id)
        .maybeSingle()
      if (data) {
        avatarUrl.value  = data.avatar_url || null
        displayName.value = data.name || null
      }
    } catch { /* silencioso */ }
  }

  // ── Actions ──────────────────────────────────────────────────
  async function init() {
    loading.value = true
    const { session: s } = await auth.getSession()
    session.value = s
    user.value = s?.user ?? null
    loading.value = false
    if (user.value) loadMusicianProfile()

    // Keep store in sync with Supabase auth changes
    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
      if (newSession?.user) loadMusicianProfile()
      else { avatarUrl.value = null; displayName.value = null }
    })
  }

  async function login(email, password) {
    const { data, error } = await auth.signIn(email, password)
    if (error) throw error
    session.value = data.session
    user.value = data.user
    return data
  }

  async function register(email, password) {
    const { data, error } = await auth.signUp(email, password)
    if (error) throw error
    return data
  }

  async function logout() {
    await auth.signOut()
    session.value = null
    user.value = null
    avatarUrl.value = null
    displayName.value = null
  }

  return {
    user,
    session,
    loading,
    isAuthenticated,
    userEmail,
    userDisplayName,
    avatarUrl,
    displayName,
    loadMusicianProfile,
    init,
    login,
    register,
    logout
  }
})
