<script setup>
import { useConfirmState, closeConfirm } from '@/composables/useConfirm'
import { onMounted, onUnmounted, watch } from 'vue'

const state = useConfirmState()

function onConfirm() { closeConfirm(true) }
function onCancel()  { closeConfirm(false) }

function onKey(e) {
  if (!state.value.open) return
  if (e.key === 'Escape') onCancel()
  if (e.key === 'Enter')  onConfirm()
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

// Bloquear scroll del body cuando está abierto
watch(() => state.value.open, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="state.open" class="confirm-overlay" @click.self="onCancel">
        <div class="confirm-box" :class="{ danger: state.danger }">
          <div class="confirm-icon">
            <i :class="state.danger ? 'ri-error-warning-fill' : 'ri-question-fill'"></i>
          </div>
          <h3 class="confirm-title">{{ state.title }}</h3>
          <p class="confirm-message">{{ state.message }}</p>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="onCancel">{{ state.cancelText }}</button>
            <button :class="['btn-confirm', { danger: state.danger }]" @click="onConfirm">
              {{ state.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex; justify-content: center; align-items: center;
  padding: 20px;
}

.confirm-box {
  background: linear-gradient(145deg, #1a1a1d 0%, #0b0b0f 100%);
  border: 1px solid rgba(177, 29, 185, 0.4);
  border-radius: 18px;
  padding: 30px 28px;
  max-width: 420px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(177, 29, 185, 0.15);
  animation: pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.confirm-box.danger {
  border-color: rgba(255, 77, 77, 0.4);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(255, 77, 77, 0.15);
}

@keyframes pop {
  from { transform: scale(0.85); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}

.confirm-icon {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: rgba(177, 29, 185, 0.15);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
  font-size: 2rem;
  color: #b11db9;
}
.confirm-box.danger .confirm-icon {
  background: rgba(255, 77, 77, 0.15);
  color: #ff4d4d;
}

.confirm-title {
  font-family: 'Impact', sans-serif;
  font-size: 1.5rem;
  letter-spacing: 0.5px;
  color: #fff;
  margin-bottom: 8px;
}

.confirm-message {
  color: #bbb;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 22px;
}

.confirm-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 11px 20px;
  border-radius: 25px;
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.06);
  color: #ccc;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.btn-confirm {
  background: linear-gradient(135deg, #b11db9, #8b1589);
  color: #fff;
}
.btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(177, 29, 185, 0.4);
}

.btn-confirm.danger {
  background: linear-gradient(135deg, #ff4d4d, #c92a2a);
}
.btn-confirm.danger:hover {
  box-shadow: 0 6px 20px rgba(255, 77, 77, 0.4);
}

/* Transición de fade */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
