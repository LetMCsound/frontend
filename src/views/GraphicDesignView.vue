<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { graphicService } from '@/services/graphic'
import { chatService } from '@/services/chat'
import { useRouter } from 'vue-router'
import SearchBar from '@/components/ui/SearchBar.vue'
import StateDisplay from '@/components/ui/StateDisplay.vue'
import ChatWindow from '@/modules/chat/components/ChatWindow.vue'
import NewGraphicForm from '@/modules/graphic/components/NewGraphicForm.vue'
import PinDetailModal from '@/modules/graphic/components/PinDetailModal.vue'

const authStore = useAuthStore()
const router = useRouter()

const designs = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const activeFilter = ref(null)
const selectedDesign = ref(null)
const activeConv = ref(null)
const contactLoading = ref(null)
const showNewForm = ref(false)

const styleFilters = [
  { label: 'Todos',        value: null },
  { label: 'Dark/Minimal', value: 'Dark / Minimal' },
  { label: 'R&B/Smooth',   value: 'R&B / Smooth' },
  { label: 'Branding',     value: 'Branding / Logo' },
  { label: 'Social Media', value: 'Social Media' },
]

const displayed = computed(() => {
  let list = designs.value
  if (activeFilter.value) list = list.filter(d => d.style === activeFilter.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(d =>
      d.title?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      d.style?.toLowerCase().includes(q)
    )
  }
  return list
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const { data, error: err } = await graphicService.getDesigns()
    if (err) throw err
    designs.value = data ?? []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function contactar(design) {
  if (!authStore.isAuthenticated) { router.push('/profile'); return }
  if (!design.seller_id) { alert('No se puede contactar a este creador'); return }
  if (authStore.user.id === design.seller_id) { alert('No puedes contactarte a ti mismo'); return }
  contactLoading.value = design.id
  try {
    const { data } = await chatService.getOrCreateConversation({
      buyerId:      authStore.user.id,
      sellerId:     design.seller_id,
      buyerName:    authStore.userDisplayName,
      sellerName:   design.seller_name,
      productId:    design.id,
      productType:  'graphic',
      productTitle: design.title
    })
    selectedDesign.value = null
    activeConv.value = data
  } catch (e) {
    alert('Error al iniciar conversación')
  } finally {
    contactLoading.value = null
  }
}

function onPublished() {
  showNewForm.value = false
  load()
}

onMounted(load)
</script>

<template>
  <div class="graphic-page">
    <div class="page-header">
      <div class="header-text">
        <h1>Graphic Design</h1>
        <p>Portadas, logos y diseños para artistas</p>
      </div>
      <div class="header-actions">
        <span class="stat-pill" v-if="designs.length">
          <i class="ri-brush-fill"></i> {{ designs.length }} diseños
        </span>
        <button v-if="authStore.isAuthenticated" class="btn-add" @click="showNewForm = true">
          <i class="ri-add-fill"></i> Subir diseño
        </button>
        <button v-else class="btn-add outline" @click="router.push('/profile')">
          <i class="ri-login-box-fill"></i> Inicia sesión para subir
        </button>
      </div>
    </div>

    <SearchBar
      v-model="searchQuery"
      v-model:activeFilter="activeFilter"
      placeholder="Buscar diseños, estilos, artistas..."
      :filters="styleFilters"
      @search="q => searchQuery = q"
    />

    <StateDisplay
      :loading="loading"
      :error="error"
      :empty="!loading && !error && displayed.length === 0"
      empty-msg="No hay diseños disponibles. ¡Sé el primero en subir uno!"
      @retry="load"
    />

    <div v-if="!loading && !error && displayed.length" class="pinterest-grid">
      <div
        v-for="design in displayed"
        :key="design.id"
        class="design-card"
        @click="selectedDesign = design"
      >
        <div class="design-img-wrap">
          <img :src="design.cover_url || '/assets/letmc.png'" :alt="design.title" class="design-img" />
          <div class="design-overlay"><i class="ri-zoom-in-line"></i></div>
        </div>
        <div class="design-info">
          <h3>{{ design.title }}</h3>
          <div class="design-row">
            <p class="design-seller"><i class="ri-user-fill"></i> {{ design.seller_name }}</p>
            <span class="design-price">${{ design.price }}</span>
          </div>
          <div class="design-tags">
            <span v-for="tag in (design.tags || []).slice(0,3)" :key="tag" class="tag">#{{ tag }}</span>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <PinDetailModal
        v-if="selectedDesign"
        :design="selectedDesign"
        @close="selectedDesign = null"
        @contact="contactar"
      />
    </Teleport>

    <Teleport to="body">
      <div v-if="showNewForm" class="modal-overlay" @click.self="showNewForm = false">
        <NewGraphicForm @close="showNewForm = false" @published="onPublished" />
      </div>
    </Teleport>

    <Teleport to="body">
      <ChatWindow v-if="activeConv" :conversation="activeConv" @close="activeConv = null" />
    </Teleport>
  </div>
</template>

<style scoped>
.graphic-page { padding: 2rem; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.header-text h1 { font-family: 'Impact', sans-serif; font-size: 2.5rem; color: var(--text); line-height: 1; margin-bottom: 6px; }
.header-text p { color: #888; font-size: 0.95rem; }
.header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.stat-pill { display: flex; align-items: center; gap: 6px; background: rgba(177,29,185,0.15); color: #b11db9; padding: 6px 14px; border-radius: 20px; font-size: 0.82rem; font-weight: 600; }
.btn-add { display: flex; align-items: center; gap: 6px; background: #b11db9; color: #fff; border: none; padding: 8px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-add:hover { background: #9a18a3; }
.btn-add.outline { background: transparent; border: 1px solid #b11db9; color: #b11db9; }
.btn-add.outline:hover { background: rgba(177,29,185,0.1); }

.pinterest-grid { columns: 4; column-gap: 1rem; }
.design-card { break-inside: avoid; margin-bottom: 1rem; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; cursor: pointer; transition: border-color 0.2s, transform 0.2s; }
.design-card:hover { border-color: #b11db9; transform: translateY(-3px); }
.design-img-wrap { position: relative; overflow: hidden; }
.design-img { width: 100%; display: block; transition: transform 0.3s; }
.design-card:hover .design-img { transform: scale(1.04); }
.design-overlay { position: absolute; inset: 0; background: rgba(177,29,185,0.3); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; font-size: 2rem; color: #fff; }
.design-card:hover .design-overlay { opacity: 1; }
.design-info { padding: 0.75rem; }
.design-info h3 { color: var(--text); font-size: 0.875rem; font-weight: 600; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.design-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.design-seller { color: #888; font-size: 0.75rem; display: flex; align-items: center; gap: 3px; margin: 0; }
.design-seller i { color: #b11db9; }
.design-price { color: #fff; font-weight: 700; font-size: 0.875rem; }
.design-tags { display: flex; flex-wrap: wrap; gap: 3px; }
.tag { color: #555; font-size: 0.7rem; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); z-index: 3000; display: flex; justify-content: center; align-items: center; padding: 20px; }

@media (max-width: 1200px) { .pinterest-grid { columns: 3; } }
@media (max-width: 768px) { .graphic-page { padding: 1rem; } .pinterest-grid { columns: 2; } }
@media (max-width: 480px) { .pinterest-grid { columns: 1; } }
</style>
