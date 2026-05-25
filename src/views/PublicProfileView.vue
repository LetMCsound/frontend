<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { musiciansService } from '@/services/musicians'
import { useBeats } from '@/composables/useBeats'
import { graphicService } from '@/services/graphic'
import { filmService } from '@/services/film'
import { lyricsService } from '@/services/lyrics'
import { chatService } from '@/services/chat'
import { followsService } from '@/services/follows'
import BeatCard from '@/modules/beats/components/BeatCard.vue'
import BeatModal from '@/modules/beats/components/BeatModal.vue'
import PinDetailModal from '@/modules/graphic/components/PinDetailModal.vue'
import FilmDetailModal from '@/modules/film/components/FilmDetailModal.vue'
import LyricDetailModal from '@/modules/lyrics/components/LyricDetailModal.vue'
import ChatWindow from '@/modules/chat/components/ChatWindow.vue'
import StateDisplay from '@/components/ui/StateDisplay.vue'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()

const musician       = ref(null)
const loading        = ref(true)
const error          = ref(null)
const activeTab      = ref('beats')
const selectedBeat   = ref(null)
const selectedDesign = ref(null)
const selectedFilm   = ref(null)
const selectedLyric  = ref(null)
const activeConv     = ref(null)
const contactLoading = ref(false)
const isFollowing    = ref(false)
const followLoading  = ref(false)
const stats          = ref(null)

const designs = ref([])
const films   = ref([])
const lyrics  = ref([])
const { beats, loading: beatsLoading, fetchBySeller } = useBeats()

const isOwnProfile = computed(() =>
  authStore.user && musician.value?.user_id === authStore.user.id
)

const tagsExpanded = ref(false)
const visibleCategories = computed(() => {
  const cats = musician.value?.categories ?? []
  return tagsExpanded.value ? cats : cats.slice(0, 3)
})
const hasMoreTags = computed(() => (musician.value?.categories?.length ?? 0) > 3)

function formatNum(n) {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k'
  return String(n)
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const { data, error: err } = await musiciansService.getMusicianBySlug(route.params.slug)
    if (err) throw err
    musician.value = data

    if (data?.user_id) {
      await Promise.all([
        fetchBySeller(data.user_id),
        loadDesigns(data.user_id),
        loadFilms(data.user_id),
        loadLyrics(data.user_id),
        loadStats(data.user_id),
      ])

      if (authStore.isAuthenticated && authStore.user.id !== data.user_id) {
        isFollowing.value = await followsService.isFollowing(authStore.user.id, data.user_id)
      }
    }
  } catch (e) {
    error.value = 'Artista no encontrado'
  } finally {
    loading.value = false
  }
}

async function loadDesigns(uid) {
  const { data } = await graphicService.getDesignsBySeller(uid)
  designs.value = data ?? []
}
async function loadFilms(uid) {
  const { data } = await filmService.getFilmsBySeller(uid)
  films.value = data ?? []
}
async function loadLyrics(uid) {
  const { data } = await lyricsService.getLyricsBySeller(uid)
  lyrics.value = data ?? []
}
async function loadStats(uid) {
  const { data } = await followsService.getProfileStats(uid)
  stats.value = data
}

async function toggleFollow() {
  if (!authStore.isAuthenticated) { router.push('/profile'); return }
  followLoading.value = true
  try {
    if (isFollowing.value) {
      await followsService.unfollow(authStore.user.id, musician.value.user_id)
      isFollowing.value = false
      if (stats.value) stats.value.total_followers = Math.max(0, stats.value.total_followers - 1)
    } else {
      await followsService.follow(authStore.user.id, musician.value.user_id)
      isFollowing.value = true
      if (stats.value) stats.value.total_followers++
    }
  } finally {
    followLoading.value = false
  }
}

async function contactar() {
  if (!authStore.isAuthenticated) { router.push('/profile'); return }
  if (authStore.user.id === musician.value.user_id) return
  contactLoading.value = true
  try {
    const { data } = await chatService.getOrCreateConversation({
      buyerId:    authStore.user.id,
      sellerId:   musician.value.user_id,
      buyerName:  authStore.userDisplayName,
      sellerName: musician.value.name
    })
    activeConv.value = data
  } finally {
    contactLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="public-profile">
    <StateDisplay :loading="loading" :error="error" empty-msg="Artista no encontrado" @retry="load" />

    <template v-if="!loading && !error && musician">

      <!-- Header -->
      <section class="profile-header" :style="musician.cover_url ? `background-image: url('${musician.cover_url}')` : ''">
        <div class="header-overlay">

          <!-- Avatar (reordenado en mobile: va primero) -->
          <div class="avatar-container">
            <img :src="musician.avatar_url || '/assets/letmc.png'" :alt="musician.name" class="avatar" />
          </div>

          <div class="header-left">
            <h1 class="artist-name">{{ musician.name.toUpperCase() }}</h1>

            <!-- Bio -->
            <p class="artist-bio" v-if="musician.bio">{{ musician.bio }}</p>

            <!-- Localización + seguidores -->
            <div class="artist-meta">
              <span v-if="musician.location"><i class="ri-map-pin-line"></i> {{ musician.location }}</span>
              <span v-if="stats"><i class="ri-user-follow-fill"></i> {{ formatNum(stats.total_followers) }} seguidores</span>
              <span v-if="musician.is_verified" class="verified"><i class="ri-verified-badge-fill"></i> Verificado</span>
            </div>

            <!-- Etiquetas con colapso -->
            <div class="categories" v-if="musician.categories?.length">
              <span v-for="cat in visibleCategories" :key="cat" class="cat-chip">{{ cat }}</span>
              <button v-if="hasMoreTags && !tagsExpanded" class="tags-toggle" @click="tagsExpanded = true">
                +{{ musician.categories.length - 3 }} más
              </button>
              <button v-if="tagsExpanded && hasMoreTags" class="tags-toggle" @click="tagsExpanded = false">
                Ver menos
              </button>
            </div>
          </div>

        </div>
      </section>

      <!-- Stats + actions -->
      <div class="profile-actions">
        <div class="stats-row" v-if="stats">
          <div class="stat-item">
            <span class="stat-num">{{ stats.total_beats + stats.total_designs + stats.total_films + stats.total_lyrics }}</span>
            <span class="stat-label">Publicaciones</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ formatNum(stats.total_followers) }}</span>
            <span class="stat-label">Seguidores</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ formatNum(stats.total_likes) }}</span>
            <span class="stat-label">Likes</span>
          </div>
        </div>

        <div class="social-links">
          <a v-if="musician.link_instagram"  :href="musician.link_instagram"  target="_blank" class="social-btn instagram"><i class="ri-instagram-fill"></i></a>
          <a v-if="musician.link_soundcloud" :href="musician.link_soundcloud" target="_blank" class="social-btn soundcloud"><i class="ri-soundcloud-fill"></i></a>
          <a v-if="musician.link_youtube"    :href="musician.link_youtube"    target="_blank" class="social-btn youtube"><i class="ri-youtube-fill"></i></a>
          <a v-if="musician.link_spotify"    :href="musician.link_spotify"    target="_blank" class="social-btn spotify"><i class="ri-spotify-fill"></i></a>
        </div>

        <div class="action-btns">
          <button v-if="isOwnProfile" class="btn-edit" @click="router.push('/configuration')">
            <i class="ri-edit-fill"></i> Editar perfil
          </button>
          <template v-else-if="musician.user_id && authStore.isAuthenticated">
            <button class="btn-follow" :class="{ following: isFollowing }" @click="toggleFollow" :disabled="followLoading">
              <i :class="isFollowing ? 'ri-user-unfollow-fill' : 'ri-user-follow-fill'"></i>
              {{ isFollowing ? 'Siguiendo' : 'Seguir' }}
            </button>
            <button class="btn-contact" @click="contactar" :disabled="contactLoading">
              <i class="ri-chat-3-fill"></i>
              {{ contactLoading ? 'Abriendo...' : 'Contactar' }}
            </button>
          </template>
          <button v-else-if="!authStore.isAuthenticated" class="btn-contact" @click="router.push('/profile')">
            <i class="ri-login-box-fill"></i> Inicia sesión
          </button>
        </div>
      </div>

      <!-- Content tabs -->
      <section class="section">
        <div class="content-tabs">
          <button :class="['ctab', { active: activeTab === 'beats' }]" @click="activeTab = 'beats'">
            <i class="ri-music-2-fill"></i> Beats <span class="count">{{ beats.length }}</span>
          </button>
          <button :class="['ctab', { active: activeTab === 'designs' }]" @click="activeTab = 'designs'">
            <i class="ri-brush-fill"></i> Diseños <span class="count">{{ designs.length }}</span>
          </button>
          <button :class="['ctab', { active: activeTab === 'films' }]" @click="activeTab = 'films'">
            <i class="ri-clapperboard-fill"></i> Videos <span class="count">{{ films.length }}</span>
          </button>
          <button :class="['ctab', { active: activeTab === 'lyrics' }]" @click="activeTab = 'lyrics'">
            <i class="ri-file-music-fill"></i> Letras <span class="count">{{ lyrics.length }}</span>
          </button>
        </div>

        <!-- Beats -->
        <div v-if="activeTab === 'beats'">
          <StateDisplay :loading="beatsLoading" />
          <div v-if="!beatsLoading && beats.length" class="beats-grid">
            <BeatCard v-for="beat in beats" :key="beat.id" v-bind="beat" @click="selectedBeat = beat" />
          </div>
          <div v-else-if="!beatsLoading" class="empty-tab">Sin beats publicados</div>
        </div>

        <!-- Designs -->
        <div v-if="activeTab === 'designs'">
          <div v-if="designs.length" class="pinterest-grid">
            <div v-for="d in designs" :key="d.id" class="design-card" @click="selectedDesign = d">
              <img :src="d.cover_url" :alt="d.title" class="design-img" />
              <div class="design-info"><h3>{{ d.title }}</h3><span>${{ d.price }}</span></div>
            </div>
          </div>
          <div v-else class="empty-tab">Sin diseños publicados</div>
        </div>

        <!-- Films -->
        <div v-if="activeTab === 'films'">
          <div v-if="films.length" class="films-grid">
            <div v-for="f in films" :key="f.id" class="film-card" @click="selectedFilm = f">
              <div class="film-thumb-wrap">
                <img :src="f.thumbnail_url || '/assets/musicians.png'" class="film-thumb" />
                <span class="dur" v-if="f.duration">{{ f.duration }}</span>
              </div>
              <div class="film-info"><h3>{{ f.title }}</h3><p>{{ f.genre }}</p></div>
            </div>
          </div>
          <div v-else class="empty-tab">Sin videos publicados</div>
        </div>

        <!-- Lyrics -->
        <div v-if="activeTab === 'lyrics'">
          <div v-if="lyrics.length" class="lyrics-grid">
            <div v-for="l in lyrics" :key="l.id" class="lyric-card" @click="selectedLyric = l">
              <div class="lyric-cover-wrap">
                <img :src="l.cover_url || '/assets/letmc.png'" class="lyric-cover-img" />
              </div>
              <div class="lyric-info"><h3>{{ l.title }}</h3><p>{{ l.genre }}</p></div>
            </div>
          </div>
          <div v-else class="empty-tab">Sin letras publicadas</div>
        </div>
      </section>
    </template>

    <!-- Modales -->
    <BeatModal v-if="selectedBeat" :beat="selectedBeat" @close="selectedBeat = null" />
    <Teleport to="body">
      <PinDetailModal v-if="selectedDesign" :design="selectedDesign" @close="selectedDesign = null" @contact="contactar" />
      <FilmDetailModal v-if="selectedFilm" :film="selectedFilm" @close="selectedFilm = null" @contact="contactar" />
      <LyricDetailModal v-if="selectedLyric" :lyric="selectedLyric" @close="selectedLyric = null" @contact="contactar" />
      <ChatWindow v-if="activeConv" :conversation="activeConv" @close="activeConv = null" />
    </Teleport>
  </div>
</template>

<style scoped>
.public-profile { }

/* Header — desktop */
.profile-header { position: relative; height: 380px; background: linear-gradient(135deg, #1a0a2e, #2d1b4e); background-size: cover; background-position: center 30%; display: flex; align-items: flex-end; margin-bottom: 0; }
.header-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%); display: flex; align-items: flex-end; padding: 2rem 2rem 2rem; gap: 1.5rem; }
.header-left { max-width: 70%; }
.artist-name { font-family: 'Impact', sans-serif; font-size: 4rem; line-height: 1; margin-bottom: 10px; background: linear-gradient(135deg, #ffffff 0%, #d4a0ff 50%, #b11db9 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 2px 8px rgba(177,29,185,0.5)); }
.categories { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.cat-chip { background: rgba(177,29,185,0.4); color: #fff; padding: 3px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; text-transform: capitalize; }
.tags-toggle { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.25); color: rgba(255,255,255,0.8); padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; cursor: pointer; transition: all 0.2s; }
.tags-toggle:hover { background: rgba(177,29,185,0.3); border-color: #b11db9; color: #fff; }
.artist-bio { color: rgba(255,255,255,0.85); font-size: 0.95rem; font-style: italic; margin-bottom: 10px; line-height: 1.6; background: rgba(0,0,0,0.25); padding: 8px 14px; border-radius: 8px; border-left: 3px solid rgba(177,29,185,0.6); max-width: 600px; }
.artist-meta { display: flex; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 6px; }
.artist-meta span { color: rgba(255,255,255,0.75); font-size: 0.85rem; display: flex; align-items: center; gap: 5px; }
.artist-meta i { color: #b11db9; }
.verified { color: #1d9bf0 !important; }

/* Avatar — desktop: esquina inferior derecha absoluta */
.avatar-container { position: absolute; right: 2rem; bottom: -3.5rem; width: 140px; height: 140px; flex-shrink: 0; }
.avatar { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 6px solid var(--bg, #0b0b0f); box-shadow: 0 8px 24px rgba(0,0,0,0.6); }

/* Actions */
.profile-actions { display: flex; align-items: center; gap: 1.5rem; padding: 1.25rem 2rem; border-bottom: 1px solid var(--border); flex-wrap: wrap; margin-top: 4rem; }
.stats-row { display: flex; gap: 1.5rem; }
.stat-item { text-align: center; }
.stat-num { display: block; font-size: 1.2rem; font-weight: 700; color: var(--text); }
.stat-label { font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.social-links { display: flex; gap: 8px; margin-left: auto; }
.social-btn { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: #fff; text-decoration: none; opacity: 0.75; transition: opacity 0.2s; }
.social-btn:hover { opacity: 1; }
.instagram { background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); }
.soundcloud { background: #ff5500; }
.youtube { background: #ff0000; }
.spotify { background: #1db954; }
.action-btns { display: flex; gap: 8px; }
.btn-follow { display: flex; align-items: center; gap: 6px; background: transparent; border: 1px solid #b11db9; color: #b11db9; padding: 8px 18px; border-radius: 20px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-follow:hover:not(:disabled) { background: rgba(177,29,185,0.1); }
.btn-follow.following { background: rgba(177,29,185,0.15); }
.btn-contact { display: flex; align-items: center; gap: 6px; background: #b11db9; color: #fff; border: none; padding: 8px 18px; border-radius: 20px; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
.btn-contact:hover:not(:disabled) { background: #9a18a3; }
.btn-edit { display: flex; align-items: center; gap: 6px; background: transparent; border: 1px solid var(--border); color: var(--text-muted); padding: 8px 18px; border-radius: 20px; font-size: 0.875rem; cursor: pointer; }
.btn-edit:hover { border-color: var(--text); color: var(--text); }

/* Section */
.section { padding: 1.5rem 2rem; }
.content-tabs { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 1.5rem; }
.ctab { display: flex; align-items: center; gap: 6px; background: transparent; border: 1px solid var(--border); color: var(--text-muted); padding: 7px 14px; border-radius: 20px; font-size: 0.82rem; cursor: pointer; transition: all 0.2s; }
.ctab:hover { border-color: #b11db9; color: var(--text); }
.ctab.active { background: rgba(177,29,185,0.15); border-color: #b11db9; color: #b11db9; }
.ctab i { font-size: 0.85rem; margin: 0; }
.count { background: rgba(177,29,185,0.2); color: #b11db9; padding: 1px 6px; border-radius: 10px; font-size: 0.7rem; font-weight: 700; }

/* Grids */
.beats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem; }
.pinterest-grid { columns: 4; column-gap: 1rem; }
.design-card { break-inside: avoid; margin-bottom: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; cursor: pointer; transition: border-color 0.2s; }
.design-card:hover { border-color: #b11db9; }
.design-img { width: 100%; display: block; }
.design-info { padding: 0.65rem; display: flex; justify-content: space-between; }
.design-info h3 { color: var(--text); font-size: 0.8rem; font-weight: 600; margin: 0; }
.design-info span { color: #b11db9; font-weight: 700; font-size: 0.8rem; }
.films-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.25rem; }
.film-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; cursor: pointer; transition: border-color 0.2s; }
.film-card:hover { border-color: #b11db9; }
.film-thumb-wrap { position: relative; aspect-ratio: 16/9; overflow: hidden; }
.film-thumb { width: 100%; height: 100%; object-fit: cover; }
.dur { position: absolute; bottom: 5px; right: 5px; background: rgba(0,0,0,0.8); color: #fff; font-size: 0.68rem; padding: 1px 5px; border-radius: 3px; }
.film-info { padding: 0.65rem; }
.film-info h3 { color: var(--text); font-size: 0.82rem; font-weight: 600; margin-bottom: 2px; }
.film-info p { color: var(--text-muted); font-size: 0.72rem; margin: 0; }
.lyrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; }
.lyric-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; cursor: pointer; transition: border-color 0.2s; }
.lyric-card:hover { border-color: #b11db9; }
.lyric-cover-wrap { aspect-ratio: 1; overflow: hidden; }
.lyric-cover-img { width: 100%; height: 100%; object-fit: cover; }
.lyric-info { padding: 0.65rem; }
.lyric-info h3 { color: var(--text); font-size: 0.8rem; font-weight: 600; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lyric-info p { color: var(--text-muted); font-size: 0.7rem; margin: 0; }
.empty-tab { color: var(--text-muted); text-align: center; padding: 2rem; font-size: 0.875rem; }

@media (max-width: 768px) {
  /* El header se convierte en columna centrada */
  .profile-header {
    height: auto;
    min-height: unset;
    padding-top: 53px; /* compensa el topbar sticky */
    position: relative;
  }
  /* Degradado que cubre TODO el alto de la imagen */
  .profile-header::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.92) 100%);
    pointer-events: none;
    z-index: 0;
  }
  .header-overlay {
    position: relative;
    z-index: 1;
    background: transparent;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.5rem 1.25rem 1.75rem;
    gap: 0.75rem;
  }

  /* Avatar: grande y centrado, primero visualmente */
  .avatar-container {
    position: static;
    transform: none;
    width: 110px;
    height: 110px;
    order: -1;
    margin-bottom: 0.25rem;
  }
  .avatar { border-width: 4px; }

  .header-left {
    max-width: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .artist-name { font-size: 2.2rem; margin-bottom: 6px; }

  .artist-bio {
    font-size: 0.88rem;
    max-width: 100%;
    text-align: left;
    margin-bottom: 8px;
  }

  .artist-meta {
    justify-content: center;
    gap: 1rem;
    margin-bottom: 4px;
  }

  .categories { justify-content: center; }

  /* Acciones: apilar en mobile */
  .profile-actions {
    padding: 1rem;
    margin-top: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 0.875rem;
  }
  .stats-row { justify-content: center; gap: 1.5rem; }
  .social-links { margin-left: 0; justify-content: center; }
  .action-btns { justify-content: center; }

  .section { padding: 1rem; }
  .pinterest-grid { columns: 2; }
}
</style>
