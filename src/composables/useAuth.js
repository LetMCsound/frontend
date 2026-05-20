import { reactive } from 'vue'
import { auth, db, supabase } from '@/lib/supabase'

const state = reactive({
  user: null,
  profileNombre: '',
  profileBio: '',
  profileAvatar: '',
  profileBanner: '',
  ready: false,
})

async function loadProfile(userId) {
  try {
    const { data } = await db.getProfile(userId)
    state.profileNombre = data?.nombre || state.user?.email?.split('@')[0] || ''
    state.profileBio = data?.bio || ''
    state.profileAvatar = data?.avatar_url || ''
    state.profileBanner = data?.banner_url || ''
  } catch {
    state.profileNombre = state.user?.email?.split('@')[0] || ''
    state.profileBio = ''
    state.profileAvatar = ''
    state.profileBanner = ''
  }
}

function init() {
  auth.onAuthStateChange((event, session) => {
    if (session) {
      state.user = session.user
      // setTimeout escapa el callback de Supabase antes de hacer peticiones DB
      setTimeout(() => loadProfile(session.user.id), 0)
    } else {
      state.user = null
      state.profileNombre = ''
    }
    state.ready = true
  })
}

export function useAuth() {
  return { state, loadProfile }
}

export { init }
