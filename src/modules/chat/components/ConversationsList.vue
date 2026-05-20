<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { chatService } from '@/services/chat'
import ChatWindow from './ChatWindow.vue'

const authStore = useAuthStore()
const conversations = ref([])
const loading = ref(true)
const activeConv = ref(null)

async function load() {
  loading.value = true
  const { data } = await chatService.getMyConversations(authStore.user.id)
  conversations.value = data ?? []
  loading.value = false
}

function otherName(conv) {
  return conv.buyer_id === authStore.user?.id ? conv.seller_name : conv.buyer_name
}

function statusLabel(status) {
  const labels = {
    open: 'Abierto',
    offer_pending: 'Oferta pendiente',
    accepted: 'Acordado',
    rejected: 'Rechazado',
    completed: 'Completado'
  }
  return labels[status] || status
}

function onUpdated(updated) {
  const idx = conversations.value.findIndex(c => c.id === updated.id)
  if (idx !== -1) conversations.value[idx] = updated
}

onMounted(load)
</script>

<template>
  <div class="convlist-page">
    <div class="page-header">
      <h1>Mensajes</h1>
      <span class="count-pill" v-if="conversations.length">{{ conversations.length }}</span>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando conversaciones...</p>
    </div>

    <div v-else-if="conversations.length === 0" class="empty-state">
      <i class="ri-chat-3-line"></i>
      <p>No tienes conversaciones aún.</p>
      <p class="empty-sub">Ve al perfil de un artista o a una lyric y pulsa "Contactar" para empezar.</p>
    </div>

    <div v-else class="conv-list">
      <div
        v-for="conv in conversations"
        :key="conv.id"
        class="conv-item"
        @click="activeConv = conv"
      >
        <div class="conv-avatar">
          {{ otherName(conv).charAt(0).toUpperCase() }}
        </div>
        <div class="conv-info">
          <div class="conv-top">
            <h3>{{ otherName(conv) }}</h3>
            <span :class="['status-dot', conv.status]"></span>
          </div>
          <p v-if="conv.product_title" class="conv-product">
            <i class="ri-price-tag-3-fill"></i> {{ conv.product_title }}
          </p>
          <div class="conv-bottom">
            <span :class="['status-label', conv.status]">{{ statusLabel(conv.status) }}</span>
            <span v-if="conv.final_price" class="final-price">${{ conv.final_price }}</span>
          </div>
        </div>
        <i class="ri-arrow-right-s-line arrow"></i>
      </div>
    </div>

    <!-- Chat abierto -->
    <ChatWindow
      v-if="activeConv"
      :conversation="activeConv"
      @close="activeConv = null"
      @updated="onUpdated"
    />
  </div>
</template>

<style scoped>
.convlist-page { padding: 2rem; }

.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem; }
.page-header h1 { font-family: 'Impact', sans-serif; font-size: 2.5rem; color: var(--text); }
.count-pill { background: rgba(177,29,185,0.2); color: #b11db9; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; }

.loading-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem; color: var(--text-muted); }
.spinner { width: 36px; height: 36px; border: 3px solid rgba(177,29,185,0.3); border-top-color: #b11db9; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 4rem 2rem; color: #555; text-align: center; }
.empty-state i { font-size: 3.5rem; }
.empty-state p { font-size: 0.95rem; }
.empty-sub { font-size: 0.82rem; color: #444; max-width: 300px; }

.conv-list { display: flex; flex-direction: column; gap: 8px; }
.conv-item {
  display: flex; align-items: center; gap: 14px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 14px; padding: 1rem 1.25rem;
  cursor: pointer; transition: border-color 0.2s, transform 0.2s;
}
.conv-item:hover { border-color: #b11db9; transform: translateX(4px); }

.conv-avatar {
  width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #b11db9, #7b2cbf);
  display: flex; align-items: center; justify-content: center;
  color: var(--text); font-weight: 700; font-size: 1.2rem;
}
.conv-info { flex: 1; min-width: 0; }
.conv-top { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.conv-top h3 { color: var(--text); font-size: 0.95rem; margin: 0; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.status-dot.open { background: #3498db; }
.status-dot.accepted { background: #2ecc71; }
.status-dot.completed { background: #b11db9; }
.status-dot.rejected { background: #e74c3c; }
.conv-product { color: #666; font-size: 0.78rem; margin-bottom: 6px; display: flex; align-items: center; gap: 4px; }
.conv-product i { color: #b11db9; }
.conv-bottom { display: flex; align-items: center; justify-content: space-between; }
.status-label { font-size: 0.75rem; font-weight: 600; }
.status-label.open { color: #3498db; }
.status-label.accepted { color: #2ecc71; }
.status-label.completed { color: #b11db9; }
.status-label.rejected { color: #e74c3c; }
.final-price { color: #ffd700; font-size: 0.82rem; font-weight: 700; }
.arrow { color: #444; font-size: 1.2rem; flex-shrink: 0; }

@media (max-width: 768px) {
  .convlist-page { padding: 1rem; }
  .page-header h1 { font-size: 1.8rem; }
}
</style>
