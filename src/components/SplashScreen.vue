<script setup>
import { ref, onMounted } from 'vue'

const visible = ref(true)

onMounted(() => {
  setTimeout(() => {
    visible.value = false
  }, 1800)
})
</script>

<template>
  <Transition name="splash">
    <div v-if="visible" class="splash">
      <div class="splash-content">
        <img src="/assets/letmc.png" alt="LetMC Sound" class="splash-logo" />
        <div class="splash-bar">
          <div class="splash-progress"></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.splash {
  position: fixed; inset: 0;
  background: #0b0b0f;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}
.splash-logo {
  width: 160px;
  animation: pulse 1s ease-in-out infinite alternate;
}
.splash-bar {
  width: 160px;
  height: 3px;
  background: rgba(177,29,185,0.2);
  border-radius: 3px;
  overflow: hidden;
}
.splash-progress {
  height: 100%;
  background: linear-gradient(90deg, #b11db9, #d4a0ff);
  border-radius: 3px;
  animation: load 1.6s ease-out forwards;
}
@keyframes pulse {
  from { opacity: 0.7; transform: scale(0.97); }
  to   { opacity: 1;   transform: scale(1); }
}
@keyframes load {
  from { width: 0%; }
  to   { width: 100%; }
}
.splash-enter-active, .splash-leave-active {
  transition: opacity 0.4s ease;
}
.splash-enter-from, .splash-leave-to {
  opacity: 0;
}
</style>
