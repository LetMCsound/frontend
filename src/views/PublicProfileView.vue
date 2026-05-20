<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { musiciansService } from '@/services/musicians'
import { useBeats } from '@/composables/useBeats'
import { chatService } from '@/services/chat'
import BeatCard from '@/modules/beats/components/BeatCard.vue'
import BeatModal from '@/modules/beats/components/BeatModal.vue'
import ChatWindow from '@/modules/chat/components/ChatWindow.vue'
import StateDisplay from '@/components/ui/StateDisplay.vue'

const route      = useRoute()
const router     = useRouter()
const authStore  = useAuthStore()

const musician       = ref(null)
const loading        = ref(true)
const error          = ref(null)
const selectedBeat   = ref(null)
const activeConv     = ref(null)
const contactLoading = ref(false)

const { beats, loading: beatsLoading, fetchBySeller } = useBeats()

const isOwnProfile = computed(() =>
  authStore.user && musician.value?.user_id === authStore.user.id
)

function formatFollowers(n) {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k'
  return String(n)
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const { data, error: err } = await musiciansService.getMusicianBySlug(route.params.slug)
    if (err) throw err
    musician.value = data

    // Cargar beats del artista si tiene user_id
    if (data?.user_id) {
      await fetchBySeller(data.user_id)
    }
  } catch (e) {
    error.value = 'Artista no encontrado'
  } finally {
    loading.value = false
  }
}

async function contactar() {
  if (!authStore.isAuthenticated) { router.push('/profile'); return }
  if (authStore.user.id === musician.value.user_id) return
  contactLoading.value = true
  try {
    const { data } = await chatService.getOrCreateConversation({
      buyerId:    authStore.user.id,
      sellerId:   musician.value.user_id,
      buyerName:  authStore.userDisplayName,
      sellerName: musician.value.name
    })
    activeConv.value = data
  } catch (e) {
    alert('Error al iniciar conversación')
  } finally {
    contactLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="public-profile">

    <!-- Loading / Error -->
    <StateDisplay
      :loading="loading"
      :error="error"
      empty-msg="Artista no encontrado"
      @retry="load"
    />

    <template v-if="!loading && !error && musician">

      <!-- Header del perfil -->
      <section class="profile-header" :style="musician.cover_url ? `background-image: url('${musician.cover_url}')` : ''">
        <div class="header-overlay">
          <div class="header-left">
            <h1 class="artist-name">{{ musician.name.toUpperCase() }}</h1>
            <div class="categories">
              <span v-for="cat in musician.categories" :key="cat" class="cat-chip">{{ cat }}</span>
            </div>
            <p class="artist-bio">{{ musician.bio }}</p>
            <div class="artist-meta">
              <span v-if="musician.location"><i class="ri-map-pin-line"></i> {{ musician.location }}</span>
              <span><i class="ri-user-follow-fill"></i> {{ formatFollowers(musician.followers) }} seguidores</span>
              <span v-if="musician.is_verified" class="verified"><i class="ri-verified-badge-fill"></i> Verificado</span>
            </div>
          </div>
        </div>

        <!-- Avatar -->
        <div class="avatar-container">
          <img :src="musician.avatar_url || '/assets/letmc.png'" :alt="musician.name" class="avatar" />
          <span v-if="musician.is_verified" class="avatar-verified"><i class="ri-verified-badge-fill"></i></span>
        </div>
      </section>

      <!-- Acciones -->
      <div class="profile-actions">
        <div class="social-links">
          <a v-if="musician.link_instagram"  :href="musician.link_instagram"  target="_blank" class="social-btn instagram"><i class="ri-instagram-fill"></i></a>
          <a v-if="musician.link_soundcloud" :href="musician.link_soundcloud" target="_blank" class="social-btn soundcloud"><i class="ri-soundcloud-fill"></i></a>
          <a v-if="musician.link_youtube"    :href="musician.link_youtube"    target="_blank" class="social-btn youtube"><i class="ri-youtube-fill"></i></a>
          <a v-if="musician.link_spotify"    :href="musician.link_spotify"    target="_blank" class="social-btn spotify"><i class="ri-spotify-fill"></i></a>
        </div>

        <div class="action-btns">
          <!-- Botón editar si es perfil propio -->
          <button v-if="isOwnProfile" class="btn-edit" @click="router.push('/configuration')">
            <i class="ri-edit-fill"></i> Editar perfil
          </button>

          <!-- Botón contactar si es otro artista -->
          <button
            v-else-if="musician.user_id && authStore.isAuthenticated"
            class="btn-contact"
            :disabled="contactLoading"
            @click="contactar"
          >
            <i class="ri-chat-3-fill"></i>
            {{ contactLoading ? 'Abriendo...' : 'Contactar' }}
          </button>

          <button
            v-else-if="!authStore.isAuthenticated"
            class="btn-contact"
            @click="router.push('/profile')"
          >
            <i class="ri-lock-fill"></i> Inicia sesión para contactar
          </button>
        </div>
      </div>

      <!-- Beats del artista -->
      <section class="section" v-if="beats.length || beatsLoading">
        <div class="section-header">
          <h2>BEATS & PROYECTOS</h2>
          <span class="count-pill">{{ beats.length }}</span>
        </div>

        <StateDisplay :loading="beatsLoading" />

        <div v-if="!beatsLoading && beats.length" class="beats-grid">
          <BeatCard
            v-for="beat in beats"
            :key="beat.id"
            v-bind="beat"
            @click="selectedBeat = beat"
          />
        </div>
      </section>

      <!-- Sin beats -->
      <section class="section" v-else-if="!beatsLoading">
        <div class="empty-beats">
          <i class="ri-music-2-line"></i>
          <p>Este artista aún no ha publicado beats.</p>
        </div>
      </section>

    </template>

    <!-- Modales -->
    <BeatModal v-if="selectedBeat" :beat="selectedBeat" @close="selectedBeat = null" />
    <ChatWindow v-if="activeConv" :conversation="activeConv" @close="activeConv = null" />
  </div>
</template>

<style scoped>
.public-profile { }

/* Header */
.profile-header {
  position: relative;
  height: 380px;
  background: linear-gradient(135deg, #1a0a2e, #2d1b4e);
  background-size: cover;
  background-position: center 30%;
  display: flex;
  align-items: flex-end;
  margin-bottom: 4rem;
}

.header-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
  display: flex; align-items: flex-end;
  padding: 2rem 2rem 5rem;
}

.header-left { max-width: 70%; }
.artist-name { font-family: 'Impact', sans-serif; font-size: 4rem; color: #fff; line-height: 1; margin-bottom: 10px; text-shadow: 4px 4px 8px rgba(0,0,0,0.9); }
.categories { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.cat-chip { background: rgba(177,29,185,0.4); color: #fff; padding: 3px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; text-transform: capitalize; }
.artist-bio { color: #ddd; font-size: 1rem; font-style: italic; margin-bottom: 10px; line-height: 1.5; }
.artist-meta { display: flex; gap: 1.5rem; flex-wrap: wrap; }
.artist-meta span { color: #bbb; font-size: 0.85rem; display: flex; align-items: center; gap: 5px; }
.artist-meta i { color: #b11db9; }
.verified { color: #1d9bf0 !important; }
.verified i { color: #1d9bf0 !important; }

.avatar-container {
  position: absolute; right: 2rem; bottom: -3.5rem;
  width: 140px; height: 140px;
}
.avatar { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 6px solid #0b0b0f; box-shadow: 0 8px 24px rgba(0,0,0,0.6); }
.avatar-verified { position: absolute; bottom: 4px; right: 4px; color: #1d9bf0; font-size: 1.4rem; background: #0b0b0f; border-radius: 50%; }

/* Actions */
.profile-actions {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 2rem 1.5rem; flex-wrap: wrap; gap: 1rem;
}
.social-links { display: flex; gap: 10px; }
.social-btn {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; color: #fff; text-decoration: none;
  transition: transform 0.2s, opacity 0.2s; opacity: 0.7;
}
.social-btn:hover { opacity: 1; transform: scale(1.1); }
.instagram { background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); }
.soundcloud { background: #ff5500; }
.youtube { background: #ff0000; }
.spotify { background: #1db954; }

.action-btns { display: flex; gap: 10px; }
.btn-contact {
  display: flex; align-items: center; gap: 8px;
  background: #b11db9; color: #fff; border: none;
  padding: 10px 22px; border-radius: 20px;
  font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: background 0.2s;
}
.btn-contact:hover:not(:disabled) { background: #9a18a3; }
.btn-contact:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-edit {
  display: flex; align-items: center; gap: 8px;
  background: transparent; border: 1px solid rgba(255,255,255,0.2);
  color: #aaa; padding: 10px 22px; border-radius: 20px;
  font-size: 0.9rem; cursor: pointer; transition: all 0.2s;
}
.btn-edit:hover { border-color: #fff; color: #fff; }

/* Sections */
.section { padding: 0 2rem 2rem; }
.section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 1.25rem; border-left: 4px solid #b11db9; padding-left: 15px; }
.section-header h2 { font-size: 1.25rem; font-weight: 700; color: var(--text); margin: 0; }
.count-pill { background: rgba(177,29,185,0.2); color: #b11db9; padding: 2px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }

.beats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem; }

.empty-beats { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; color: #555; }
.empty-beats i { font-size: 3rem; }

@media (max-width: 768px) {
  .profile-header { height: auto; min-height: 300px; margin-bottom: 5rem; }
  .header-overlay { padding: 2rem 1rem 5rem; }
  .header-left { max-width: 100%; }
  .artist-name { font-size: 2.5rem; }
  .avatar-container { right: auto; left: 50%; transform: translateX(-50%); bottom: -3rem; width: 110px; height: 110px; }
  .profile-actions { padding: 0 1rem 1.5rem; }
  .section { padding: 0 1rem 1.5rem; }
  .beats-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
}
@media (max-width: 480px) {
  .beats-grid { grid-template-columns: 1fr; }
}
</style>
