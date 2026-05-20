<script>
export default {
  name: 'SectionHeader',
  props: {
    title: { type: String, required: true },
    // Muestra borde izquierdo morado (estilo ProfileView)
    accent: { type: Boolean, default: false },
    // Ruta para el enlace "Ver todo" (estilo HomeView)
    link: { type: String, default: '' },
    linkLabel: { type: String, default: 'Ver todo' },
    // Icono a la derecha (estilo ProfileView, ej: 'ri-more-fill')
    icon: { type: String, default: '' }
  },
  emits: ['icon-click']
}
</script>

<template>
  <div :class="['section-header', { 'section-header--accent': accent }]">
    <h2>{{ title }}</h2>

    <!-- Enlace "Ver todo" -->
    <span v-if="link" class="header-link" @click="$router.push(link)">
      {{ linkLabel }} <i class="ri-arrow-right-s-line"></i>
    </span>

    <!-- Icono acción -->
    <i v-else-if="icon" :class="['header-icon', icon]" @click="$emit('icon-click')"></i>
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header--accent {
  border-left: 4px solid var(--accent-color, #b259ff);
  padding-left: 15px;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary, #fff);
  margin: 0;
}

.section-header--accent h2 {
  font-size: 1.25rem;
}

.header-link {
  font-size: 0.82rem;
  color: var(--text-muted, #888);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.1rem;
  transition: color 0.2s;
}

.header-link:hover { color: var(--accent-color, #b259ff); }

.header-icon {
  font-size: 1.25rem;
  cursor: pointer;
  color: #aaa;
  transition: color 0.2s;
}

.header-icon:hover { color: var(--accent-color, #b259ff); }
</style>
