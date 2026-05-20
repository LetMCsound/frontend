<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { filmService } from '@/services/film'
import { chatService } from '@/services/chat'
import { useRouter } from 'vue-router'
import SearchBar from '@/components/ui/SearchBar.vue'
import StateDisplay from '@/components/ui/StateDisplay.vue'
import ChatWindow from '@/modules/chat/components/ChatWindow.vue'
import NewFilmForm from '@/modules/film/components/NewFilmForm.vue'
import FilmDetailModal from '@/modules/film/components/FilmDetailModal.vue'

const authStore = useAuthStore()
const router = useRouter()

const films = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const activeFilter = ref(null)
const selectedFilm = ref(null)
const activeConv = ref(null)
const showNewForm = ref(false)

const genreFilters = [
  { label: 'Todos',         value: null },
  { label: 'Music Video',   value: 'Music Video' },
  { label: 'Documentary',   value: 'Documentary' },
  { label: 'Short Film',    value: 'Short Film' },
  { label: 'Behind Scenes', value: 'Behind The Scenes' },
]

const displayed = computed(() => {
  let list = films.value
  if (activeFilter.value) list = list.filter(f => f.genre === activeFilter.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(f =>
      f.title?.toLowerCase().includes(q) ||
      f.description?.toLowerCase().includes(q) ||
      f.genre?.toLowerCase().includes(q)
    )
  }
  return list
})

function formatViews(n) {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k'
  return String(n)
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const { data, error: err } = await filmService.getFilms()
    if (err) throw err
    films.value = data ?? []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function contactar(film) {
  if (!authStore.isAuthenticated) { router.push('/profile'); return }
  if (!film.seller_id) { alert('No se puede contactar a este creador'); return }
  if (authStore.user.id === film.seller_id) { alert('No puedes contactarte a ti mismo'); return }
  try {
    const { data } = await chatService.getOrCreateConversation({
      buyerId:      authStore.user.id,
      sellerId:     film.seller_id,
      buyerName:    authStore.userDisplayName,
      sellerName:   film.seller_name,
      productId:    film.id,
      productType:  'film',
      productTitle: film.title
    })
    selectedFilm.value = null
    activeConv.value = data
  } catch (e) {
    alert('Error al iniciar conversación')
  }
}

function onPublished() {
  showNewForm.value = false
  load()
}

onMounted(load)
</script>

<template>
  <div class="film-page">
    <div class="page-header">
      <div class="header-text">
        <h1>Film Makers</h1>
        <p>Videoclips, documentales y contenido visual</p>
      </div>
      <div class="header-actions">
        <span class="stat-pill" v-if="films.length">
          <i class="ri-clapperboard-fill"></i> {{ films.length }} videos
        </span>
        <button v-if="authStore.isAuthenticated" class="btn-add" @click="showNewForm = true">
          <i class="ri-add-fill"></i> Subir video
        </button>
        <button v-else class="btn-add outline" @click="router.push('/profile')">
          <i class="ri-login-box-fill"></i> Inicia sesión para subir
        </button>
      </div>
    </div>

    <SearchBar
      v-model="searchQuery"
      v-model:activeFilter="activeFilter"
      placeholder="Buscar videos, géneros, artistas..."
      :filters="genreFilters"
      @search="q => searchQuery = q"
    />

    <StateDisplay
      :loading="loading"
      :error="error"
      :empty="!loading && !error && displayed.length === 0"
      empty-msg="No hay videos disponibles. ¡Sé el primero en subir uno!"
      @retry="load"
    />

    <!-- Grid estilo YouTube -->
    <div v-if="!loading && !error && displayed.length" class="youtube-grid">
      <div
        v-for="film in displayed"
        :key="film.id"
        class="film-card"
        @click="selectedFilm = film"
      >
        <div class="thumbnail-wrap">
          <img :src="film.thumbnail_url || '/assets/musicians.png'" :alt="film.title" class="thumbnail" />
          <div class="thumb-overlay">
            <div class="play-btn"><i class="ri-play-fill"></i></div>
          </div>
          <span class="duration-badge" v-if="film.duration">{{ film.duration }}</span>
        </div>

        <div class="film-info">
          <div class="film-main">
            <div class="film-avatar">{{ film.seller_name.charAt(0).toUpperCase() }}</div>
            <div class="film-text">
              <h3>{{ film.title }}</h3>
              <p class="film-seller">{{ film.seller_name }}</p>
              <div class="film-meta">
                <span><i class="ri-eye-fill"></i> {{ formatViews(film.views) }}</span>
                <span class="genre-tag">{{ film.genre }}</span>
                <span class="film-price">${{ film.price }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <Teleport to="body">
      <FilmDetailModal
        v-if="selectedFilm"
        :film="selectedFilm"
        @close="selectedFilm = null"
        @contact="contactar"
      />
    </Teleport>

    <Teleport to="body">
      <div v-if="showNewForm" class="modal-overlay" @click.self="showNewForm = false">
        <NewFilmForm @close="showNewForm = false" @published="onPublished" />
      </div>
    </Teleport>

    <Teleport to="body">
      <ChatWindow v-if="activeConv" :conversation="activeConv" @close="activeConv = null" />
    </Teleport>
  </div>
</template>

<style scoped>
.film-page { padding: 2rem; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.header-text h1 { font-family: 'Impact', sans-serif; font-size: 2.5rem; color: var(--text); line-height: 1; margin-bottom: 6px; }
.header-text p { color: #888; font-size: 0.95rem; }
.header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.stat-pill { display: flex; align-items: center; gap: 6px; background: rgba(177,29,185,0.15); color: #b11db9; padding: 6px 14px; border-radius: 20px; font-size: 0.82rem; font-weight: 600; }
.btn-add { display: flex; align-items: center; gap: 6px; background: #b11db9; color: #fff; border: none; padding: 8px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-add:hover { background: #9a18a3; }
.btn-add.outline { background: transparent; border: 1px solid #b11db9; color: #b11db9; }
.btn-add.outline:hover { background: rgba(177,29,185,0.1); }

.youtube-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
.film-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; cursor: pointer; transition: border-color 0.2s, transform 0.2s; }
.film-card:hover { border-color: rgba(177,29,185,0.5); transform: translateY(-3px); }
.thumbnail-wrap { position: relative; aspect-ratio: 16/9; overflow: hidden; background: #0b0b0f; }
.thumbnail { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.film-card:hover .thumbnail { transform: scale(1.04); }
.thumb-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; }
.film-card:hover .thumb-overlay { opacity: 1; }
.play-btn { width: 52px; height: 52px; border-radius: 50%; background: rgba(177,29,185,0.9); display: flex; align-items: center; justify-content: center; }
.play-btn i { font-size: 1.6rem; color: #fff; margin-left: 3px; }
.duration-badge { position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.85); color: #fff; font-size: 0.72rem; font-weight: 600; padding: 2px 7px; border-radius: 4px; }
.film-info { padding: 0.875rem; }
.film-main { display: flex; gap: 10px; }
.film-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #b11db9, #7b2cbf); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
.film-text { flex: 1; min-width: 0; }
.film-text h3 { color: var(--text); font-size: 0.875rem; font-weight: 600; margin-bottom: 3px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.film-seller { color: #888; font-size: 0.75rem; margin-bottom: 4px; }
.film-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.film-meta span { font-size: 0.72rem; color: #666; display: flex; align-items: center; gap: 3px; }
.film-meta i { color: #b11db9; }
.genre-tag { background: rgba(177,29,185,0.15); color: #b11db9; padding: 2px 7px; border-radius: 20px; font-size: 0.68rem; font-weight: 600; }
.film-price { color: #fff !important; font-weight: 700 !important; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); z-index: 3000; display: flex; justify-content: center; align-items: center; padding: 20px; }

@media (max-width: 768px) { .film-page { padding: 1rem; } .youtube-grid { grid-template-columns: 1fr; } }
</style>
