<script setup>
import { useAuthStore } from '@/stores/auth'
import ConversationsList from '@/modules/chat/components/ConversationsList.vue'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
</script>

<template>
  <div>
    <ConversationsList v-if="authStore.isAuthenticated" />
    <div v-else class="not-auth">
      <i class="ri-chat-lock-fill"></i>
      <h2>Inicia sesión para ver tus mensajes</h2>
      <button @click="router.push('/profile')">Iniciar sesión</button>
    </div>
  </div>
</template>

<style scoped>
.not-auth {
  display: flex; flex-direction: column; align-items: center;
  gap: 1rem; padding: 5rem 2rem; color: #555; text-align: center;
}
.not-auth i { font-size: 4rem; color: #333; }
.not-auth h2 { color: var(--text-muted); font-size: 1.2rem; }
.not-auth button {
  background: #b11db9; color: var(--text); border: none;
  padding: 10px 24px; border-radius: 20px;
  font-size: 0.95rem; font-weight: 600; cursor: pointer;
}
</style>
