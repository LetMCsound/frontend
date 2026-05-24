<script setup>
/**
 * GradualBlur — Adaptación a Vue 3 del componente original de React Bits.
 *
 * Crea una capa con blur progresivo (gradiente) en un borde del contenedor
 * o de toda la página. Ideal para mascarar/fundir contenido al hacer scroll
 * dentro de una sección.
 *
 * Original: https://github.com/ansh-dhanani
 */
import { ref, computed, watch, onBeforeUnmount } from 'vue'

const DEFAULT_CONFIG = {
  position: 'bottom',
  strength: 2,
  height: '6rem',
  divCount: 5,
  exponential: false,
  zIndex: 1000,
  animated: false,
  duration: '0.3s',
  easing: 'ease-out',
  opacity: 1,
  curve: 'linear',
  responsive: false,
  target: 'parent',
  className: '',
  style: {}
}

const PRESETS = {
  top:    { position: 'top',    height: '6rem' },
  bottom: { position: 'bottom', height: '6rem' },
  left:   { position: 'left',   height: '6rem' },
  right:  { position: 'right',  height: '6rem' },
  subtle:  { height: '4rem',  strength: 1, opacity: 0.8, divCount: 3 },
  intense: { height: '10rem', strength: 4, divCount: 8, exponential: true },
  smooth:  { height: '8rem',  curve: 'bezier', divCount: 10 },
  sharp:   { height: '5rem',  curve: 'linear', divCount: 4 },
  header:  { position: 'top',    height: '8rem', curve: 'ease-out' },
  footer:  { position: 'bottom', height: '8rem', curve: 'ease-out' },
  sidebar: { position: 'left',   height: '6rem', strength: 2.5 },
  'page-header': { position: 'top',    height: '10rem', target: 'page', strength: 3 },
  'page-footer': { position: 'bottom', height: '10rem', target: 'page', strength: 3 }
}

const CURVE_FUNCTIONS = {
  linear:        p => p,
  bezier:        p => p * p * (3 - 2 * p),
  'ease-in':     p => p * p,
  'ease-out':    p => 1 - Math.pow(1 - p, 2),
  'ease-in-out': p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)
}

const getGradientDirection = position =>
  ({ top: 'to top', bottom: 'to bottom', left: 'to left', right: 'to right' })[position] || 'to bottom'

// ── Props ────────────────────────────────────────────
const props = defineProps({
  position:       { type: String,  default: undefined },
  strength:       { type: Number,  default: undefined },
  height:         { type: String,  default: undefined },
  width:          { type: String,  default: undefined },
  divCount:       { type: Number,  default: undefined },
  exponential:    { type: Boolean, default: undefined },
  curve:          { type: String,  default: undefined },
  opacity:        { type: Number,  default: undefined },
  animated:       { type: [Boolean, String], default: undefined },
  duration:       { type: String,  default: undefined },
  easing:         { type: String,  default: undefined },
  hoverIntensity: { type: Number,  default: undefined },
  target:         { type: String,  default: undefined },
  preset:         { type: String,  default: undefined },
  responsive:     { type: Boolean, default: undefined },
  zIndex:         { type: Number,  default: undefined },
  className:      { type: String,  default: '' },
  customStyle:    { type: Object,  default: () => ({}) }
})
const emit = defineEmits(['animation-complete'])

// ── Config combinada (DEFAULT + preset + props no nulas) ────
const config = computed(() => {
  const presetConfig = props.preset && PRESETS[props.preset] ? PRESETS[props.preset] : {}
  const propsFiltered = Object.fromEntries(
    Object.entries(props).filter(([, v]) => v !== undefined)
  )
  return { ...DEFAULT_CONFIG, ...presetConfig, ...propsFiltered }
})

// ── State ────────────────────────────────────────────
const containerRef = ref(null)
const isHovered = ref(false)
const isVisible = ref(true)

// ── IntersectionObserver para animated="scroll" ─────
let observer = null
let animTimer = null

watch(
  () => [containerRef.value, config.value.animated],
  ([el, animated]) => {
    if (observer) { observer.disconnect(); observer = null }
    if (animated !== 'scroll' || !el) {
      isVisible.value = true
      return
    }
    isVisible.value = false
    observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.value = entry.isIntersecting
        if (entry.isIntersecting && config.value.duration) {
          const ms = parseFloat(config.value.duration) * 1000 || 300
          clearTimeout(animTimer)
          animTimer = setTimeout(() => emit('animation-complete'), ms)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
  },
  { immediate: true, flush: 'post' }
)

onBeforeUnmount(() => {
  if (observer) observer.disconnect()
  clearTimeout(animTimer)
})

// ── Capas de blur (computadas) ──────────────────────
const blurDivs = computed(() => {
  const c = config.value
  const divs = []
  const increment = 100 / c.divCount
  const currentStrength = isHovered.value && c.hoverIntensity
    ? c.strength * c.hoverIntensity
    : c.strength
  const curveFunc = CURVE_FUNCTIONS[c.curve] || CURVE_FUNCTIONS.linear

  for (let i = 1; i <= c.divCount; i++) {
    let progress = curveFunc(i / c.divCount)
    const blurValue = c.exponential
      ? Math.pow(2, progress * 4) * 0.0625 * currentStrength
      : 0.0625 * (progress * c.divCount + 1) * currentStrength

    const p1 = Math.round((increment * i - increment) * 10) / 10
    const p2 = Math.round(increment * i * 10) / 10
    const p3 = Math.round((increment * i + increment) * 10) / 10
    const p4 = Math.round((increment * i + increment * 2) * 10) / 10

    let gradient = `transparent ${p1}%, black ${p2}%`
    if (p3 <= 100) gradient += `, black ${p3}%`
    if (p4 <= 100) gradient += `, transparent ${p4}%`

    const direction = getGradientDirection(c.position)
    const blurStr = `blur(${blurValue.toFixed(3)}rem)`

    divs.push({
      position: 'absolute',
      inset: '0',
      maskImage: `linear-gradient(${direction}, ${gradient})`,
      WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
      backdropFilter: blurStr,
      WebkitBackdropFilter: blurStr,
      opacity: c.opacity,
      transition: c.animated && c.animated !== 'scroll'
        ? `backdrop-filter ${c.duration} ${c.easing}`
        : undefined
    })
  }
  return divs
})

// ── Estilo del contenedor ───────────────────────────
const containerStyle = computed(() => {
  const c = config.value
  const isVertical = ['top', 'bottom'].includes(c.position)
  const isHorizontal = ['left', 'right'].includes(c.position)
  const isPageTarget = c.target === 'page'

  const style = {
    position: isPageTarget ? 'fixed' : 'absolute',
    pointerEvents: c.hoverIntensity ? 'auto' : 'none',
    opacity: isVisible.value ? 1 : 0,
    transition: c.animated ? `opacity ${c.duration} ${c.easing}` : undefined,
    zIndex: isPageTarget ? c.zIndex + 100 : c.zIndex,
    ...c.customStyle
  }

  if (isVertical) {
    style.height = c.height
    style.width = c.width || '100%'
    style[c.position] = 0
    style.left = 0
    style.right = 0
  } else if (isHorizontal) {
    style.width = c.width || c.height
    style.height = '100%'
    style[c.position] = 0
    style.top = 0
    style.bottom = 0
  }
  return style
})

function onMouseEnter() { if (config.value.hoverIntensity) isHovered.value = true }
function onMouseLeave() { if (config.value.hoverIntensity) isHovered.value = false }
</script>

<template>
  <div
    ref="containerRef"
    :class="[
      'gradual-blur',
      config.target === 'page' ? 'gradual-blur-page' : 'gradual-blur-parent',
      config.className
    ]"
    :style="containerStyle"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <div class="gradual-blur-inner">
      <div v-for="(divStyle, i) in blurDivs" :key="i" :style="divStyle"></div>
    </div>
  </div>
</template>

<style>
/* No-scoped para que afecte a las capas internas */
.gradual-blur {
  pointer-events: none;
  transition: opacity 0.3s ease-out;
  isolation: isolate;
}
.gradual-blur-parent { overflow: hidden; }
.gradual-blur-inner {
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.gradual-blur-inner > div {
  -webkit-backdrop-filter: inherit;
  backdrop-filter: inherit;
}
@supports not (backdrop-filter: blur(1px)) {
  .gradual-blur-inner > div {
    background: rgba(0,0,0,0.3);
    opacity: 0.5;
  }
}
</style>
