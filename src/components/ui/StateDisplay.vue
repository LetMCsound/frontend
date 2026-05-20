<script setup>
defineProps({
  loading:  { type: Boolean, default: false },
  error:    { type: String,  default: null },
  empty:    { type: Boolean, default: false },
  emptyMsg: { type: String,  default: 'No se encontraron resultados.' }
})
const emit = defineEmits(['retry'])
</script>

<template>
  <div v-if="loading" class="state-container">
    <div class="spinner"></div>
    <p>Cargando...</p>
  </div>

  <div v-else-if="error" class="state-container error">
    <i class="ri-error-warning-fill"></i>
    <p>{{ error }}</p>
    <button @click="emit('retry')">Reintentar</button>
  </div>

  <div v-else-if="empty" class="state-container empty">
    <i class="ri-inbox-line"></i>
    <p>{{ emptyMsg }}</p>
  </div>
</template>

<style scoped>
.state-container {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 1rem; padding: 4rem 2rem;
  color: #666; text-align: center;
}
.state-container i { font-size: 3rem; }
.state-container p { font-size: 0.95rem; }

.spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(177,29,185,0.3);
  border-top-color: #b11db9;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error i { color: #ff4d4d; }
.error button {
  background: #b11db9; color: #fff; border: none;
  padding: 8px 20px; border-radius: 8px; cursor: pointer;
  font-size: 0.9rem; transition: background 0.2s;
}
.error button:hover { background: #9a18a3; }

.empty i { color: #444; }
</style>
