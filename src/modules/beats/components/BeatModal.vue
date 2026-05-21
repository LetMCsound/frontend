<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase, db } from '@/services/supabase'
import { commentsService } from '@/services/comments'
import { favoritesService } from '@/services/favorites'
import { confirmDialog } from '@/composables/useConfirm'
import beatDemoFallback from '@/assets/beat_demo.mp3'

const props = defineProps({ beat: { type: Object, required: true } })
const emit = defineEmits(['close'])

const authStore = useAuthStore()
const purchasing = ref(false)
const comments = ref([])
const newComment = ref('')
const sending = ref(false)
const isFav = ref(false)
const likes = ref(props.beat.likes || 0)
const liked = ref(false)
const copied = ref(false)
const activeTab = ref('buy') // 'buy' | 'comments'
let channel = null

const licenses = [
  { key: 'Standard',  label: 'Standard',  price: () => props.beat.priceStandard,  features: ['Archivo MP3', '10k Streams', 'Sin Radio'], class: 'standard' },
  { key: 'Premium',   label: 'Premium',   price: () => props.beat.pricePremium,   features: ['MP3 + WAV', '500k Streams', 'Radio Regional'], class: 'premium' },
  { key: 'Exclusiva', label: 'Exclusiva', price: () => props.beat.priceExclusive, features: ['Trackouts (Stems)', 'Streams Ilimitados', 'Propiedad Total'], class: 'exclusive', gold: true }
]

async function comprarBeat(licencia, precio) {
  if (!confirm(`¿Confirmar compra de licencia ${licencia} por $${precio}?`)) return
  if (!authStore.isAuthenticated) { alert('Por favor inicia sesión para comprar'); return }
  purchasing.value = true
  try {
    const { error: ventaError } = await db.insertVenta({
      comprador: authStore.userEmail,
      titulo_beat: props.beat.title,
      precio,
      licencia
    })
    if (ventaError) { alert('Error al guardar la compra'); return }

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    if (!token) { alert('Sesión expirada'); return }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generar-contrato`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          tipo: 'beat',
          titulo: props.beat.title,
          precio,
          licencia,
          comprador: authStore.userEmail,
          vendedor: props.beat.sellerName || 'Vendedor'
        })
      }
    )
    if (response.ok) {
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Contrato_LetMC_${licencia}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      alert('¡Compra exitosa! Contrato descargado.')
    } else {
      alert('La compra se guardó pero el contrato no pudo generarse.')
    }
  } catch (err) {
    console.error(err)
    alert('Error procesando la compra.')
  } finally {
    purchasing.value = false
  }
}

async function loadComments() {
  const { data } = await commentsService.getComments(props.beat.id, 'beat')
  comments.value = data ?? []
}

async function sendComment() {
  if (!newComment.value.trim() || !authStore.isAuthenticated) return
  sending.value = true
  try {
    const { data } = await commentsService.addComment({
      userId: authStore.user.id,
      userName: authStore.userDisplayName,
      contentId: props.beat.id,
      contentType: 'beat',
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
    await favoritesService.removeFavorite(authStore.user.id, props.beat.id)
    isFav.value = false
  } else {
    await favoritesService.addFavorite(authStore.user.id, props.beat.id, 'beat')
    isFav.value = true
  }
}

async function toggleLike() {
  if (!authStore.isAuthenticated || liked.value) return
  liked.value = true
  likes.value++
  await supabase.rpc('increment_beat_likes', { beat_id: props.beat.id })
}

function copyLink() {
  navigator.clipboard.writeText(`${window.location.origin}/sound`)
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

function close() {
  const audio = document.querySelector('.beat-modal-audio')
  if (audio) audio.pause()
  emit('close')
}

onMounted(async () => {
  await loadComments()
  if (authStore.isAuthenticated) {
    isFav.value = await favoritesService.isFavorite(authStore.user.id, props.beat.id)
  }
  channel = commentsService.subscribe(props.beat.id, 'beat', (newC) => {
    if (!comments.value.find(c => c.id === newC.id)) comments.value.push(newC)
  })
})

onUnmounted(() => commentsService.unsubscribe(channel))
</script>

<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <button class="close-modal" @click="close">&times;</button>

      <div class="modal-grid">
        <!-- Left -->
        <div class="modal-left">
          <img :src="beat.coverUrl" :alt="beat.title" class="modal-img" />

          <div class="audio-player-container">
            <p class="audio-label">Preview Track</p>
            <audio controls class="custom-audio beat-modal-audio">
              <source :src="beat.audioSrc ?? beatDemoFallback" type="audio/mpeg" />
            </audio>
          </div>

          <div class="beat-details">
            <h4>Detalles</h4>
            <ul>
              <li><strong>Artista</strong><span>{{ beat.sellerName }}</span></li>
              <li><strong>BPM</strong><span>{{ beat.bpm }}</span></li>
              <li><strong>Key</strong><span>{{ beat.key }}</span></li>
              <li><strong>Scale</strong><span>{{ beat.scale }}</span></li>
              <li><strong>Fecha</strong><span>{{ beat.date }}</span></li>
            </ul>
          </div>

          <div v-if="beat.tags?.length" class="beat-tags">
            <span v-for="tag in beat.tags" :key="tag" class="tag">#{{ tag }}</span>
          </div>
        </div>

        <!-- Right -->
        <div class="modal-right">
          <span class="beat-type-badge">{{ beat.type }}</span>
          <h2 class="beat-title">{{ beat.title }}</h2>
          <p class="beat-desc">{{ beat.description }}</p>

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
          </div>

          <!-- Tabs -->
          <div class="tabs">
            <button :class="['tab', { active: activeTab === 'buy' }]" @click="activeTab = 'buy'">
              <i class="ri-shopping-bag-fill"></i> Licencias
            </button>
            <button :class="['tab', { active: activeTab === 'comments' }]" @click="activeTab = 'comments'">
              <i class="ri-chat-3-fill"></i> Comentarios <span class="tab-count">{{ comments.length }}</span>
            </button>
          </div>

          <!-- Tab: Licencias -->
          <div v-if="activeTab === 'buy'" class="tab-content">
            <div class="pricing-cards">
              <div v-for="lic in licenses" :key="lic.key" :class="['price-card', lic.class]">
                <div class="card-header">
                  <h4>{{ lic.label }}</h4>
                  <span class="price">${{ lic.price().toFixed(2) }}</span>
                </div>
                <ul class="features">
                  <li v-for="f in lic.features" :key="f">{{ f }}</li>
                </ul>
                <button @click="comprarBeat(lic.key, lic.price())" :class="['buy-btn', { gold: lic.gold }]" :disabled="purchasing">
                  {{ purchasing ? '...' : 'COMPRAR' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Tab: Comentarios -->
          <div v-if="activeTab === 'comments'" class="tab-content comments-tab">
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
                <input v-model="newComment" type="text" placeholder="Añade un comentario..." class="comment-input" @keyup.enter="sendComment" :disabled="sending" />
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
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.88); backdrop-filter: blur(6px); z-index: 2000; display: flex; justify-content: center; align-items: center; padding: 20px; }
.modal-content { background: var(--bg-surface, #121212); width: 100%; max-width: 1000px; border-radius: 20px; border: 1px solid var(--border, #333); box-shadow: 0 10px 40px rgba(0,0,0,0.8); position: relative; max-height: 90vh; overflow-y: auto; }
.close-modal { position: absolute; top: 15px; right: 20px; background: none; border: none; color: var(--text); font-size: 2rem; cursor: pointer; z-index: 10; }
.modal-grid { display: grid; grid-template-columns: 320px 1fr; }

.modal-left { background: rgba(0,0,0,0.3); padding: 24px; display: flex; flex-direction: column; align-items: center; border-right: 1px solid var(--border, #222); gap: 14px; }
.modal-img { width: 100%; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.5); }
.audio-player-container { width: 100%; text-align: center; }
.audio-label { color: var(--text-muted, #888); font-size: 0.72rem; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
.custom-audio { width: 100%; height: 36px; border-radius: 20px; }
.beat-details { width: 100%; background: var(--bg-card); padding: 14px; border-radius: 10px; }
.beat-details h4 { color: var(--text, #fff); margin-bottom: 8px; font-size: 0.875rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 5px; }
.beat-details ul { list-style: none; padding: 0; margin: 0; }
.beat-details li { color: var(--text-soft, #ccc); font-size: 0.82rem; margin-bottom: 5px; display: flex; justify-content: space-between; gap: 8px; }
.beat-details li strong { color: #b11db9; white-space: nowrap; }
.beat-tags { display: flex; flex-wrap: wrap; gap: 5px; width: 100%; }
.tag { background: rgba(177,29,185,0.15); color: #b11db9; padding: 2px 8px; border-radius: 20px; font-size: 0.72rem; }

.modal-right { padding: 28px; display: flex; flex-direction: column; }
.beat-type-badge { display: inline-block; background: rgba(177,29,185,0.2); color: #b11db9; padding: 2px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
.beat-title { font-family: 'Impact', sans-serif; font-size: 2rem; color: var(--text, #fff); margin-bottom: 10px; line-height: 1.1; }
.beat-desc { color: var(--text-soft, #bbb); line-height: 1.6; margin-bottom: 16px; font-size: 0.875rem; }

.quick-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
.action-btn { display: flex; align-items: center; gap: 5px; background: var(--input-bg); border: 1px solid var(--border); color: var(--text-muted, #aaa); padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; cursor: pointer; transition: all 0.2s; }
.action-btn:hover { border-color: #b11db9; color: var(--text, #fff); }
.action-btn.active { background: rgba(177,29,185,0.2); border-color: #b11db9; color: #b11db9; }
.action-btn i { font-size: 0.9rem; margin: 0; }

.tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.tab { display: flex; align-items: center; gap: 6px; background: transparent; border: none; color: var(--text-muted, #888); padding: 8px 14px; font-size: 0.82rem; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.2s; }
.tab:hover { color: var(--text, #fff); }
.tab.active { color: #b11db9; border-bottom-color: #b11db9; }
.tab i { font-size: 0.9rem; margin: 0; }
.tab-count { background: rgba(177,29,185,0.2); color: #b11db9; padding: 1px 6px; border-radius: 10px; font-size: 0.7rem; }

.tab-content { flex: 1; }

.pricing-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.price-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 14px; text-align: center; transition: border-color 0.2s; display: flex; flex-direction: column; gap: 8px; }
.price-card:hover { border-color: #b11db9; }
.price-card.exclusive:hover { border-color: #ffd700; }
.card-header h4 { color: var(--text, #fff); margin: 0; font-size: 0.875rem; }
.price { display: block; font-size: 1.4rem; color: var(--text, #fff); font-weight: bold; margin: 6px 0; }
.features { list-style: none; padding: 0; margin: 0; color: var(--text-muted, #888); font-size: 0.78rem; text-align: left; }
.features li { padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.buy-btn { background: transparent; border: 1px solid #b11db9; color: #b11db9; padding: 8px; border-radius: 20px; font-weight: bold; cursor: pointer; transition: all 0.2s; width: 100%; font-size: 0.8rem; }
.buy-btn:hover:not(:disabled) { background: #b11db9; color: var(--text); }
.buy-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.buy-btn.gold { border-color: #ffd700; color: #ffd700; }
.buy-btn.gold:hover:not(:disabled) { background: #ffd700; color: #000; }

.comments-tab { display: flex; flex-direction: column; height: 280px; }
.comments-list { flex: 1; overflow-y: auto; padding-right: 4px; margin-bottom: 10px; }
.no-comments { color: var(--text-muted, #555); font-size: 0.82rem; text-align: center; padding: 2rem 0; }
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
.comment-input-row { display: flex; align-items: center; gap: 7px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px; }
.comment-avatar-sm { width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #b11db9, #7b2cbf); display: flex; align-items: center; justify-content: center; color: var(--text); font-size: 0.68rem; font-weight: 700; }
.comment-input { flex: 1; background: var(--input-bg); border: 1px solid var(--border); border-radius: 20px; color: var(--text, #fff); padding: 6px 12px; font-size: 0.82rem; outline: none; }
.comment-input:focus { border-color: #b11db9; }
.comment-input::placeholder { color: var(--text-muted, #555); }
.send-btn { width: 28px; height: 28px; border-radius: 50%; background: #b11db9; border: none; color: var(--text); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.8rem; }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.login-note { color: var(--text-muted, #666); font-size: 0.82rem; flex: 1; }
.login-note a { color: #b11db9; text-decoration: none; }

@media (max-width: 768px) {
  .modal-grid { grid-template-columns: 1fr; }
  .modal-left { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .pricing-cards { grid-template-columns: 1fr; }
  .beat-title { font-size: 1.5rem; }
  .modal-right { padding: 18px; }
}
</style>
