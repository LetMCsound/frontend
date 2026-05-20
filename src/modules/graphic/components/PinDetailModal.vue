<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { commentsService } from '@/services/comments'
import { favoritesService } from '@/services/favorites'
import { supabase } from '@/services/supabase'

const props = defineProps({
  design: { type: Object, required: true }
})
const emit = defineEmits(['close', 'contact'])

const authStore  = useAuthStore()
const comments   = ref([])
const newComment = ref('')
const sending    = ref(false)
const isFav      = ref(false)
const likes      = ref(props.design.likes || 0)
const liked      = ref(false)
const copied     = ref(false)
let channel = null

async function loadComments() {
  const { data } = await commentsService.getComments(props.design.id, 'graphic')
  comments.value = data ?? []
}

async function sendComment() {
  if (!newComment.value.trim() || !authStore.isAuthenticated) return
  sending.value = true
  try {
    const { data } = await commentsService.addComment({
      userId:      authStore.user.id,
      userName:    authStore.userDisplayName,
      contentId:   props.design.id,
      contentType: 'graphic',
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
    await favoritesService.removeFavorite(authStore.user.id, props.design.id)
    isFav.value = false
  } else {
    await favoritesService.addFavorite(authStore.user.id, props.design.id, 'graphic')
    isFav.value = true
  }
}

async function toggleLike() {
  if (!authStore.isAuthenticated || liked.value) return
  liked.value = true
  likes.value++
  await supabase.rpc('increment_graphic_likes', { design_id: props.design.id })
}

async function downloadImage() {
  try {
    const response = await fetch(props.design.cover_url)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.design.title || 'design'}.jpg`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch {
    alert('No se pudo descargar la imagen')
  }
}

function copyLink() {
  const url = `${window.location.origin}/graphic-design`
  navigator.clipboard.writeText(url).then(() => {
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  })
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
    isFav.value = await favoritesService.isFavorite(authStore.user.id, props.design.id)
  }
  channel = commentsService.subscribe(props.design.id, 'graphic', (newC) => {
    if (!comments.value.find(c => c.id === newC.id)) comments.value.push(newC)
  })
})

onUnmounted(() => commentsService.unsubscribe(channel))
</script>

<template>
  <div class="pin-overlay" @click.self="emit('close')">
    <div class="pin-modal">
      <button class="pin-close" @click="emit('close')"><i class="ri-close-fill"></i></button>

      <div class="pin-grid">
        <!-- Left: imagen -->
        <div class="pin-left">
          <img :src="design.cover_url || '/assets/letmc.png'" :alt="design.title" class="pin-img" />
        </div>

        <!-- Right -->
        <div class="pin-right">

          <!-- Acciones rápidas -->
          <div class="quick-actions">
            <button class="action-btn" @click="toggleLike" :class="{ active: liked }" title="Me gusta">
              <i :class="liked ? 'ri-heart-fill' : 'ri-heart-line'"></i>
              <span>{{ likes }}</span>
            </button>
            <button class="action-btn" @click="toggleFav" :class="{ active: isFav }" title="Guardar">
              <i :class="isFav ? 'ri-bookmark-fill' : 'ri-bookmark-line'"></i>
              <span>{{ isFav ? 'Guardado' : 'Guardar' }}</span>
            </button>
            <button class="action-btn" @click="downloadImage" title="Descargar">
              <i class="ri-download-2-line"></i>
              <span>Descargar</span>
            </button>
            <button class="action-btn" @click="copyLink" :class="{ active: copied }" title="Compartir">
              <i :class="copied ? 'ri-check-fill' : 'ri-share-line'"></i>
              <span>{{ copied ? '¡Copiado!' : 'Compartir' }}</span>
            </button>
          </div>

          <!-- Author + contact -->
          <div class="pin-header">
            <div class="pin-author">
              <div class="author-avatar">{{ design.seller_name.charAt(0).toUpperCase() }}</div>
              <div>
                <p class="author-name">{{ design.seller_name }}</p>
                <p class="author-role">Diseñador gráfico</p>
              </div>
            </div>
            <button class="btn-contact" @click="emit('contact', design)">
              <i class="ri-chat-3-fill"></i> Contactar
            </button>
          </div>

          <!-- Info -->
          <div class="pin-info">
            <h2>{{ design.title }}</h2>
            <p class="pin-desc" v-if="design.description">{{ design.description }}</p>
            <div class="pin-meta">
              <span class="pin-style" v-if="design.style">{{ design.style }}</span>
              <span class="pin-price">${{ design.price }}</span>
            </div>
            <div class="pin-tags">
              <span v-for="tag in (design.tags || [])" :key="tag" class="tag">#{{ tag }}</span>
            </div>
          </div>

          <!-- Comentarios -->
          <div class="pin-comments">
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
  </div>
</template>

<style scoped>
.pin-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); z-index: 4000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.pin-modal { background: #1a1a1d; border-radius: 20px; width: 100%; max-width: 920px; max-height: 92vh; overflow: hidden; position: relative; display: flex; flex-direction: column; }
.pin-close { position: absolute; top: 12px; right: 12px; z-index: 10; background: rgba(0,0,0,0.6); border: none; color: var(--text); width: 36px; height: 36px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.pin-close:hover { background: rgba(0,0,0,0.9); }
.pin-grid { display: grid; grid-template-columns: 1fr 1fr; height: 100%; max-height: 92vh; overflow: hidden; }

/* Left */
.pin-left { background: #0b0b0f; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.pin-img { width: 100%; height: 100%; object-fit: cover; max-height: 92vh; }

/* Right */
.pin-right { display: flex; flex-direction: column; overflow: hidden; }

/* Quick actions */
.quick-actions { display: flex; gap: 8px; padding: 0.875rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; flex-wrap: wrap; }
.action-btn {
  display: flex; align-items: center; gap: 5px;
  background: var(--input-bg); border: 1px solid var(--border);
  color: var(--text-muted); padding: 6px 12px; border-radius: 20px;
  font-size: 0.78rem; cursor: pointer; transition: all 0.2s;
}
.action-btn:hover { border-color: #b11db9; color: var(--text); }
.action-btn.active { background: rgba(177,29,185,0.2); border-color: #b11db9; color: #b11db9; }
.action-btn i { font-size: 1rem; }

/* Header */
.pin-header { display: flex; justify-content: space-between; align-items: center; padding: 0.875rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
.pin-author { display: flex; align-items: center; gap: 10px; }
.author-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #b11db9, #7b2cbf); display: flex; align-items: center; justify-content: center; color: var(--text); font-weight: 700; font-size: 0.9rem; }
.author-name { color: var(--text); font-size: 0.875rem; font-weight: 600; margin: 0; }
.author-role { color: var(--text-muted); font-size: 0.72rem; margin: 0; }
.btn-contact { display: flex; align-items: center; gap: 6px; background: #b11db9; color: var(--text); border: none; padding: 7px 14px; border-radius: 20px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-contact:hover { background: #9a18a3; }

/* Info */
.pin-info { padding: 0.875rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
.pin-info h2 { color: var(--text); font-size: 1.1rem; margin-bottom: 6px; }
.pin-desc { color: var(--text-muted); font-size: 0.85rem; line-height: 1.5; margin-bottom: 8px; }
.pin-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.pin-style { color: var(--text-muted); font-size: 0.78rem; }
.pin-price { color: var(--text); font-weight: 700; font-size: 1rem; }
.pin-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.tag { color: #b11db9; font-size: 0.75rem; }

/* Comments */
.pin-comments { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.pin-comments h3 { color: var(--text); font-size: 0.9rem; padding: 0.875rem 1.25rem 0.5rem; flex-shrink: 0; }
.pin-comments h3 span { color: var(--text-muted); font-size: 0.78rem; margin-left: 6px; }
.comments-list { flex: 1; overflow-y: auto; padding: 0 1.25rem; }
.no-comments { color: var(--text-muted); font-size: 0.82rem; text-align: center; padding: 1.5rem 0; }
.comment-item { display: flex; gap: 8px; margin-bottom: 10px; }
.comment-avatar { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #b11db9, #7b2cbf); display: flex; align-items: center; justify-content: center; color: var(--text); font-size: 0.72rem; font-weight: 700; }
.comment-body { flex: 1; }
.comment-author { color: var(--text); font-size: 0.78rem; font-weight: 600; margin-bottom: 1px; }
.comment-text { color: var(--text-soft); font-size: 0.82rem; line-height: 1.4; margin-bottom: 2px; }
.comment-time { color: var(--text-muted); font-size: 0.68rem; }
.comment-input-row { display: flex; align-items: center; gap: 8px; padding: 0.875rem 1.25rem; border-top: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
.comment-input-avatar { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #b11db9, #7b2cbf); display: flex; align-items: center; justify-content: center; color: var(--text); font-size: 0.72rem; font-weight: 700; }
.comment-input { flex: 1; background: var(--input-bg); border: 1px solid var(--border); border-radius: 20px; color: var(--text); padding: 7px 12px; font-size: 0.82rem; outline: none; }
.comment-input:focus { border-color: #b11db9; }
.comment-input::placeholder { color: var(--text-muted); }
.send-comment-btn { width: 30px; height: 30px; border-radius: 50%; background: #b11db9; border: none; color: var(--text); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.send-comment-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.login-to-comment { color: var(--text-muted); font-size: 0.82rem; flex: 1; }
.login-to-comment a { color: #b11db9; text-decoration: none; }

@media (max-width: 768px) {
  .pin-grid { grid-template-columns: 1fr; overflow-y: auto; }
  .pin-left { max-height: 250px; }
  .quick-actions { gap: 6px; }
  .action-btn span { display: none; }
}
</style>
