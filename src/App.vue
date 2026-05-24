<script setup>
import MainLayout from '@/layouts/MainLayout.vue'
import SplashScreen from '@/components/SplashScreen.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { useTheme } from '@/composables/useTheme'

// Apply saved theme on mount
const { theme } = useTheme()
</script>

<template>
  <SplashScreen />
  <MainLayout />
  <ConfirmDialog />
</template>
