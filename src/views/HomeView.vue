<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBeats } from '@/composables/useBeats'
import BeatCard from '@/modules/beats/components/BeatCard.vue'
import BeatModal from '@/modules/beats/components/BeatModal.vue'
import StateDisplay from '@/components/ui/StateDisplay.vue'

const router = useRouter()
const { popular, loading, error, fetchPopular } = useBeats()
const selectedBeat = ref(null)

onMounted(() => fetchPopular(4))

const categories = [
  { label: 'Sounds',    desc: 'Beats, melodías y samples',    icon: 'ri-music-2-fill',      route: '/sound',          img: '/assets/musicians.png' },
  { label: 'Musicians', desc: 'Artistas y compositores',      icon: 'ri-user-star-fill',    route: '/musicians',      img: '/assets/musicians.png' },
  { label: 'Lyrics',   desc: 'Letras listas para licenciar', icon: 'ri-file-music-fill',   route: '/lyrics',         img: '/assets/lyrics.png' },
  { label: 'Graphic',  desc: 'Portadas y diseño gráfico',    icon: 'ri-brush-fill',        route: '/graphic-design', img: '/assets/kairoportada1.jpg' },
  { label: 'Film',     desc: 'Contenido visual y reel',      icon: 'ri-clapperboard-fill', route: '/film-makers',    img: '/assets/kairoProyect1.jpg' },
]
</script>

<template>
  <div class="home-page">

    <!-- Hero banner -->
    <section class="banner">
      <div class="banner-bg"></div>
      <div class="banner-overlay"></div>
      <div class="banner-logo-wrap">
        <img src="/assets/letmc.png" alt="LetMC Sound" class="banner-logo" />
      </div>
    </section>

    <!-- Categorías -->
    <section class="section">
      <div class="section-header">
        <h2>¿Qué estás buscando?</h2>
      </div>
      <div class="categories-grid">
        <div
          v-for="cat in categories"
          :key="cat.label"
          class="cat-card"
          :style="`background-image: url('${cat.img}')`"
          @click="cat.route && router.push(cat.route)"
        >
          <div class="cat-overlay">
            <i :class="cat.icon"></i>
            <h3>{{ cat.label }}</h3>
            <p>{{ cat.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Popular ahora -->
    <section class="section">
      <div class="section-header">
        <h2><i class="ri-fire-fill" style="color:#b11db9; margin:0; font-size:1.2rem"></i> Popular ahora</h2>
        <button class="see-all" @click="router.push('/sound')">
          Ver todo <i class="ri-arrow-right-line" style="margin:0; font-size:0.9rem"></i>
        </button>
      </div>

      <StateDisplay
        :loading="loading"
        :error="error"
        :empty="!loading && !error && popular.length === 0"
        empty-msg="No hay beats populares aún."
        @retry="fetchPopular(4)"
      />

      <div v-if="!loading && !error && popular.length" class="beats-grid">
        <BeatCard
          v-for="beat in popular"
          :key="beat.id"
          v-bind="beat"
          @click="selectedBeat = beat"
        />
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="cta-content">
        <h2>¿Eres creador?</h2>
        <p>Sube tus beats, letras y proyectos. Llega a miles de artistas.</p>
        <button class="btn-hero-primary" @click="router.push('/profile')">
          <i class="ri-rocket-fill"></i> Empieza a vender
        </button>
      </div>
    </section>

    <BeatModal v-if="selectedBeat" :beat="selectedBeat" @close="selectedBeat = null" />
  </div>
</template>

<style scoped>
.home-page { background: var(--bg); }

/* ── Banner ───────────────────────────────────────── */
.banner {
  position: relative;
  height: 260px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  overflow: hidden;
}

/* Fondo con imagen de ondas */
.banner-bg {
  position: absolute; inset: 0;
  background-image: url('/assets/fondo.png');
  background-size: cover;
  background-position: center;
  background-color: #1a0a2e;
}

/* Overlay sutil para profundidad */
.banner-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(11,11,15,0.2) 0%,
    rgba(11,11,15,0.1) 40%,
    rgba(11,11,15,0.55) 100%
  );
}

.banner-logo-wrap {
  position: relative;
  z-index: 1;
  padding: 2.5rem 3rem;
  align-self: flex-start;
}

.banner-logo {
  width: 280px;
  opacity: 0.9;
  display: block;
}

/* Botones del banner — siempre con contraste sobre fondo oscuro */
.btn-hero-primary {
  display: inline-flex; align-items: center; gap: 8px;
  margin: 0 auto;
  background: #b11db9; color: #fff !important; border: none;
  padding: 12px 28px; border-radius: 30px;
  font-size: 0.95rem; font-weight: 600; cursor: pointer;
  transition: background 0.2s, transform 0.2s;
  font-family: 'Poppins', sans-serif;
}
.btn-hero-primary:hover { background: #9a18a3; transform: translateY(-2px); }

.btn-hero-outline {
  display: inline-flex; align-items: center; gap: 8px;
  margin: 0 auto;
  background: transparent; color: #fff !important;
  border: 1px solid rgba(255,255,255,0.5);
  padding: 12px 28px; border-radius: 30px;
  font-size: 0.95rem; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
  font-family: 'Poppins', sans-serif;
}
.btn-hero-outline:hover { border-color: #fff; background: rgba(255,255,255,0.1); }

/* ── Sections ─────────────────────────────────────── */
.section { padding: 2rem; background: var(--bg); }

.section-header {
  display: flex; justify-content: space-between;
  align-items: center; margin-bottom: 1.25rem;
}
.section-header h2 {
  font-size: 1.3rem; font-weight: 700;
  color: var(--text);
  display: flex; align-items: center; gap: 8px;
}
.see-all {
  display: flex; align-items: center; gap: 4px;
  background: none; border: none; color: #b11db9;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  transition: gap 0.2s; font-family: 'Poppins', sans-serif;
}
.see-all:hover { gap: 8px; }

/* ── Categories ───────────────────────────────────── */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.875rem;
}

.cat-card {
  height: 190px; border-radius: 14px;
  background-size: cover; background-position: center;
  position: relative; overflow: hidden;
  cursor: pointer;
  transition: transform 0.25s, box-shadow 0.25s;
  border: 1px solid rgba(255,255,255,0.06);
}
.cat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.4);
}

.cat-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(
    to top,
    rgba(0,0,0,0.88) 0%,
    rgba(0,0,0,0.45) 55%,
    transparent 100%
  );
  display: flex; flex-direction: column;
  justify-content: flex-end; padding: 1rem 1.1rem;
}
.cat-overlay i {
  font-size: 1.4rem; color: #b11db9;
  margin: 0 0 4px; display: block;
}
.cat-overlay h3 {
  font-size: 0.95rem; font-weight: 700;
  color: #fff !important; margin-bottom: 2px;
}
.cat-overlay p {
  font-size: 0.72rem;
  color: rgba(255,255,255,0.7) !important;
}

/* ── Beats grid ───────────────────────────────────── */
.beats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}

/* ── CTA ──────────────────────────────────────────── */
.cta-section {
  margin: 0 2rem 2rem;
  background: linear-gradient(135deg, rgba(177,29,185,0.18) 0%, rgba(177,29,185,0.04) 100%);
  border: 1px solid rgba(177,29,185,0.25);
  border-radius: 16px; padding: 3rem 2rem;
  text-align: center;
}
.cta-content h2 {
  font-family: 'Impact', sans-serif;
  font-size: 2.5rem;
  color: var(--text) !important;
  margin-bottom: 0.75rem;
}
.cta-content p {
  color: var(--text-muted) !important;
  margin-bottom: 1.5rem;
  font-size: 1rem;
}

/* ── Responsive ───────────────────────────────────── */
@media (max-width: 1200px) {
  .categories-grid { grid-template-columns: repeat(3, 1fr); }
  .beats-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .banner { height: 340px; }
  .banner-title { font-size: 2rem; }
  .section { padding: 1rem; }
  .categories-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
  .beats-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
  .cta-section { margin: 0 1rem 1rem; padding: 2rem 1rem; }
  .cta-content h2 { font-size: 1.8rem; }
}
@media (max-width: 480px) {
  .beats-grid { grid-template-columns: 1fr; }
  .banner-logo { width: 70px; }
  .banner-title { font-size: 1.75rem; }
}
</style>
