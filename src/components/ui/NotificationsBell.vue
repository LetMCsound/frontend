<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const notifStore = useNotificationsStore()
const authStore  = useAuthStore()
const router     = useRouter()
const open       = ref(false)

function toggle() {
  open.value = !open.value
  if (open.value && notifStore.unreadCount > 0) {
    notifStore.markAllAsRead()
  }
}

function goToConversation(notif) {
  open.value = false
  notifStore.markAsRead(notif.id)
  router.push('/chat')
}

function formatTime(ts) {
  const d = new Date(ts)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'Ahora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

// Pedir permiso para notificaciones del navegador
function requestPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    notifStore.load()
    notifStore.startListening(authStore.user.id)
    requestPermission()
  }
})

onUnmounted(() => notifStore.stopListening())
</script>

<template>
  <div class="notif-wrapper">
    <!-- Campana -->
    <button class="bell-btn" @click="toggle">
      <i class="ri-notification-3-fill"></i>
      <span v-if="notifStore.unreadCount > 0" class="badge">
        {{ notifStore.unreadCount > 9 ? '9+' : notifStore.unreadCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <Teleport to="body">
      <div v-if="open" class="notif-backdrop" @click="open = false"></div>
      <div v-if="open" class="notif-dropdown">
        <div class="notif-header">
          <h3>Notificaciones</h3>
          <button
            v-if="notifStore.unreadCount > 0"
            class="mark-all-btn"
            @click="notifStore.markAllAsRead()"
          >
            Marcar todo leído
          </button>
        </div>

        <div v-if="notifStore.loading" class="notif-loading">
          <div class="spinner"></div>
        </div>

        <div v-else-if="notifStore.notifications.length === 0" class="notif-empty">
          <i class="ri-notification-off-line"></i>
          <p>Sin notificaciones</p>
        </div>

        <div v-else class="notif-list">
          <div
            v-for="notif in notifStore.notifications"
            :key="notif.id"
            :class="['notif-item', { unread: !notif.is_read }]"
            @click="goToConversation(notif)"
          >
            <div class="notif-icon" :style="`background: ${notif.color}22; color: ${notif.color}`">
              <i :class="notif.icon"></i>
            </div>
            <div class="notif-body">
              <p class="notif-title">{{ notif.title }}</p>
              <p v-if="notif.body" class="notif-text">{{ notif.body }}</p>
              <span class="notif-time">{{ formatTime(notif.created_at) }}</span>
            </div>
            <div v-if="!notif.is_read" class="unread-dot"></div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.notif-wrapper { position: relative; }

.bell-btn {
  position: relative;
  background: none; border: none; color: var(--text-muted);
  font-size: 1.3rem; cursor: pointer; padding: 6px;
  border-radius: 8px; transition: color 0.2s, background 0.2s;
  display: flex; align-items: center;
}
.bell-btn:hover { color: var(--text); background: var(--input-bg); }

.badge {
  position: absolute; top: 0; right: 0;
  background: #b11db9; color: var(--text);
  font-size: 0.6rem; font-weight: 700;
  width: 16px; height: 16px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #0b0b0f;
}

.notif-backdrop {
  position: fixed; inset: 0; z-index: 3999;
}

.notif-dropdown {
  position: fixed;
  top: 60px; right: 16px;
  width: 340px; max-height: 480px;
  background: #1a1a1d; border: 1px solid #333;
  border-radius: 16px; overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  z-index: 4000;
  display: flex; flex-direction: column;
}

.notif-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.25rem; border-bottom: 1px solid #2a2a2a; flex-shrink: 0;
}
.notif-header h3 { color: var(--text); font-size: 0.95rem; margin: 0; }
.mark-all-btn {
  background: none; border: none; color: #b11db9;
  font-size: 0.75rem; cursor: pointer; padding: 0;
}
.mark-all-btn:hover { text-decoration: underline; }

.notif-loading { display: flex; justify-content: center; padding: 2rem; }
.spinner {
  width: 28px; height: 28px;
  border: 3px solid rgba(177,29,185,0.3); border-top-color: #b11db9;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.notif-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 3rem 1rem; color: #555;
}
.notif-empty i { font-size: 2.5rem; }
.notif-empty p { font-size: 0.85rem; }

.notif-list { overflow-y: auto; flex: 1; }

.notif-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 0.9rem 1.25rem; cursor: pointer;
  transition: background 0.15s; position: relative;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.notif-item:hover { background: var(--bg-card); }
.notif-item.unread { background: rgba(177,29,185,0.05); }

.notif-icon {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem;
}
.notif-body { flex: 1; min-width: 0; }
.notif-title { color: var(--text); font-size: 0.85rem; font-weight: 600; margin-bottom: 2px; }
.notif-text { color: var(--text-muted); font-size: 0.78rem; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.notif-time { color: #555; font-size: 0.72rem; }

.unread-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #b11db9; flex-shrink: 0; margin-top: 6px;
}

@media (max-width: 480px) {
  .notif-dropdown { right: 8px; left: 8px; width: auto; }
}
</style>
