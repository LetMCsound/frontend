<script setup>
import MainLayout from '@/layouts/MainLayout.vue'
import { useTheme } from '@/composables/useTheme'

// Apply saved theme on mount
const { theme } = useTheme()
</script>

<template>
  <MainLayout />
</template>
