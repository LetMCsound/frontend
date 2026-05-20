<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { chatService } from '@/services/chat'
import { useRouter } from 'vue-router'
import ChatWindow from '@/modules/chat/components/ChatWindow.vue'

const props = defineProps({
  sellerId:     { type: String, required: true },
  sellerName:   { type: String, required: true },
  productId:    { type: String, default: null },
  productType:  { type: String, default: null },
  productTitle: { type: String, default: null },
  label:        { type: String, default: 'Contactar' },
  icon:         { type: String, default: 'ri-chat-3-fill' }
})

const authStore = useAuthStore()
const router = useRouter()
const loading = ref(false)
const activeConv = ref(null)

async function start() {
  if (!authStore.isAuthenticated) {
    router.push('/profile')
    return
  }
  if (authStore.user.id === props.sellerId) {
    alert('No puedes contactarte a ti mismo')
    return
  }

  loading.value = true
  try {
    const { data, error } = await chatService.getOrCreateConversation({
      buyerId:      authStore.user.id,
      sellerId:     props.sellerId,
      buyerName:    authStore.userDisplayName,
      sellerName:   props.sellerName,
      productId:    props.productId,
      productType:  props.productType,
      productTitle: props.productTitle
    })
    if (error && error.code !== 'PGRST116') throw error
    activeConv.value = data
  } catch (e) {
    console.error(e)
    alert('Error al iniciar conversación')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <button class="contact-btn" @click="start" :disabled="loading">
    <i :class="icon"></i>
    {{ loading ? '...' : label }}
  </button>

  <ChatWindow
    v-if="activeConv"
    :conversation="activeConv"
    @close="activeConv = null"
  />
</template>

<style scoped>
.contact-btn {
  display: flex; align-items: center; gap: 6px;
  background: rgba(177,29,185,0.15); border: 1px solid #b11db9;
  color: #b11db9; padding: 8px 16px; border-radius: 20px;
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  transition: all 0.2s; white-space: nowrap;
}
.contact-btn:hover:not(:disabled) { background: #b11db9; color: #fff; }
.contact-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
