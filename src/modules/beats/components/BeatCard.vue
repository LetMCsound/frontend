<script setup>
defineProps({
  title: { type: String, required: true },
  genre: { type: String, default: '' },
  type: { type: String, default: 'Beat' },
  likes: { type: String, default: '0' },
  coverUrl: { type: String, required: true }
})

const emit = defineEmits(['click'])
</script>

<template>
  <div
    class="project-card"
    :style="`background-image: url('${coverUrl}')`"
    @click="emit('click')"
  >
    <div class="project-info">
      <h3>{{ title }}</h3>
      <p>{{ genre }}</p>
      <div class="project-stats">
        <span>{{ type }}</span>
        <span><i class="ri-heart-fill"></i> {{ likes }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-card {
  height: 300px;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  transition: transform 0.3s ease;
}
.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.5);
}
.project-info {
  position: absolute; bottom: 0; left: 0; width: 100%;
  padding: 15px;
  background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, transparent 100%);
  color: white; display: flex; flex-direction: column; justify-content: flex-end;
}
.project-info h3 { margin: 0 0 5px; font-size: 1.1rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.project-info p { margin: 0 0 10px; font-size: 0.85rem; color: var(--text-soft); }
.project-stats { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #b11db9; font-weight: bold; }

@media (max-width: 768px) {
  .project-card { height: 220px; }
}
</style>
