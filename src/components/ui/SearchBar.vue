<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  placeholder: { type: String, default: 'Buscar...' },
  filters: {
    type: Array,
    default: () => []
    // [{ label: 'Beats', value: 'Beat' }, ...]
  },
  modelValue: { type: String, default: '' },
  activeFilter: { type: String, default: null }
})

const emit = defineEmits(['update:modelValue', 'update:activeFilter', 'search'])

const inputVal = ref(props.modelValue)
let debounceTimer = null

watch(inputVal, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('update:modelValue', val)
    emit('search', val)
  }, 350)
})

function setFilter(val) {
  const next = props.activeFilter === val ? null : val
  emit('update:activeFilter', next)
}

function clear() {
  inputVal.value = ''
  emit('update:modelValue', '')
  emit('search', '')
}
</script>

<template>
  <div class="search-bar-wrapper">
    <div class="search-input-row">
      <i class="ri-search-line search-icon"></i>
      <input
        v-model="inputVal"
        :placeholder="placeholder"
        class="search-input"
        type="text"
      />
      <button v-if="inputVal" class="clear-btn" @click="clear">
        <i class="ri-close-line"></i>
      </button>
    </div>

    <div v-if="filters.length" class="filter-chips">
      <button
        v-for="f in filters"
        :key="f.value"
        :class="['chip', { active: activeFilter === f.value }]"
        @click="setFilter(f.value)"
      >
        <i v-if="f.icon" :class="f.icon"></i>
        {{ f.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.search-bar-wrapper { margin-bottom: 1.5rem; }

.search-input-row {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 0 1rem;
  transition: border-color 0.2s;
}
.search-input-row:focus-within { border-color: #b11db9; }

.search-icon { color: #666; font-size: 1.1rem; flex-shrink: 0; }
.search-input {
  flex: 1; background: transparent; border: none; outline: none;
  color: #fff; font-size: 0.95rem; padding: 0.75rem 0.6rem;
  width: 100%;
}
.search-input::placeholder { color: #555; }
.clear-btn {
  background: none; border: none; color: #666; cursor: pointer;
  font-size: 1.1rem; padding: 4px; display: flex; align-items: center;
  transition: color 0.2s;
}
.clear-btn:hover { color: #fff; }

.filter-chips {
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;
}
.chip {
  display: flex; align-items: center; gap: 5px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.12);
  color: #aaa; padding: 5px 14px; border-radius: 20px;
  font-size: 0.82rem; cursor: pointer; transition: all 0.2s;
  white-space: nowrap;
}
.chip:hover { border-color: #b11db9; color: #fff; }
.chip.active { background: rgba(177,29,185,0.2); border-color: #b11db9; color: #b11db9; font-weight: 600; }
.chip i { font-size: 0.9rem; }
</style>
