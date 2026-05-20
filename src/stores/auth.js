import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth, supabase } from '@/services/supabase'

export const useAuthStore = defineStore('auth', () => {
  // ── State ────────────────────────────────────────────────────
  const user = ref(null)
  const session = ref(null)
  const loading = ref(true)

  // ── Getters ──────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!session.value)
  const userEmail = computed(() => user.value?.email ?? '')
  const userDisplayName = computed(() => userEmail.value.split('@')[0])

  // ── Actions ──────────────────────────────────────────────────
  async function init() {
    loading.value = true
    const { session: s } = await auth.getSession()
    session.value = s
    user.value = s?.user ?? null
    loading.value = false

    // Keep store in sync with Supabase auth changes
    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
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
  }

  return {
    user,
    session,
    loading,
    isAuthenticated,
    userEmail,
    userDisplayName,
    init,
    login,
    register,
    logout
  }
})
