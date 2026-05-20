<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { commentsService } from '@/services/comments'
import { favoritesService } from '@/services/favorites'
import { supabase } from '@/services/supabase'

const props = defineProps({
  film: { type: Object, required: true }
})
const emit = defineEmits(['close', 'contact'])

const authStore  = useAuthStore()
const comments   = ref([])
const newComment = ref('')
const sending    = ref(false)
const isFav      = ref(false)
const likes      = ref(props.film.likes || 0)
const liked      = ref(false)
const copied     = ref(false)
const showPlayer = ref(false)
let channel = null

const youtubeId = computed(() => {
  if (!props.film.video_url) return null
  const match = props.film.video_url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)
  return match ? match[1] : null
})

const isDirectVideo = computed(() => {
  if (!props.film.video_url) return false
  return props.film.video_url.includes('supabase') ||
    props.film.video_url.endsWith('.mp4') ||
    props.film.video_url.endsWith('.webm') ||
    props.film.video_url.endsWith('.mov')
})

async function loadComments() {
  const { data } = await commentsService.getComments(props.film.id, 'film')
  comments.value = data ?? []
}

async function sendComment() {
  if (!newComment.value.trim() || !authStore.isAuthenticated) return
  sending.value = true
  try {
    const { data } = await commentsService.addComment({
      userId:      authStore.user.id,
      userName:    authStore.userDisplayName,
      contentId:   props.film.id,
      contentType: 'film',
      text:        newComment.value.trim()
    })
    if (data) comments.value.push(data)
    newComment.value = ''
  } finally {
    sending.value = false
  }
}

async function toggleFav() {
  if (!authStore.isAuthenticated) return
  if (isFav.value) {
    await favoritesService.removeFavorite(authStore.user.id, props.film.id)
    isFav.value = false
  } else {
    await favoritesService.addFavorite(authStore.user.id, props.film.id, 'film')
    isFav.value = true
  }
}

async function toggleLike() {
  if (!authStore.isAuthenticated || liked.value) return
  liked.value = true
  likes.value++
  await supabase.rpc('increment_film_likes', { film_id: props.film.id })
}

function copyLink() {
  const url = `${window.location.origin}/film-makers`
  navigator.clipboard.writeText(url).then(() => {
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  })
}

function formatViews(n) {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k'
  return String(n)
}

function formatTime(ts) {
  const d = new Date(ts)
  const diff = Math.floor((Date.now() - d) / 1000)
  if (diff < 60) return 'Ahora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

onMounted(async () => {
  await loadComments()
  if (authStore.isAuthenticated) {
    isFav.value = await favoritesService.isFavorite(authStore.user.id, props.film.id)
  }
  channel = commentsService.subscribe(props.film.id, 'film', (newC) => {
    if (!comments.value.find(c => c.id === newC.id)) comments.value.push(newC)
  })
})

onUnmounted(() => commentsService.unsubscribe(channel))
</script>

<template>
  <div class="film-overlay" @click.self="emit('close')">
    <div class="film-modal">
      <button class="film-close" @click="emit('close')"><i class="ri-close-fill"></i></button>

      <!-- Video player -->
      <div class="video-section">
        <!-- MP4 directo -->
        <template v-if="showPlayer && isDirectVideo">
          <video :src="film.video_url" class="yt-embed" controls autoplay></video>
        </template>
        <!-- YouTube embed -->
        <template v-else-if="showPlayer && youtubeId">
          <iframe
            :src="`https://www.youtube.com/embed/${youtubeId}?autoplay=1`"
            class="yt-embed"
            frameborder="0"
            allow="autoplay; encrypted-media"
            allowfullscreen
          ></iframe>
        </template>
        <!-- Thumbnail con play -->
        <template v-else>
          <img :src="film.thumbnail_url || '/assets/musicians.png'" :alt="film.title" class="thumbnail" />
          <div class="play-overlay" @click="showPlayer = true">
            <div class="play-btn">
              <i class="ri-play-fill"></i>
            </div>
            <span v-if="film.duration" class="duration">{{ film.duration }}</span>
          </div>
        </template>
      </div>

      <!-- Info section -->
      <div class="film-body">
        <div class="film-left">

          <!-- Title + author -->
          <div class="film-header">
            <div>
              <h2>{{ film.title }}</h2>
              <div class="film-meta">
                <span class="genre-badge">{{ film.genre }}</span>
                <span class="views"><i class="ri-eye-fill"></i> {{ formatViews(film.views) }} vistas</span>
                <span class="price-badge">${{ film.price }}</span>
              </div>
            </div>
            <div class="author-info">
              <div class="author-avatar">{{ film.seller_name.charAt(0).toUpperCase() }}</div>
              <span>{{ film.seller_name }}</span>
            </div>
          </div>

          <!-- Quick actions -->
          <div class="quick-actions">
            <button class="action-btn" @click="toggleLike" :class="{ active: liked }">
              <i :class="liked ? 'ri-heart-fill' : 'ri-heart-line'"></i> {{ likes }}
            </button>
            <button class="action-btn" @click="toggleFav" :class="{ active: isFav }">
              <i :class="isFav ? 'ri-bookmark-fill' : 'ri-bookmark-line'"></i>
              {{ isFav ? 'Guardado' : 'Guardar' }}
            </button>
            <button class="action-btn" @click="copyLink" :class="{ active: copied }">
              <i :class="copied ? 'ri-check-fill' : 'ri-share-line'"></i>
              {{ copied ? '¡Copiado!' : 'Compartir' }}
            </button>
            <button class="action-btn contact" @click="emit('contact', film)">
              <i class="ri-chat-3-fill"></i> Contratar
            </button>
          </div>

          <!-- Description -->
          <div class="film-desc" v-if="film.description">
            <p>{{ film.description }}</p>
          </div>

          <!-- Tags -->
          <div class="film-tags" v-if="film.tags?.length">
            <span v-for="tag in film.tags" :key="tag" class="tag">#{{ tag }}</span>
          </div>
        </div>

        <!-- Comments -->
        <div class="film-comments">
          <h3>Comentarios <span>{{ comments.length }}</span></h3>

          <div class="comments-list">
            <div v-if="comments.length === 0" class="no-comments">Sé el primero en comentar</div>
            <div v-for="c in comments" :key="c.id" class="comment-item">
              <div class="comment-avatar">{{ c.user_name.charAt(0).toUpperCase() }}</div>
              <div class="comment-body">
                <p class="comment-author">{{ c.user_name }}</p>
                <p class="comment-text">{{ c.text }}</p>
                <span class="comment-time">{{ formatTime(c.created_at) }}</span>
              </div>
            </div>
          </div>

          <div class="comment-input-row">
            <template v-if="authStore.isAuthenticated">
              <div class="comment-input-avatar">{{ authStore.userDisplayName.charAt(0).toUpperCase() }}</div>
              <input
                v-model="newComment"
                type="text"
                placeholder="Añade un comentario..."
                class="comment-input"
                @keyup.enter="sendComment"
                :disabled="sending"
              />
              <button class="send-comment-btn" @click="sendComment" :disabled="!newComment.trim() || sending">
                <i class="ri-send-plane-fill"></i>
              </button>
            </template>
            <p v-else class="login-to-comment">
              <router-link to="/profile">Inicia sesión</router-link> para comentar
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.film-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(6px); z-index: 4000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.film-modal { background: #121212; border-radius: 16px; width: 100%; max-width: 900px; max-height: 92vh; overflow: hidden; position: relative; display: flex; flex-direction: column; }
.film-close { position: absolute; top: 10px; right: 10px; z-index: 10; background: rgba(0,0,0,0.7); border: none; color: var(--text); width: 34px; height: 34px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }

/* Video */
.video-section { position: relative; aspect-ratio: 16/9; background: #000; flex-shrink: 0; overflow: hidden; }
.thumbnail { width: 100%; height: 100%; object-fit: cover; display: block; border: none; outline: none; }
.yt-embed { width: 100%; height: 100%; }
.play-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); cursor: pointer; transition: background 0.2s; }
.play-overlay:hover { background: rgba(0,0,0,0.5); }
.play-btn { width: 64px; height: 64px; border-radius: 50%; background: rgba(177,29,185,0.9); display: flex; align-items: center; justify-content: center; }
.play-btn i { font-size: 2rem; color: var(--text); margin-left: 4px; }
.duration { position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.8); color: var(--text); font-size: 0.78rem; font-weight: 600; padding: 2px 8px; border-radius: 4px; }

/* Body */
.film-body { display: grid; grid-template-columns: 1fr 340px; flex: 1; overflow: hidden; }
.film-left { padding: 1.25rem; overflow-y: auto; border-right: 1px solid rgba(255,255,255,0.08); }

.film-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 1rem; }
.film-header h2 { color: var(--text); font-size: 1.1rem; margin-bottom: 6px; }
.film-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.genre-badge { background: rgba(177,29,185,0.2); color: #b11db9; padding: 2px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
.views { color: var(--text-muted); font-size: 0.78rem; display: flex; align-items: center; gap: 4px; }
.views i { color: #b11db9; }
.price-badge { color: var(--text); font-weight: 700; font-size: 0.9rem; }

.author-info { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.author-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #b11db9, #7b2cbf); display: flex; align-items: center; justify-content: center; color: var(--text); font-weight: 700; font-size: 0.85rem; }
.author-info span { color: var(--text-muted); font-size: 0.82rem; white-space: nowrap; }

.quick-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.action-btn { display: flex; align-items: center; gap: 5px; background: var(--input-bg); border: 1px solid var(--border); color: var(--text-muted); padding: 6px 12px; border-radius: 20px; font-size: 0.78rem; cursor: pointer; transition: all 0.2s; }
.action-btn:hover { border-color: #b11db9; color: var(--text); }
.action-btn.active { background: rgba(177,29,185,0.2); border-color: #b11db9; color: #b11db9; }
.action-btn.contact { background: #b11db9; border-color: #b11db9; color: var(--text); }
.action-btn.contact:hover { background: #9a18a3; }

.film-desc p { color: var(--text-muted); font-size: 0.85rem; line-height: 1.6; margin-bottom: 10px; }
.film-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.tag { color: #b11db9; font-size: 0.75rem; }

/* Comments */
.film-comments { display: flex; flex-direction: column; overflow: hidden; }
.film-comments h3 { color: var(--text); font-size: 0.875rem; padding: 1rem 1.25rem 0.5rem; flex-shrink: 0; }
.film-comments h3 span { color: var(--text-muted); font-size: 0.75rem; margin-left: 5px; }
.comments-list { flex: 1; overflow-y: auto; padding: 0 1.25rem; }
.no-comments { color: var(--text-muted); font-size: 0.82rem; text-align: center; padding: 1.5rem 0; }
.comment-item { display: flex; gap: 8px; margin-bottom: 10px; }
.comment-avatar { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #b11db9, #7b2cbf); display: flex; align-items: center; justify-content: center; color: var(--text); font-size: 0.7rem; font-weight: 700; }
.comment-body { flex: 1; }
.comment-author { color: var(--text); font-size: 0.78rem; font-weight: 600; margin-bottom: 1px; }
.comment-text { color: var(--text-soft); font-size: 0.82rem; line-height: 1.4; margin-bottom: 2px; }
.comment-time { color: var(--text-muted); font-size: 0.68rem; }
.comment-input-row { display: flex; align-items: center; gap: 8px; padding: 0.875rem 1.25rem; border-top: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
.comment-input-avatar { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #b11db9, #7b2cbf); display: flex; align-items: center; justify-content: center; color: var(--text); font-size: 0.7rem; font-weight: 700; }
.comment-input { flex: 1; background: var(--input-bg); border: 1px solid var(--border); border-radius: 20px; color: var(--text); padding: 7px 12px; font-size: 0.82rem; outline: none; }
.comment-input:focus { border-color: #b11db9; }
.comment-input::placeholder { color: var(--text-muted); }
.send-comment-btn { width: 30px; height: 30px; border-radius: 50%; background: #b11db9; border: none; color: var(--text); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.send-comment-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.login-to-comment { color: var(--text-muted); font-size: 0.82rem; flex: 1; }
.login-to-comment a { color: #b11db9; text-decoration: none; }

@media (max-width: 768px) {
  .film-body { grid-template-columns: 1fr; }
  .film-left { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .film-comments { max-height: 300px; }
}
</style>
