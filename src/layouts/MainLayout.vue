<script setup>
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const showTopbar = computed(() => route.name !== 'profile')
</script>

<template>
  <div class="app-container">
    <Sidebar />
    <main class="main-content">
      <Topbar v-if="showTopbar" />
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
}
.main-content {
  flex: 1;
  margin-left: 72px;
  min-height: 100vh;
  background: var(--bg);
  overflow-x: hidden;
  transition: margin-left 0.3s;
}
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding-bottom: calc(60px + env(safe-area-inset-bottom));
  }
}
</style>
