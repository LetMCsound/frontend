<script setup>
import { ref, computed, onMounted } from 'vue'
import { lyricsService } from '@/services/lyrics'
import { chatService } from '@/services/chat'
import SearchBar from '@/components/ui/SearchBar.vue'
import StateDisplay from '@/components/ui/StateDisplay.vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import LyricDetailModal from '@/modules/lyrics/components/LyricDetailModal.vue'
import NewLyricForm from '@/modules/lyrics/components/NewLyricForm.vue'
import ChatWindow from '@/modules/chat/components/ChatWindow.vue'

const authStore = useAuthStore()
const router = useRouter()
const lyrics = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const activeFilter = ref(null)
const selectedLyric = ref(null)
const showNewForm = ref(false)
const activeConv = ref(null)

const langFilters = [
  { label: 'Todos',     value: null  },
  { label: '🇪🇸 Español', value: 'es' },
  { label: '🇬🇧 English', value: 'en' },
  { label: '🇧🇷 Português',value: 'pt' },
]

const genreFilters = ['R&B','Trap','Drill','Pop','Funk Carioca','Reggaeton','Hip-Hop']
const activeGenre = ref(null)

const displayed = computed(() => {
  let list = lyrics.value
  if (activeFilter.value) list = list.filter(l => l.language === activeFilter.value)
  if (activeGenre.value)  list = list.filter(l => l.genre?.toLowerCase().includes(activeGenre.value.toLowerCase()))
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(l =>
      l.title?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      l.seller_name?.toLowerCase().includes(q)
    )
  }
  return list
})

function formatLikes(n) {
  if (!n) return '0'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0','') + 'k'
  return String(n)
}

function langFlag(code) {
  const flags = { es: '🇪🇸', en: '🇬🇧', pt: '🇧🇷', fr: '🇫🇷' }
  return flags[code] || '🌐'
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const { data, error: err } = await lyricsService.getLyrics()
    if (err) throw err
    lyrics.value = data ?? []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function contactar(lyric) {
  if (!authStore.isAuthenticated) { router.push('/profile'); return }
  if (!lyric.seller_id) { alert('No se puede contactar a este compositor'); return }
  if (authStore.user.id === lyric.seller_id) { alert('No puedes contactarte a ti mismo'); return }
  try {
    const { data } = await chatService.getOrCreateConversation({
      buyerId:      authStore.user.id,
      sellerId:     lyric.seller_id,
      buyerName:    authStore.userDisplayName,
      sellerName:   lyric.seller_name,
      productId:    lyric.id,
      productType:  'lyric',
      productTitle: lyric.title
    })
    selectedLyric.value = null
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
  <div class="lyrics-page">
    <div class="page-header">
      <div class="header-text">
        <h1>Lyrics</h1>
        <p>Portfolio de compositores y letristas</p>
      </div>
      <div class="header-actions">
        <span class="stat-pill" v-if="lyrics.length">
          <i class="ri-folder-music-fill"></i> {{ lyrics.length }} canciones
        </span>
        <button v-if="authStore.isAuthenticated" class="btn-add" @click="showNewForm = true">
          <i class="ri-add-fill"></i> Publicar canción
        </button>
        <button v-else class="btn-add outline" @click="router.push('/profile')">
          <i class="ri-login-box-fill"></i> Inicia sesión para publicar
        </button>
      </div>
    </div>

    <SearchBar
      v-model="searchQuery"
      v-model:activeFilter="activeFilter"
      placeholder="Buscar canciones, compositores, géneros..."
      :filters="langFilters"
      @search="q => searchQuery = q"
    />

    <div class="genre-chips">
      <button
        v-for="g in genreFilters" :key="g"
        :class="['genre-chip', { active: activeGenre === g }]"
        @click="activeGenre = activeGenre === g ? null : g"
      >{{ g }}</button>
    </div>

    <StateDisplay
      :loading="loading"
      :error="error"
      :empty="!loading && !error && displayed.length === 0"
      empty-msg="No hay canciones publicadas aún."
      @retry="load"
    />

    <!-- Grid de canciones -->
    <div v-if="!loading && !error && displayed.length" class="lyrics-grid">
      <div
        v-for="lyric in displayed"
        :key="lyric.id"
        class="lyric-card"
        @click="selectedLyric = lyric"
      >
        <!-- Portada -->
        <div class="lyric-cover-wrap">
          <img
            :src="lyric.cover_url || '/assets/letmc.png'"
            :alt="lyric.title"
            class="lyric-cover-img"
          />
          <!-- Audio indicator -->
          <div v-if="lyric.audio_url" class="audio-badge">
            <i class="ri-headphone-fill"></i>
          </div>
          <div class="lyric-hover-overlay">
            <i class="ri-eye-line"></i>
          </div>
        </div>

        <!-- Info -->
        <div class="lyric-card-info">
          <div class="lyric-top-row">
            <h3>{{ lyric.title }}</h3>
            <span class="lang-flag">{{ langFlag(lyric.language) }}</span>
          </div>
          <p class="lyric-composer">
            <i class="ri-user-fill"></i> {{ lyric.seller_name }}
          </p>
          <div class="lyric-bottom-row">
            <span class="lyric-genre" v-if="lyric.genre">{{ lyric.genre }}</span>
            <span class="lyric-likes"><i class="ri-heart-fill"></i> {{ formatLikes(lyric.likes) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <Teleport to="body">
      <LyricDetailModal
        v-if="selectedLyric"
        :lyric="selectedLyric"
        @close="selectedLyric = null"
        @contact="contactar"
      />
    </Teleport>

    <Teleport to="body">
      <div v-if="showNewForm" class="modal-overlay" @click.self="showNewForm = false">
        <NewLyricForm @close="showNewForm = false" @published="onPublished" />
      </div>
    </Teleport>

    <Teleport to="body">
      <ChatWindow v-if="activeConv" :conversation="activeConv" @close="activeConv = null" />
    </Teleport>
  </div>
</template>

<style scoped>
.lyrics-page { padding: 2rem; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.header-text h1 { font-family: 'Impact', sans-serif; font-size: 2.5rem; color: var(--text, #fff); line-height: 1; margin-bottom: 6px; }
.header-text p { color: var(--text-muted, #888); font-size: 0.95rem; }
.header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.stat-pill { display: flex; align-items: center; gap: 6px; background: var(--accent-light, rgba(177,29,185,0.15)); color: var(--accent, #b11db9); padding: 6px 14px; border-radius: 20px; font-size: 0.82rem; font-weight: 600; }
.btn-add { display: flex; align-items: center; gap: 6px; background: #b11db9; color: #fff; border: none; padding: 8px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-add:hover { background: #9a18a3; }
.btn-add.outline { background: transparent; border: 1px solid #b11db9; color: #b11db9; }
.btn-add.outline:hover { background: var(--accent-light); }

.genre-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 1.5rem; }
.genre-chip { background: var(--bg-card, rgba(255,255,255,0.04)); border: 1px solid var(--border, rgba(255,255,255,0.1)); color: var(--text-muted, #888); padding: 5px 14px; border-radius: 20px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
.genre-chip:hover { border-color: #b11db9; color: var(--text, #fff); }
.genre-chip.active { background: var(--accent-light); border-color: #b11db9; color: #b11db9; font-weight: 600; }

/* Grid */
.lyrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem; }

.lyric-card { background: var(--bg-card, rgba(255,255,255,0.04)); border: 1px solid var(--border, rgba(255,255,255,0.08)); border-radius: 14px; overflow: hidden; cursor: pointer; transition: border-color 0.2s, transform 0.2s; }
.lyric-card:hover { border-color: #b11db9; transform: translateY(-3px); }

.lyric-cover-wrap { position: relative; aspect-ratio: 1; overflow: hidden; }
.lyric-cover-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.lyric-card:hover .lyric-cover-img { transform: scale(1.05); }
.audio-badge { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.7); color: #b11db9; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; }
.lyric-hover-overlay { position: absolute; inset: 0; background: rgba(177,29,185,0.3); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; font-size: 1.8rem; color: #fff; }
.lyric-card:hover .lyric-hover-overlay { opacity: 1; }

.lyric-card-info { padding: 0.75rem; }
.lyric-top-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; margin-bottom: 4px; }
.lyric-top-row h3 { color: var(--text, #fff); font-size: 0.875rem; font-weight: 600; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lang-flag { font-size: 1rem; flex-shrink: 0; }
.lyric-composer { color: var(--text-muted, #888); font-size: 0.75rem; display: flex; align-items: center; gap: 3px; margin-bottom: 6px; }
.lyric-composer i { color: #b11db9; }
.lyric-bottom-row { display: flex; justify-content: space-between; align-items: center; }
.lyric-genre { background: var(--accent-light, rgba(177,29,185,0.15)); color: #b11db9; padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.lyric-likes { color: var(--text-muted, #666); font-size: 0.75rem; display: flex; align-items: center; gap: 3px; }
.lyric-likes i { color: #ff6b6b; font-size: 0.7rem; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); z-index: 3000; display: flex; justify-content: center; align-items: center; padding: 20px; }

@media (max-width: 768px) {
  .lyrics-page { padding: 1rem; }
  .header-text h1 { font-size: 1.8rem; }
  .lyrics-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
}
@media (max-width: 480px) {
  .lyrics-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
