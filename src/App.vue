<script setup>
import MainLayout from '@/layouts/MainLayout.vue'
import SplashScreen from '@/components/SplashScreen.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { useTheme } from '@/composables/useTheme'
import { useRoute, useRouter } from 'vue-router'
import { computed, onMounted, onBeforeUnmount } from 'vue'

// Apply saved theme on mount
const { theme } = useTheme()

const route = useRoute()
const router = useRouter()
const isStandalone = computed(() => route.meta.standalone === true)

// Atajo oculto: Ctrl + Shift + P abre la presentación en una pestaña nueva
const onKeydown = (e) => {
  if (e.ctrlKey && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
    e.preventDefault()
    const href = router.resolve({ name: 'presentation' }).href
    window.open(href, '_blank')
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <template v-if="isStandalone">
    <router-view />
  </template>
  <template v-else>
    <SplashScreen />
    <MainLayout />
    <ConfirmDialog />
  </template>
</template>
