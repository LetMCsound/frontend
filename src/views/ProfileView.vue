<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBeats } from '@/composables/useBeats'
import { profileService } from '@/services/profile'
import { lyricsService } from '@/services/lyrics'
import { filmService } from '@/services/film'
import { graphicService } from '@/services/graphic'
import AuthForm from '@/modules/auth/components/AuthForm.vue'
import BeatCard from '@/modules/beats/components/BeatCard.vue'
import BeatModal from '@/modules/beats/components/BeatModal.vue'
import NewBeatForm from '@/modules/beats/components/NewBeatForm.vue'
import StateDisplay from '@/components/ui/StateDisplay.vue'
import ContentTypeSelector from '@/components/ui/ContentTypeSelector.vue'
import NewGraphicForm from '@/modules/graphic/components/NewGraphicForm.vue'
import NewFilmForm from '@/modules/film/components/NewFilmForm.vue'
import NewLyricForm from '@/modules/lyrics/components/NewLyricForm.vue'
import FilmDetailModal from '@/modules/film/components/FilmDetailModal.vue'
import LyricDetailModal from '@/modules/lyrics/components/LyricDetailModal.vue'
import PinDetailModal from '@/modules/graphic/components/PinDetailModal.vue'
import EditPublicationModal from '@/components/ui/EditPublicationModal.vue'
import { beatsService } from '@/services/beats'
import { confirmDialog } from '@/composables/useConfirm'

const authStore  = useAuthStore()
const { beats, loading: beatsLoading, fetchBySeller } = useBeats()

const profile         = ref(null)
const loadingProfile  = ref(true)
const selectedBeat    = ref(null)
const selectedFilm    = ref(null)
const selectedLyric   = ref(null)
const selectedGraphic = ref(null)
const showSelector    = ref(false)
const showBeatForm    = ref(false)
const showGraphicForm = ref(false)
const showFilmForm    = ref(false)
const showLyricForm   = ref(false)

// Contenido adicional del usuario
const lyrics    = ref([])
const films     = ref([])
const graphics  = ref([])
const activeTab = ref('all') // all | beats | lyrics | films | graphics
const editingItem = ref(null) // { type, item } cuando se está editando

function startEdit(type, item) {
  editingItem.value = { type, item }
}

async function deleteItem(type, item) {
  const ok = await confirmDialog({
    title: '¿Eliminar publicación?',
    message: `"${item.title}" se eliminará permanentemente.`,
    confirmText: 'Eliminar',
    danger: true
  })
  if (!ok) return
  try {
    if (type === 'beat')    await beatsService.deleteBeat(item.id)
    if (type === 'lyric')   await lyricsService.deleteLyric(item.id)
    if (type === 'film')    await filmService.deleteFilm(item.id)
    if (type === 'graphic') await graphicService.deleteDesign(item.id)
    // Refrescar la lista correspondiente
    if (type === 'beat')    await fetchBySeller(authStore.user.id)
    if (type === 'lyric')   await loadLyrics()
    if (type === 'film')    await loadFilms()
    if (type === 'graphic') await loadGraphics()
  } catch (e) {
    alert('Error al eliminar: ' + (e.message || ''))
  }
}

async function onEditSaved() {
  // Refrescar todo después de editar
  await Promise.all([
    fetchBySeller(authStore.user.id),
    loadLyrics(),
    loadFilms(),
    loadGraphics()
  ])
}

async function load() {
  if (!authStore.user) return
  loadingProfile.value = true
  const { data } = await profileService.getMyProfile(authStore.user.id)
  profile.value = data
  loadingProfile.value = false
  if (data) {
    // Cargar todo en paralelo
    await Promise.all([
      fetchBySeller(authStore.user.id),
      loadLyrics(),
      loadFilms(),
      loadGraphics()
    ])
  }
}

async function loadLyrics() {
  const { data } = await lyricsService.getLyricsBySeller(authStore.user.id)
  lyrics.value = data || []
}
async function loadFilms() {
  const { data } = await filmService.getFilmsBySeller(authStore.user.id)
  films.value = data || []
}
async function loadGraphics() {
  const { data } = await graphicService.getDesignsBySeller(authStore.user.id)
  graphics.value = data || []
}

const totalCount = computed(() =>
  beats.value.length + lyrics.value.length + films.value.length + graphics.value.length
)

function onSelectType(type) {
  showSelector.value = false
  if (type === 'beat')    showBeatForm.value    = true
  if (type === 'graphic') showGraphicForm.value = true
  if (type === 'film')    showFilmForm.value    = true
  if (type === 'lyric')   showLyricForm.value   = true
}

function onPublished() { load() }

const artistName = computed(() => profile.value?.name?.toUpperCase() || authStore.userDisplayName.toUpperCase())
const avatarUrl  = computed(() => profile.value?.avatar_url || null)
const coverUrl   = computed(() => profile.value?.cover_url || '/assets/kairoProyect1.jpg')
const bio        = computed(() => profile.value?.bio || '')
const categories = computed(() => profile.value?.categories || [])
const slug       = computed(() => profile.value?.slug || '')

// Cargar el perfil cuando el usuario esté disponible (puede no estarlo al montar)
watch(
  () => authStore.user,
  (newUser) => { if (newUser) load() },
  { immediate: true }
)
</script>

<template>
  <div>
    <AuthForm v-if="!authStore.isAuthenticated" />

    <div v-else class="profile-content">

      <!-- Header -->
      <section class="profile-header-modern" :style="`background-image: url('${coverUrl}')`">
        <div class="header-content">
          <div class="text-info">
            <h1 class="artist-name">{{ artistName }}</h1>
            <div class="categories" v-if="categories.length">
              <span v-for="cat in categories" :key="cat" class="cat-chip">{{ cat }}</span>
            </div>
            <p class="artist-bio" v-if="bio">{{ bio }}</p>
            <p class="artist-bio empty-bio" v-else>Añade una descripción en <strong>Configuration</strong></p>
          </div>
        </div>
        <div class="profile-pic-container">
          <img v-if="avatarUrl" :src="avatarUrl" alt="Avatar" class="profile-img" />
          <div v-else class="profile-img-placeholder">{{ authStore.userDisplayName.charAt(0).toUpperCase() }}</div>
        </div>
      </section>

      <!-- URL pública -->
      <div v-if="slug" class="profile-url-bar">
        <i class="ri-link"></i>
        <span>Tu perfil público:</span>
        <a :href="`/profile/${slug}`" target="_blank">/profile/{{ slug }}</a>
      </div>

      <StateDisplay :loading="loadingProfile" />

      <template v-if="!loadingProfile">
        <section class="section">
          <div class="section-header">
            <h2>MIS PUBLICACIONES</h2>
            <div class="header-actions">
              <span class="beat-count">{{ totalCount }}</span>
              <button class="add-btn" @click="showSelector = true" title="Nueva publicación">
                <i class="ri-add-fill"></i>
              </button>
            </div>
          </div>

          <!-- Tabs por tipo de contenido -->
          <div class="profile-tabs">
            <button :class="['tab', { active: activeTab === 'all' }]"      @click="activeTab = 'all'">
              <i class="ri-apps-line"></i> Todo <span class="tab-count">{{ totalCount }}</span>
            </button>
            <button :class="['tab', { active: activeTab === 'beats' }]"    @click="activeTab = 'beats'">
              <i class="ri-music-2-fill"></i> Beats <span class="tab-count">{{ beats.length }}</span>
            </button>
            <button :class="['tab', { active: activeTab === 'lyrics' }]"   @click="activeTab = 'lyrics'">
              <i class="ri-quill-pen-fill"></i> Lyrics <span class="tab-count">{{ lyrics.length }}</span>
            </button>
            <button :class="['tab', { active: activeTab === 'films' }]"    @click="activeTab = 'films'">
              <i class="ri-film-fill"></i> Films <span class="tab-count">{{ films.length }}</span>
            </button>
            <button :class="['tab', { active: activeTab === 'graphics' }]" @click="activeTab = 'graphics'">
              <i class="ri-brush-fill"></i> Graphics <span class="tab-count">{{ graphics.length }}</span>
            </button>
          </div>

          <StateDisplay :loading="beatsLoading" />

          <!-- Beats -->
          <div v-if="(activeTab === 'all' || activeTab === 'beats') && beats.length" class="content-block">
            <h3 v-if="activeTab === 'all'" class="content-title"><i class="ri-music-2-fill"></i> Beats</h3>
            <div class="project-grid">
              <div v-for="beat in beats" :key="beat.id" class="card-with-actions">
                <BeatCard v-bind="beat" @click="selectedBeat = beat" />
                <div class="card-actions">
                  <button class="card-action edit" @click.stop="startEdit('beat', beat)" title="Editar">
                    <i class="ri-edit-line"></i>
                  </button>
                  <button class="card-action delete" @click.stop="deleteItem('beat', beat)" title="Eliminar">
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Lyrics -->
          <div v-if="(activeTab === 'all' || activeTab === 'lyrics') && lyrics.length" class="content-block">
            <h3 v-if="activeTab === 'all'" class="content-title"><i class="ri-quill-pen-fill"></i> Lyrics</h3>
            <div class="lyrics-grid">
              <div v-for="l in lyrics" :key="l.id" class="card-with-actions">
                <div class="lyric-mini" @click="selectedLyric = l">
                  <img :src="l.cover_url || '/assets/letmc.png'" :alt="l.title" />
                  <div class="lyric-info">
                    <h4>{{ l.title }}</h4>
                    <p>{{ l.genre || 'Sin género' }} · {{ l.language || 'es' }}</p>
                    <span class="likes-pill"><i class="ri-heart-fill"></i> {{ l.likes || 0 }}</span>
                  </div>
                </div>
                <div class="card-actions">
                  <button class="card-action edit" @click.stop="startEdit('lyric', l)" title="Editar">
                    <i class="ri-edit-line"></i>
                  </button>
                  <button class="card-action delete" @click.stop="deleteItem('lyric', l)" title="Eliminar">
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Films -->
          <div v-if="(activeTab === 'all' || activeTab === 'films') && films.length" class="content-block">
            <h3 v-if="activeTab === 'all'" class="content-title"><i class="ri-film-fill"></i> Films</h3>
            <div class="films-grid">
              <div v-for="f in films" :key="f.id" class="card-with-actions">
                <div class="film-mini" @click="selectedFilm = f">
                  <div class="film-thumb" :style="f.thumbnail_url ? `background-image: url('${f.thumbnail_url}')` : ''">
                    <i v-if="!f.thumbnail_url" class="ri-film-fill"></i>
                    <span v-if="f.duration" class="duration">{{ f.duration }}</span>
                  </div>
                  <div class="film-info">
                    <h4>{{ f.title }}</h4>
                    <p>{{ f.genre || 'Sin género' }}</p>
                  </div>
                </div>
                <div class="card-actions">
                  <button class="card-action edit" @click.stop="startEdit('film', f)" title="Editar">
                    <i class="ri-edit-line"></i>
                  </button>
                  <button class="card-action delete" @click.stop="deleteItem('film', f)" title="Eliminar">
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Graphics -->
          <div v-if="(activeTab === 'all' || activeTab === 'graphics') && graphics.length" class="content-block">
            <h3 v-if="activeTab === 'all'" class="content-title"><i class="ri-brush-fill"></i> Graphics</h3>
            <div class="graphics-grid">
              <div v-for="g in graphics" :key="g.id" class="card-with-actions">
                <div class="graphic-mini" @click="selectedGraphic = g">
                  <img :src="g.cover_url || '/assets/letmc.png'" :alt="g.title" />
                  <div class="graphic-info">
                    <h4>{{ g.title }}</h4>
                    <p>{{ g.style || 'Sin estilo' }}</p>
                  </div>
                </div>
                <div class="card-actions">
                  <button class="card-action edit" @click.stop="startEdit('graphic', g)" title="Editar">
                    <i class="ri-edit-line"></i>
                  </button>
                  <button class="card-action delete" @click.stop="deleteItem('graphic', g)" title="Eliminar">
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="!beatsLoading && totalCount === 0" class="empty-state">
            <i class="ri-music-2-line"></i>
            <p>Aún no tienes publicaciones.</p>
            <button class="btn-publish-first" @click="showSelector = true">
              <i class="ri-add-fill"></i> Crear mi primera publicación
            </button>
          </div>
        </section>
      </template>
    </div>

    <!-- Modales de detalle -->
    <BeatModal       v-if="selectedBeat"    :beat="selectedBeat"       @close="selectedBeat    = null" />
    <Teleport to="body">
      <FilmDetailModal  v-if="selectedFilm"    :film="selectedFilm"      @close="selectedFilm    = null" />
      <LyricDetailModal v-if="selectedLyric"   :lyric="selectedLyric"    @close="selectedLyric   = null" />
      <PinDetailModal   v-if="selectedGraphic" :design="selectedGraphic" @close="selectedGraphic = null" />
    </Teleport>

    <!-- Modal de edición -->
    <EditPublicationModal
      v-if="editingItem"
      :type="editingItem.type"
      :item="editingItem.item"
      @close="editingItem = null"
      @updated="onEditSaved"
    />

    <Teleport to="body">
      <ContentTypeSelector v-if="showSelector" @close="showSelector = false" @select="onSelectType" />
      <div v-if="showBeatForm || showGraphicForm || showFilmForm || showLyricForm" class="modal-overlay" @click.self="showBeatForm = showGraphicForm = showFilmForm = showLyricForm = false">
        <NewBeatForm    v-if="showBeatForm"    @close="showBeatForm = false"    @published="onPublished" />
        <NewGraphicForm v-if="showGraphicForm" @close="showGraphicForm = false" @published="onPublished" />
        <NewFilmForm    v-if="showFilmForm"    @close="showFilmForm = false"    @published="onPublished" />
        <NewLyricForm   v-if="showLyricForm"   @close="showLyricForm = false"   @published="onPublished" />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.profile-content { padding: 2rem; }
.profile-header-modern { position: relative; background-size: cover; background-position: center 30%; height: 350px; border-radius: 12px; display: flex; align-items: flex-end; padding: 2rem; margin-bottom: 2rem; box-shadow: inset 0 -150px 100px -20px rgba(0,0,0,0.8); }
.header-content { width: 100%; }
.text-info { max-width: 70%; }
.artist-name { font-family: 'Impact', sans-serif; font-size: 4rem; color: #fff; line-height: 1; margin-bottom: 8px; text-shadow: 4px 4px 8px rgba(0,0,0,0.9); }
.categories { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.cat-chip { background: rgba(177,29,185,0.5); color: #fff; padding: 3px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize; }
.artist-bio { color: #ddd; font-size: 1rem; font-style: italic; }
.empty-bio { color: #888; font-style: normal; font-size: 0.85rem; }
.empty-bio strong { color: #b11db9; }
.profile-pic-container { position: absolute; right: 2rem; bottom: -3rem; }
.profile-img { width: 160px; height: 160px; object-fit: cover; border-radius: 50%; border: 6px solid #0b0b0f; box-shadow: 0 10px 25px rgba(0,0,0,0.6); }
.profile-img-placeholder { width: 160px; height: 160px; border-radius: 50%; background: linear-gradient(135deg, #b11db9, #7b2cbf); border: 6px solid #0b0b0f; display: flex; align-items: center; justify-content: center; font-size: 4rem; font-weight: 700; color: #fff; box-shadow: 0 10px 25px rgba(0,0,0,0.6); }
.profile-url-bar { display: flex; align-items: center; gap: 8px; background: rgba(177,29,185,0.1); border: 1px solid rgba(177,29,185,0.2); border-radius: 8px; padding: 8px 16px; margin-bottom: 1.5rem; font-size: 0.85rem; color: #aaa; }
.profile-url-bar i { color: #b11db9; }
.profile-url-bar a { color: #b11db9; text-decoration: none; font-weight: 600; }
.section { background: var(--bg-card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid rgba(255,255,255,0.1); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-left: 4px solid #b11db9; padding-left: 15px; }
.section-header h2 { font-size: 1.25rem; font-weight: 700; color: var(--text); margin: 0; }
.header-actions { display: flex; align-items: center; gap: 10px; }
.beat-count { background: rgba(177,29,185,0.2); color: #b11db9; padding: 2px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
.add-btn { width: 32px; height: 32px; border-radius: 50%; background: #b11db9; border: none; color: #fff; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s, transform 0.2s; }
.add-btn:hover { background: #9a18a3; transform: scale(1.1); }
/* Grid unificada para todos los tipos de contenido (mismo tamaño de tarjeta) */
.project-grid,
.lyrics-grid,
.films-grid,
.graphics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

/* Card wrapper con acciones flotantes (editar/eliminar) */
.card-with-actions {
  position: relative;
}
.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
}
.card-with-actions:hover .card-actions { opacity: 1; }

.card-action {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}
.card-action.edit:hover {
  background: #b11db9;
  border-color: #b11db9;
}
.card-action.delete:hover {
  background: #ff4d4d;
  border-color: #ff4d4d;
}

/* Altura consistente: beats override (overlay), films y graphics suman thumb + info */
.project-grid :deep(.project-card) { height: 240px; }
.films-grid .film-mini    { display: flex; flex-direction: column; height: 240px; }
.films-grid .film-thumb   { flex: 1; min-height: 0; }
.graphics-grid .graphic-mini { display: flex; flex-direction: column; height: 240px; }
.graphics-grid .graphic-mini img { flex: 1; min-height: 0; height: auto; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; color: #555; }
.empty-state i { font-size: 3rem; }
.btn-publish-first { display: flex; align-items: center; gap: 8px; background: #b11db9; color: #fff; border: none; padding: 10px 22px; border-radius: 20px; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); z-index: 3000; display: flex; justify-content: center; align-items: center; padding: 20px; }

/* Tabs */
.profile-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding-bottom: 1rem;
}
.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: #888;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.tab:hover { border-color: #b11db9; color: #fff; }
.tab.active { background: rgba(177,29,185,0.2); border-color: #b11db9; color: #b11db9; }
.tab-count {
  background: rgba(177,29,185,0.3);
  color: #fff;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  min-width: 18px;
  text-align: center;
}
.tab.active .tab-count { background: #b11db9; }

/* Bloques de contenido */
.content-block { margin-bottom: 1.5rem; }
.content-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.95rem; font-weight: 700; color: #fff;
  text-transform: uppercase; letter-spacing: 0.05em;
  margin-bottom: 0.85rem; padding-left: 4px;
}
.content-title i { color: #b11db9; }

/* Lyrics */
.lyric-mini {
  display: flex; gap: 12px;
  background: var(--bg-card-soft, rgba(255,255,255,0.03));
  border: 1px solid var(--border);
  border-radius: 10px; padding: 10px;
  cursor: pointer; transition: border-color 0.2s, transform 0.2s;
}
.lyric-mini:hover { border-color: #b11db9; transform: translateY(-2px); }
.lyric-mini img { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
.lyric-info { flex: 1; min-width: 0; }
.lyric-info h4 { font-size: 0.9rem; color: var(--text); margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lyric-info p { font-size: 0.75rem; color: var(--text-muted); margin: 0 0 6px; }
.likes-pill {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.7rem; color: #b11db9;
}

/* Films */
.film-mini {
  background: var(--bg-card-soft, rgba(255,255,255,0.03));
  border: 1px solid var(--border);
  border-radius: 10px; overflow: hidden;
  cursor: pointer; transition: border-color 0.2s, transform 0.2s;
}
.film-mini:hover { border-color: #b11db9; transform: translateY(-2px); }
.film-thumb {
  position: relative;
  height: 130px;
  background-size: cover;
  background-position: center;
  background-color: #1a1a1d;
  display: flex; align-items: center; justify-content: center;
}
.film-thumb i { font-size: 2.5rem; color: rgba(177,29,185,0.5); }
.duration {
  position: absolute; bottom: 6px; right: 6px;
  background: rgba(0,0,0,0.85); color: #fff;
  padding: 2px 6px; border-radius: 4px;
  font-size: 0.7rem; font-weight: 600;
}
.film-info { padding: 10px 12px; }
.film-info h4 { font-size: 0.9rem; color: var(--text); margin: 0 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.film-info p { font-size: 0.75rem; color: var(--text-muted); margin: 0; }

/* Graphics */
.graphic-mini {
  background: var(--bg-card-soft, rgba(255,255,255,0.03));
  border: 1px solid var(--border);
  border-radius: 10px; overflow: hidden;
  cursor: pointer; transition: border-color 0.2s, transform 0.2s;
}
.graphic-mini:hover { border-color: #b11db9; transform: translateY(-2px); }
.graphic-mini img { width: 100%; height: 180px; object-fit: cover; display: block; }
.graphic-info { padding: 10px 12px; }
.graphic-info h4 { font-size: 0.85rem; color: var(--text); margin: 0 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.graphic-info p { font-size: 0.72rem; color: var(--text-muted); margin: 0; }

@media (max-width: 768px) {
  .profile-content { padding: 1rem; }
  .profile-header-modern { height: auto; min-height: 300px; padding: 2rem 1rem 5rem; margin-bottom: 4rem; }
  .text-info { max-width: 100%; }
  .artist-name { font-size: 2.5rem; }
  .profile-pic-container { right: auto; left: 50%; transform: translateX(-50%); bottom: -3rem; }
  .profile-img, .profile-img-placeholder { width: 120px; height: 120px; }
  .section { padding: 1rem; }
}
</style>
