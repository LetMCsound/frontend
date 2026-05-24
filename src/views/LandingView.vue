<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import GradualBlur from '@/components/ui/GradualBlur.vue'
import MagicBento from '@/components/ui/MagicBento.vue'

gsap.registerPlugin(ScrollTrigger, SplitText)

const router = useRouter()
const landingEl = ref(null)
const splits = []
const triggers = []

onMounted(() => {
  document.fonts.ready.then(() => {
    if (!landingEl.value) return
    const root = landingEl.value

    // AutoSplit con animación de líneas al hacer scroll
    const targets = root.querySelectorAll('[data-split]')
    targets.forEach((el) => {
      const split = SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line'
      })
      splits.push(split)

      const tween = gsap.from(split.lines, {
        y: 120,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      })
      triggers.push(tween.scrollTrigger)
    })

    ScrollTrigger.refresh()
  })
})

onBeforeUnmount(() => {
  triggers.forEach(t => t && t.kill())
  splits.forEach(s => s && s.revert())
  // Limpiar todos los ScrollTrigger restantes
  ScrollTrigger.getAll().forEach(t => t.kill())
})

const features = [
  {
    icon: 'ri-music-2-fill',
    color: '#b11db9',
    label: 'Music',
    title: 'Beats & Samples',
    description: 'Sube tus instrumentales con licencias Standard, Premium o Exclusiva.'
  },
  {
    icon: 'ri-quill-pen-fill',
    color: '#ff6b6b',
    label: 'Words',
    title: 'Lyrics',
    description: 'Comparte y vende letras en cualquier idioma a artistas de todo el mundo.'
  },
  {
    icon: 'ri-film-fill',
    color: '#4ecdc4',
    label: 'Visual',
    title: 'Films & Videos',
    description: 'Muestra tus producciones audiovisuales: videoclips, behind-the-scenes y más.'
  },
  {
    icon: 'ri-brush-fill',
    color: '#ffd93d',
    label: 'Design',
    title: 'Graphic Design',
    description: 'Diseños, portadas y branding para artistas. Tu portafolio es tu escaparate.'
  }
]

const advantages = [
  {
    icon: 'ri-file-text-fill',
    title: 'Contratos PDF automáticos',
    desc: 'Cada venta genera un contrato legal con todos los detalles de la licencia.'
  },
  {
    icon: 'ri-chat-3-fill',
    title: 'Chat directo con clientes',
    desc: 'Negocia precios, resuelve dudas y cierra ventas sin intermediarios.'
  },
  {
    icon: 'ri-money-euro-circle-fill',
    title: '0% comisiones',
    desc: 'Cobras el 100% de tus ventas. Nosotros no nos llevamos nada.'
  },
  {
    icon: 'ri-shield-check-fill',
    title: 'Tu contenido protegido',
    desc: 'Storage seguro, RLS por usuario y autenticación con JWT. Solo tú controlas lo que publicas.'
  }
]

const steps = [
  {
    n: 1,
    title: 'Regístrate gratis',
    desc: 'Crea tu cuenta en menos de 30 segundos. Sin tarjeta de crédito.',
    icon: 'ri-user-add-fill'
  },
  {
    n: 2,
    title: 'Sube tu contenido',
    desc: 'Beats, letras, videos o diseños. Pon tus precios y descripciones.',
    icon: 'ri-upload-cloud-2-fill'
  },
  {
    n: 3,
    title: 'Vende y conecta',
    desc: 'Recibe mensajes de compradores, cierra ventas y descarga tus contratos.',
    icon: 'ri-rocket-2-fill'
  }
]

function goRegister() { router.push('/profile') }
function goExplore() { router.push('/sound') }
</script>

<template>
  <div class="landing" ref="landingEl">

    <!-- HERO -->
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <!-- Badge primero -->
        <div class="hero-badge">
          <span class="badge-dot"></span> Plataforma para creadores musicales
        </div>

        <!-- Logo LetMCsound -->
        <div class="hero-brand">
          <img src="/assets/letmc.png" alt="LetMCsound" class="hero-logo" />
        </div>
        <h1 class="hero-title" data-split>
          Tu música.<br />
          <span class="gradient-text">Tu marketplace.</span>
        </h1>
        <p class="hero-subtitle" data-split>
          Publica tus <strong>beats</strong>, <strong>letras</strong>, <strong>videos</strong> y <strong>diseños</strong>.
          Vende directamente a artistas. Sin intermediarios, sin comisiones.
        </p>
        <div class="hero-actions">
          <button class="btn-primary-lg" @click="goRegister">
            <i class="ri-rocket-fill"></i> Empezar gratis
          </button>
          <button class="btn-outline-lg" @click="goExplore">
            <i class="ri-play-fill"></i> Explorar la plataforma
          </button>
        </div>
        <div class="hero-stats">
          <div class="stat"><strong>4</strong><span>Tipos de contenido</span></div>
          <div class="stat-divider"></div>
          <div class="stat"><strong>0%</strong><span>Comisiones</span></div>
          <div class="stat-divider"></div>
          <div class="stat"><strong>PDF</strong><span>Contratos automáticos</span></div>
        </div>
      </div>

    </section>

    <!-- QUÉ PUEDES HACER -->
    <section class="section">
      <div class="section-head">
        <span class="section-tag">¿QUÉ PUEDES HACER?</span>
        <h2 data-split>Una plataforma, <span class="gradient-text">cuatro mundos</span></h2>
        <p class="section-desc" data-split>Sea cual sea tu disciplina creativa, aquí tienes un sitio.</p>
      </div>
      <MagicBento
        :cards="features"
        :text-auto-hide="false"
        :enable-spotlight="true"
        :enable-border-glow="true"
        :enable-tilt="true"
        :enable-magnetism="true"
        :click-effect="true"
        :spotlight-radius="280"
        glow-color="177, 29, 185"
      />
    </section>

    <!-- POR QUÉ ELEGIRNOS -->
    <section class="section dark-section">
      <div class="section-head">
        <span class="section-tag">¿POR QUÉ ELEGIRNOS?</span>
        <h2 data-split>Hecho <span class="gradient-text">por y para</span> creadores</h2>
        <p class="section-desc" data-split>Lo que nos diferencia de otras plataformas.</p>
      </div>
      <div class="advantages-grid">
        <div v-for="a in advantages" :key="a.title" class="advantage-card">
          <i :class="a.icon" class="advantage-icon"></i>
          <h3>{{ a.title }}</h3>
          <p>{{ a.desc }}</p>
        </div>
      </div>
    </section>

    <!-- CÓMO FUNCIONA -->
    <section class="section">
      <div class="section-head">
        <span class="section-tag">¿CÓMO FUNCIONA?</span>
        <h2 data-split>Empieza en <span class="gradient-text">3 pasos</span></h2>
        <p class="section-desc" data-split>Tan fácil como abrir una cuenta de Spotify.</p>
      </div>
      <div class="steps">
        <div v-for="(s, i) in steps" :key="s.n" class="step">
          <div class="step-number">{{ s.n }}</div>
          <div class="step-icon"><i :class="s.icon"></i></div>
          <h3>{{ s.title }}</h3>
          <p>{{ s.desc }}</p>
          <div v-if="i < steps.length - 1" class="step-arrow"><i class="ri-arrow-right-line"></i></div>
        </div>
      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="cta-final">
      <div class="cta-final-content">
        <h2 data-split>¿Listo para <span class="gradient-text">empezar a vender</span>?</h2>
        <p data-split>Únete a la comunidad de creadores que ya confían en LetMCsound.</p>
        <button class="btn-primary-lg" @click="goRegister">
          <i class="ri-rocket-fill"></i> Crear mi cuenta gratis
        </button>
        <p class="cta-final-note">
          <i class="ri-check-line"></i> Sin tarjeta de crédito ·
          <i class="ri-check-line"></i> Cuenta gratis para siempre ·
          <i class="ri-check-line"></i> Cancela cuando quieras
        </p>
      </div>

    </section>

    <!-- ─── BLUR FIJO en top y bottom de la página ─────────
         Solo cubre el área de contenido (no sidebar ni topbar)
         La clase landing-blur ajusta offsets en main.css ─── -->
    <GradualBlur
      target="page"
      position="top"
      height="6rem"
      :strength="3"
      :div-count="6"
      curve="bezier"
      :exponential="true"
      class-name="landing-blur landing-blur-top"
    />
    <GradualBlur
      target="page"
      position="bottom"
      height="6rem"
      :strength="3"
      :div-count="6"
      curve="bezier"
      :exponential="true"
      class-name="landing-blur landing-blur-bottom"
    />

  </div>
</template>

<style scoped>
.landing {
  background: var(--bg);
  color: var(--text);
  overflow-x: hidden;
}

/* SplitText: cada línea queda dentro de un wrapper con overflow hidden ("mask") */
:deep(.split-line) {
  display: block;
  overflow: hidden;
}
[data-split] { will-change: transform; }

/* ─── HERO ──────────────────────────────────────────── */
.hero {
  position: relative;
  min-height: 90vh;
  display: flex;
  align-items: center;
  padding: 6rem 2rem 4rem;
  overflow: hidden;
}

.hero-bg {
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(177,29,185,0.25), transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(78,205,196,0.15), transparent 50%),
    radial-gradient(circle at 50% 100%, rgba(255,107,107,0.1), transparent 50%);
  z-index: 0;
  animation: pulse-bg 8s ease-in-out infinite;
}

@keyframes pulse-bg {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 1; }
}

.hero-content {
  position: relative; z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}

.hero-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  animation: fadeInDown 0.8s ease-out;
}

.hero-logo {
  height: clamp(110px, 18vw, 180px);
  width: auto;
  filter: drop-shadow(0 8px 32px rgba(177,29,185,0.55));
  transition: transform 0.3s ease;
}
.hero-logo:hover { transform: scale(1.05); }

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(177,29,185,0.1);
  border: 1px solid rgba(177,29,185,0.3);
  color: #b11db9;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}
.badge-dot {
  width: 8px; height: 8px;
  background: #b11db9;
  border-radius: 50%;
  animation: pulse-dot 1.5s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(177,29,185,0.6); }
  50%      { box-shadow: 0 0 0 8px rgba(177,29,185,0); }
}

.hero-title {
  font-family: 'Impact', sans-serif;
  font-size: clamp(1.75rem, 4vw, 3.25rem);
  line-height: 1.1;
  letter-spacing: -0.5px;
  margin-bottom: 1.25rem;
  color: var(--text);
}

.gradient-text {
  background: linear-gradient(135deg, #b11db9 0%, #ff6b6b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: var(--text-muted);
  margin-bottom: 2rem;
  line-height: 1.6;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}
.hero-subtitle strong { color: var(--text); font-weight: 600; }

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 3rem;
}

.btn-primary-lg, .btn-outline-lg {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  border: none;
  font-family: inherit;
}
.btn-primary-lg {
  background: linear-gradient(135deg, #b11db9, #8b1589);
  color: #fff;
  box-shadow: 0 8px 24px rgba(177,29,185,0.35);
}
.btn-primary-lg:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(177,29,185,0.5);
}
.btn-outline-lg {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border-strong, rgba(255,255,255,0.2));
}
.btn-outline-lg:hover {
  border-color: #b11db9;
  background: rgba(177,29,185,0.05);
}

.hero-stats {
  display: inline-flex;
  align-items: center;
  gap: 1.5rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 1rem 2rem;
  backdrop-filter: blur(8px);
}
.stat { display: flex; flex-direction: column; align-items: center; }
.stat strong {
  font-family: 'Impact', sans-serif;
  font-size: 1.8rem;
  color: var(--text);
  line-height: 1;
}
.stat span {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 4px;
}
.stat-divider {
  width: 1px;
  height: 32px;
  background: var(--border-strong, rgba(255,255,255,0.15));
}

/* ─── SECCIONES ─────────────────────────────────────── */
.section {
  padding: 5rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.dark-section {
  max-width: 100%;
  background: linear-gradient(180deg, transparent, rgba(177,29,185,0.05) 50%, transparent);
  position: relative;
}
.dark-section::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border), transparent);
}
.dark-section::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border), transparent);
}

.section-head {
  text-align: center;
  margin-bottom: 3rem;
}
.section-tag {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #b11db9;
  letter-spacing: 0.15em;
  margin-bottom: 0.75rem;
}
.section-head h2 {
  font-family: 'Impact', sans-serif;
  font-size: clamp(2rem, 5vw, 3.5rem);
  margin-bottom: 0.75rem;
  letter-spacing: -0.5px;
  color: var(--text);
}
.section-desc {
  color: var(--text-muted);
  font-size: 1.05rem;
  max-width: 600px;
  margin: 0 auto;
}

/* ─── FEATURES ──────────────────────────────────────── */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem 1.5rem;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}
.feature-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(177,29,185,0.05), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}
.feature-card:hover {
  transform: translateY(-6px);
  border-color: rgba(177,29,185,0.4);
  box-shadow: 0 12px 40px rgba(0,0,0,0.3);
}
.feature-card:hover::before { opacity: 1; }

.feature-icon {
  position: relative;
  width: 56px; height: 56px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem;
  margin-bottom: 1.25rem;
}
.feature-card h3 {
  font-size: 1.25rem;
  color: var(--text);
  margin-bottom: 0.5rem;
  position: relative;
}
.feature-card p {
  color: var(--text-muted);
  line-height: 1.6;
  font-size: 0.92rem;
  position: relative;
}

/* ─── ADVANTAGES ────────────────────────────────────── */
.advantages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}
.advantage-card {
  background: rgba(177,29,185,0.04);
  border: 1px solid rgba(177,29,185,0.15);
  border-radius: 16px;
  padding: 1.75rem;
  transition: all 0.3s;
}
.advantage-card:hover {
  border-color: rgba(177,29,185,0.4);
  background: rgba(177,29,185,0.08);
  transform: translateY(-4px);
}
.advantage-icon {
  font-size: 2.25rem;
  color: #b11db9;
  margin-bottom: 1rem;
  display: block;
}
.advantage-card h3 {
  font-size: 1.15rem;
  color: var(--text);
  margin-bottom: 0.5rem;
}
.advantage-card p {
  color: var(--text-muted);
  font-size: 0.92rem;
  line-height: 1.6;
}

/* ─── STEPS ─────────────────────────────────────────── */
.steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 2rem;
  position: relative;
}
.step {
  text-align: center;
  position: relative;
  padding: 2rem 1rem;
}
.step-number {
  position: absolute;
  top: -10px; left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #b11db9, #8b1589);
  color: #fff;
  width: 36px; height: 36px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 4px 16px rgba(177,29,185,0.4);
}
.step-icon {
  font-size: 3rem;
  color: #b11db9;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}
.step h3 {
  font-size: 1.25rem;
  color: var(--text);
  margin-bottom: 0.5rem;
}
.step p {
  color: var(--text-muted);
  font-size: 0.92rem;
  line-height: 1.6;
}
.step-arrow {
  position: absolute;
  top: 50%;
  right: -1.5rem;
  transform: translateY(-50%);
  color: rgba(177,29,185,0.3);
  font-size: 2rem;
}

/* ─── CTA FINAL ─────────────────────────────────────── */
.cta-final {
  position: relative;
  padding: 6rem 2rem;
  background: radial-gradient(circle at center, rgba(177,29,185,0.15), transparent 70%);
  overflow: hidden;
}
.cta-final-content {
  max-width: 700px;
  margin: 0 auto;
  text-align: center;
}
.cta-final-content h2 {
  font-family: 'Impact', sans-serif;
  font-size: clamp(2rem, 5vw, 3.5rem);
  margin-bottom: 1rem;
  color: var(--text);
}
.cta-final-content > p {
  color: var(--text-muted);
  font-size: 1.1rem;
  margin-bottom: 2rem;
}
.cta-final-note {
  margin-top: 1.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  display: flex; justify-content: center; gap: 6px; flex-wrap: wrap;
}
.cta-final-note i { color: #2ecc71; margin-right: 2px; }

/* ─── RESPONSIVE ────────────────────────────────────── */
@media (max-width: 768px) {
  .hero { padding: 4rem 1.25rem 3rem; min-height: 80vh; }
  .hero-stats { padding: 0.75rem 1.25rem; gap: 1rem; }
  .stat strong { font-size: 1.4rem; }
  .section { padding: 3rem 1.25rem; }
  .step-arrow { display: none; }
}
</style>
