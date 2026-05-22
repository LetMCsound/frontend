<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { beatsService } from '@/services/beats'
import { lyricsService } from '@/services/lyrics'
import { filmService } from '@/services/film'
import { graphicService } from '@/services/graphic'

const props = defineProps({
  type: { type: String, required: true }, // 'beat' | 'lyric' | 'film' | 'graphic'
  item: { type: Object, required: true }
})
const emit = defineEmits(['close', 'updated'])

const saving = ref(false)
const error = ref(null)
const coverFile = ref(null)
const coverPreview = ref(null)
const mediaFile = ref(null)
const mediaFileName = ref(null)

// Schemas de campos editables por tipo
const fieldsByType = {
  beat: ['title', 'description', 'genre', 'bpm', 'price_standard', 'price_premium', 'price_exclusive', 'is_published'],
  lyric: ['title', 'description', 'genre', 'language', 'content', 'price_standard', 'price_premium', 'price_exclusive', 'is_published'],
  film: ['title', 'description', 'genre', 'duration', 'video_url', 'price', 'is_published'],
  graphic: ['title', 'description', 'style', 'price', 'is_published']
}

// Mapeo de URLs de imagen por tipo
const coverFieldByType = {
  beat: 'cover_url',
  lyric: 'cover_url',
  film: 'thumbnail_url',
  graphic: 'cover_url'
}

// Mapeo de URLs de archivo media (audio/video) por tipo
const mediaFieldByType = {
  beat: 'audio_preview_url',
  lyric: 'audio_url',
  film: 'video_url',
  graphic: null // graphics no tiene archivo media
}

const mediaLabelByType = {
  beat: 'Audio preview',
  lyric: 'Audio (opcional)',
  film: 'Video',
  graphic: null
}

const mediaAcceptByType = {
  beat: 'audio/*',
  lyric: 'audio/*',
  film: 'video/*',
  graphic: null
}

const form = reactive({})

watch(
  () => props.item,
  (it) => {
    if (!it) return
    const fields = fieldsByType[props.type] || []
    for (const f of fields) {
      form[f] = it[f] ?? (f === 'is_published' ? true : '')
    }
    // Reset file states
    coverFile.value = null
    coverPreview.value = it[coverFieldByType[props.type]] || null
    mediaFile.value = null
    mediaFileName.value = null
  },
  { immediate: true }
)

const labels = {
  title: 'Título',
  description: 'Descripción',
  genre: 'Género',
  style: 'Estilo',
  language: 'Idioma',
  content: 'Letra',
  bpm: 'BPM',
  duration: 'Duración',
  video_url: 'Enlace de YouTube / Vimeo',
  price: 'Precio',
  price_standard: 'Precio Standard',
  price_premium: 'Precio Premium',
  price_exclusive: 'Precio Exclusiva',
  is_published: 'Publicado'
}

const titleByType = {
  beat: '🎵 Editar Beat',
  lyric: '✍️ Editar Letra',
  film: '🎬 Editar Film',
  graphic: '🎨 Editar Diseño'
}

const services = {
  beat:    { update: (id, u) => beatsService.updateBeat(id, u),    uploadCover: beatsService.uploadCover,    uploadMedia: beatsService.uploadAudio },
  lyric:   { update: (id, u) => lyricsService.updateLyric(id, u),  uploadCover: lyricsService.uploadCover,   uploadMedia: lyricsService.uploadAudio },
  film:    { update: (id, u) => filmService.updateFilm(id, u),     uploadCover: filmService.uploadThumbnail, uploadMedia: filmService.uploadVideo },
  graphic: { update: (id, u) => graphicService.updateDesign(id, u), uploadCover: graphicService.uploadCover,  uploadMedia: null }
}

const hasMedia = computed(() => mediaFieldByType[props.type] !== null)

/**
 * Detecta si la URL es externa (YouTube, Vimeo, etc.) en vez de Supabase Storage.
 * Útil para no mostrar "Archivo actual" cuando es un enlace de YouTube.
 */
function isExternalUrl(url) {
  if (!url) return false
  return /youtube\.com|youtu\.be|vimeo\.com|twitch\.tv/i.test(url)
}

function onCoverChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) { error.value = 'La imagen no puede superar 10MB'; return }
  coverFile.value = file
  coverPreview.value = URL.createObjectURL(file)
  error.value = null
}

function onMediaChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const maxSize = props.type === 'film' ? 500 : 20 // MB
  if (file.size > maxSize * 1024 * 1024) {
    error.value = `El archivo no puede superar ${maxSize}MB`
    return
  }
  mediaFile.value = file
  mediaFileName.value = file.name
  error.value = null
}

async function save() {
  if (!form.title?.trim()) { error.value = 'El título es obligatorio'; return }
  saving.value = true
  error.value = null
  try {
    const updates = { ...form }
    // Limpiar campos vacíos opcionales
    for (const k of Object.keys(updates)) {
      if (updates[k] === '' || updates[k] === null || updates[k] === undefined) delete updates[k]
    }
    // Forzar tipos numéricos
    for (const k of ['bpm', 'price', 'price_standard', 'price_premium', 'price_exclusive']) {
      if (updates[k] !== undefined) updates[k] = Number(updates[k])
    }

    const svc = services[props.type]
    if (!svc) throw new Error('Tipo no soportado')

    // Subir nueva portada si hay
    if (coverFile.value) {
      const { url, error: upErr } = await svc.uploadCover(coverFile.value, props.item.id)
      if (upErr) throw new Error('Error subiendo portada: ' + (upErr.message || ''))
      if (url) updates[coverFieldByType[props.type]] = url
    }

    // Subir nuevo archivo media si hay
    if (mediaFile.value && svc.uploadMedia) {
      const { url, error: upErr } = await svc.uploadMedia(mediaFile.value, props.item.id)
      if (upErr) throw new Error('Error subiendo archivo: ' + (upErr.message || ''))
      if (url) updates[mediaFieldByType[props.type]] = url
    }

    const { data, error: err } = await svc.update(props.item.id, updates)
    if (err) throw new Error(err.message || 'Error al guardar')
    emit('updated', data)
    emit('close')
  } catch (e) {
    error.value = e.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}

function isField(name) {
  return (fieldsByType[props.type] || []).includes(name)
}
</script>

<template>
  <Teleport to="body">
    <div class="edit-overlay" @click.self="emit('close')">
      <div class="edit-box">
        <div class="edit-header">
          <h2>{{ titleByType[props.type] }}</h2>
          <button class="edit-close" @click="emit('close')">&times;</button>
        </div>

        <p v-if="error" class="edit-error"><i class="ri-error-warning-fill"></i> {{ error }}</p>

        <div class="edit-body">
          <!-- Portada -->
          <div class="edit-field">
            <label>Portada</label>
            <label class="cover-uploader">
              <img v-if="coverPreview" :src="coverPreview" alt="Portada" />
              <div v-else class="cover-placeholder">
                <i class="ri-image-add-line"></i>
                <span>Subir portada</span>
              </div>
              <div class="cover-overlay">
                <i class="ri-camera-line"></i>
                <span>Cambiar</span>
              </div>
              <input type="file" accept="image/*" @change="onCoverChange" hidden />
            </label>
          </div>

          <!-- Para films: enlace YouTube/Vimeo (opción 1) -->
          <div v-if="type === 'film' && isField('video_url')" class="edit-field">
            <label>{{ labels.video_url }}</label>
            <input v-model="form.video_url" type="text" placeholder="https://youtube.com/watch?v=..." />
            <p class="field-hint">Pega aquí el enlace, o sube un archivo más abajo</p>
          </div>

          <!-- Archivo media (audio/video) -->
          <div v-if="hasMedia" class="edit-field">
            <label>
              {{ mediaLabelByType[type] }}
              <span v-if="type === 'film'" class="field-sublabel">(opción 2)</span>
            </label>
            <label class="media-uploader">
              <i :class="type === 'film' ? 'ri-video-add-line' : 'ri-music-line'"></i>
              <span v-if="mediaFileName">{{ mediaFileName }}</span>
              <span v-else-if="item[mediaFieldByType[type]] && !isExternalUrl(item[mediaFieldByType[type]])" class="media-current">
                <i class="ri-check-line"></i> Archivo actual (click para cambiar)
              </span>
              <span v-else>Subir archivo</span>
              <input type="file" :accept="mediaAcceptByType[type]" @change="onMediaChange" hidden />
            </label>
          </div>

          <div v-if="isField('title')" class="edit-field">
            <label>{{ labels.title }} *</label>
            <input v-model="form.title" type="text" placeholder="Título" />
          </div>

          <div v-if="isField('description')" class="edit-field">
            <label>{{ labels.description }}</label>
            <textarea v-model="form.description" rows="3" placeholder="Descripción"></textarea>
          </div>

          <div class="edit-row">
            <div v-if="isField('genre')" class="edit-field">
              <label>{{ labels.genre }}</label>
              <input v-model="form.genre" type="text" placeholder="Trap, R&B..." />
            </div>
            <div v-if="isField('style')" class="edit-field">
              <label>{{ labels.style }}</label>
              <input v-model="form.style" type="text" placeholder="Dark, Minimal..." />
            </div>
            <div v-if="isField('language')" class="edit-field">
              <label>{{ labels.language }}</label>
              <select v-model="form.language">
                <option value="es">🇪🇸 Español</option>
                <option value="en">🇬🇧 English</option>
                <option value="pt">🇧🇷 Português</option>
                <option value="fr">🇫🇷 Français</option>
              </select>
            </div>
            <div v-if="isField('bpm')" class="edit-field">
              <label>{{ labels.bpm }}</label>
              <input v-model.number="form.bpm" type="number" min="40" max="300" />
            </div>
            <div v-if="isField('duration')" class="edit-field">
              <label>{{ labels.duration }}</label>
              <input v-model="form.duration" type="text" placeholder="3:45" />
            </div>
          </div>

          <div v-if="isField('content')" class="edit-field">
            <label>{{ labels.content }}</label>
            <textarea v-model="form.content" rows="6" placeholder="La letra de la canción..."></textarea>
          </div>

          <!-- Precios -->
          <div v-if="isField('price')" class="edit-field">
            <label>{{ labels.price }} ($)</label>
            <input v-model.number="form.price" type="number" min="0" step="0.01" />
          </div>
          <div v-if="isField('price_standard')" class="edit-row">
            <div class="edit-field">
              <label>{{ labels.price_standard }} ($)</label>
              <input v-model.number="form.price_standard" type="number" min="0" step="0.01" />
            </div>
            <div class="edit-field">
              <label>{{ labels.price_premium }} ($)</label>
              <input v-model.number="form.price_premium" type="number" min="0" step="0.01" />
            </div>
            <div class="edit-field">
              <label>{{ labels.price_exclusive }} ($)</label>
              <input v-model.number="form.price_exclusive" type="number" min="0" step="0.01" />
            </div>
          </div>

          <!-- Estado de publicación -->
          <div v-if="isField('is_published')" class="edit-field-row">
            <label class="checkbox-label">
              <input v-model="form.is_published" type="checkbox" />
              <span>{{ form.is_published ? '✅ Publicado (visible)' : '🔒 Oculto (privado)' }}</span>
            </label>
          </div>
        </div>

        <div class="edit-footer">
          <button class="btn-cancel-edit" @click="emit('close')" :disabled="saving">Cancelar</button>
          <button class="btn-save-edit" @click="save" :disabled="saving">
            <i v-if="saving" class="ri-loader-4-line spin"></i>
            <i v-else class="ri-save-fill"></i>
            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.edit-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(6px);
  z-index: 4000;
  display: flex; justify-content: center; align-items: center;
  padding: 20px;
}

.edit-box {
  background: var(--bg-card, #1a1a1d);
  border: 1px solid var(--border, rgba(177,29,185,0.3));
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex; flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}

.edit-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
}
.edit-header h2 {
  font-family: 'Impact', sans-serif;
  font-size: 1.4rem;
  color: var(--text, #fff);
  margin: 0;
}
.edit-close {
  background: none; border: none;
  color: var(--text-muted, #888);
  font-size: 1.8rem; cursor: pointer;
  line-height: 1; padding: 0 4px;
}
.edit-close:hover { color: #b11db9; }

.edit-error {
  background: rgba(255,77,77,0.1);
  border: 1px solid rgba(255,77,77,0.3);
  color: #ff4d4d;
  margin: 1rem 1.5rem 0;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  display: flex; align-items: center; gap: 6px;
}

.edit-body {
  padding: 1.25rem 1.5rem;
  display: flex; flex-direction: column;
  gap: 0.85rem;
}

.edit-field { display: flex; flex-direction: column; gap: 4px; }
.edit-field label {
  font-size: 0.78rem;
  color: var(--text-muted, #888);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.edit-field input,
.edit-field select,
.edit-field textarea {
  background: var(--input-bg, rgba(255,255,255,0.05));
  border: 1px solid var(--border, rgba(255,255,255,0.1));
  border-radius: 8px;
  padding: 0.55rem 0.75rem;
  color: var(--text, #fff);
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}
.edit-field input:focus,
.edit-field select:focus,
.edit-field textarea:focus { border-color: #b11db9; }

.field-hint {
  font-size: 0.72rem;
  color: var(--text-muted, #888);
  margin: 4px 0 0;
  font-style: italic;
}
.field-sublabel {
  font-size: 0.7rem;
  color: var(--text-muted, #888);
  text-transform: none;
  font-weight: 400;
  margin-left: 4px;
}

.edit-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.85rem;
}

/* Cover uploader */
.cover-uploader {
  position: relative;
  display: block;
  width: 100%;
  max-width: 240px;
  aspect-ratio: 1;
  border-radius: 12px;
  border: 2px dashed var(--border, rgba(255,255,255,0.15));
  overflow: hidden;
  cursor: pointer;
  background: var(--input-bg, rgba(255,255,255,0.03));
  transition: border-color 0.2s;
}
.cover-uploader:hover { border-color: #b11db9; }
.cover-uploader img {
  width: 100%; height: 100%;
  object-fit: cover;
}
.cover-placeholder {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  height: 100%;
  gap: 8px;
  color: var(--text-muted, #888);
  font-size: 0.85rem;
}
.cover-placeholder i { font-size: 2rem; color: #b11db9; }
.cover-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 4px;
  color: #fff;
  font-size: 0.85rem;
  opacity: 0;
  transition: opacity 0.2s;
}
.cover-overlay i { font-size: 1.5rem; }
.cover-uploader:hover .cover-overlay { opacity: 1; }

/* Media uploader (audio/video) */
.media-uploader {
  display: flex; align-items: center; gap: 10px;
  border: 2px dashed var(--border, rgba(255,255,255,0.15));
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  color: var(--text-muted, #888);
  font-size: 0.85rem;
  transition: border-color 0.2s, color 0.2s;
}
.media-uploader:hover { border-color: #b11db9; color: #b11db9; }
.media-uploader i { font-size: 1.3rem; }
.media-current {
  color: #2ecc71;
  display: inline-flex; align-items: center; gap: 4px;
}

.edit-field-row {
  padding: 8px 12px;
  background: rgba(177,29,185,0.06);
  border-radius: 8px;
}
.checkbox-label {
  display: flex; align-items: center; gap: 8px;
  cursor: pointer;
  font-size: 0.88rem;
  color: var(--text, #fff);
}
.checkbox-label input { width: auto; }

.edit-footer {
  display: flex; gap: 10px; justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border, rgba(255,255,255,0.08));
}
.btn-cancel-edit,
.btn-save-edit {
  display: flex; align-items: center; gap: 6px;
  padding: 0.6rem 1.2rem;
  border-radius: 25px;
  border: none;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.btn-cancel-edit {
  background: rgba(255,255,255,0.06);
  color: var(--text-soft, #ccc);
  border: 1px solid rgba(255,255,255,0.1);
}
.btn-cancel-edit:hover { background: rgba(255,255,255,0.1); }
.btn-save-edit {
  background: linear-gradient(135deg, #b11db9, #8b1589);
  color: #fff;
}
.btn-save-edit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(177,29,185,0.4);
}
.btn-save-edit:disabled { opacity: 0.6; cursor: not-allowed; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
