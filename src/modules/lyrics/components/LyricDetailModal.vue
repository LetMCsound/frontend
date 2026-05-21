<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { commentsService } from '@/services/comments'
import { favoritesService } from '@/services/favorites'
import { confirmDialog } from '@/composables/useConfirm'
import { supabase } from '@/services/supabase'

const props = defineProps({
  lyric: { type: Object, required: true }
})
const emit = defineEmits(['close', 'contact'])

const authStore = useAuthStore()
const comments  = ref([])
const newComment = ref('')
const sending   = ref(false)
const isFav     = ref(false)
const likes     = ref(props.lyric.likes || 0)
const liked     = ref(false)
const copied    = ref(false)
const showLyric = ref(false)
let channel = null

const externalLinks = (() => {
  try {
    return Array.isArray(props.lyric.external_links)
      ? props.lyric.external_links
      : JSON.parse(props.lyric.external_links || '[]')
  } catch { return [] }
})()

function getLinkIcon(url) {
  if (!url) return 'ri-link'
  if (url.includes('spotify'))    return 'ri-spotify-fill'
  if (url.includes('soundcloud')) return 'ri-soundcloud-fill'
  if (url.includes('youtube'))    return 'ri-youtube-fill'
  if (url.includes('apple'))      return 'ri-apple-fill'
  return 'ri-link'
}

function getLinkLabel(url) {
  if (!url) return 'Link'
  if (url.includes('spotify'))    return 'Spotify'
  if (url.includes('soundcloud')) return 'SoundCloud'
  if (url.includes('youtube'))    return 'YouTube'
  if (url.includes('apple'))      return 'Apple Music'
  return 'Escuchar'
}

function langFlag(code) {
  const flags = { es: '🇪🇸', en: '🇬🇧', pt: '🇧🇷', fr: '🇫🇷' }
  return flags[code] || '🌐'
}

async function loadComments() {
  const { data } = await commentsService.getComments(props.lyric.id, 'lyric')
  comments.value = data ?? []
}

async function sendComment() {
  if (!newComment.value.trim() || !authStore.isAuthenticated) return
  sending.value = true
  try {
    const { data } = await commentsService.addComment({
      userId: authStore.user.id,
      userName: authStore.userDisplayName,
      contentId: props.lyric.id,
      contentType: 'lyric',
      text: newComment.value.trim()
    })
    if (data) comments.value.push(data)
    newComment.value = ''
  } finally {
    sending.value = false
  }
}

async function deleteComment(id) {
  const ok = await confirmDialog({
    title: 'Eliminar comentario',
    message: 'Esta acción no se puede deshacer.',
    confirmText: 'Eliminar',
    danger: true
  })
  if (!ok) return
  const { error } = await commentsService.deleteComment(id)
  if (error) {
    alert('Error al eliminar: ' + (error.message || ''))
    return
  }
  comments.value = comments.value.filter(c => c.id !== id)
}

async function toggleFav() {
  if (!authStore.isAuthenticated) return
  if (isFav.value) {
    await favoritesService.removeFavorite(authStore.user.id, props.lyric.id)
    isFav.value = false
  } else {
    await favoritesService.addFavorite(authStore.user.id, props.lyric.id, 'lyric')
    isFav.value = true
  }
}

async function toggleLike() {
  if (!authStore.isAuthenticated || liked.value) return
  liked.value = true
  likes.value++
  await supabase.rpc('increment_lyric_likes', { lyric_id: props.lyric.id })
}

function copyLink() {
  navigator.clipboard.writeText(`${window.location.origin}/lyrics`)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
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
    isFav.value = await favoritesService.isFavorite(authStore.user.id, props.lyric.id)
  }
  channel = commentsService.subscribe(props.lyric.id, 'lyric', (newC) => {
    if (!comments.value.find(c => c.id === newC.id)) comments.value.push(newC)
  })
})

onUnmounted(() => commentsService.unsubscribe(channel))
</script>

<template>
  <div class="lyric-overlay" @click.self="emit('close')">
    <div class="lyric-modal">
      <button class="close-btn" @click="emit('close')"><i class="ri-close-fill"></i></button>

      <div class="lyric-grid">
        <!-- Left: portada + audio + links -->
        <div class="lyric-left">
          <img
            :src="lyric.cover_url || '/assets/letmc.png'"
            :alt="lyric.title"
            class="lyric-cover"
          />

          <!-- Audio player -->
          <div v-if="lyric.audio_url" class="audio-section">
            <p class="audio-label"><i class="ri-headphone-fill"></i> Preview</p>
            <audio controls class="audio-player">
              <source :src="lyric.audio_url" />
            </audio>
          </div>

          <!-- External links -->
          <div v-if="externalLinks.length" class="links-section">
            <p class="links-label">Escuchar en</p>
            <div class="links-list">
              <a
                v-for="link in externalLinks"
                :key="link"
                :href="link"
                target="_blank"
                class="ext-link"
              >
                <i :class="getLinkIcon(link)"></i>
                {{ getLinkLabel(link) }}
              </a>
            </div>
          </div>

          <!-- Meta info -->
          <div class="lyric-meta-box">
            <div class="meta-row">
              <span class="meta-label">Compositor</span>
              <span class="meta-value">{{ lyric.seller_name }}</span>
            </div>
            <div class="meta-row" v-if="lyric.genre">
              <span class="meta-label">Género</span>
              <span class="meta-value">{{ lyric.genre }}</span>
            </div>
            <div class="meta-row" v-if="lyric.language">
              <span class="meta-label">Idioma</span>
              <span class="meta-value">{{ langFlag(lyric.language) }} {{ lyric.language?.toUpperCase() }}</span>
            </div>
          </div>
        </div>

        <!-- Right: info + letra + comentarios -->
        <div class="lyric-right">

          <!-- Header -->
          <div class="lyric-header">
            <div class="author-row">
              <div class="author-avatar">{{ lyric.seller_name.charAt(0).toUpperCase() }}</div>
              <div>
                <p class="author-name">{{ lyric.seller_name }}</p>
                <p class="author-role">Compositor / Letrista</p>
              </div>
            </div>
            <button class="btn-contact" @click="emit('contact', lyric)">
              <i class="ri-chat-3-fill"></i> Contactar
            </button>
          </div>

          <!-- Título y acciones -->
          <div class="lyric-title-section">
            <h2>{{ lyric.title }}</h2>
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
            </div>
          </div>

          <!-- Descripción -->
          <p class="lyric-desc" v-if="lyric.description">{{ lyric.description }}</p>

          <!-- Tags -->
          <div class="lyric-tags" v-if="lyric.tags?.length">
            <span v-for="tag in lyric.tags" :key="tag" class="tag">#{{ tag }}</span>
          </div>

          <!-- Letra -->
          <div class="lyric-content-section">
            <button class="toggle-lyric-btn" @click="showLyric = !showLyric">
              <i :class="showLyric ? 'ri-eye-off-line' : 'ri-file-text-line'"></i>
              {{ showLyric ? 'Ocultar letra' : 'Ver letra' }}
            </button>
            <div v-if="showLyric && lyric.content" class="lyric-text">
              <pre>{{ lyric.content }}</pre>
            </div>
            <div v-else-if="showLyric && !lyric.content" class="no-lyric">
              El compositor no ha publicado la letra completa.
            </div>
          </div>

          <!-- Comentarios -->
          <div class="lyric-comments">
            <h3>Comentarios <span>{{ comments.length }}</span></h3>
            <div class="comments-list">
              <div v-if="!comments.length" class="no-comments">Sé el primero en comentar</div>
              <div v-for="c in comments" :key="c.id" class="comment-item">
                <div class="comment-avatar">{{ c.user_name.charAt(0).toUpperCase() }}</div>
                <div class="comment-body">
                  <p class="comment-author">{{ c.user_name }}</p>
                  <p class="comment-text">{{ c.text }}</p>
                  <span class="comment-time">{{ formatTime(c.created_at) }}</span>
                </div>
                <button
                  v-if="authStore.user?.id === c.user_id"
                  class="comment-delete"
                  @click="deleteComment(c.id)"
                  title="Eliminar comentario"
                >
                  <i class="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
            <div class="comment-input-row">
              <template v-if="authStore.isAuthenticated">
                <div class="comment-avatar-sm">{{ authStore.userDisplayName.charAt(0).toUpperCase() }}</div>
                <input
                  v-model="newComment"
                  type="text"
                  placeholder="Añade un comentario..."
                  class="comment-input"
                  @keyup.enter="sendComment"
                  :disabled="sending"
                />
                <button class="send-btn" @click="sendComment" :disabled="!newComment.trim() || sending">
                  <i class="ri-send-plane-fill"></i>
                </button>
              </template>
              <p v-else class="login-note">
                <router-link to="/profile">Inicia sesión</router-link> para comentar
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lyric-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.88); backdrop-filter: blur(6px); z-index: 4000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.lyric-modal { background: var(--bg-surface, #1a1a1d); border: 1px solid var(--border, rgba(255,255,255,0.1)); border-radius: 20px; width: 100%; max-width: 920px; max-height: 92vh; overflow: hidden; position: relative; display: flex; flex-direction: column; }
.close-btn { position: absolute; top: 12px; right: 12px; z-index: 10; background: rgba(0,0,0,0.5); border: none; color: var(--text); width: 36px; height: 36px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }

.lyric-grid { display: grid; grid-template-columns: 280px 1fr; height: 100%; max-height: 92vh; overflow: hidden; }

/* Left */
.lyric-left { background: rgba(0,0,0,0.3); padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; border-right: 1px solid var(--border, rgba(255,255,255,0.08)); }
.lyric-cover { width: 100%; border-radius: 12px; object-fit: cover; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
.audio-section { }
.audio-label { color: var(--text-muted, #888); font-size: 0.78rem; margin-bottom: 6px; display: flex; align-items: center; gap: 5px; }
.audio-player { width: 100%; height: 36px; border-radius: 20px; }
.links-section { }
.links-label { color: var(--text-muted, #888); font-size: 0.78rem; margin-bottom: 8px; }
.links-list { display: flex; flex-direction: column; gap: 6px; }
.ext-link { display: flex; align-items: center; gap: 8px; background: var(--input-bg); border: 1px solid var(--border); border-radius: 10px; padding: 8px 12px; color: var(--text, #fff); font-size: 0.82rem; font-weight: 500; transition: all 0.2s; text-decoration: none; }
.ext-link:hover { background: var(--accent-light, rgba(177,29,185,0.15)); border-color: var(--accent, #b11db9); color: var(--accent, #b11db9); }
.ext-link i { font-size: 1rem; }
.lyric-meta-box { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
.meta-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.meta-row:last-child { border-bottom: none; }
.meta-label { color: var(--text-muted, #888); font-size: 0.75rem; }
.meta-value { color: var(--text, #fff); font-size: 0.82rem; font-weight: 500; }

/* Right */
.lyric-right { display: flex; flex-direction: column; overflow: hidden; }
.lyric-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
.author-row { display: flex; align-items: center; gap: 10px; }
.author-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #b11db9, #7b2cbf); display: flex; align-items: center; justify-content: center; color: var(--text); font-weight: 700; font-size: 0.9rem; }
.author-name { color: var(--text, #fff); font-size: 0.875rem; font-weight: 600; margin: 0; }
.author-role { color: var(--text-muted, #888); font-size: 0.72rem; margin: 0; }
.btn-contact { display: flex; align-items: center; gap: 6px; background: #b11db9; color: var(--text); border: none; padding: 7px 14px; border-radius: 20px; font-size: 0.82rem; font-weight: 600; cursor: pointer; }
.btn-contact:hover { background: #9a18a3; }

.lyric-title-section { padding: 0.875rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
.lyric-title-section h2 { color: var(--text, #fff); font-size: 1.2rem; margin-bottom: 8px; }
.quick-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.action-btn { display: flex; align-items: center; gap: 5px; background: var(--input-bg); border: 1px solid var(--border); color: var(--text-muted, #aaa); padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; cursor: pointer; transition: all 0.2s; }
.action-btn:hover { border-color: #b11db9; color: var(--text, #fff); }
.action-btn.active { background: rgba(177,29,185,0.2); border-color: #b11db9; color: #b11db9; }

.lyric-desc { padding: 0.75rem 1.25rem; color: var(--text-soft, #ccc); font-size: 0.85rem; line-height: 1.6; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
.lyric-tags { padding: 0.5rem 1.25rem; display: flex; flex-wrap: wrap; gap: 5px; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
.tag { color: #b11db9; font-size: 0.75rem; }

.lyric-content-section { padding: 0.875rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
.toggle-lyric-btn { display: flex; align-items: center; gap: 6px; background: rgba(177,29,185,0.1); border: 1px solid rgba(177,29,185,0.3); color: #b11db9; padding: 7px 14px; border-radius: 20px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.toggle-lyric-btn:hover { background: rgba(177,29,185,0.2); }
.lyric-text { margin-top: 10px; background: rgba(0,0,0,0.2); border-radius: 10px; padding: 1rem; max-height: 200px; overflow-y: auto; }
.lyric-text pre { color: var(--text-soft, #ddd); font-family: 'Poppins', sans-serif; font-size: 0.85rem; line-height: 1.8; white-space: pre-wrap; word-break: break-word; }
.no-lyric { color: var(--text-muted, #666); font-size: 0.82rem; margin-top: 8px; font-style: italic; }

/* Comments */
.lyric-comments { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.lyric-comments h3 { color: var(--text, #fff); font-size: 0.875rem; padding: 0.75rem 1.25rem 0.5rem; flex-shrink: 0; }
.lyric-comments h3 span { color: var(--text-muted, #666); font-size: 0.75rem; margin-left: 5px; }
.comments-list { flex: 1; overflow-y: auto; padding: 0 1.25rem; }
.no-comments { color: var(--text-muted, #555); font-size: 0.82rem; text-align: center; padding: 1rem 0; }
.comment-item { display: flex; gap: 8px; margin-bottom: 10px; align-items: flex-start; }
.comment-delete {
  background: none; border: none;
  color: var(--text-muted, #666);
  cursor: pointer; padding: 4px 6px;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: color 0.2s, background 0.2s;
  opacity: 0;
}
.comment-item:hover .comment-delete { opacity: 1; }
.comment-delete:hover { color: #ff4d4d; background: rgba(255,77,77,0.1); }
.comment-avatar { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #b11db9, #7b2cbf); display: flex; align-items: center; justify-content: center; color: var(--text); font-size: 0.7rem; font-weight: 700; }
.comment-body { flex: 1; }
.comment-author { color: var(--text, #fff); font-size: 0.78rem; font-weight: 600; margin-bottom: 1px; }
.comment-text { color: var(--text-soft, #ccc); font-size: 0.82rem; line-height: 1.4; margin-bottom: 2px; }
.comment-time { color: var(--text-muted, #555); font-size: 0.68rem; }
.comment-input-row { display: flex; align-items: center; gap: 8px; padding: 0.75rem 1.25rem; border-top: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
.comment-avatar-sm { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #b11db9, #7b2cbf); display: flex; align-items: center; justify-content: center; color: var(--text); font-size: 0.7rem; font-weight: 700; }
.comment-input { flex: 1; background: var(--input-bg); border: 1px solid var(--border); border-radius: 20px; color: var(--text, #fff); padding: 7px 12px; font-size: 0.82rem; outline: none; }
.comment-input:focus { border-color: #b11db9; }
.comment-input::placeholder { color: var(--text-muted, #555); }
.send-btn { width: 30px; height: 30px; border-radius: 50%; background: #b11db9; border: none; color: var(--text); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.login-note { color: var(--text-muted, #666); font-size: 0.82rem; flex: 1; }
.login-note a { color: #b11db9; text-decoration: none; }

@media (max-width: 768px) {
  .lyric-grid { grid-template-columns: 1fr; overflow-y: auto; }
  .lyric-left { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .lyric-cover { max-height: 200px; object-fit: cover; }
}
</style>
