<script setup>
const emit = defineEmits(['select', 'close'])

const types = [
  { key: 'beat',    label: 'Beat / Song / Sample', icon: 'ri-music-2-fill',      desc: 'Sube tu beat, canción o sample' },
  { key: 'lyric',   label: 'Letra',                icon: 'ri-file-music-fill',   desc: 'Publica una letra para licenciar' },
  { key: 'graphic', label: 'Diseño Gráfico',       icon: 'ri-brush-fill',        desc: 'Portadas, logos, arte visual' },
  { key: 'film',    label: 'Video / Film',         icon: 'ri-clapperboard-fill', desc: 'Videoclips, documentales, reels' },
]
</script>

<template>
  <div class="selector-overlay" @click.self="emit('close')">
    <div class="selector-box">
      <div class="selector-header">
        <h2>¿Qué quieres publicar?</h2>
        <button @click="emit('close')">&times;</button>
      </div>
      <div class="selector-grid">
        <button
          v-for="t in types"
          :key="t.key"
          class="type-card"
          @click="emit('select', t.key)"
        >
          <i :class="t.icon"></i>
          <span class="type-label">{{ t.label }}</span>
          <span class="type-desc">{{ t.desc }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.selector-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(6px);
  z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 20px;
}
.selector-box {
  background: #121212; border: 1px solid #333; border-radius: 20px;
  width: 100%; max-width: 500px; overflow: hidden;
}
.selector-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 1.5rem; border-bottom: 1px solid #222;
}
.selector-header h2 { color: #fff; font-size: 1.2rem; margin: 0; }
.selector-header button { background: none; border: none; color: #aaa; font-size: 1.5rem; cursor: pointer; }
.selector-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1.25rem; }
.type-card {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px; padding: 1.25rem 1rem;
  cursor: pointer; transition: all 0.2s; text-align: center;
}
.type-card:hover { border-color: #b11db9; background: rgba(177,29,185,0.1); transform: translateY(-2px); }
.type-card i { font-size: 2rem; color: #b11db9; }
.type-label { color: #fff; font-size: 0.9rem; font-weight: 600; }
.type-desc { color: #666; font-size: 0.75rem; }
</style>
