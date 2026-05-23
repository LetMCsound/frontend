<script setup>
/**
 * MagicBento — Adaptación a Vue 3 de React Bits.
 * Aplica efectos de spotlight, border glow, tilt, magnetism y click ripple
 * a una grid de tarjetas.
 *
 * Original: https://reactbits.dev
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import gsap from 'gsap'

const props = defineProps({
  cards: { type: Array, required: true },
  textAutoHide:     { type: Boolean, default: true },
  enableSpotlight:  { type: Boolean, default: true },
  enableBorderGlow: { type: Boolean, default: true },
  enableTilt:       { type: Boolean, default: true },
  enableMagnetism:  { type: Boolean, default: true },
  clickEffect:      { type: Boolean, default: true },
  spotlightRadius:  { type: Number,  default: 300 },
  glowColor:        { type: String,  default: '177, 29, 185' } // morado LetMCsound
})

const MOBILE_BREAKPOINT = 768

const gridRef = ref(null)
const isMobile = ref(false)
const spotlightEl = ref(null)
const cardCleanups = []

function checkMobile() {
  isMobile.value = window.innerWidth <= MOBILE_BREAKPOINT
}

// ─── Spotlight global que sigue el cursor ────────────
function setupSpotlight() {
  if (!props.enableSpotlight || isMobile.value) return

  const spot = document.createElement('div')
  spot.className = 'mb-global-spotlight'
  spot.style.cssText = `
    position: fixed;
    width: 800px;
    height: 800px;
    border-radius: 50%;
    pointer-events: none;
    background: radial-gradient(circle,
      rgba(${props.glowColor}, 0.15) 0%,
      rgba(${props.glowColor}, 0.08) 15%,
      rgba(${props.glowColor}, 0.04) 25%,
      rgba(${props.glowColor}, 0.02) 40%,
      rgba(${props.glowColor}, 0.01) 65%,
      transparent 70%
    );
    z-index: 200;
    opacity: 0;
    transform: translate(-50%, -50%);
    mix-blend-mode: screen;
  `
  document.body.appendChild(spot)
  spotlightEl.value = spot

  const proximity = props.spotlightRadius * 0.5
  const fadeDistance = props.spotlightRadius * 0.75

  function handleMouseMove(e) {
    if (!gridRef.value) return
    const section = gridRef.value
    const rect = section.getBoundingClientRect()
    const inside = e.clientX >= rect.left && e.clientX <= rect.right &&
                   e.clientY >= rect.top  && e.clientY <= rect.bottom

    const cards = section.querySelectorAll('.magic-bento-card')

    if (!inside) {
      gsap.to(spot, { opacity: 0, duration: 0.3, ease: 'power2.out' })
      cards.forEach(c => c.style.setProperty('--glow-intensity', '0'))
      return
    }

    let minDistance = Infinity
    cards.forEach(card => {
      const cr = card.getBoundingClientRect()
      const cx = cr.left + cr.width / 2
      const cy = cr.top + cr.height / 2
      const distance = Math.hypot(e.clientX - cx, e.clientY - cy) - Math.max(cr.width, cr.height) / 2
      const eff = Math.max(0, distance)
      minDistance = Math.min(minDistance, eff)

      let glow = 0
      if (eff <= proximity) glow = 1
      else if (eff <= fadeDistance) glow = (fadeDistance - eff) / (fadeDistance - proximity)

      const relX = ((e.clientX - cr.left) / cr.width) * 100
      const relY = ((e.clientY - cr.top) / cr.height) * 100
      card.style.setProperty('--glow-x', `${relX}%`)
      card.style.setProperty('--glow-y', `${relY}%`)
      card.style.setProperty('--glow-intensity', String(glow))
      card.style.setProperty('--glow-radius', `${props.spotlightRadius}px`)
    })

    gsap.to(spot, { left: e.clientX, top: e.clientY, duration: 0.1, ease: 'power2.out' })

    const targetOpacity = minDistance <= proximity
      ? 0.8
      : minDistance <= fadeDistance
        ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
        : 0

    gsap.to(spot, {
      opacity: targetOpacity,
      duration: targetOpacity > 0 ? 0.2 : 0.5,
      ease: 'power2.out'
    })
  }

  function handleMouseLeaveWindow() {
    if (!gridRef.value) return
    gridRef.value.querySelectorAll('.magic-bento-card').forEach(c => {
      c.style.setProperty('--glow-intensity', '0')
    })
    gsap.to(spot, { opacity: 0, duration: 0.3, ease: 'power2.out' })
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseleave', handleMouseLeaveWindow)

  cardCleanups.push(() => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseleave', handleMouseLeaveWindow)
    spot.parentNode?.removeChild(spot)
  })
}

// ─── Efectos por tarjeta (tilt, magnetism, click ripple) ──
function setupCardEffects() {
  if (!gridRef.value || isMobile.value) return
  const cards = gridRef.value.querySelectorAll('.magic-bento-card')

  cards.forEach(el => {
    function handleMove(e) {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const cx = rect.width / 2
      const cy = rect.height / 2

      if (props.enableTilt) {
        const rotateX = ((y - cy) / cy) * -10
        const rotateY = ((x - cx) / cx) * 10
        gsap.to(el, { rotateX, rotateY, duration: 0.1, ease: 'power2.out', transformPerspective: 1000 })
      }
      if (props.enableMagnetism) {
        const mx = (x - cx) * 0.05
        const my = (y - cy) * 0.05
        gsap.to(el, { x: mx, y: my, duration: 0.3, ease: 'power2.out' })
      }
    }

    function handleLeave() {
      if (props.enableTilt) {
        gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.3, ease: 'power2.out' })
      }
      if (props.enableMagnetism) {
        gsap.to(el, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' })
      }
    }

    function handleClick(e) {
      if (!props.clickEffect) return
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      )
      const ripple = document.createElement('div')
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${props.glowColor}, 0.4) 0%, rgba(${props.glowColor}, 0.2) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 5;
      `
      el.appendChild(ripple)
      gsap.fromTo(ripple,
        { scale: 0, opacity: 1 },
        { scale: 1, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => ripple.remove() }
      )
    }

    el.addEventListener('mousemove', handleMove)
    el.addEventListener('mouseleave', handleLeave)
    el.addEventListener('click', handleClick)

    cardCleanups.push(() => {
      el.removeEventListener('mousemove', handleMove)
      el.removeEventListener('mouseleave', handleLeave)
      el.removeEventListener('click', handleClick)
    })
  })
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  setupSpotlight()
  setupCardEffects()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  cardCleanups.forEach(fn => fn())
})
</script>

<template>
  <div ref="gridRef" class="magic-bento-grid">
    <div
      v-for="(card, i) in cards"
      :key="i"
      :class="[
        'magic-bento-card',
        { 'magic-bento-card--text-autohide': textAutoHide },
        { 'magic-bento-card--border-glow': enableBorderGlow }
      ]"
      :style="{ '--glow-color': glowColor }"
    >
      <div class="magic-bento-card__header">
        <div class="magic-bento-card__label" :style="card.color ? { color: card.color } : {}">
          <i v-if="card.icon" :class="card.icon"></i>
          {{ card.label || card.title }}
        </div>
      </div>
      <div class="magic-bento-card__content">
        <h3 class="magic-bento-card__title">{{ card.title }}</h3>
        <p class="magic-bento-card__description">{{ card.description }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.magic-bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  width: 100%;
  position: relative;
  user-select: none;
}

.magic-bento-card {
  --glow-x: 50%;
  --glow-y: 50%;
  --glow-intensity: 0;
  --glow-radius: 200px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  min-height: 220px;
  padding: 1.5rem;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.3s ease;
  will-change: transform;
}

.magic-bento-card__header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
  position: relative;
  z-index: 2;
}

.magic-bento-card__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(177,29,185,0.9);
}
.magic-bento-card__label i { font-size: 1.4rem; }

.magic-bento-card__content {
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2;
  color: var(--text, #fff);
}

.magic-bento-card__title {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: var(--text, #fff);
}

.magic-bento-card__description {
  font-size: 0.92rem;
  line-height: 1.6;
  color: var(--text-muted, #aaa);
  opacity: 0.95;
}

.magic-bento-card--text-autohide .magic-bento-card__title,
.magic-bento-card--text-autohide .magic-bento-card__description {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
.magic-bento-card--text-autohide .magic-bento-card__title       { -webkit-line-clamp: 2; line-clamp: 2; }
.magic-bento-card--text-autohide .magic-bento-card__description { -webkit-line-clamp: 3; line-clamp: 3; }

/* ─── Border glow que sigue el cursor ──────────────── */
.magic-bento-card--border-glow::after {
  content: '';
  position: absolute;
  inset: 0;
  padding: 2px;
  background: radial-gradient(
    var(--glow-radius) circle at var(--glow-x) var(--glow-y),
    rgba(177,29,185, calc(var(--glow-intensity) * 0.8)) 0%,
    rgba(177,29,185, calc(var(--glow-intensity) * 0.4)) 30%,
    transparent 60%
  );
  border-radius: inherit;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  pointer-events: none;
  z-index: 3;
  transition: opacity 0.3s ease;
}

.magic-bento-card--border-glow:hover {
  box-shadow:
    0 4px 20px rgba(46, 24, 78, 0.3),
    0 0 30px rgba(177, 29, 185, 0.2);
}

/* Light mode adaptation */
body.light-theme .magic-bento-card {
  background: #fff;
  border-color: rgba(0,0,0,0.08);
}
body.light-theme .magic-bento-card__title { color: #1a1a2e; }
body.light-theme .magic-bento-card__description { color: #666; }
</style>
