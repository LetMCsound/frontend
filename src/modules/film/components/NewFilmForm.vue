<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { filmService } from '@/services/film'
import CollaboratorsInput from '@/components/CollaboratorsInput.vue'

const emit = defineEmits(['close', 'published'])
const authStore = useAuthStore()
const loading = ref(false)
const error = ref(null)
const thumbPreview = ref(null)
const thumbFile = ref(null)
const videoFile = ref(null)
const videoPreview = ref(null)
const uploadProgress = ref(0)

const form = reactive({
  title: '',
  description: '',
  genre: '',
  video_url: '',
  duration: '',
  tags: '',
  price: 99.99,
  collaborators: { platform: [], external: [] },
})

const genres = ['Music Video', 'Documentary', 'Short Film', 'Behind The Scenes', 'Live Performance', 'Otro']

function onThumbChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) { error.value = 'La miniatura no puede superar 10MB'; return }
  thumbFile.value = file
  thumbPreview.value = URL.createObjectURL(file)
}

function onVideoChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 500 * 1024 * 1024) { error.value = 'El video no puede superar 500MB'; return }
  videoFile.value = file
  videoPreview.value = URL.createObjectURL(file)
  // Auto-detectar duración
  const video = document.createElement('video')
  video.src = videoPreview.value
  video.onloadedmetadata = () => {
    const secs = Math.floor(video.duration)
    const m = Math.floor(secs / 60)
    const s = secs % 60
    form.duration = `${m}:${s.toString().padStart(2, '0')}`
  }
}

async function publish() {
  if (!form.title.trim()) { error.value = 'El título es obligatorio'; return }
  if (!videoFile.value && !form.video_url.trim()) { error.value = 'Sube un video o añade un enlace de YouTube'; return }
  loading.value = true
  error.value = null
  uploadProgress.value = 0

  try {
    const filmData = {
      seller_id:    authStore.user.id,
      seller_name:  authStore.userDisplayName,
      title:        form.title.trim(),
      description:  form.description.trim(),
      genre:        form.genre,
      video_url:    form.video_url.trim() || null,
      duration:     form.duration.trim() || null,
      tags:         form.tags ? form.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [],
      collaborators: form.collaborators,
      price:        parseFloat(form.price),
      is_published: true
    }

    const { data, error: err } = await filmService.createFilm(filmData)
    if (err) throw err

    uploadProgress.value = 25

    // Subir miniatura
    if (thumbFile.value) {
      const { url } = await filmService.uploadThumbnail(thumbFile.value, data.id)
      if (url) await filmService.updateFilm(data.id, { thumbnail_url: url })
    }

    uploadProgress.value = 60

    // Subir video MP4 si hay
    if (videoFile.value) {
      const { url, error: vidErr } = await filmService.uploadVideo(videoFile.value, data.id)
      if (vidErr) throw vidErr
      if (url) await filmService.updateFilm(data.id, { video_url: url })
    }

    uploadProgress.value = 100
    emit('published')
    emit('close')
  } catch (e) {
    error.value = e.message || 'Error al publicar'
  } finally {
    loading.value = false
    uploadProgress.value = 0
  }
}
</script>

<template>
  <div class="form-box">
    <div class="form-header">
      <h2><i class="ri-clapperboard-fill"></i> Nuevo video</h2>
      <button @click="emit('close')">&times;</button>
    </div>

    <p v-if="error" class="error-msg"><i class="ri-error-warning-fill"></i> {{ error }}</p>

    <div class="form-body">

      <!-- Miniatura -->
      <label class="upload-label">Miniatura</label>
      <label class="cover-dropzone" :class="{ 'has-file': thumbPreview }">
        <img v-if="thumbPreview" :src="thumbPreview" class="cover-preview" />
        <div v-else class="cover-placeholder">
          <i class="ri-image-add-fill"></i>
          <p>Haz clic para subir miniatura (JPG/PNG · Max 10MB)</p>
        </div>
        <input type="file" accept="image/*" @change="onThumbChange" hidden />
      </label>

      <!-- Video MP4 o URL -->
      <label class="upload-label">Video *</label>
      <div class="video-options">
        <!-- Opción 1: subir MP4 -->
        <label class="video-dropzone" :class="{ 'has-file': videoPreview }">
          <template v-if="videoPreview">
            <video :src="videoPreview" class="video-preview" controls></video>
          </template>
          <div v-else class="cover-placeholder">
            <i class="ri-video-add-fill"></i>
            <p>Haz clic para subir MP4/MOV/WebM<br><span class="hint">Max 500MB</span></p>
          </div>
          <input type="file" accept="video/mp4,video/mov,video/webm,video/quicktime" @change="onVideoChange" hidden />
        </label>

        <div class="or-divider"><span>o</span></div>

        <!-- Opción 2: URL YouTube -->
        <div class="form-group">
          <label>Enlace de YouTube / Vimeo</label>
          <input v-model="form.video_url" type="url" placeholder="https://youtube.com/watch?v=..." :disabled="!!videoFile" />
          <p v-if="videoFile" class="hint-note">Ya tienes un video subido — el enlace de YouTube se ignorará</p>
        </div>
      </div>

      <div class="form-group">
        <label>Título *</label>
        <input v-model="form.title" type="text" placeholder="Nombre del video" />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Género</label>
          <select v-model="form.genre">
            <option value="">Seleccionar...</option>
            <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Duración</label>
          <input v-model="form.duration" type="text" placeholder="3:24" />
        </div>
      </div>

      <div class="form-group">
        <label>Descripción</label>
        <textarea v-model="form.description" rows="2" placeholder="Describe tu trabajo..."></textarea>
      </div>

      <div class="form-group">
        <label>Tags <span class="hint">(separados por coma)</span></label>
        <input v-model="form.tags" type="text" placeholder="music video, urban, drill" />
      </div>

      <div class="form-group">
        <label>Precio base ($)</label>
        <input v-model="form.price" type="number" min="0" step="0.01" />
      </div>

      <CollaboratorsInput v-model="form.collaborators" />

      <!-- Progress bar -->
      <div v-if="loading && uploadProgress > 0" class="progress-wrap">
        <div class="progress-bar" :style="`width: ${uploadProgress}%`"></div>
        <span>{{ uploadProgress < 100 ? 'Subiendo...' : '¡Listo!' }}</span>
      </div>
    </div>

    <div class="form-footer">
      <button class="btn-cancel" @click="emit('close')" :disabled="loading">Cancelar</button>
      <button class="btn-publish" @click="publish" :disabled="loading">
        <i class="ri-rocket-fill"></i>
        {{ loading ? `Subiendo... ${uploadProgress}%` : 'Publicar video' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.form-box { background: #121212; border: 1px solid #333; border-radius: 20px; width: 100%; max-width: 580px; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; }
.form-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #222; flex-shrink: 0; }
.form-header h2 { color: var(--text); font-size: 1.2rem; display: flex; align-items: center; gap: 8px; }
.form-header h2 i { color: #b11db9; }
.form-header button { background: none; border: none; color: var(--text-muted); font-size: 1.5rem; cursor: pointer; }
.error-msg { margin: 0.75rem 1.5rem; padding: 8px 12px; background: rgba(255,60,60,0.1); border: 1px solid rgba(255,60,60,0.3); border-radius: 8px; color: #ff6b6b; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; }
.form-body { padding: 1.25rem 1.5rem; flex: 1; }
.upload-label { display: block; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 8px; font-weight: 500; }

/* Miniatura */
.cover-dropzone { display: flex; align-items: center; justify-content: center; border: 2px dashed rgba(255,255,255,0.15); border-radius: 12px; cursor: pointer; overflow: hidden; margin-bottom: 1rem; min-height: 120px; transition: border-color 0.2s; }
.cover-dropzone:hover { border-color: #b11db9; }
.cover-dropzone.has-file { border-style: solid; border-color: #b11db9; }
.cover-preview { width: 100%; max-height: 140px; object-fit: cover; display: block; }

/* Video */
.video-options { margin-bottom: 1rem; }
.video-dropzone { display: flex; align-items: center; justify-content: center; border: 2px dashed rgba(255,255,255,0.15); border-radius: 12px; cursor: pointer; overflow: hidden; min-height: 120px; transition: border-color 0.2s; margin-bottom: 0.5rem; }
.video-dropzone:hover { border-color: #b11db9; }
.video-dropzone.has-file { border-style: solid; border-color: #2ecc71; }
.video-preview { width: 100%; max-height: 180px; display: block; }
.cover-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-muted); padding: 1.5rem; text-align: center; }
.cover-placeholder i { font-size: 2rem; }
.cover-placeholder p { font-size: 0.82rem; }
.or-divider { text-align: center; color: var(--text-muted); font-size: 0.82rem; margin: 0.5rem 0; position: relative; }
.or-divider::before, .or-divider::after { content: ''; position: absolute; top: 50%; width: 44%; height: 1px; background: rgba(255,255,255,0.1); }
.or-divider::before { left: 0; }
.or-divider::after { right: 0; }
.or-divider span { background: #121212; padding: 0 8px; }
.hint-note { color: #f39c12; font-size: 0.72rem; margin-top: 4px; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.form-group { margin-bottom: 0.875rem; }
.form-group label { display: block; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 5px; }
.hint { color: var(--text-muted); font-size: 0.75rem; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.65rem 0.85rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 0.9rem; outline: none; box-sizing: border-box; resize: vertical; transition: border-color 0.2s; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #b11db9; }
.form-group select option { background: #1a1a1d; }
.form-group input:disabled { opacity: 0.5; cursor: not-allowed; }

/* Progress */
.progress-wrap { margin: 0.5rem 0; }
.progress-wrap span { font-size: 0.78rem; color: var(--text-muted); display: block; margin-bottom: 4px; }
.progress-bar { height: 4px; background: #b11db9; border-radius: 2px; transition: width 0.3s; }

.form-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 1rem 1.5rem; border-top: 1px solid #222; flex-shrink: 0; }
.btn-cancel { background: transparent; border: 1px solid #444; color: var(--text-muted); padding: 8px 18px; border-radius: 20px; cursor: pointer; font-size: 0.875rem; }
.btn-cancel:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-publish { display: flex; align-items: center; gap: 6px; background: #b11db9; color: var(--text); border: none; padding: 8px 20px; border-radius: 20px; font-size: 0.875rem; font-weight: 700; cursor: pointer; transition: background 0.2s; }
.btn-publish:hover:not(:disabled) { background: #9a18a3; }
.btn-publish:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
