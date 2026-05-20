import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notificationsService } from '@/services/notifications'
import { useAuthStore } from './auth'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([])
  const loading = ref(false)
  let channel = null

  const unread = computed(() =>
    notifications.value.filter(n => !n.is_read)
  )
  const unreadCount = computed(() => unread.value.length)

  function iconForType(type) {
    const icons = {
      new_message:      'ri-chat-3-fill',
      new_offer:        'ri-hand-coin-fill',
      offer_accepted:   'ri-check-double-fill',
      offer_rejected:   'ri-close-circle-fill',
      contract_signed:  'ri-file-text-fill'
    }
    return icons[type] || 'ri-notification-fill'
  }

  function colorForType(type) {
    const colors = {
      new_message:      '#b11db9',
      new_offer:        '#f39c12',
      offer_accepted:   '#2ecc71',
      offer_rejected:   '#e74c3c',
      contract_signed:  '#3498db'
    }
    return colors[type] || '#888'
  }

  async function load() {
    const authStore = useAuthStore()
    if (!authStore.user) return
    loading.value = true
    const { data } = await notificationsService.getNotifications(authStore.user.id)
    notifications.value = (data ?? []).map(n => ({
      ...n,
      icon: iconForType(n.type),
      color: colorForType(n.type)
    }))
    loading.value = false
  }

  async function markAsRead(id) {
    await notificationsService.markAsRead(id)
    const n = notifications.value.find(n => n.id === id)
    if (n) n.is_read = true
  }

  async function markAllAsRead() {
    const authStore = useAuthStore()
    if (!authStore.user) return
    await notificationsService.markAllAsRead(authStore.user.id)
    notifications.value.forEach(n => n.is_read = true)
  }

  function addNotification(raw) {
    notifications.value.unshift({
      ...raw,
      icon: iconForType(raw.type),
      color: colorForType(raw.type)
    })
  }

  function startListening(userId) {
    channel = notificationsService.subscribeToNotifications(userId, (newNotif) => {
      addNotification(newNotif)
      // Browser notification si el tab no está activo
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(newNotif.title, {
          body: newNotif.body || '',
          icon: '/assets/letmc.png'
        })
      }
    })
  }

  function stopListening() {
    notificationsService.unsubscribe(channel)
    channel = null
  }

  return {
    notifications,
    loading,
    unread,
    unreadCount,
    load,
    markAsRead,
    markAllAsRead,
    addNotification,
    startListening,
    stopListening
  }
})
