<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBeats } from '@/composables/useBeats'
import { profileService } from '@/services/profile'
import AuthForm from '@/modules/auth/components/AuthForm.vue'
import BeatCard from '@/modules/beats/components/BeatCard.vue'
import BeatModal from '@/modules/beats/components/BeatModal.vue'
import NewBeatForm from '@/modules/beats/components/NewBeatForm.vue'
import StateDisplay from '@/components/ui/StateDisplay.vue'
import ContentTypeSelector from '@/components/ui/ContentTypeSelector.vue'
import NewGraphicForm from '@/modules/graphic/components/NewGraphicForm.vue'
import NewFilmForm from '@/modules/film/components/NewFilmForm.vue'
import NewLyricForm from '@/modules/lyrics/components/NewLyricForm.vue'

const authStore  = useAuthStore()
const { beats, loading: beatsLoading, fetchBySeller } = useBeats()

const profile        = ref(null)
const loadingProfile = ref(true)
const selectedBeat   = ref(null)
const showSelector   = ref(false)
const showBeatForm   = ref(false)
const showGraphicForm= ref(false)
const showFilmForm   = ref(false)
const showLyricForm  = ref(false)

async function load() {
  if (!authStore.user) return
  loadingProfile.value = true
  const { data } = await profileService.getMyProfile(authStore.user.id)
  profile.value = data
  loadingProfile.value = false
  if (data) await fetchBySeller(authStore.user.id)
}

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

onMounted(load)
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
              <span class="beat-count">{{ beats.length }}</span>
              <button class="add-btn" @click="showSelector = true" title="Nueva publicación">
                <i class="ri-add-fill"></i>
              </button>
            </div>
          </div>

          <StateDisplay :loading="beatsLoading" />

          <div v-if="!beatsLoading && beats.length" class="project-grid">
            <BeatCard
              v-for="beat in beats"
              :key="beat.id"
              v-bind="beat"
              @click="selectedBeat = beat"
            />
          </div>

          <div v-else-if="!beatsLoading" class="empty-state">
            <i class="ri-music-2-line"></i>
            <p>Aún no tienes publicaciones.</p>
            <button class="btn-publish-first" @click="showSelector = true">
              <i class="ri-add-fill"></i> Crear mi primera publicación
            </button>
          </div>
        </section>
      </template>
    </div>

    <!-- Modales -->
    <BeatModal v-if="selectedBeat" :beat="selectedBeat" @close="selectedBeat = null" />

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
.project-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; color: #555; }
.empty-state i { font-size: 3rem; }
.btn-publish-first { display: flex; align-items: center; gap: 8px; background: #b11db9; color: #fff; border: none; padding: 10px 22px; border-radius: 20px; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); z-index: 3000; display: flex; justify-content: center; align-items: center; padding: 20px; }
@media (max-width: 1200px) { .project-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .profile-content { padding: 1rem; } .profile-header-modern { height: auto; min-height: 300px; padding: 2rem 1rem 5rem; margin-bottom: 4rem; } .text-info { max-width: 100%; } .artist-name { font-size: 2.5rem; } .profile-pic-container { right: auto; left: 50%; transform: translateX(-50%); bottom: -3rem; } .profile-img, .profile-img-placeholder { width: 120px; height: 120px; } .project-grid { grid-template-columns: 1fr; gap: 1rem; } .section { padding: 1rem; } }
</style>
