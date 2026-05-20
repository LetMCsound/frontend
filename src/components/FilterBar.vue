<script>
export default {
  name: 'FilterBar',
  props: {
    genres: {
      type: Array,
      default: () => ['All', 'Trap', 'Drill', 'Lo-fi', 'R&B', 'Pop', 'Hip-hop']
    },
    modelValue: {
      type: String,
      default: 'All'
    }
  },
  emits: ['update:modelValue']
}
</script>

<template>
  <div class="filter-bar">
    <button
      v-for="g in genres"
      :key="g"
      :class="['pill', { active: modelValue === g }]"
      @click="$emit('update:modelValue', g)"
    >{{ g }}</button>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pill {
  background: var(--bg-secondary, #0f0f14);
  color: var(--text-muted, #888);
  border: 1px solid var(--border-color, #2a2a35);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.pill:hover {
  border-color: var(--accent-color, #b259ff);
  color: var(--accent-color, #b259ff);
}

.pill.active {
  background: var(--accent-color, #b259ff);
  color: #fff;
  border-color: var(--accent-color, #b259ff);
}
</style>
