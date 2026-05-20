<script>
export default {
  name: 'CoverCard',
  props: {
    cover: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    badge: { type: String, default: '' },
    likes: { type: [String, Number], default: '' },
    height: { type: String, default: '190px' }
  }
}
</script>

<template>
  <div
    class="cover-card"
    :style="{ backgroundImage: `url('${cover}')`, height }"
  >
    <!-- Slot para contenido extra (ej: play overlay, price tag) -->
    <slot />

    <!-- Info inferior -->
    <div class="card-info">
      <h3>{{ title }}</h3>
      <p v-if="subtitle">{{ subtitle }}</p>
      <div v-if="badge || likes" class="card-stats">
        <span v-if="badge" class="type-badge">{{ badge }}</span>
        <span v-if="likes" class="card-likes">
          <i class="ri-heart-fill"></i> {{ likes }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cover-card {
  position: relative;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.25s, box-shadow 0.25s;
}

.cover-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
}

/* Gradiente inferior */
.cover-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.88) 30%, transparent 70%);
  pointer-events: none;
}

/* Info */
.card-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.85rem 1rem;
  z-index: 1;
}

.card-info h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.15rem;
}

.card-info p {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.65);
  margin-bottom: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
}

.type-badge {
  font-weight: 700;
  color: var(--accent-color, #b259ff);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.card-likes {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: rgba(255, 255, 255, 0.7);
}

.card-likes i {
  color: var(--accent-color, #b259ff);
  font-size: 0.65rem;
}
</style>
