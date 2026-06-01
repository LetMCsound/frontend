import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const HomeView          = () => import('@/views/HomeView.vue')
const ProfileView       = () => import('@/views/ProfileView.vue')
const PublicProfile     = () => import('@/views/PublicProfileView.vue')
const SoundView         = () => import('@/views/SoundView.vue')
const MusiciansView     = () => import('@/views/MusiciansView.vue')
const LyricsView        = () => import('@/views/LyricsView.vue')
const GraphicDesignView = () => import('@/views/GraphicDesignView.vue')
const FilmMakersView    = () => import('@/views/FilmMakersView.vue')
const ConfigView        = () => import('@/views/ConfigView.vue')
const ChatView          = () => import('@/views/ChatView.vue')
const PresentationView  = () => import('@/views/PresentationView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/',               name: 'home',          component: HomeView },
    { path: '/profile',        name: 'profile',       component: ProfileView },
    { path: '/profile/:slug',  name: 'publicProfile', component: PublicProfile },
    { path: '/sound',          name: 'sound',         component: SoundView },
    { path: '/musicians',      name: 'musicians',     component: MusiciansView },
    { path: '/lyrics',         name: 'lyrics',        component: LyricsView },
    { path: '/graphic-design', name: 'graphic',       component: GraphicDesignView },
    { path: '/film-makers',    name: 'film',          component: FilmMakersView },
    { path: '/chat',           name: 'chat',          component: ChatView,   meta: { requiresAuth: true } },
    { path: '/configuration',  name: 'configuration', component: ConfigView, meta: { requiresAuth: true } },
    { path: '/presentacion',   name: 'presentation',  component: PresentationView, meta: { standalone: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'profile' }
  }
})

export default router
