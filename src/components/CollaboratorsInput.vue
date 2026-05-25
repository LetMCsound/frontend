<script setup>
import { ref, computed } from 'vue'
import { musiciansService } from '@/services/musicians'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ platform: [], external: [] })
  }
})
const emit = defineEmits(['update:modelValue'])

// ── Búsqueda de usuarios de la plataforma ──────────────────
const searchQuery  = ref('')
const searchResults = ref([])
const searching    = ref(false)
const searchTimeout = ref(null)

function onSearchInput() {
  clearTimeout(searchTimeout.value)
  if (searchQuery.value.trim().length < 2) { searchResults.value = []; return }
  searchTimeout.value = setTimeout(doSearch, 350)
}

async function doSearch() {
  searching.value = true
  try {
    const { data } = await musiciansService.searchMusicians(searchQuery.value.trim(), 8)
    // Filtrar los que ya están añadidos
    const addedIds = props.modelValue.platform.map(u => u.user_id)
    searchResults.value = (data || []).filter(u => !addedIds.includes(u.user_id || u.id))
  } catch {
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

function addPlatformUser(user) {
  const updated = {
    ...props.modelValue,
    platform: [
      ...props.modelValue.platform,
      {
        user_id:    user.user_id || user.id,
        name:       user.name,
        avatar_url: user.avatar_url || null,
        slug:       user.slug || null,
      }
    ]
  }
  emit('update:modelValue', updated)
  searchQuery.value  = ''
  searchResults.value = []
}

function removePlatformUser(userId) {
  emit('update:modelValue', {
    ...props.modelValue,
    platform: props.modelValue.platform.filter(u => u.user_id !== userId)
  })
}

// ── Colaboradores externos ─────────────────────────────────
const extName = ref('')
const extUrl  = ref('')
const extErr  = ref('')

const socialNetworks = [
  { label: 'Instagram', prefix: 'https://instagram.com/', icon: 'ri-instagram-line' },
  { label: 'Twitter/X', prefix: 'https://x.com/',        icon: 'ri-twitter-x-fill' },
  { label: 'TikTok',    prefix: 'https://tiktok.com/@',  icon: 'ri-tiktok-fill' },
  { label: 'YouTube',   prefix: 'https://youtube.com/',  icon: 'ri-youtube-fill' },
  { label: 'SoundCloud',prefix: 'https://soundcloud.com/',icon: 'ri-soundcloud-fill'},
  { label: 'Otro',      prefix: 'https://',               icon: 'ri-link' },
]

function getExtIcon(url) {
  if (!url) return 'ri-link'
  if (url.includes('instagram'))   return 'ri-instagram-line'
  if (url.includes('tiktok'))      return 'ri-tiktok-fill'
  if (url.includes('youtube'))     return 'ri-youtube-fill'
  if (url.includes('soundcloud'))  return 'ri-soundcloud-fill'
  if (url.includes('x.com') || url.includes('twitter')) return 'ri-twitter-x-fill'
  return 'ri-link'
}

function addExternal() {
  extErr.value = ''
  if (!extName.value.trim()) { extErr.value = 'Añade un nombre'; return }
  if (extUrl.value.trim() && !/^https?:\/\//.test(extUrl.value.trim())) {
    extErr.value = 'La URL debe empezar por https://'
    return
  }
  emit('update:modelValue', {
    ...props.modelValue,
    external: [
      ...props.modelValue.external,
      { name: extName.value.trim(), url: extUrl.value.trim() || null }
    ]
  })
  extName.value = ''
  extUrl.value  = ''
}

function removeExternal(idx) {
  emit('update:modelValue', {
    ...props.modelValue,
    external: props.modelValue.external.filter((_, i) => i !== idx)
  })
}

const totalCollabs = computed(
  () => props.modelValue.platform.length + props.modelValue.external.length
)
</script>

<template>
  <div class="collabs-wrap">
    <div class="collabs-header">
      <i class="ri-group-fill"></i>
      <span>Colaboradores</span>
      <span v-if="totalCollabs" class="badge">{{ totalCollabs }}</span>
      <span class="hint">opcional</span>
    </div>

    <!-- ── Buscar usuarios de la plataforma ── -->
    <div class="search-section">
      <label class="sub-label">Buscar en LetMCsound</label>
      <div class="search-row">
        <div class="search-input-wrap">
          <i class="ri-search-line search-icon"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Nombre del artista..."
            @input="onSearchInput"
          />
          <i v-if="searching" class="ri-loader-4-line spin search-icon-right"></i>
        </div>
      </div>

      <!-- Resultados -->
      <div v-if="searchResults.length" class="search-dropdown">
        <div
          v-for="user in searchResults"
          :key="user.user_id || user.id"
          class="search-result"
          @click="addPlatformUser(user)"
        >
          <img
            v-if="user.avatar_url"
            :src="user.avatar_url"
            :alt="user.name"
            class="result-avatar"
          />
          <div v-else class="result-avatar-placeholder">
            {{ user.name?.[0]?.toUpperCase() }}
          </div>
          <div class="result-info">
            <span class="result-name">{{ user.name }}</span>
            <span v-if="user.location" class="result-loc">
              <i class="ri-map-pin-line"></i> {{ user.location }}
            </span>
          </div>
          <button class="add-btn"><i class="ri-add-fill"></i> Añadir</button>
        </div>
      </div>
    </div>

    <!-- Chips de usuarios de plataforma añadidos -->
    <div v-if="modelValue.platform.length" class="chips-row">
      <div
        v-for="user in modelValue.platform"
        :key="user.user_id"
        class="chip platform-chip"
      >
        <img v-if="user.avatar_url" :src="user.avatar_url" class="chip-avatar" />
        <div v-else class="chip-avatar-placeholder">{{ user.name?.[0]?.toUpperCase() }}</div>
        <span>{{ user.name }}</span>
        <i class="ri-verified-badge-fill verified-icon"></i>
        <button class="chip-remove" @click="removePlatformUser(user.user_id)">
          <i class="ri-close-fill"></i>
        </button>
      </div>
    </div>

    <!-- ── Externos ── -->
    <div class="external-section">
      <label class="sub-label">Añadir externo <span class="hint">con red social</span></label>
      <div class="ext-row">
        <input
          v-model="extName"
          type="text"
          placeholder="Nombre"
          class="ext-name"
          @keyup.enter="addExternal"
        />
        <div class="ext-url-wrap">
          <select v-model="extUrl" class="ext-network" v-if="false"></select>
          <input
            v-model="extUrl"
            type="url"
            placeholder="https://instagram.com/..."
            class="ext-url"
            @keyup.enter="addExternal"
          />
        </div>
        <button class="add-ext-btn" @click="addExternal" title="Añadir colaborador externo">
          <i class="ri-add-fill"></i>
        </button>
      </div>
      <p v-if="extErr" class="ext-err"><i class="ri-error-warning-line"></i> {{ extErr }}</p>

      <!-- Chips externos -->
      <div v-if="modelValue.external.length" class="chips-row">
        <div
          v-for="(ext, i) in modelValue.external"
          :key="i"
          class="chip ext-chip"
        >
          <i :class="getExtIcon(ext.url)" class="chip-network-icon"></i>
          <span>{{ ext.name }}</span>
          <a
            v-if="ext.url"
            :href="ext.url"
            target="_blank"
            rel="noopener"
            class="ext-link"
            @click.stop
          >
            <i class="ri-external-link-line"></i>
          </a>
          <button class="chip-remove" @click="removeExternal(i)">
            <i class="ri-close-fill"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.collabs-wrap {
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: rgba(255,255,255,0.02);
}

.collabs-header {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 0.875rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text, #fff);
}
.collabs-header i { color: #b11db9; font-size: 1rem; }
.badge {
  background: #b11db9;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  border-radius: 20px;
  padding: 1px 7px;
  line-height: 1.6;
}
.hint { color: var(--text-muted, #555); font-size: 0.72rem; font-weight: 400; }

.sub-label {
  display: block;
  font-size: 0.78rem;
  color: var(--text-muted, #888);
  margin-bottom: 6px;
}

/* Search */
.search-section { margin-bottom: 0.75rem; position: relative; }
.search-row { position: relative; }
.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.search-input-wrap input {
  width: 100%;
  padding: 0.55rem 2rem 0.55rem 2.2rem;
  background: var(--bg-card, rgba(255,255,255,0.05));
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: var(--text, #fff);
  font-size: 0.85rem;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.search-input-wrap input:focus { border-color: #b11db9; }
.search-icon {
  position: absolute;
  left: 0.6rem;
  color: var(--text-muted, #555);
  font-size: 0.9rem;
  pointer-events: none;
}
.search-icon-right {
  position: absolute;
  right: 0.6rem;
  color: #b11db9;
  font-size: 0.9rem;
  pointer-events: none;
}
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }

.search-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0; right: 0;
  background: #1a1a1d;
  border: 1px solid #333;
  border-radius: 10px;
  z-index: 100;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
.search-result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.6rem 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
}
.search-result:hover { background: rgba(177,29,185,0.12); }
.result-avatar {
  width: 34px; height: 34px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.result-avatar-placeholder {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: #333;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; font-weight: 700; color: #aaa;
  flex-shrink: 0;
}
.result-info { flex: 1; min-width: 0; }
.result-name { display: block; font-size: 0.85rem; color: #fff; font-weight: 600; }
.result-loc { display: block; font-size: 0.72rem; color: #666; display: flex; align-items: center; gap: 3px; }
.add-btn {
  display: flex; align-items: center; gap: 4px;
  background: rgba(177,29,185,0.15);
  border: 1px solid #b11db9;
  color: #b11db9;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  flex-shrink: 0;
}
.add-btn:hover { background: #b11db9; color: #fff; }

/* Chips */
.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.chip {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 20px;
  padding: 4px 10px 4px 5px;
  font-size: 0.78rem;
  font-weight: 500;
}
.platform-chip {
  background: rgba(177,29,185,0.15);
  border: 1px solid rgba(177,29,185,0.35);
  color: #ddb6e0;
}
.ext-chip {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.12);
  color: #ccc;
}
.chip-avatar {
  width: 22px; height: 22px;
  border-radius: 50%; object-fit: cover;
}
.chip-avatar-placeholder {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: #444;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.65rem; font-weight: 700; color: #aaa;
}
.verified-icon { color: #b11db9; font-size: 0.75rem; }
.chip-network-icon { color: #b11db9; font-size: 0.85rem; }
.ext-link {
  color: #888;
  font-size: 0.75rem;
  text-decoration: none;
  display: flex; align-items: center;
}
.ext-link:hover { color: #fff; }
.chip-remove {
  background: none; border: none;
  color: rgba(255,255,255,0.35);
  cursor: pointer;
  font-size: 0.8rem;
  display: flex; align-items: center;
  padding: 0;
  margin-left: 2px;
  transition: color 0.15s;
}
.chip-remove:hover { color: #ff6b6b; }

/* External form */
.external-section { margin-top: 0.875rem; }
.ext-row { display: flex; gap: 6px; align-items: stretch; }
.ext-name {
  width: 130px;
  flex-shrink: 0;
  padding: 0.55rem 0.7rem;
  background: var(--bg-card, rgba(255,255,255,0.05));
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: var(--text, #fff);
  font-size: 0.82rem;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.ext-name:focus { border-color: #b11db9; }
.ext-url-wrap { flex: 1; }
.ext-url {
  width: 100%;
  padding: 0.55rem 0.7rem;
  background: var(--bg-card, rgba(255,255,255,0.05));
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: var(--text, #fff);
  font-size: 0.82rem;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.ext-url:focus { border-color: #b11db9; }
.add-ext-btn {
  width: 36px; height: 36px;
  border-radius: 8px;
  background: #b11db9;
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
  align-self: center;
  transition: background 0.15s;
}
.add-ext-btn:hover { background: #9a18a3; }
.ext-err {
  display: flex; align-items: center; gap: 5px;
  color: #ff6b6b; font-size: 0.75rem; margin-top: 5px;
}

@media (max-width: 480px) {
  .ext-row { flex-wrap: wrap; }
  .ext-name { width: 100%; }
  .ext-url-wrap { flex: 1 1 calc(100% - 44px); }
}
</style>
