<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NotificationsBell from '@/components/ui/NotificationsBell.vue'

const router = useRouter()
const authStore = useAuthStore()
const searchQuery = ref('')

function onSearch() {
  if (searchQuery.value.trim()) {
    router.push({ name: 'sound', query: { q: searchQuery.value } })
  }
}
</script>

<template>
  <header class="topbar">
    <!-- Search -->
    <div class="search-wrap">
      <i class="ri-search-line"></i>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Explore"
        @keyup.enter="onSearch"
      />
    </div>

    <div class="topbar-right">
      <!-- Notifications bell -->
      <NotificationsBell v-if="authStore.isAuthenticated" />

      <!-- User avatar -->
      <div
        v-if="authStore.isAuthenticated"
        class="user-avatar"
        @click="router.push('/profile')"
        :title="authStore.userDisplayName"
      >
        {{ authStore.userDisplayName.charAt(0).toUpperCase() }}
      </div>
      <button v-else class="login-btn" @click="router.push('/profile')">
        <i class="ri-user-line"></i> Login
      </button>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex; align-items: center; gap: 1rem;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  background: rgba(11,11,15,0.95);
  backdrop-filter: blur(10px);
  position: sticky; top: 0; z-index: 90;
}

.search-wrap {
  display: flex; align-items: center; gap: 8px;
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: 20px; padding: 8px 16px; flex: 1; max-width: 400px;
  transition: border-color 0.2s;
}
.search-wrap:focus-within { border-color: #b11db9; }
.search-wrap i { color: #555; font-size: 0.95rem; }
.search-wrap input {
  background: transparent; border: none; outline: none;
  color: var(--text); font-size: 0.9rem; width: 100%;
}
.search-wrap input::placeholder { color: #555; }

.topbar-right { display: flex; align-items: center; gap: 10px; margin-left: auto; }

.user-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: linear-gradient(135deg, #b11db9, #7b2cbf);
  display: flex; align-items: center; justify-content: center;
  color: var(--text); font-weight: 700; font-size: 0.9rem;
  cursor: pointer; transition: transform 0.2s;
}
.user-avatar:hover { transform: scale(1.08); }

.login-btn {
  display: flex; align-items: center; gap: 6px;
  background: transparent; border: 1px solid rgba(255,255,255,0.2);
  color: var(--text-muted); padding: 6px 14px; border-radius: 20px;
  font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
}
.login-btn:hover { border-color: #b11db9; color: #b11db9; }
</style>
