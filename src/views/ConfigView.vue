<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { profileService } from '@/services/profile'

const router    = useRouter()
const authStore = useAuthStore()
const { theme, applyTheme } = useTheme()

const saving      = ref(false)
const saveMsg     = ref('')
const profile     = ref(null)

// Form fields
const name        = ref('')
const bio         = ref('')
const location    = ref('')
const linkIG      = ref('')
const linkSC      = ref('')
const linkYT      = ref('')
const linkSpotify = ref('')

const avatarPreview = ref(null)
const coverPreview  = ref(null)
const avatarFile    = ref(null)
const coverFile     = ref(null)

const language  = ref('es')
const timezone  = ref('Europe/Madrid')
const themes    = [{ value: 'dark', label: 'Oscuro' }, { value: 'light', label: 'Claro' }]
const languages = [{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }]
const timezones = [
  { value: 'Europe/Madrid',      label: 'Europa/Madrid (UTC+1)' },
  { value: 'Europe/London',      label: 'Europa/London (UTC+0)' },
  { value: 'America/New_York',   label: 'America/New_York (UTC-5)' },
  { value: 'America/Los_Angeles',label: 'America/Los_Angeles (UTC-8)' },
  { value: 'Asia/Tokyo',         label: 'Asia/Tokyo (UTC+9)' },
]

async function load() {
  if (!authStore.user) return
  try {
    const { data, error } = await profileService.getMyProfile(authStore.user.id)
    if (error) {
      console.error('[ConfigView] error cargando perfil:', error)
      return
    }
    if (data) {
      profile.value   = data
      name.value      = data.name || ''
      bio.value       = data.bio || ''
      location.value  = data.location || ''
      linkIG.value    = data.link_instagram || ''
      linkSC.value    = data.link_soundcloud || ''
      linkYT.value    = data.link_youtube || ''
      linkSpotify.value = data.link_spotify || ''
      avatarPreview.value = data.avatar_url || null
      coverPreview.value  = data.cover_url  || null
    }
  } catch (e) {
    console.error('[ConfigView] excepción cargando perfil:', e)
  }
}

function onAvatarChange(e) {
  const file = e.target.files[0]
  if (!file) return
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

function onCoverChange(e) {
  const file = e.target.files[0]
  if (!file) return
  coverFile.value = file
  coverPreview.value = URL.createObjectURL(file)
}

async function saveProfile() {
  saving.value = true
  saveMsg.value = ''
  try {
    const updates = {
      name: name.value,
      bio: bio.value,
      location: location.value,
      link_instagram:  linkIG.value,
      link_soundcloud: linkSC.value,
      link_youtube:    linkYT.value,
      link_spotify:    linkSpotify.value,
    }

    // Subir avatar si hay
    if (avatarFile.value) {
      const { url, error: avatarErr } = await profileService.uploadAvatar(avatarFile.value, authStore.user.id)
      if (avatarErr) throw new Error('Error subiendo la foto de perfil: ' + (avatarErr.message || avatarErr))
      if (url) {
        updates.avatar_url = url
        avatarPreview.value = url
      }
    }

    // Subir portada si hay
    if (coverFile.value) {
      const { url, error: coverErr } = await profileService.uploadCover(coverFile.value, authStore.user.id)
      if (coverErr) throw new Error('Error subiendo la portada: ' + (coverErr.message || coverErr))
      if (url) {
        updates.cover_url = url
        coverPreview.value = url
      }
    }

    const { error } = await profileService.updateProfile(authStore.user.id, updates)
    if (error) throw error

    // Refrescar avatar y nombre en el store (sidebar se actualiza automáticamente)
    await authStore.loadMusicianProfile()

    saveMsg.value = '✅ Perfil guardado correctamente'
    avatarFile.value = null
    coverFile.value  = null
  } catch (e) {
    saveMsg.value = '❌ Error al guardar: ' + e.message
  } finally {
    saving.value = false
  }
}

function savePreferences() {
  applyTheme(theme.value)
  saveMsg.value = '✅ Preferencias guardadas'
}

async function logout() {
  await authStore.logout()
  router.push('/profile')
}

// Cargar perfil cuando el usuario esté disponible (puede no estarlo al montar)
watch(
  () => authStore.user,
  (newUser) => { if (newUser) load() },
  { immediate: true }
)
</script>

<template>
  <div class="config-page">
    <h1>Configuration</h1>

    <p v-if="saveMsg" :class="['save-msg', saveMsg.startsWith('✅') ? 'ok' : 'err']">
      {{ saveMsg }}
    </p>

    <!-- Perfil público -->
    <section class="config-section">
      <h2><i class="ri-user-3-fill"></i> Tu Perfil Público</h2>

      <!-- Portada -->
      <div class="cover-upload">
        <label class="cover-label">Imagen de portada</label>
        <label class="cover-dropzone" :style="coverPreview ? `background-image: url('${coverPreview}')` : ''">
          <div class="cover-overlay">
            <i class="ri-image-edit-fill"></i>
            <span>{{ coverPreview ? 'Cambiar portada' : 'Subir portada' }}</span>
          </div>
          <input type="file" accept="image/*" @change="onCoverChange" hidden />
        </label>
      </div>

      <!-- Avatar -->
      <div class="avatar-upload">
        <div class="avatar-preview">
          <img v-if="avatarPreview" :src="avatarPreview" alt="Avatar" />
          <div v-else class="avatar-placeholder">
            {{ authStore.userDisplayName.charAt(0).toUpperCase() }}
          </div>
        </div>
        <label class="upload-btn">
          <i class="ri-camera-fill"></i> Cambiar foto
          <input type="file" accept="image/*" @change="onAvatarChange" hidden />
        </label>
      </div>

      <div class="form-group">
        <label>Nombre artístico</label>
        <input type="text" v-model="name" placeholder="Tu nombre o alias" />
      </div>

      <div class="form-group">
        <label>Biografía</label>
        <textarea v-model="bio" rows="3" placeholder="Cuéntanos sobre ti, tu estilo, tus influencias..."></textarea>
      </div>

      <div class="form-group">
        <label>Ubicación</label>
        <input type="text" v-model="location" placeholder="Ciudad, País" />
      </div>

      <h3 class="section-subtitle">Links externos</h3>
      <div class="links-grid">
        <div class="form-group">
          <label><i class="ri-instagram-fill" style="color:#E1306C"></i> Instagram</label>
          <input type="url" v-model="linkIG" placeholder="https://instagram.com/tu-perfil" />
        </div>
        <div class="form-group">
          <label><i class="ri-soundcloud-fill" style="color:#ff5500"></i> SoundCloud</label>
          <input type="url" v-model="linkSC" placeholder="https://soundcloud.com/tu-perfil" />
        </div>
        <div class="form-group">
          <label><i class="ri-youtube-fill" style="color:#ff0000"></i> YouTube</label>
          <input type="url" v-model="linkYT" placeholder="https://youtube.com/@tu-canal" />
        </div>
        <div class="form-group">
          <label><i class="ri-spotify-fill" style="color:#1db954"></i> Spotify</label>
          <input type="url" v-model="linkSpotify" placeholder="https://open.spotify.com/artist/..." />
        </div>
      </div>

      <button class="btn-primary" @click="saveProfile" :disabled="saving">
        {{ saving ? 'Guardando...' : 'Guardar perfil' }}
      </button>
    </section>

    <!-- Preferencias -->
    <section class="config-section">
      <h2><i class="ri-settings-3-fill"></i> Preferencias</h2>
      <div class="form-group">
        <label>Idioma</label>
        <select v-model="language">
          <option v-for="l in languages" :key="l.value" :value="l.value">{{ l.label }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>Zona horaria</label>
        <select v-model="timezone">
          <option v-for="tz in timezones" :key="tz.value" :value="tz.value">{{ tz.label }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>Tema</label>
        <select v-model="theme">
          <option v-for="t in themes" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>
      <button class="btn-primary" @click="savePreferences">Guardar preferencias</button>
    </section>

    <!-- Acciones de cuenta -->
    <section class="config-section danger-section">
      <div class="danger-actions">
        <button class="btn-danger" @click="logout">
          <i class="ri-logout-box-fill"></i> Cerrar sesión
        </button>
        <button class="btn-danger outline" @click="alert('Contacta con soporte para eliminar tu cuenta')">
          <i class="ri-delete-bin-fill"></i> Eliminar cuenta
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.config-page { padding: 2rem; max-width: 720px; margin: 0 auto; }
.config-page h1 { font-family: 'Impact', sans-serif; font-size: 2.5rem; color: var(--text); margin-bottom: 1.5rem; }

.save-msg { padding: 10px 16px; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem; }
.save-msg.ok { background: rgba(46,204,113,0.1); border: 1px solid rgba(46,204,113,0.3); color: #2ecc71; }
.save-msg.err { background: rgba(231,76,60,0.1); border: 1px solid rgba(231,76,60,0.3); color: #e74c3c; }

.config-section { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
.config-section h2 { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; font-size: 1.1rem; color: var(--text); border-left: 4px solid #b11db9; padding-left: 12px; }
.config-section h2 i { color: #b11db9; }
.section-subtitle { color: var(--text-muted); font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 1.25rem 0 0.75rem; }

/* Cover */
.cover-label { display: block; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 8px; }
.cover-dropzone {
  width: 100%; height: 140px; border-radius: 12px;
  background: var(--bg-card); border: 2px dashed rgba(255,255,255,0.15);
  background-size: cover; background-position: center;
  cursor: pointer; position: relative; overflow: hidden; margin-bottom: 1.5rem;
  display: block;
}
.cover-dropzone:hover .cover-overlay { opacity: 1; }
.cover-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.5); opacity: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: var(--text); gap: 6px; transition: opacity 0.2s;
}
.cover-overlay i { font-size: 1.5rem; }
.cover-overlay span { font-size: 0.85rem; }

/* Avatar */
.avatar-upload { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; }
.avatar-preview { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; border: 3px solid #b11db9; flex-shrink: 0; }
.avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #b11db9, #7b2cbf); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; color: var(--text); }
.upload-btn { display: flex; align-items: center; gap: 6px; background: rgba(177,29,185,0.15); border: 1px solid #b11db9; color: #b11db9; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 0.875rem; transition: background 0.2s; }
.upload-btn:hover { background: rgba(177,29,185,0.3); }

/* Form */
.form-group { margin-bottom: 1rem; }
.form-group label { display: flex; align-items: center; gap: 6px; margin-bottom: 0.4rem; font-size: 0.875rem; color: var(--text-muted); }
.form-group input, .form-group select, .form-group textarea {
  width: 100%; padding: 0.7rem 0.9rem;
  background: rgba(0,0,0,0.3); border: 1px solid var(--border);
  border-radius: 8px; color: var(--text); font-size: 0.95rem; box-sizing: border-box; resize: vertical;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #b11db9; }
.form-group select option { background: #1a1a1d; }

.links-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }

/* Buttons */
.btn-primary { padding: 0.7rem 1.5rem; background: #b11db9; color: var(--text); border: none; border-radius: 8px; font-size: 0.95rem; font-weight: bold; cursor: pointer; transition: background 0.2s; margin-top: 0.5rem; }
.btn-primary:hover:not(:disabled) { background: #9a18a3; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.danger-section { border-color: rgba(255,60,60,0.3); }
.danger-section h2 { border-left-color: #ff3c3c; }
.danger-section h2 i { color: #ff3c3c; }
.danger-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
.btn-danger { display: flex; align-items: center; gap: 6px; padding: 0.7rem 1.5rem; background: #c0392b; color: var(--text); border: none; border-radius: 8px; font-size: 0.95rem; font-weight: bold; cursor: pointer; }
.btn-danger:hover { background: #a93226; }
.btn-danger.outline { background: transparent; border: 1px solid #c0392b; color: #c0392b; }
.btn-danger.outline:hover { background: rgba(192,57,43,0.1); }

@media (max-width: 768px) {
  .config-page { padding: 1rem; }
  .links-grid { grid-template-columns: 1fr; }
  .danger-actions { flex-direction: column; }
  .btn-danger { width: 100%; justify-content: center; }
}
</style>
