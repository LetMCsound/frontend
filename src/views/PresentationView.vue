<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

const slides = [
  { type: 'cover' },
  {
    type: 'description',
    tag: 'Descripción',
    lead: 'LetMC Sound es un <em>marketplace musical</em> para la escena independiente hispanohablante.',
    body: 'Una plataforma web y móvil donde productores, letristas, filmmakers y diseñadores publican, venden y negocian su trabajo en un único ecosistema digital.',
    tags: ['Marketplace', 'Web + Android', 'En español', 'Sin comisión']
  },
  {
    type: 'justify',
    tag: 'Justificación',
    cols: [
      { icon: 'ri-lightbulb-flash-line', label: 'Motivación', items: [
        'Somos parte de la escena musical independiente',
        'Vivimos de primera mano la falta de un espacio común',
        'El mercado hispano no tiene una plataforma propia'
      ] },
      { icon: 'ri-heart-3-line', label: 'Beneficios', items: [
        'Artistas que venden y dan a conocer su trabajo',
        'Compradores que encuentran todo en un sitio',
        'Una comunidad que colabora y crece junta'
      ] }
    ]
  },
  {
    type: 'objectives',
    tag: 'Objetivos',
    general: 'Desarrollar una plataforma multiplataforma (web + Android) para comprar, vender y negociar contenido musical y audiovisual en un único ecosistema.',
    items: [
      { icon: 'ri-palette-line', t: 'Interfaz moderna', d: 'UI atractiva e intuitiva en web y móvil.' },
      { icon: 'ri-shield-keyhole-line', t: 'Autenticación segura', d: 'Sesiones y tokens JWT con Supabase.' },
      { icon: 'ri-store-2-line', t: 'Marketplace', d: 'Beats, letras, filmmaker y diseño gráfico.' },
      { icon: 'ri-chat-3-line', t: 'Chat en tiempo real', d: 'Negociación entre compradores y vendedores.' },
      { icon: 'ri-database-2-line', t: 'Base de datos con RLS', d: 'Modelo relacional seguro en PostgreSQL.' },
      { icon: 'ri-file-paper-2-line', t: 'Contratos PDF', d: 'Generación automática en cada compra.' }
    ]
  },
  {
    type: 'problem',
    tag: 'El problema',
    title: 'El talento independiente no tiene dónde encontrarse',
    cards: [
      { icon: 'ri-scattered-fill', title: 'Trabajo disperso', desc: 'Beats, letras y servicios repartidos entre redes y chats, difíciles de mostrar.' },
      { icon: 'ri-store-2-line', title: 'Sin marketplace propio', desc: 'No existe una plataforma especializada y en español para vender.' },
      { icon: 'ri-team-line', title: 'Colaboración improvisada', desc: 'Conectar con otros artistas depende del azar y del boca a boca.' }
    ]
  },
  {
    type: 'solution',
    tag: 'La solución',
    pillars: [
      { icon: 'ri-store-2-fill', title: 'Todo en un sitio', desc: 'Beats, letras y servicios creativos en una única plataforma.' },
      { icon: 'ri-user-star-fill', title: 'Perfiles de artista', desc: 'Un espacio profesional para cada tipo de creador.' },
      { icon: 'ri-device-fill', title: 'Web + App', desc: 'Misma cuenta y contenido sincronizados en cualquier lugar.' }
    ],
    stats: [
      { num: '0%', label: 'comisión' },
      { num: '100%', label: 'en español' }
    ]
  },
  {
    type: 'features',
    tag: 'Funcionalidades',
    title: '¿Qué puedes hacer en LetMC Sound?',
    cards: [
      { icon: 'ri-music-2-fill', name: 'Beats', desc: 'Compra-venta con preview de audio.' },
      { icon: 'ri-folder-music-fill', name: 'Letras', desc: 'Vista previa protegida antes de comprar.' },
      { icon: 'ri-user-star-fill', name: 'Perfiles', desc: 'Un espacio para cada tipo de artista.' },
      { icon: 'ri-chat-3-fill', name: 'Chat', desc: 'Negociación en tiempo real.' },
      { icon: 'ri-clapperboard-fill', name: 'Servicios', desc: 'Diseño gráfico y audiovisual.' },
      { icon: 'ri-smartphone-fill', name: 'Multiplataforma', desc: 'Web y app sincronizadas.' }
    ]
  },
  {
    type: 'tech',
    tag: 'Tecnologías',
    title: 'Construido con un stack moderno',
    cards: [
      { name: 'Vue 3',      cat: 'Frontend', desc: 'Framework web',        logo: 'vuejs/vuejs-original.svg',          color: '#42b883' },
      { name: 'Vite',       cat: 'Frontend', desc: 'Build & dev server',   logo: 'vitejs/vitejs-original.svg',        color: '#b366f9' },
      { name: 'Android',    cat: 'Móvil',    desc: 'App nativa',           logo: 'android/android-original.svg',      color: '#3ddc84' },
      { name: 'Java',       cat: 'Móvil',    desc: 'Lenguaje de la app',   logo: 'java/java-original.svg',            color: '#f89820' },
      { name: 'Node.js',    cat: 'Backend',  desc: 'Runtime de la API',    logo: 'nodejs/nodejs-original.svg',        color: '#83cd29' },
      { name: 'Express',    cat: 'Backend',  desc: 'API REST',             logo: 'https://cdn.simpleicons.org/express/ffffff', color: '#ffffff' },
      { name: 'Supabase',   cat: 'Datos',    desc: 'Base de datos & Auth', logo: 'supabase/supabase-original.svg',    color: '#3ecf8e' },
      { name: 'PostgreSQL', cat: 'Datos',    desc: 'Base de datos',        logo: 'postgresql/postgresql-original.svg', color: '#7aa6ff' },
      { name: 'JWT',        cat: 'Seguridad',desc: 'Autenticación',        logo: 'https://cdn.simpleicons.org/jsonwebtokens/ffffff', color: '#e056e8' },
      { name: 'Vercel',     cat: 'Infra',    desc: 'Despliegue web',       logo: 'https://cdn.simpleicons.org/vercel/ffffff', color: '#ffffff' },
      { name: 'Render',     cat: 'Infra',    desc: 'Despliegue backend',   logo: 'https://cdn.simpleicons.org/render/ffffff', color: '#46e3b7' },
      { name: 'Swagger',    cat: 'Backend',  desc: 'Documentación API',    logo: 'swagger/swagger-original.svg',      color: '#85ea2d' }
    ]
  },
  {
    type: 'arch',
    tag: 'Arquitectura del sistema',
    title: 'Arquitectura cliente-servidor de 3 capas',
    columns: [
      { icon: 'ri-computer-fill', label: 'CLIENTES', items: ['Vue 3 SPA (Web)', 'Android App (Java)'] },
      { icon: 'ri-settings-3-fill', label: 'API BACKEND', items: ['Node.js + Express 4', 'Swagger · Joi · JWT', 'pdf-lib (contratos)'] },
      { icon: 'ri-database-2-fill', label: 'BAAS / DATA', items: ['Supabase PostgreSQL', 'Auth + RLS', 'Storage + Realtime'] }
    ]
  },
  {
    type: 'table',
    tag: 'Mercado y competencia',
    title: 'Ningún rival cubre los 4 tipos + mercado hispano',
    headers: ['Plataforma', 'Contenido', 'Comisión', 'Idioma', 'Limitación'],
    rows: [
      ['BeatStars', 'Beats', '15–30 %', 'Inglés', 'Solo beats, sin chat'],
      ['Splice', 'Samples', '50 %', 'Inglés', 'Suscripción, no marketplace'],
      ['Genius', 'Letras', 'No vende', 'Inglés', 'Wiki, sin venta'],
      ['Bandcamp', 'Música', '10–15 %', 'Inglés', 'Álbumes, no licencias'],
      ['Fiverr', 'Servicios', '20 %', 'Multi', 'Genérico']
    ],
    highlight: ['LetMC Sound ✓', 'Beats + Letras + Film + Gráfico', '0 %', 'Español', 'Multiplataforma hispanohablante']
  },
  {
    type: 'data',
    tag: 'Modelo de datos',
    title: '8 tablas en PostgreSQL con RLS',
    tables: ['musicians', 'beats', 'lyrics', 'conversations', 'messages', 'ventas', 'notifications', 'favorites']
  },
  {
    type: 'difficulties',
    tag: 'Dificultades',
    items: [
      { icon: 'ri-team-line', p: 'Trabajar en equipo', s: 'Coordinar opiniones diferentes y llegar a acuerdos comunes.' },
      { icon: 'ri-smartphone-line', p: 'La aplicación móvil', s: 'Resolver los problemas propios del desarrollo nativo en Android.' },
      { icon: 'ri-user-heart-line', p: 'Entender al cliente', s: 'Intentar acertar con lo que al usuario le podría gustar.' },
      { icon: 'ri-chat-3-line', p: 'El chat', s: 'Hacer funcionar la mensajería en tiempo real entre usuarios.' }
    ]
  },
  {
    type: 'roadmap',
    tag: 'Hoja de ruta',
    steps: [
      { v: 'v1.1', title: 'Más comunidad', desc: 'Reseñas de vendedores y búsqueda avanzada.', icon: 'ri-star-smile-line' },
      { v: 'v1.2', title: 'Pagos reales', desc: 'Pasarela con Stripe y retirada de fondos.', icon: 'ri-bank-card-line' },
      { v: 'v2.0', title: 'Expansión', desc: 'App iOS, estadísticas e IA de recomendación.', icon: 'ri-rocket-2-line' }
    ]
  },
  { type: 'closing' }
]

const current = ref(0)
const total = slides.length

const next = () => { if (current.value < total - 1) current.value++ }
const prev = () => { if (current.value > 0) current.value-- }
const goTo = (i) => { current.value = i }

const onKey = (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next() }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev() }
  else if (e.key === 'Home') { goTo(0) }
  else if (e.key === 'End') { goTo(total - 1) }
  else if (e.key === 'Escape') { window.close() }
}

onMounted(() => {
  document.title = 'LetMC Sound · Presentación'
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const devicon = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/'
const slide = computed(() => slides[current.value])
const progress = computed(() => ((current.value) / (total - 1)) * 100)
const pad = (n) => String(n).padStart(2, '0')
</script>

<template>
  <div class="deck">
    <div class="bg-glow glow-1"></div>
    <div class="bg-glow glow-2"></div>

    <div class="progress"><div class="progress-bar" :style="{ width: progress + '%' }"></div></div>
    <div class="counter">{{ pad(current + 1) }} / {{ pad(total) }}</div>

    <transition name="fade" mode="out-in">
      <div class="slide" :key="current">

        <!-- COVER -->
        <div v-if="slide.type === 'cover'" class="cv">
          <div class="cv-ghost">LETMC</div>

          <div class="cv-left">
            <div class="cv-badge"><span class="cv-dot"></span>PROYECTO FINAL · 2º DAM</div>
            <img src="/assets/letmc.png" alt="LetMC Sound" class="cv-logo" />
            <h2 class="cv-tag">Tu mercado musical<br><span>independiente</span></h2>
            <p class="cv-sub">Plataforma Web &amp; Aplicación móvil Android</p>

            <div class="cv-by">
              <span class="cv-by-label">Realizado por</span>
              <div class="cv-by-names">
                <span>Martina Vargas Troche</span>
                <span>Michael Ekhosuehi Olumuyiwa</span>
              </div>
              <div class="cv-by-foot">
                <span><i class="ri-building-2-line"></i> IES EPla</span>
                <span class="cv-by-divider"></span>
                <span><i class="ri-user-star-line"></i> Tutor: Vicente Santonja</span>
              </div>
            </div>
          </div>

          <div class="cv-right">
            <div class="cv-disc">
              <div class="cv-disc-ring"></div>
              <div class="cv-disc-center"><i class="ri-music-2-fill"></i></div>
            </div>
            <div class="cv-chip chip-a"><i class="ri-music-2-fill"></i> Beats</div>
            <div class="cv-chip chip-b"><i class="ri-folder-music-fill"></i> Letras</div>
            <div class="cv-chip chip-c"><i class="ri-clapperboard-fill"></i> Servicios</div>
            <div class="cv-chip chip-d"><i class="ri-smartphone-fill"></i> App + Web</div>
          </div>
        </div>

        <!-- PROBLEM -->
        <div v-else-if="slide.type === 'problem'" class="content prob">
          <div class="prob-watermark">PROBLEMA</div>
          <span class="prob-kicker">{{ slide.tag }}</span>
          <h1 class="prob-h1">
            El talento independiente<br>
            no tiene <em>dónde encontrarse</em>
          </h1>

          <div class="prob-list">
            <div class="prob-row" v-for="(c, i) in slide.cards" :key="i" :style="{ animationDelay: (i * 0.12) + 's' }">
              <span class="prob-n">{{ String(i + 1).padStart(2, '0') }}</span>
              <div class="prob-text">
                <span class="prob-t">{{ c.title }}</span>
                <span class="prob-d">{{ c.desc }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- DESCRIPTION -->
        <div v-else-if="slide.type === 'description'" class="content desc">
          <span class="desc-watermark">LETMC</span>
          <span class="feat-blob feat-blob-1"></span>
          <span class="feat-blob feat-blob-2"></span>
          <div class="desc-inner">
            <span class="tech-kicker">{{ slide.tag }}</span>
            <h1 class="desc-lead" v-html="slide.lead"></h1>
            <p class="desc-body">{{ slide.body }}</p>
            <div class="desc-tags">
              <span v-for="(t, i) in slide.tags" :key="i" :style="{ animationDelay: (0.15 + i * 0.08) + 's' }">{{ t }}</span>
            </div>
          </div>
        </div>

        <!-- JUSTIFICATION -->
        <div v-else-if="slide.type === 'justify'" class="content just">
          <span class="just-watermark">¿POR QUÉ?</span>
          <span class="feat-blob feat-blob-1"></span>
          <div class="just-head">
            <span class="tech-kicker">{{ slide.tag }}</span>
            <h1 class="tech-h1">¿Por qué <em>LetMC Sound</em>?</h1>
          </div>
          <div class="just-cols">
            <div class="just-col" v-for="(c, i) in slide.cols" :key="i" :style="{ animationDelay: (i * 0.15) + 's' }">
              <div class="just-icon"><i :class="c.icon"></i></div>
              <div class="just-label">{{ c.label }}</div>
              <ul>
                <li v-for="(it, j) in c.items" :key="j">{{ it }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- OBJECTIVES -->
        <div v-else-if="slide.type === 'objectives'" class="content obj">
          <span class="obj-watermark">GOALS</span>
          <div class="obj-head">
            <span class="tech-kicker">{{ slide.tag }}</span>
            <h1 class="tech-h1">Qué queremos <em>lograr</em></h1>
          </div>
          <div class="obj-general">
            <span class="obj-general-tag">Objetivo general</span>
            <p>{{ slide.general }}</p>
          </div>
          <div class="obj-grid">
            <div class="obj-item" v-for="(it, i) in slide.items" :key="i" :style="{ animationDelay: (0.1 + i * 0.07) + 's' }">
              <span class="obj-n">{{ String(i + 1).padStart(2, '0') }}</span>
              <div class="obj-icon"><i :class="it.icon"></i></div>
              <div class="obj-text">
                <span class="obj-t">{{ it.t }}</span>
                <span class="obj-d">{{ it.d }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- SCOPE -->
        <div v-else-if="slide.type === 'scope'" class="content scope">
          <span class="scope-watermark">SCOPE</span>
          <div class="scope-head">
            <span class="tech-kicker">{{ slide.tag }}</span>
            <h1 class="tech-h1">Qué entra <em>y qué no</em></h1>
          </div>
          <div class="scope-cols">
            <div class="scope-col scope-in" :style="{ animationDelay: '0.1s' }">
              <div class="scope-col-head"><i class="ri-checkbox-circle-fill"></i> Incluye</div>
              <ul>
                <li v-for="(it, i) in slide.includes" :key="i">{{ it }}</li>
              </ul>
            </div>
            <div class="scope-col scope-out" :style="{ animationDelay: '0.2s' }">
              <div class="scope-col-head"><i class="ri-close-circle-fill"></i> No incluye</div>
              <ul>
                <li v-for="(it, i) in slide.excludes" :key="i">{{ it }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- DIFFICULTIES -->
        <div v-else-if="slide.type === 'difficulties'" class="content diff">
          <span class="diff-watermark">RETOS</span>
          <span class="feat-blob feat-blob-2"></span>
          <div class="diff-head">
            <span class="tech-kicker">{{ slide.tag }}</span>
            <h1 class="tech-h1">Retos <em>resueltos</em></h1>
          </div>
          <div class="diff-grid">
            <div class="diff-card" v-for="(it, i) in slide.items" :key="i" :style="{ animationDelay: (i * 0.1) + 's' }">
              <div class="diff-icon"><i :class="it.icon"></i></div>
              <div class="diff-body">
                <div class="diff-p">{{ it.p }}</div>
                <div class="diff-s"><i class="ri-arrow-right-line"></i>{{ it.s }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- DELIVERABLES -->
        <div v-else-if="slide.type === 'deliverables'" class="content deliv">
          <span class="deliv-watermark">ENTREGA</span>
          <div class="deliv-head">
            <span class="tech-kicker">{{ slide.tag }}</span>
            <h1 class="tech-h1">Lo que <em>entregamos</em></h1>
          </div>
          <div class="deliv-grid">
            <div class="deliv-card" v-for="(it, i) in slide.items" :key="i" :style="{ animationDelay: (i * 0.07) + 's' }">
              <div class="deliv-icon"><i :class="it.icon"></i></div>
              <div class="deliv-t">{{ it.t }}</div>
              <div class="deliv-d">{{ it.d }}</div>
            </div>
          </div>
        </div>

        <!-- SOLUTION -->
        <div v-else-if="slide.type === 'solution'" class="content sol">
          <div class="sol-top">
            <div class="sol-intro">
              <span class="sol-kicker">{{ slide.tag }}</span>
              <h1 class="sol-h1">El mercado musical<br><em>independiente</em></h1>
            </div>
            <div class="sol-stats">
              <div class="sol-stat" v-for="(s, i) in slide.stats" :key="i" :style="{ animationDelay: (i * 0.15) + 's' }">
                <span class="sol-num">{{ s.num }}</span>
                <span class="sol-stat-label">{{ s.label }}</span>
              </div>
            </div>
          </div>
          <div class="sol-bento">
            <div class="bento" v-for="(p, i) in slide.pillars" :key="i" :class="'bento-' + i" :style="{ animationDelay: (0.2 + i * 0.12) + 's' }">
              <i :class="p.icon" class="bento-bg"></i>
              <div class="bento-icon"><i :class="p.icon"></i></div>
              <div class="bento-foot">
                <div class="sol-card-title">{{ p.title }}</div>
                <div class="sol-card-desc">{{ p.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ROADMAP -->
        <div v-else-if="slide.type === 'roadmap'" class="content road">
          <span class="road-watermark">ROADMAP</span>
          <div class="road-head">
            <span class="tech-kicker">{{ slide.tag }}</span>
            <h1 class="tech-h1">Lo que <em>viene</em></h1>
          </div>
          <div class="road-track">
            <div class="road-line"></div>
            <div class="road-step" v-for="(s, i) in slide.steps" :key="i" :style="{ animationDelay: (i * 0.15) + 's' }">
              <div class="road-node"><i :class="s.icon"></i></div>
              <span class="road-v">{{ s.v }}</span>
              <div class="road-title">{{ s.title }}</div>
              <div class="road-desc">{{ s.desc }}</div>
            </div>
          </div>
        </div>

        <!-- CONTENT -->
        <div v-else-if="slide.type === 'content'" class="content">
          <span class="tag">{{ slide.tag }}</span>
          <h1>{{ slide.title }}</h1>
          <p v-if="slide.body" class="body">{{ slide.body }}</p>
          <ul class="points">
            <li v-for="(p, i) in slide.points" :key="i" :style="{ animationDelay: (i * 0.08) + 's' }">{{ p }}</li>
          </ul>
        </div>

        <!-- FEATURES -->
        <div v-else-if="slide.type === 'features'" class="content feat">
          <span class="feat-watermark">FEATURES</span>
          <span class="feat-blob feat-blob-1"></span>
          <span class="feat-blob feat-blob-2"></span>
          <span class="feat-dots"></span>

          <div class="feat-head">
            <span class="feat-kicker">{{ slide.tag }}</span>
            <h1 class="feat-h1">¿Qué puedes <em>hacer</em>?</h1>
            <div class="feat-eq" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
          </div>

          <div class="feat-grid">
            <div class="feat-item" v-for="(c, i) in slide.cards" :key="i" :style="{ animationDelay: (i * 0.07) + 's' }">
              <span class="feat-num">{{ String(i + 1).padStart(2, '0') }}</span>
              <div class="feat-icon"><i :class="c.icon"></i></div>
              <div class="feat-body">
                <div class="f-name">{{ c.name }}</div>
                <div class="f-desc">{{ c.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- TECH -->
        <div v-else-if="slide.type === 'tech'" class="content tech">
          <span class="tech-watermark">STACK</span>
          <span class="tech-ring tech-ring-1"></span>
          <span class="tech-ring tech-ring-2"></span>

          <div class="tech-head">
            <span class="tech-kicker">{{ slide.tag }}</span>
            <h1 class="tech-h1">Un <em>stack</em> moderno</h1>
          </div>

          <div class="tech-cards">
            <div class="tcard" v-for="(c, i) in slide.cards" :key="i"
                 :style="{ animationDelay: (i * 0.05) + 's', '--c': c.color }">
              <div class="tcard-top">
                <img :src="c.logo.startsWith('http') ? c.logo : devicon + c.logo" :alt="c.name" class="tcard-logo" loading="lazy" />
                <span class="tcard-cat">{{ c.cat }}</span>
                <span class="tcard-dot"></span>
              </div>
              <div class="tcard-name">{{ c.name }}</div>
              <div class="tcard-desc">{{ c.desc }}</div>
            </div>
          </div>
        </div>

        <!-- TECH (legacy, unused) -->
        <div v-else-if="slide.type === 'tech-old'" class="content">
          <span class="tag">{{ slide.tag }}</span>
          <h1>{{ slide.title }}</h1>
          <div class="tech-grid">
            <div class="tech-group" v-for="(g, i) in slide.groups" :key="i" :style="{ animationDelay: (i * 0.07) + 's' }">
              <div class="t-label">{{ g.label }}</div>
              <div class="chips">
                <span class="chip" v-for="(it, j) in g.items" :key="j">{{ it }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ARCHITECTURE -->
        <div v-else-if="slide.type === 'arch'" class="content arch2">
          <span class="arch2-watermark">3 CAPAS</span>
          <span class="feat-blob feat-blob-1"></span>
          <div class="arch2-head">
            <span class="tech-kicker">{{ slide.tag }}</span>
            <h1 class="tech-h1">Cliente · servidor · <em>datos</em></h1>
          </div>
          <div class="arch2-flow">
            <template v-for="(c, i) in slide.columns" :key="i">
              <div class="arch2-node" :style="{ animationDelay: (i * 0.15) + 's' }">
                <span class="arch2-step">{{ String(i + 1).padStart(2, '0') }}</span>
                <div class="arch2-icon"><i :class="c.icon"></i></div>
                <div class="arch2-label">{{ c.label }}</div>
                <div class="arch2-items">
                  <span v-for="(it, j) in c.items" :key="j">{{ it }}</span>
                </div>
              </div>
              <div v-if="i < slide.columns.length - 1" class="arch2-arrow" :style="{ animationDelay: (i * 0.15 + 0.1) + 's' }">
                <i class="ri-arrow-right-line"></i><small>REST / JSON</small>
              </div>
            </template>
          </div>
        </div>

        <!-- COMPETITION TABLE -->
        <div v-else-if="slide.type === 'table'" class="content cmp2">
          <span class="cmp2-watermark">VS</span>
          <div class="cmp2-head">
            <span class="tech-kicker">{{ slide.tag }}</span>
            <h1 class="tech-h1">Nadie cubre <em>todo</em></h1>
          </div>
          <table class="cmp">
            <thead>
              <tr><th v-for="(h, i) in slide.headers" :key="i">{{ h }}</th></tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in slide.rows" :key="i" :style="{ animationDelay: (i * 0.07) + 's' }">
                <td v-for="(c, j) in r" :key="j">{{ c }}</td>
              </tr>
              <tr class="hl">
                <td v-for="(c, j) in slide.highlight" :key="j">{{ c }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- DATA MODEL -->
        <div v-else-if="slide.type === 'data'" class="content data2">
          <span class="data2-watermark">SQL</span>
          <span class="feat-blob feat-blob-2"></span>
          <div class="data2-layout">
            <div class="data2-left">
              <span class="tech-kicker">{{ slide.tag }}</span>
              <h1 class="data2-h1"><em>8</em> tablas</h1>
              <p class="data2-sub">PostgreSQL en Supabase, con Row Level Security y triggers SQL.</p>
              <div class="data2-badges">
                <span><i class="ri-shield-keyhole-line"></i> RLS</span>
                <span><i class="ri-flashlight-line"></i> Triggers</span>
                <span><i class="ri-links-line"></i> Relacional</span>
              </div>
            </div>
            <div class="data2-grid">
              <div class="data2-table" v-for="(t, i) in slide.tables" :key="i" :style="{ animationDelay: (i * 0.06) + 's' }">
                <i class="ri-table-2"></i>{{ t }}
              </div>
            </div>
          </div>
        </div>

        <!-- CLOSING -->
        <div v-else-if="slide.type === 'closing'" class="content closing2">
          <span class="closing2-watermark">GRACIAS</span>
          <span class="feat-blob feat-blob-1"></span>
          <span class="feat-blob feat-blob-2"></span>
          <div class="closing2-inner">
            <img src="/assets/letmc.png" alt="LetMC Sound" class="closing2-logo" />
            <h1 class="closing2-title">Donde el talento<br>independiente <em>suena</em></h1>
            <div class="closing2-eq" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
            <p class="closing2-thanks">¡Gracias!</p>
          </div>
        </div>

      </div>
    </transition>
  </div>
</template>

<style scoped>
.deck {
  position: fixed; inset: 0;
  background: #0b0b0f;
  color: #fff;
  overflow: hidden;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  display: flex; align-items: center; justify-content: center;
}
.bg-glow { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.35; z-index: 0; }
.glow-1 { width: 520px; height: 520px; background: #b11db9; top: -160px; right: -120px; }
.glow-2 { width: 460px; height: 460px; background: #5b2c8e; bottom: -180px; left: -140px; }

.progress { position: absolute; top: 0; left: 0; right: 0; height: 4px; background: rgba(255,255,255,0.06); z-index: 5; }
.progress-bar { height: 100%; background: linear-gradient(90deg, #b11db9, #e056e8); transition: width .4s ease; }
.counter { position: absolute; top: 22px; right: 30px; z-index: 5; color: rgba(255,255,255,0.4); font-size: 0.85rem; letter-spacing: 0.15em; }

.slide { position: relative; z-index: 2; width: 96vw; max-width: 2400px; padding: 30px clamp(24px, 3vw, 60px); }

/* Cover */
.cover { text-align: center; }

/* Cover — asymmetric creative */
.cv {
  position: relative; display: grid; grid-template-columns: 1.1fr 0.9fr;
  align-items: center; gap: 50px; width: 100%;
}
.cv-ghost {
  position: absolute; top: -120px; left: -60px; z-index: 0;
  font-size: 22rem; font-weight: 900; letter-spacing: -0.03em;
  color: transparent; -webkit-text-stroke: 2px rgba(177,29,185,0.10);
  pointer-events: none; user-select: none; line-height: 1;
}
.cv-left { position: relative; z-index: 2; text-align: left; }
.cv-badge {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 9px 20px; border-radius: 100px;
  background: rgba(177,29,185,0.14); border: 1px solid rgba(177,29,185,0.45);
  color: #e056e8; font-size: 1.05rem; font-weight: 700; letter-spacing: 0.32em;
  font-family: 'Space Grotesk', sans-serif; text-transform: uppercase;
  animation: slideIn .5s ease both;
}
.cv-dot { width: 11px; height: 11px; border-radius: 50%; background: #e056e8; box-shadow: 0 0 10px #e056e8; animation: pulse 1.6s infinite; }
.cv-logo {
  width: min(720px, 60vw); height: auto; margin: 34px 0 10px; display: block;
  filter: drop-shadow(0 10px 40px rgba(177,29,185,0.4));
  animation: slideIn .6s ease both;
}
.cv-tag {
  font-family: 'Anton', sans-serif; font-weight: 400; text-transform: uppercase;
  font-size: 5.2rem; line-height: 0.98; letter-spacing: 0.01em; margin: 22px 0 0; color: #fff;
}
.cv-tag span {
  font-family: 'Fraunces', serif; font-style: italic; font-weight: 600; text-transform: none; letter-spacing: -0.01em;
  background: linear-gradient(120deg, #b11db9, #e056e8); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.cv-sub { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; color: rgba(255,255,255,0.55); margin-top: 18px; letter-spacing: 0.01em; }
.cv-by {
  margin-top: 44px; padding-left: 24px; border-left: 4px solid #b11db9;
  animation: slideIn .8s ease both;
}
.cv-by-label {
  font-family: 'Space Grotesk', sans-serif; text-transform: uppercase;
  letter-spacing: 0.32em; font-size: 0.95rem; font-weight: 700; color: #e056e8;
}
.cv-by-names { display: flex; flex-direction: column; margin-top: 12px; }
.cv-by-names span {
  font-family: 'Fraunces', serif; font-style: italic; font-weight: 600;
  font-size: 2rem; line-height: 1.25; color: #fff;
}
.cv-by-foot {
  display: flex; align-items: center; gap: 18px; margin-top: 18px;
  font-family: 'Space Grotesk', sans-serif; font-size: 1.2rem; color: rgba(255,255,255,0.55);
}
.cv-by-foot i { color: #e056e8; margin-right: 6px; }
.cv-by-divider { width: 1px; height: 18px; background: rgba(255,255,255,0.2); }

/* Right visual cluster */
.cv-right { position: relative; z-index: 2; height: 680px; }
.cv-disc {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 460px; height: 460px; border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #2a1230, #0b0b0f 70%);
  border: 2px solid rgba(177,29,185,0.4);
  box-shadow: 0 0 80px rgba(177,29,185,0.45), inset 0 0 60px rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  animation: spin 18s linear infinite;
}
.cv-disc-ring { position: absolute; inset: 50px; border-radius: 50%; border: 1px dashed rgba(255,255,255,0.12); }
.cv-disc-center {
  width: 140px; height: 140px; border-radius: 50%;
  background: linear-gradient(135deg, #b11db9, #e056e8);
  display: flex; align-items: center; justify-content: center;
  font-size: 3.6rem; color: #fff; box-shadow: 0 0 30px rgba(177,29,185,0.7);
}
.cv-chip {
  position: absolute; display: inline-flex; align-items: center; gap: 12px;
  padding: 17px 30px; border-radius: 100px; font-size: 1.6rem; font-weight: 600; color: #fff;
  background: rgba(20,20,28,0.85); border: 1px solid rgba(177,29,185,0.4);
  backdrop-filter: blur(6px); box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  animation: float 4s ease-in-out infinite;
}
.cv-chip i { color: #e056e8; font-size: 1.8rem; }
.chip-a { top: 10px; right: 0; animation-delay: 0s; }
.chip-b { top: 120px; left: -50px; animation-delay: .6s; }
.chip-c { bottom: 120px; right: -40px; animation-delay: 1.2s; }
.chip-d { bottom: 10px; left: 0; animation-delay: 1.8s; }

@keyframes spin { to { transform: translate(-50%,-50%) rotate(360deg); } }
@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
.logo { display: inline-flex; flex-direction: column; align-items: center; line-height: 0.95; }
.logo-main { font-size: 7rem; font-weight: 800; letter-spacing: 0.04em; background: linear-gradient(120deg, #fff 30%, #e056e8); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.logo-sub { font-size: 2.1rem; letter-spacing: 0.55em; color: #b11db9; margin-top: 4px; padding-left: 0.55em; }
.logo.small .logo-main { font-size: 4rem; }
.logo.small .logo-sub { font-size: 1.3rem; }
.tagline { font-size: 2rem; color: #fff; margin-top: 28px; font-weight: 600; }
.subtitle { color: rgba(255,255,255,0.55); margin-top: 12px; font-size: 1.3rem; }
.hint { margin-top: 50px; color: rgba(255,255,255,0.3); font-size: 1rem; letter-spacing: 0.1em; }
.closing-title { font-size: 3.2rem; margin-top: 32px; max-width: 820px; margin-left: auto; margin-right: auto; }

/* Content */
.tag {
  display: inline-block; background: rgba(177,29,185,0.18); color: #e056e8;
  border: 1px solid rgba(177,29,185,0.4); padding: 8px 20px; border-radius: 100px;
  font-size: 1.25rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
}
h1 { font-size: 4.2rem; font-weight: 800; margin: 26px 0 24px; line-height: 1.08; }
.body { font-size: 1.8rem; color: rgba(255,255,255,0.72); max-width: 1100px; line-height: 1.6; }
.points { list-style: none; padding: 0; margin: 38px 0 0; display: flex; flex-direction: column; gap: 26px; }
.points li {
  position: relative; padding-left: 50px; font-size: 2rem; color: rgba(255,255,255,0.92);
  animation: slideIn .5s ease both;
}
.points li::before {
  content: ''; position: absolute; left: 0; top: 14px; width: 20px; height: 20px;
  border-radius: 50%; background: linear-gradient(135deg, #b11db9, #e056e8);
  box-shadow: 0 0 12px rgba(177,29,185,0.6);
}

/* Problem slide — typographic editorial */
.prob { position: relative; }
.prob-watermark {
  position: absolute; top: -70px; right: -20px; z-index: 0; pointer-events: none; user-select: none;
  font-family: 'Anton', sans-serif; font-size: 16rem; line-height: 0.8; letter-spacing: 0.02em;
  color: transparent; -webkit-text-stroke: 2px rgba(177,29,185,0.08);
}
.prob-kicker {
  position: relative; z-index: 2; display: inline-block;
  font-family: 'Space Grotesk', sans-serif; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5em; font-size: 1.1rem; color: #e056e8; padding-left: 4px;
}
.prob-h1 {
  position: relative; z-index: 2; font-family: 'Anton', sans-serif; font-weight: 400;
  font-size: 5rem; line-height: 1.02; letter-spacing: 0.005em; text-transform: uppercase;
  color: #fff; margin: 20px 0 50px;
}
.prob-h1 em {
  font-family: 'Fraunces', serif; font-style: italic; font-weight: 600; text-transform: none;
  letter-spacing: -0.01em;
  background: linear-gradient(120deg, #b11db9, #e056e8);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.prob-list { position: relative; z-index: 2; display: flex; flex-direction: column; }
.prob-row {
  display: flex; align-items: baseline; gap: 30px;
  padding: 26px 0; border-top: 1px solid rgba(255,255,255,0.1);
  animation: slideIn .55s ease both;
}
.prob-row:last-child { border-bottom: 1px solid rgba(255,255,255,0.1); }
.prob-n {
  font-family: 'Bebas Neue', sans-serif; font-size: 3.6rem; line-height: 1;
  color: #b11db9; min-width: 90px;
}
.prob-text { display: flex; flex-direction: column; gap: 6px; }
.prob-t {
  font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 2.1rem; color: #fff;
}
.prob-d {
  font-family: 'Space Grotesk', sans-serif; font-weight: 400; font-size: 1.4rem;
  color: rgba(255,255,255,0.58); line-height: 1.5;
}

/* Solution slide — modern */
.sol-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 40px; flex-wrap: wrap; }
.sol-kicker {
  font-family: 'Space Grotesk', sans-serif; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5em; font-size: 1.1rem; color: #e056e8;
}
.sol-h1 {
  font-family: 'Anton', sans-serif; font-weight: 400; text-transform: uppercase;
  font-size: 5rem; line-height: 0.98; margin: 18px 0 0; color: #fff;
}
.sol-h1 em {
  font-family: 'Fraunces', serif; font-style: italic; font-weight: 600; text-transform: none;
  background: linear-gradient(120deg, #b11db9, #e056e8); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.sol-stats { display: flex; gap: 18px; }
.sol-stat {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-width: 170px; padding: 22px 28px; border-radius: 20px;
  background: linear-gradient(150deg, rgba(177,29,185,0.22), rgba(177,29,185,0.05));
  border: 1px solid rgba(177,29,185,0.4); animation: slideIn .6s ease both;
}
.sol-num {
  font-family: 'Bebas Neue', sans-serif; font-size: 4.8rem; line-height: 0.9;
  background: linear-gradient(120deg, #fff, #e056e8); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.sol-stat-label {
  font-family: 'Space Grotesk', sans-serif; text-transform: uppercase; letter-spacing: 0.22em;
  font-size: 1rem; color: rgba(255,255,255,0.7); margin-top: 6px;
}
.sol-bento {
  display: grid; grid-template-columns: 1.4fr 1fr; grid-template-rows: 1fr 1fr;
  gap: 20px; margin-top: 42px; height: 460px;
}
.bento-0 { grid-row: 1 / 3; }
.bento {
  position: relative; overflow: hidden; border-radius: 24px;
  padding: 36px; display: flex; flex-direction: column; justify-content: flex-end;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
  animation: slideIn .6s ease both; transition: .35s;
}
.bento-0 {
  background: linear-gradient(150deg, rgba(177,29,185,0.28), rgba(91,44,142,0.10));
  border-color: rgba(177,29,185,0.4);
}
.bento:hover { transform: translateY(-6px); border-color: rgba(177,29,185,0.6); box-shadow: 0 16px 40px rgba(0,0,0,0.35); }
.bento-bg {
  position: absolute; right: -20px; top: -24px; font-size: 11rem; line-height: 1;
  color: rgba(255,255,255,0.05); pointer-events: none;
}
.bento-0 .bento-bg { font-size: 18rem; right: -30px; top: -40px; color: rgba(255,255,255,0.07); }
.bento-icon {
  position: relative; z-index: 1; width: 70px; height: 70px; border-radius: 18px;
  background: rgba(177,29,185,0.18); border: 1px solid rgba(177,29,185,0.4);
  display: flex; align-items: center; justify-content: center;
  font-size: 2.2rem; color: #e056e8; margin-bottom: auto;
}
.bento-icon i { display: block; line-height: 1; }
.bento-foot { position: relative; z-index: 1; margin-top: 20px; }
.sol-card-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 2rem; color: #fff; margin-bottom: 8px; }
.bento-0 .sol-card-title { font-size: 2.6rem; }
.sol-card-desc { font-family: 'Space Grotesk', sans-serif; font-size: 1.4rem; color: rgba(255,255,255,0.65); line-height: 1.5; }
.bento-0 .sol-card-desc { font-size: 1.6rem; }

/* Features — graphic index */
.feat { position: relative; }
.feat-watermark {
  position: absolute; top: -50px; left: -30px; z-index: 0; pointer-events: none; user-select: none;
  font-family: 'Anton', sans-serif; font-size: 13rem; line-height: 0.8; letter-spacing: 0.01em;
  color: transparent; -webkit-text-stroke: 2px rgba(177,29,185,0.07);
}
.feat-blob { position: absolute; z-index: 0; border-radius: 50%; filter: blur(90px); pointer-events: none; }
.feat-blob-1 { width: 360px; height: 360px; background: rgba(177,29,185,0.22); top: -80px; right: 4%; }
.feat-blob-2 { width: 300px; height: 300px; background: rgba(91,44,142,0.28); bottom: -100px; left: 30%; }
.feat-dots {
  position: absolute; z-index: 0; top: 30px; right: 40px; width: 180px; height: 130px; pointer-events: none;
  background-image: radial-gradient(rgba(255,255,255,0.18) 2px, transparent 2px);
  background-size: 22px 22px; opacity: 0.5;
}
.feat-head { position: relative; z-index: 2; display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }
.feat-kicker {
  font-family: 'Space Grotesk', sans-serif; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.45em; font-size: 1.05rem; color: #e056e8;
  border: 1px solid rgba(177,29,185,0.4); border-radius: 100px; padding: 8px 22px;
}
.feat-h1 {
  font-family: 'Anton', sans-serif; font-weight: 400; text-transform: uppercase;
  font-size: 4.4rem; line-height: 1; color: #fff; margin: 0;
}
.feat-h1 em {
  font-family: 'Fraunces', serif; font-style: italic; font-weight: 600; text-transform: none;
  background: linear-gradient(120deg, #b11db9, #e056e8); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.feat-eq { display: flex; align-items: flex-end; gap: 6px; height: 56px; margin-left: auto; }
.feat-eq span {
  width: 9px; border-radius: 6px; background: linear-gradient(#e056e8, #b11db9);
  animation: eq 1.1s ease-in-out infinite;
}
.feat-eq span:nth-child(1) { height: 40%; animation-delay: 0s; }
.feat-eq span:nth-child(2) { height: 80%; animation-delay: .15s; }
.feat-eq span:nth-child(3) { height: 55%; animation-delay: .3s; }
.feat-eq span:nth-child(4) { height: 95%; animation-delay: .1s; }
.feat-eq span:nth-child(5) { height: 65%; animation-delay: .4s; }
.feat-eq span:nth-child(6) { height: 45%; animation-delay: .25s; }
@keyframes eq { 0%,100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }

.feat-grid {
  position: relative; z-index: 2;
  display: grid; grid-template-columns: 1fr 1fr; gap: 0 70px; margin-top: 36px;
}
.feat-item {
  position: relative; display: flex; align-items: flex-start; gap: 22px;
  padding: 24px 10px; border-bottom: 1px solid rgba(255,255,255,0.1);
  animation: slideIn .55s ease both; transition: .3s;
}
.feat-item::after {
  content: ''; position: absolute; left: 0; bottom: -1px; height: 2px; width: 0;
  background: linear-gradient(90deg, #b11db9, #e056e8); transition: width .35s ease;
}
.feat-item:hover { padding-left: 18px; }
.feat-item:hover::after { width: 100%; }
.feat-item:hover .feat-icon { color: #fff; background: linear-gradient(140deg, #b11db9, #e056e8); border-color: transparent; transform: rotate(-6deg) scale(1.05); }
.feat-num {
  font-family: 'Anton', sans-serif; font-size: 3.4rem; line-height: 0.9;
  color: transparent; -webkit-text-stroke: 1.5px rgba(224,86,232,0.55); min-width: 60px;
}
.feat-icon {
  flex-shrink: 0; width: 66px; height: 66px; border-radius: 18px;
  background: rgba(177,29,185,0.12); border: 1px solid rgba(177,29,185,0.35);
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem; color: #e056e8; transition: .3s;
}
.feat-icon i { display: block; line-height: 1; }
.feat-body { flex: 1; padding-top: 4px; }
.f-name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.9rem; color: #fff; margin-bottom: 6px; }
.f-desc { font-family: 'Space Grotesk', sans-serif; color: rgba(255,255,255,0.6); font-size: 1.35rem; line-height: 1.45; }

/* Tech — layered stack */
.tech { position: relative; }
.tech-watermark {
  position: absolute; top: -40px; right: -20px; z-index: 0; pointer-events: none; user-select: none;
  font-family: 'Anton', sans-serif; font-size: 15rem; line-height: 0.8;
  color: transparent; -webkit-text-stroke: 2px rgba(177,29,185,0.07);
}
.tech-ring { position: absolute; z-index: 0; border-radius: 50%; pointer-events: none; }
.tech-ring-1 { width: 320px; height: 320px; border: 2px dashed rgba(177,29,185,0.18); bottom: -120px; left: -90px; }
.tech-ring-2 { width: 180px; height: 180px; border: 2px solid rgba(224,86,232,0.14); top: 40px; right: 18%; }
.tech-head { position: relative; z-index: 2; display: flex; align-items: center; gap: 26px; flex-wrap: wrap; }
.tech-kicker {
  font-family: 'Space Grotesk', sans-serif; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.45em; font-size: 1.05rem; color: #e056e8;
  border: 1px solid rgba(177,29,185,0.4); border-radius: 100px; padding: 8px 22px;
}
.tech-h1 {
  font-family: 'Anton', sans-serif; font-weight: 400; text-transform: uppercase;
  font-size: 4.4rem; line-height: 1; color: #fff; margin: 0;
}
.tech-h1 em {
  font-family: 'Fraunces', serif; font-style: italic; font-weight: 600; text-transform: none;
  background: linear-gradient(120deg, #b11db9, #e056e8); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.tech-cards {
  position: relative; z-index: 2;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-top: 38px;
}
.tcard {
  position: relative; overflow: hidden; border-radius: 22px; padding: 28px 30px;
  background:
    radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--c) 22%, transparent), transparent 60%),
    rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.12);
  animation: slideIn .5s ease both; transition: .3s;
}
.tcard:hover {
  transform: translateY(-6px);
  border-color: color-mix(in srgb, var(--c) 60%, transparent);
  box-shadow: 0 16px 40px rgba(0,0,0,0.35);
}
.tcard-top { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
.tcard-logo { width: 30px; height: 30px; object-fit: contain; flex-shrink: 0; }
.tcard-cat {
  font-family: 'Space Grotesk', sans-serif; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.2em; font-size: 0.95rem; color: rgba(255,255,255,0.5);
}
.tcard-dot {
  margin-left: auto; width: 11px; height: 11px; border-radius: 50%;
  background: var(--c); box-shadow: 0 0 12px var(--c);
}
.tcard-name {
  font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 2.7rem; line-height: 1.05;
  color: var(--c); margin-bottom: 8px;
}
.tcard-desc { font-family: 'Space Grotesk', sans-serif; font-size: 1.3rem; color: rgba(255,255,255,0.55); }

/* Tech (legacy) */
.tech-grid { display: flex; flex-wrap: wrap; gap: 22px; margin-top: 38px; }
.tech-group {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px; padding: 26px 28px; flex: 1 1 280px; animation: slideIn .5s ease both;
}
.t-label { color: #e056e8; font-weight: 700; font-size: 1.5rem; margin-bottom: 20px; letter-spacing: 0.04em; }
.chips { display: flex; flex-wrap: wrap; gap: 12px; }
.chip {
  background: rgba(177,29,185,0.12); border: 1px solid rgba(177,29,185,0.3); color: #fff;
  padding: 10px 22px; border-radius: 100px; font-size: 1.4rem; font-weight: 500;
}

/* Architecture */
.arch { display: flex; align-items: stretch; gap: 10px; margin-top: 40px; }
.arch-col {
  flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px; padding: 30px; animation: slideIn .5s ease both;
}
.a-icon { font-size: 3.2rem; color: #e056e8; line-height: 1; }
.a-label { color: #e056e8; font-weight: 700; letter-spacing: 0.06em; margin-top: 16px; font-size: 1.55rem; }
.a-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 20px 0; }
.arch-col ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; }
.arch-col li { position: relative; padding-left: 24px; color: rgba(255,255,255,0.85); font-size: 1.55rem; }
.arch-col li::before { content: ''; position: absolute; left: 0; top: 10px; width: 8px; height: 8px; border-radius: 50%; background: #b11db9; }
.arch-arrow { display: flex; flex-direction: column; align-items: center; justify-content: center; color: #b11db9; font-size: 2rem; }
.arch-arrow small { color: rgba(255,255,255,0.4); font-size: 0.75rem; letter-spacing: 0.15em; margin-top: 4px; }

/* Competition table */
.cmp { position: relative; z-index: 2; width: 100%; border-collapse: collapse; margin-top: 40px; font-size: 1.55rem; font-family: 'Space Grotesk', sans-serif; }
.cmp th {
  text-align: left; padding: 20px 24px; background: linear-gradient(90deg, rgba(177,29,185,0.35), rgba(91,44,142,0.25));
  color: #fff; font-weight: 700; font-size: 1.2rem; text-transform: uppercase; letter-spacing: 0.08em;
}
.cmp th:first-child { border-top-left-radius: 12px; }
.cmp th:last-child { border-top-right-radius: 12px; }
.cmp td { padding: 20px 24px; color: rgba(255,255,255,0.78); border-bottom: 1px solid rgba(255,255,255,0.06); }
.cmp tbody tr { animation: slideIn .45s ease both; }
.cmp tr.hl td { background: rgba(177,29,185,0.16); color: #fff; font-weight: 600; border-bottom: none; }
.cmp tr.hl td:first-child { color: #fff; font-weight: 800; }
.cmp tr.hl td:nth-child(3) { color: #4ade80; font-weight: 800; }
.cmp tr.hl td:nth-child(4) { color: #e056e8; }
.cmp tr.hl td:first-child { border-bottom-left-radius: 12px; }
.cmp tr.hl td:last-child { border-bottom-right-radius: 12px; }

/* Data model */
.db-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-top: 36px; }
.db-table {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(177,29,185,0.25);
  border-radius: 12px; padding: 26px 28px; font-family: 'Consolas', monospace; font-size: 1.65rem;
  display: flex; align-items: center; gap: 14px; animation: slideIn .45s ease both;
}
.db-dot { width: 10px; height: 10px; border-radius: 50%; background: #b11db9; box-shadow: 0 0 8px #b11db9; }

/* Challenges */
.ch-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 28px; }
.ch-card {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px; padding: 20px; animation: slideIn .5s ease both;
}
.ch-p { font-weight: 700; font-size: 1.02rem; display: flex; gap: 10px; }
.ch-p span { color: #fbbf24; }
.ch-s { color: rgba(255,255,255,0.68); font-size: 0.95rem; margin-top: 10px; display: flex; gap: 10px; line-height: 1.5; }
.ch-s span { color: #4ade80; font-weight: 700; }

/* Nav */
.nav { position: absolute; bottom: 28px; left: 0; right: 0; z-index: 5; display: flex; align-items: center; justify-content: center; gap: 22px; }
.nav-btn {
  width: 48px; height: 48px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.05); color: #fff; font-size: 1.3rem; cursor: pointer; transition: .25s;
}
.nav-btn:hover:not(:disabled) { background: #b11db9; border-color: #b11db9; transform: scale(1.08); }
.nav-btn:disabled { opacity: 0.25; cursor: default; }
.dots { display: flex; gap: 9px; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.2); cursor: pointer; transition: .25s; }
.dot.active { background: #b11db9; width: 28px; border-radius: 100px; box-shadow: 0 0 10px rgba(177,29,185,0.7); }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity .35s ease, transform .35s ease; }
.fade-enter-from { opacity: 0; transform: translateY(18px); }
.fade-leave-to { opacity: 0; transform: translateY(-18px); }

@keyframes slideIn { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: translateX(0); } }

/* ===== Architecture redesign ===== */
.arch2 { position: relative; }
.arch2-watermark {
  position: absolute; top: -50px; right: -10px; z-index: 0; pointer-events: none; user-select: none;
  font-family: 'Anton', sans-serif; font-size: 13rem; line-height: 0.8;
  color: transparent; -webkit-text-stroke: 2px rgba(177,29,185,0.07);
}
.arch2-head { position: relative; z-index: 2; display: flex; align-items: center; gap: 26px; flex-wrap: wrap; }
.arch2-flow { position: relative; z-index: 2; display: flex; align-items: stretch; gap: 14px; margin-top: 44px; }
.arch2-node {
  flex: 1; position: relative; overflow: hidden; border-radius: 24px; padding: 34px 30px;
  background: linear-gradient(160deg, rgba(177,29,185,0.16), rgba(255,255,255,0.03));
  border: 1px solid rgba(177,29,185,0.3); animation: slideIn .6s ease both; transition: .3s;
}
.arch2-node:hover { transform: translateY(-6px); border-color: rgba(224,86,232,0.6); }
.arch2-step {
  position: absolute; top: 10px; right: 18px; font-family: 'Anton', sans-serif; font-size: 4rem;
  color: transparent; -webkit-text-stroke: 1.5px rgba(255,255,255,0.08); line-height: 1;
}
.arch2-icon {
  width: 84px; height: 84px; border-radius: 22px; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(140deg, #b11db9, #e056e8); color: #fff; font-size: 2.6rem;
  box-shadow: 0 10px 30px rgba(177,29,185,0.45); margin-bottom: 22px;
}
.arch2-icon i { display: block; line-height: 1; }
.arch2-label { font-family: 'Anton', sans-serif; text-transform: uppercase; font-size: 1.9rem; color: #fff; margin-bottom: 16px; }
.arch2-items { display: flex; flex-direction: column; gap: 10px; }
.arch2-items span {
  font-family: 'Space Grotesk', sans-serif; font-size: 1.3rem; color: rgba(255,255,255,0.75);
  padding-left: 18px; position: relative;
}
.arch2-items span::before { content: ''; position: absolute; left: 0; top: 9px; width: 7px; height: 7px; border-radius: 50%; background: #e056e8; }
.arch2-arrow { display: flex; flex-direction: column; align-items: center; justify-content: center; color: #e056e8; animation: slideIn .6s ease both; }
.arch2-arrow i { font-size: 2.6rem; }
.arch2-arrow small { font-family: 'Space Grotesk', sans-serif; font-size: 0.8rem; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); margin-top: 4px; white-space: nowrap; }

/* ===== Competition redesign ===== */
.cmp2 { position: relative; }
.cmp2-watermark {
  position: absolute; top: -70px; right: 30px; z-index: 0; pointer-events: none; user-select: none;
  font-family: 'Anton', sans-serif; font-size: 18rem; line-height: 0.7;
  color: transparent; -webkit-text-stroke: 2px rgba(177,29,185,0.07);
}
.cmp2-head { position: relative; z-index: 2; display: flex; align-items: center; gap: 26px; flex-wrap: wrap; }

/* ===== Data model redesign ===== */
.data2 { position: relative; }
.data2-watermark {
  position: absolute; bottom: -90px; left: -20px; z-index: 0; pointer-events: none; user-select: none;
  font-family: 'Anton', sans-serif; font-size: 16rem; line-height: 0.7;
  color: transparent; -webkit-text-stroke: 2px rgba(177,29,185,0.06);
}
.data2-layout { position: relative; z-index: 2; display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 50px; align-items: center; }
.data2-h1 { font-family: 'Anton', sans-serif; text-transform: uppercase; font-size: 5.5rem; color: #fff; margin: 16px 0 14px; }
.data2-h1 em {
  font-family: 'Bebas Neue', sans-serif; font-style: normal; font-size: 7rem;
  background: linear-gradient(120deg, #b11db9, #e056e8); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; margin-right: 10px;
}
.data2-sub { font-family: 'Space Grotesk', sans-serif; font-size: 1.45rem; color: rgba(255,255,255,0.6); line-height: 1.5; max-width: 420px; }
.data2-badges { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 26px; }
.data2-badges span {
  font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 1.2rem; color: #fff;
  background: rgba(177,29,185,0.14); border: 1px solid rgba(177,29,185,0.4); border-radius: 100px; padding: 8px 18px;
}
.data2-badges i { color: #e056e8; margin-right: 6px; }
.data2-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.data2-table {
  display: flex; align-items: center; gap: 14px;
  font-family: 'Consolas', monospace; font-size: 1.6rem; color: #fff;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
  border-left: 4px solid #b11db9; border-radius: 14px; padding: 20px 24px;
  animation: slideIn .5s ease both; transition: .25s;
}
.data2-table:hover { transform: translateX(8px); border-left-color: #e056e8; background: rgba(177,29,185,0.1); }
.data2-table i { color: #e056e8; font-size: 1.5rem; }

/* ===== Roadmap redesign ===== */
.road { position: relative; }
.road-watermark {
  position: absolute; top: -50px; left: -20px; z-index: 0; pointer-events: none; user-select: none;
  font-family: 'Anton', sans-serif; font-size: 13rem; line-height: 0.8;
  color: transparent; -webkit-text-stroke: 2px rgba(177,29,185,0.07);
}
.road-head { position: relative; z-index: 2; display: flex; align-items: center; gap: 26px; flex-wrap: wrap; }
.road-track { position: relative; z-index: 2; display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-top: 70px; }
.road-line { position: absolute; top: 32px; left: 6%; right: 6%; height: 3px; background: linear-gradient(90deg, #b11db9, #e056e8); opacity: 0.5; }
.road-step {
  position: relative; padding: 50px 28px 30px; border-radius: 22px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
  animation: slideIn .6s ease both; transition: .3s;
}
.road-step:hover { transform: translateY(-6px); border-color: rgba(224,86,232,0.6); }
.road-node {
  position: absolute; top: -32px; left: 28px; width: 66px; height: 66px; border-radius: 50%;
  background: linear-gradient(140deg, #b11db9, #e056e8); display: flex; align-items: center; justify-content: center;
  font-size: 2rem; color: #fff; box-shadow: 0 8px 24px rgba(177,29,185,0.5);
}
.road-node i { display: block; line-height: 1; }
.road-v { font-family: 'Bebas Neue', sans-serif; font-size: 2.4rem; color: #e056e8; letter-spacing: 0.04em; }
.road-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 2rem; color: #fff; margin: 6px 0 10px; }
.road-desc { font-family: 'Space Grotesk', sans-serif; font-size: 1.35rem; color: rgba(255,255,255,0.6); line-height: 1.5; }

/* ===== Closing redesign ===== */
.closing2 { position: relative; }
.closing2-watermark {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 0; pointer-events: none; user-select: none;
  font-family: 'Anton', sans-serif; font-size: 20rem; line-height: 0.8;
  color: transparent; -webkit-text-stroke: 2px rgba(177,29,185,0.06);
}
.closing2-inner { position: relative; z-index: 2; text-align: center; display: flex; flex-direction: column; align-items: center; }
.closing2-logo { width: min(440px, 50vw); filter: drop-shadow(0 10px 40px rgba(177,29,185,0.45)); animation: slideIn .6s ease both; }
.closing2-title {
  font-family: 'Anton', sans-serif; text-transform: uppercase; font-size: 4rem; line-height: 1.04;
  color: #fff; margin: 30px 0 0;
}
.closing2-title em {
  font-family: 'Fraunces', serif; font-style: italic; font-weight: 600; text-transform: none;
  background: linear-gradient(120deg, #b11db9, #e056e8); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.closing2-eq { display: flex; align-items: flex-end; justify-content: center; gap: 7px; height: 56px; margin: 34px 0 18px; }
.closing2-eq span { width: 10px; border-radius: 6px; background: linear-gradient(#e056e8, #b11db9); animation: eq 1.1s ease-in-out infinite; }
.closing2-eq span:nth-child(1){height:40%;animation-delay:0s}
.closing2-eq span:nth-child(2){height:75%;animation-delay:.15s}
.closing2-eq span:nth-child(3){height:55%;animation-delay:.3s}
.closing2-eq span:nth-child(4){height:100%;animation-delay:.1s}
.closing2-eq span:nth-child(5){height:60%;animation-delay:.35s}
.closing2-eq span:nth-child(6){height:85%;animation-delay:.2s}
.closing2-eq span:nth-child(7){height:45%;animation-delay:.4s}
.closing2-thanks { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.6rem; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(255,255,255,0.6); }

/* ===== Description ===== */
.desc { position: relative; }
.desc-watermark {
  position: absolute; bottom: -80px; right: -20px; z-index: 0; pointer-events: none; user-select: none;
  font-family: 'Anton', sans-serif; font-size: 17rem; line-height: 0.7;
  color: transparent; -webkit-text-stroke: 2px rgba(177,29,185,0.06);
}
.desc-inner { position: relative; z-index: 2; max-width: 1300px; }
.desc-lead {
  font-family: 'Anton', sans-serif; font-weight: 400; text-transform: uppercase;
  font-size: 4.6rem; line-height: 1.04; color: #fff; margin: 22px 0 0;
}
.desc-lead em {
  font-family: 'Fraunces', serif; font-style: italic; font-weight: 600; text-transform: none;
  background: linear-gradient(120deg, #b11db9, #e056e8); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.desc-body { font-family: 'Space Grotesk', sans-serif; font-size: 1.7rem; color: rgba(255,255,255,0.65); line-height: 1.55; margin: 28px 0 0; max-width: 1000px; }
.desc-tags { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 38px; }
.desc-tags span {
  font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 1.35rem; color: #fff;
  background: rgba(177,29,185,0.14); border: 1px solid rgba(177,29,185,0.4); border-radius: 100px;
  padding: 12px 26px; animation: slideIn .5s ease both;
}

/* shared watermark helper */
.just-watermark, .obj-watermark, .scope-watermark, .diff-watermark, .deliv-watermark {
  position: absolute; z-index: 0; pointer-events: none; user-select: none;
  font-family: 'Anton', sans-serif; line-height: 0.8;
  color: transparent; -webkit-text-stroke: 2px rgba(177,29,185,0.07);
}
.just-head, .obj-head, .scope-head, .diff-head, .deliv-head {
  position: relative; z-index: 2; display: flex; align-items: center; gap: 26px; flex-wrap: wrap;
}

/* ===== Justification ===== */
.just { position: relative; }
.just-watermark { top: -50px; right: -10px; font-size: 13rem; }
.just-cols { position: relative; z-index: 2; display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 46px; }
.just-col {
  border-radius: 24px; padding: 38px 36px; animation: slideIn .6s ease both;
  background: linear-gradient(160deg, rgba(177,29,185,0.14), rgba(255,255,255,0.03));
  border: 1px solid rgba(177,29,185,0.3);
}
.just-icon {
  width: 80px; height: 80px; border-radius: 22px; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(140deg, #b11db9, #e056e8); color: #fff; font-size: 2.4rem; margin-bottom: 22px;
  box-shadow: 0 10px 30px rgba(177,29,185,0.45);
}
.just-icon i { display: block; line-height: 1; }
.just-label { font-family: 'Anton', sans-serif; text-transform: uppercase; font-size: 2.2rem; color: #fff; margin-bottom: 20px; }
.just-col ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; }
.just-col li {
  position: relative; padding-left: 30px; font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem; color: rgba(255,255,255,0.82); line-height: 1.4;
}
.just-col li::before { content: ''; position: absolute; left: 0; top: 11px; width: 12px; height: 12px; border-radius: 50%; background: linear-gradient(135deg, #b11db9, #e056e8); }

/* ===== Objectives ===== */
.obj { position: relative; }
.obj-watermark { top: -40px; right: 0; font-size: 14rem; }
.obj-general {
  position: relative; z-index: 2; margin-top: 30px; padding: 26px 32px; border-radius: 20px;
  background: rgba(177,29,185,0.12); border: 1px solid rgba(177,29,185,0.4); border-left: 5px solid #e056e8;
}
.obj-general-tag {
  font-family: 'Space Grotesk', sans-serif; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.22em; font-size: 0.95rem; color: #e056e8;
}
.obj-general p { font-family: 'Space Grotesk', sans-serif; font-size: 1.55rem; color: #fff; line-height: 1.4; margin: 10px 0 0; }
.obj-grid { position: relative; z-index: 2; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; margin-top: 26px; }
.obj-item {
  position: relative; display: flex; align-items: flex-start; gap: 16px;
  padding: 22px 24px; border-radius: 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
  animation: slideIn .5s ease both; transition: .25s;
}
.obj-item:hover { transform: translateY(-4px); border-color: rgba(224,86,232,0.5); }
.obj-n { font-family: 'Bebas Neue', sans-serif; font-size: 2rem; color: rgba(224,86,232,0.7); }
.obj-icon {
  flex-shrink: 0; width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center;
  background: rgba(177,29,185,0.14); border: 1px solid rgba(177,29,185,0.35); color: #e056e8; font-size: 1.6rem;
}
.obj-icon i { display: block; line-height: 1; }
.obj-text { display: flex; flex-direction: column; gap: 4px; }
.obj-t { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.45rem; color: #fff; }
.obj-d { font-family: 'Space Grotesk', sans-serif; font-size: 1.15rem; color: rgba(255,255,255,0.58); line-height: 1.4; }

/* ===== Scope ===== */
.scope { position: relative; }
.scope-watermark { top: -50px; left: 0; font-size: 15rem; }
.scope-cols { position: relative; z-index: 2; display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 46px; }
.scope-col { border-radius: 24px; padding: 34px 36px; animation: slideIn .6s ease both; border: 1px solid; }
.scope-in { background: rgba(74,222,128,0.06); border-color: rgba(74,222,128,0.3); }
.scope-out { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.12); }
.scope-col-head { display: flex; align-items: center; gap: 12px; font-family: 'Anton', sans-serif; text-transform: uppercase; font-size: 2rem; color: #fff; margin-bottom: 24px; }
.scope-in .scope-col-head i { color: #4ade80; font-size: 2.2rem; }
.scope-out .scope-col-head i { color: rgba(255,255,255,0.4); font-size: 2.2rem; }
.scope-col ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; }
.scope-col li { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; line-height: 1.4; padding-left: 28px; position: relative; }
.scope-in li { color: rgba(255,255,255,0.88); }
.scope-out li { color: rgba(255,255,255,0.55); }
.scope-in li::before { content: '\2713'; position: absolute; left: 0; color: #4ade80; font-weight: 700; }
.scope-out li::before { content: '\2715'; position: absolute; left: 0; color: rgba(255,255,255,0.35); }

/* ===== Difficulties ===== */
.diff { position: relative; }
.diff-watermark { top: -50px; right: -10px; font-size: 14rem; }
.diff-grid { position: relative; z-index: 2; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 44px; }
.diff-card {
  display: flex; gap: 22px; padding: 28px 30px; border-radius: 20px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
  animation: slideIn .55s ease both; transition: .25s;
}
.diff-card:hover { transform: translateY(-5px); border-color: rgba(224,86,232,0.5); }
.diff-icon {
  flex-shrink: 0; width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
  background: rgba(251,191,36,0.14); border: 1px solid rgba(251,191,36,0.4); color: #fbbf24; font-size: 2rem;
}
.diff-icon i { display: block; line-height: 1; }
.diff-p { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.65rem; color: #fff; margin-bottom: 10px; }
.diff-s { font-family: 'Space Grotesk', sans-serif; font-size: 1.3rem; color: rgba(255,255,255,0.62); line-height: 1.45; display: flex; gap: 8px; }
.diff-s i { color: #4ade80; flex-shrink: 0; margin-top: 4px; }

/* ===== Deliverables ===== */
.deliv { position: relative; }
.deliv-watermark { top: -40px; right: 0; font-size: 14rem; }
.deliv-grid { position: relative; z-index: 2; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 44px; }
.deliv-card {
  position: relative; overflow: hidden; border-radius: 22px; padding: 32px 30px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
  animation: slideIn .5s ease both; transition: .3s;
}
.deliv-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #b11db9, #e056e8); }
.deliv-card:hover { transform: translateY(-6px); border-color: rgba(224,86,232,0.6); box-shadow: 0 16px 40px rgba(0,0,0,0.35); }
.deliv-icon {
  width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  background: rgba(177,29,185,0.16); border: 1px solid rgba(177,29,185,0.4); color: #e056e8; font-size: 2.3rem; margin-bottom: 20px;
}
.deliv-icon i { display: block; line-height: 1; }
.deliv-t { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.9rem; color: #fff; margin-bottom: 8px; }
.deliv-d { font-family: 'Space Grotesk', sans-serif; font-size: 1.3rem; color: rgba(255,255,255,0.6); line-height: 1.45; }

@media (max-width: 820px) {
  .just-cols, .scope-cols, .diff-grid { grid-template-columns: 1fr; }
  .obj-grid, .deliv-grid { grid-template-columns: 1fr 1fr; }
  .desc-lead { font-size: 2.4rem; }
  .arch2-flow { flex-direction: column; }
  .arch2-arrow { transform: rotate(90deg); }
  .data2-layout { grid-template-columns: 1fr; gap: 30px; }
  .data2-grid { grid-template-columns: 1fr 1fr; }
  .road-track { grid-template-columns: 1fr; gap: 40px; }
  .road-line { display: none; }
  .cv { grid-template-columns: 1fr; }
  .cv-right { display: none; }
  .cv-ghost { font-size: 12rem; top: -60px; }
  .cv-tag { font-size: 2rem; }
  .logo-main { font-size: 3.4rem; }
  h1 { font-size: 1.9rem; }
  .grid, .db-grid, .ch-grid, .prob-grid, .feat-grid { grid-template-columns: 1fr; gap: 0; }
  .tech-cards { grid-template-columns: 1fr 1fr; }
  .tech-h1, .feat-h1 { font-size: 2.4rem; }
  .sol-bento { grid-template-columns: 1fr; grid-template-rows: none; height: auto; }
  .bento-0 { grid-row: auto; }
  .sol-h1 { font-size: 2.4rem; }
  .arch { flex-direction: column; }
  .arch-arrow { transform: rotate(90deg); }
  .body { font-size: 1.02rem; }
  .cmp { font-size: 0.82rem; }
  .cmp th, .cmp td { padding: 9px 10px; }
}
</style>
