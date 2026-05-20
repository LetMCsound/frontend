<script setup>
import { ref, computed, onMounted } from 'vue'
import { musiciansService } from '@/services/musicians'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { chatService } from '@/services/chat'
import SearchBar from '@/components/ui/SearchBar.vue'
import StateDisplay from '@/components/ui/StateDisplay.vue'
import ChatWindow from '@/modules/chat/components/ChatWindow.vue'

const authStore = useAuthStore()
const router = useRouter()
const musicians  = ref([])
const loading    = ref(false)
const error      = ref(null)
const searchQuery  = ref('')
const activeFilter = ref(null)
const activeConv = ref(null)
const contactLoading = ref(null) // id del músico que está cargando

const categoryFilters = [
  { label: 'Todos',       value: null,        icon: 'ri-apps-line' },
  { label: 'Beatmakers',  value: 'beatmaker',  icon: 'ri-rhythm-fill' },
  { label: 'Vocalists',   value: 'vocalist',   icon: 'ri-mic-fill' },
  { label: 'Composers',   value: 'composer',   icon: 'ri-quill-pen-fill' },
  { label: 'Producers',   value: 'producer',   icon: 'ri-equalizer-fill' },
]

const displayed = computed(() => {
  let list = musicians.value
  if (activeFilter.value) list = list.filter(m => m.categories?.includes(activeFilter.value))
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(m =>
      m.name?.toLowerCase().includes(q) ||
      m.bio?.toLowerCase().includes(q) ||
      m.location?.toLowerCase().includes(q)
    )
  }
  return list
})

function formatFollowers(n) {
  if (!n) return '0'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k'
  return String(n)
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const { data, error: err } = await musiciansService.getMusicians()
    if (err) throw err
    musicians.value = data ?? []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function contactar(m) {
  if (!authStore.isAuthenticated) { router.push('/profile'); return }
  if (authStore.user.id === m.user_id) { alert('No puedes contactarte a ti mismo'); return }
  contactLoading.value = m.id
  try {
    const { data } = await chatService.getOrCreateConversation({
      buyerId: authStore.user.id,
      sellerId: m.user_id,
      buyerName: authStore.userDisplayName,
      sellerName: m.name
    })
    activeConv.value = data
  } catch (e) {
    alert('Error al iniciar conversación')
  } finally {
    contactLoading.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="musicians-page">
    <div class="page-header">
      <div class="header-text">
        <h1>Musicians</h1>
        <p>Descubre compositores, beatmakers y artistas</p>
      </div>
      <span class="stat-pill" v-if="musicians.length">
        <i class="ri-user-fill"></i> {{ musicians.length }} artistas
      </span>
    </div>

    <SearchBar
      v-model="searchQuery"
      v-model:activeFilter="activeFilter"
      placeholder="Buscar por nombre, ciudad, estilo..."
      :filters="categoryFilters"
      @search="q => searchQuery = q"
    />

    <StateDisplay
      :loading="loading"
      :error="error"
      :empty="!loading && !error && displayed.length === 0"
      empty-msg="No se encontraron artistas."
      @retry="load"
    />

    <div v-if="!loading && !error && displayed.length" class="musicians-grid">
      <div
        v-for="m in displayed"
        :key="m.id"
        class="musician-card"
        :style="m.cover_url ? `--cover: url(${m.cover_url})` : ''"
      >
        <div class="card-cover"></div>

        <div class="avatar-wrap">
          <img :src="m.avatar_url || '/assets/letmc.png'" :alt="m.name" class="avatar" />
          <span v-if="m.is_verified" class="verified-badge"><i class="ri-verified-badge-fill"></i></span>
        </div>

        <div class="card-body">
          <h3 class="m-name">{{ m.name }}</h3>
          <div class="categories">
            <span v-for="cat in (m.categories || []).slice(0,2)" :key="cat" class="cat-chip">{{ cat }}</span>
          </div>
          <p class="m-bio">{{ m.bio?.slice(0, 80) }}{{ m.bio?.length > 80 ? '...' : '' }}</p>
          <div class="m-meta">
            <span v-if="m.location"><i class="ri-map-pin-line"></i> {{ m.location }}</span>
            <span><i class="ri-user-follow-fill"></i> {{ formatFollowers(m.followers) }}</span>
          </div>
          <div class="social-links">
            <a v-if="m.link_instagram"  :href="m.link_instagram"  target="_blank"><i class="ri-instagram-fill"></i></a>
            <a v-if="m.link_soundcloud" :href="m.link_soundcloud" target="_blank"><i class="ri-soundcloud-fill"></i></a>
            <a v-if="m.link_youtube"    :href="m.link_youtube"    target="_blank"><i class="ri-youtube-fill"></i></a>
            <a v-if="m.link_spotify"    :href="m.link_spotify"    target="_blank"><i class="ri-spotify-fill"></i></a>
          </div>
          <div class="card-btns">
            <button
              v-if="m.slug"
              class="profile-btn"
              @click.stop="router.push(`/profile/${m.slug}`)"
            >
              <i class="ri-user-fill"></i> Ver perfil
            </button>
            <button
              v-if="m.user_id"
              class="contact-btn"
              :disabled="contactLoading === m.id"
              @click.stop="contactar(m)"
            >
              <i class="ri-chat-3-fill"></i>
              {{ contactLoading === m.id ? '...' : 'Contactar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Chat fuera del grid, sin Teleport -->
  <ChatWindow
    v-if="activeConv"
    :conversation="activeConv"
    @close="activeConv = null"
  />
</template>

<style scoped>
.musicians-page { padding: 2rem; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.header-text h1 { font-family: 'Impact', sans-serif; font-size: 2.5rem; color: var(--text); line-height: 1; margin-bottom: 6px; }
.header-text p { color: #888; font-size: 0.95rem; }
.stat-pill { display: flex; align-items: center; gap: 6px; background: rgba(177,29,185,0.15); color: #b11db9; padding: 6px 14px; border-radius: 20px; font-size: 0.82rem; font-weight: 600; }

.musicians-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }

.musician-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px; overflow: hidden;
}
.musician-card:hover { border-color: #b11db9; }

.card-cover { height: 100px; background: var(--cover, linear-gradient(135deg, #1a0a2e, #2d1b4e)); background-size: cover; background-position: center; }

.avatar-wrap { position: relative; margin: -36px auto 0; width: 72px; display: flex; justify-content: center; }
.avatar { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 4px solid #0b0b0f; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
.verified-badge { position: absolute; bottom: 2px; right: -2px; color: #1d9bf0; font-size: 1rem; background: #0b0b0f; border-radius: 50%; }

.card-body { padding: 0.75rem 1.25rem 1.25rem; text-align: center; }
.m-name { font-size: 1.1rem; font-weight: 700; color: var(--text); margin-bottom: 6px; }
.categories { display: flex; justify-content: center; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; }
.cat-chip { background: rgba(177,29,185,0.15); color: #b11db9; padding: 2px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; text-transform: capitalize; }
.m-bio { color: #888; font-size: 0.82rem; line-height: 1.5; margin-bottom: 10px; }
.m-meta { display: flex; justify-content: center; gap: 1rem; font-size: 0.78rem; color: #666; margin-bottom: 10px; }
.m-meta span { display: flex; align-items: center; gap: 4px; }
.m-meta i { color: #b11db9; }
.social-links { display: flex; justify-content: center; gap: 10px; margin-bottom: 12px; }
.social-links a { color: #555; font-size: 1.2rem; transition: color 0.2s; }
.social-links a:hover { color: #b11db9; }

.contact-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; background: rgba(177,29,185,0.15);
  border: 1px solid #b11db9; color: #b11db9;
  padding: 8px 16px; border-radius: 20px;
  font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.contact-btn:hover:not(:disabled) { background: #b11db9; color: #fff; }
.contact-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.card-btns { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.profile-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  flex: 1; background: transparent;
  border: 1px solid rgba(255,255,255,0.2); color: #aaa;
  padding: 8px 12px; border-radius: 20px;
  font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.profile-btn:hover { border-color: #fff; color: #fff; }

@media (max-width: 768px) {
  .musicians-page { padding: 1rem; }
  .header-text h1 { font-size: 1.8rem; }
  .musicians-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
}
@media (max-width: 480px) {
  .musicians-grid { grid-template-columns: 1fr; }
}
</style>
