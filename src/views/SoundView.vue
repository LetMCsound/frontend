<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBeats } from '@/composables/useBeats'
import SearchBar from '@/components/ui/SearchBar.vue'
import StateDisplay from '@/components/ui/StateDisplay.vue'
import BeatCard from '@/modules/beats/components/BeatCard.vue'
import BeatModal from '@/modules/beats/components/BeatModal.vue'

const { beats, loading, error, isEmpty, fetchBeats, searchBeats } = useBeats()

const searchQuery  = ref('')
const activeFilter = ref(null)
const selectedBeat = ref(null)

const filters = [
  { label: 'Todos',    value: null,     icon: 'ri-apps-line' },
  { label: 'Beats',    value: 'Beat',   icon: 'ri-music-2-fill' },
  { label: 'Songs',    value: 'Song',   icon: 'ri-mic-fill' },
  { label: 'Samples',  value: 'Sample', icon: 'ri-sound-module-fill' },
]

const genreFilters = ['Trap','Drill','R&B','Brazilian Funk','Jersey','Lo-Fi','Pop']

const activeGenre = ref(null)

const displayedBeats = computed(() => {
  if (!activeFilter.value && !activeGenre.value) return beats.value
  return beats.value.filter(b => {
    const matchType  = !activeFilter.value || b.type === activeFilter.value
    const matchGenre = !activeGenre.value  || b.genre?.toLowerCase().includes(activeGenre.value.toLowerCase())
    return matchType && matchGenre
  })
})

async function onSearch(q) {
  if (q.trim()) {
    await searchBeats(q)
  } else {
    await fetchBeats()
  }
}

async function onFilterChange(val) {
  activeFilter.value = val
  if (!searchQuery.value) await fetchBeats({ type: val || undefined })
}

onMounted(() => fetchBeats())
</script>

<template>
  <div class="sound-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-text">
        <h1>Sounds</h1>
        <p>Beats, melodías y samples listos para licenciar</p>
      </div>
      <div class="header-stats" v-if="beats.length">
        <span class="stat-pill">
          <i class="ri-music-2-fill"></i> {{ beats.length }} tracks
        </span>
      </div>
    </div>

    <!-- Búsqueda -->
    <SearchBar
      v-model="searchQuery"
      v-model:activeFilter="activeFilter"
      placeholder="Buscar beats, géneros, artistas..."
      :filters="filters"
      @search="onSearch"
      @update:activeFilter="onFilterChange"
    />

    <!-- Filtros de género -->
    <div class="genre-chips">
      <button
        v-for="g in genreFilters"
        :key="g"
        :class="['genre-chip', { active: activeGenre === g }]"
        @click="activeGenre = activeGenre === g ? null : g"
      >
        {{ g }}
      </button>
    </div>

    <!-- Estado -->
    <StateDisplay
      :loading="loading"
      :error="error"
      :empty="!loading && !error && displayedBeats.length === 0"
      empty-msg="No se encontraron tracks con ese criterio."
      @retry="fetchBeats()"
    />

    <!-- Grid de beats -->
    <div v-if="!loading && !error && displayedBeats.length" class="beats-grid">
      <BeatCard
        v-for="beat in displayedBeats"
        :key="beat.id"
        v-bind="beat"
        @click="selectedBeat = beat"
      />
    </div>

    <!-- Modal -->
    <BeatModal
      v-if="selectedBeat"
      :beat="selectedBeat"
      @close="selectedBeat = null"
    />
  </div>
</template>

<style scoped>
.sound-page { padding: 2rem; }

.page-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
}
.header-text h1 {
  font-family: 'Impact', sans-serif; font-size: 2.5rem;
  color: var(--text); line-height: 1; margin-bottom: 6px;
}
.header-text p { color: #888; font-size: 0.95rem; }
.stat-pill {
  display: flex; align-items: center; gap: 6px;
  background: rgba(177,29,185,0.15); color: #b11db9;
  padding: 6px 14px; border-radius: 20px; font-size: 0.82rem; font-weight: 600;
}

.genre-chips {
  display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 1.5rem;
}
.genre-chip {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
  color: #888; padding: 5px 14px; border-radius: 20px;
  font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
}
.genre-chip:hover { border-color: #b11db9; color: #fff; }
.genre-chip.active { background: rgba(177,29,185,0.2); border-color: #b11db9; color: #b11db9; font-weight: 600; }

.beats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
}

@media (max-width: 768px) {
  .sound-page { padding: 1rem; }
  .header-text h1 { font-size: 1.8rem; }
  .beats-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
}

@media (max-width: 480px) {
  .beats-grid { grid-template-columns: 1fr; }
}
</style>
