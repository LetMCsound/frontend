<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { beatsService } from '@/services/beats'
import CollaboratorsInput from '@/components/CollaboratorsInput.vue'

const emit = defineEmits(['close', 'published'])
const authStore = useAuthStore()

const loading = ref(false)
const error = ref(null)
const step = ref(1) // 1: info, 2: media, 3: precios

// Previews
const coverPreview = ref(null)
const audioPreview = ref(null)
const coverFile = ref(null)
const audioFile = ref(null)

const form = reactive({
  title: '',
  description: '',
  genre: '',
  type: 'Beat',
  bpm: '',
  key: '',
  scale: '',
  release_date: new Date().getFullYear().toString(),
  tags: '',
  price_standard: 29.99,
  price_premium: 79.99,
  price_exclusive: 199.99,
  collaborators: { platform: [], external: [] },
})

const genres = [
  'Trap', 'Drill', 'R&B', 'Brazilian Funk', 'Jersey',
  'Lo-Fi', 'Pop', 'Afrobeats', 'Reggaeton', 'Dancehall',
  'Hip-Hop', 'House', 'Amapiano', 'Otro'
]

const keys = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const scales = ['Major','Minor','Harmonic Minor','Natural Minor','Phrygian','Dorian']

function onCoverChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'La portada no puede superar 5MB'
    return
  }
  coverFile.value = file
  coverPreview.value = URL.createObjectURL(file)
}

function onAudioChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 20 * 1024 * 1024) {
    error.value = 'El audio no puede superar 20MB'
    return
  }
  audioFile.value = file
  audioPreview.value = URL.createObjectURL(file)
}

function validateStep1() {
  if (!form.title.trim()) { error.value = 'El título es obligatorio'; return false }
  if (!form.genre) { error.value = 'Selecciona un género'; return false }
  return true
}

function nextStep() {
  error.value = null
  if (step.value === 1 && !validateStep1()) return
  step.value++
}

async function publish() {
  if (!authStore.isAuthenticated) return
  error.value = null
  loading.value = true

  try {
    // 1. Crear el beat en BD para obtener el ID
    const beatData = {
      seller_id: authStore.user.id,
      seller_name: authStore.userDisplayName,
      title: form.title.trim(),
      description: form.description.trim(),
      genre: form.genre,
      type: form.type,
      bpm: form.bpm ? parseInt(form.bpm) : null,
      key: form.key || null,
      scale: form.scale || null,
      release_date: form.release_date,
      tags: form.tags ? form.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [],
      collaborators: form.collaborators,
      price_standard: parseFloat(form.price_standard),
      price_premium: parseFloat(form.price_premium),
      price_exclusive: parseFloat(form.price_exclusive),
      is_published: true,
    }

    const { data: beat, error: beatErr } = await beatsService.createBeat(beatData)
    if (beatErr) throw beatErr

    // 2. Subir portada si hay
    if (coverFile.value) {
      const { url, error: coverErr } = await beatsService.uploadCover(coverFile.value, beat.id)
      if (!coverErr && url) {
        await beatsService.updateBeat(beat.id, { cover_url: url })
      }
    }

    // 3. Subir audio si hay
    if (audioFile.value) {
      const { url, error: audioErr } = await beatsService.uploadAudio(audioFile.value, beat.id)
      if (!audioErr && url) {
        await beatsService.updateBeat(beat.id, { audio_preview_url: url })
      }
    }

    emit('published', beat)
    emit('close')

  } catch (e) {
    error.value = e.message || 'Error al publicar'
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-box">

      <!-- Header -->
      <div class="modal-header">
        <h2>Nueva publicación</h2>
        <button class="close-btn" @click="emit('close')">&times;</button>
      </div>

      <!-- Steps indicator -->
      <div class="steps">
        <div :class="['step', { active: step === 1, done: step > 1 }]">
          <span>1</span> Información
        </div>
        <div class="step-line"></div>
        <div :class="['step', { active: step === 2, done: step > 2 }]">
          <span>2</span> Archivos
        </div>
        <div class="step-line"></div>
        <div :class="['step', { active: step === 3 }]">
          <span>3</span> Precios
        </div>
      </div>

      <!-- Error -->
      <p v-if="error" class="error-msg">
        <i class="ri-error-warning-fill"></i> {{ error }}
      </p>

      <!-- ── STEP 1: Información ── -->
      <div v-if="step === 1" class="step-content">
        <div class="form-row">
          <div class="form-group full">
            <label>Título *</label>
            <input v-model="form.title" type="text" placeholder="Nombre del beat" />
          </div>
        </div>

        <div class="form-row two-col">
          <div class="form-group">
            <label>Tipo *</label>
            <select v-model="form.type">
              <option value="Beat">Beat</option>
              <option value="Song">Song</option>
              <option value="Sample">Sample</option>
            </select>
          </div>
          <div class="form-group">
            <label>Género *</label>
            <select v-model="form.genre">
              <option value="" disabled>Seleccionar...</option>
              <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>
        </div>

        <div class="form-row three-col">
          <div class="form-group">
            <label>BPM</label>
            <input v-model="form.bpm" type="number" placeholder="140" min="40" max="300" />
          </div>
          <div class="form-group">
            <label>Key</label>
            <select v-model="form.key">
              <option value="">—</option>
              <option v-for="k in keys" :key="k" :value="k">{{ k }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Scale</label>
            <select v-model="form.scale">
              <option value="">—</option>
              <option v-for="s in scales" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>

        <div class="form-group full">
          <label>Descripción</label>
          <textarea v-model="form.description" rows="3" placeholder="Describe tu beat..."></textarea>
        </div>

        <div class="form-group full">
          <label>Tags <span class="hint">(separados por coma: trap, dark, 808)</span></label>
          <input v-model="form.tags" type="text" placeholder="trap, dark, 808, melodic" />
        </div>

        <CollaboratorsInput v-model="form.collaborators" />
      </div>

      <!-- ── STEP 2: Archivos ── -->
      <div v-if="step === 2" class="step-content">

        <!-- Portada -->
        <div class="upload-area">
          <label class="upload-label">Portada <span class="hint">JPG/PNG · Max 5MB</span></label>
          <label class="upload-dropzone" :class="{ 'has-file': coverPreview }">
            <img v-if="coverPreview" :src="coverPreview" class="preview-img" />
            <div v-else class="upload-placeholder">
              <i class="ri-image-add-fill"></i>
              <p>Haz clic para subir portada</p>
            </div>
            <input type="file" accept="image/*" @change="onCoverChange" hidden />
          </label>
        </div>

        <!-- Audio preview -->
        <div class="upload-area">
          <label class="upload-label">Audio Preview <span class="hint">MP3/WAV · Max 20MB</span></label>
          <label class="upload-dropzone audio-zone" :class="{ 'has-file': audioPreview }">
            <div v-if="audioPreview" class="audio-ready">
              <i class="ri-music-2-fill"></i>
              <p>Audio cargado</p>
              <audio controls :src="audioPreview" class="preview-audio" @click.stop></audio>
            </div>
            <div v-else class="upload-placeholder">
              <i class="ri-music-2-fill"></i>
              <p>Haz clic para subir audio</p>
            </div>
            <input type="file" accept="audio/*" @change="onAudioChange" hidden />
          </label>
        </div>

        <p class="files-note">
          <i class="ri-information-line"></i>
          Los archivos se suben cuando publicas. La portada y el audio son opcionales pero recomendados.
        </p>
      </div>

      <!-- ── STEP 3: Precios ── -->
      <div v-if="step === 3" class="step-content">
        <p class="prices-intro">
          Define el precio de cada licencia. El tipo <strong>Song</strong> no tiene opciones de venta — solo aparecerá en tu perfil.
        </p>

        <div v-if="form.type === 'Beat' || form.type === 'Sample'" class="prices-grid">
          <div class="price-card-edit standard">
            <div class="price-card-header">
              <h4>Standard</h4>
              <p>MP3 · 10k Streams · Sin radio</p>
            </div>
            <div class="price-input-wrap">
              <span>$</span>
              <input v-model="form.price_standard" type="number" min="0" step="0.01" />
            </div>
          </div>

          <div class="price-card-edit premium">
            <div class="price-card-header">
              <h4>Premium</h4>
              <p>MP3 + WAV · 500k Streams · Radio regional</p>
            </div>
            <div class="price-input-wrap">
              <span>$</span>
              <input v-model="form.price_premium" type="number" min="0" step="0.01" />
            </div>
          </div>

          <div class="price-card-edit exclusive">
            <div class="price-card-header">
              <h4>Exclusiva</h4>
              <p>Stems · Streams ilimitados · Propiedad total</p>
            </div>
            <div class="price-input-wrap gold">
              <span>$</span>
              <input v-model="form.price_exclusive" type="number" min="0" step="0.01" />
            </div>
          </div>
        </div>

        <div v-else class="song-note">
          <i class="ri-information-line"></i>
          Las <strong>Songs</strong> no tienen precio — aparecerán en tu perfil para que los fans las descubran.
        </div>
      </div>

      <!-- Footer navegación -->
      <div class="modal-footer">
        <button v-if="step > 1" class="btn-back" @click="step--">
          <i class="ri-arrow-left-line"></i> Atrás
        </button>
        <div class="spacer"></div>
        <button v-if="step < 3" class="btn-next" @click="nextStep">
          Siguiente <i class="ri-arrow-right-line"></i>
        </button>
        <button
          v-if="step === 3"
          class="btn-publish"
          @click="publish"
          :disabled="loading"
        >
          <i class="ri-rocket-fill"></i>
          {{ loading ? 'Publicando...' : 'Publicar' }}
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(6px);
  z-index: 3000; display: flex; justify-content: center; align-items: center; padding: 20px;
}
.modal-box {
  background: #121212; border: 1px solid #333;
  border-radius: 20px; width: 100%; max-width: 640px;
  max-height: 90vh; overflow-y: auto;
  display: flex; flex-direction: column;
}

/* Header */
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.5rem 1.75rem 1rem; border-bottom: 1px solid #222;
}
.modal-header h2 { font-family: 'Impact', sans-serif; font-size: 1.5rem; color: #fff; }
.close-btn { background: none; border: none; color: #aaa; font-size: 1.75rem; cursor: pointer; line-height: 1; }
.close-btn:hover { color: #fff; }

/* Steps */
.steps {
  display: flex; align-items: center;
  padding: 1rem 1.75rem; gap: 0;
}
.step {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.82rem; color: #555; white-space: nowrap;
}
.step span {
  width: 24px; height: 24px; border-radius: 50%;
  background: #333; color: #555;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
}
.step.active { color: #fff; }
.step.active span { background: #b11db9; color: #fff; }
.step.done span { background: #2ecc71; color: #fff; }
.step-line { flex: 1; height: 1px; background: #333; margin: 0 8px; }

/* Error */
.error-msg {
  margin: 0 1.75rem; padding: 10px 14px;
  background: rgba(255,60,60,0.1); border: 1px solid rgba(255,60,60,0.3);
  border-radius: 8px; color: #ff6b6b; font-size: 0.85rem;
  display: flex; align-items: center; gap: 8px;
}

/* Step content */
.step-content { padding: 1.25rem 1.75rem; flex: 1; }

.form-row { display: flex; gap: 1rem; margin-bottom: 1rem; }
.form-row.two-col > * { flex: 1; }
.form-row.three-col > * { flex: 1; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.full { width: 100%; margin-bottom: 1rem; }
.form-group label { font-size: 0.82rem; color: #aaa; font-weight: 500; }
.hint { color: #555; font-weight: 400; margin-left: 6px; }
.form-group input,
.form-group select,
.form-group textarea {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px; color: #fff; padding: 0.65rem 0.85rem;
  font-size: 0.9rem; outline: none; transition: border-color 0.2s;
  box-sizing: border-box; width: 100%;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus { border-color: #b11db9; }
.form-group select option { background: #1a1a1d; }
.form-group textarea { resize: vertical; }

/* Upload */
.upload-area { margin-bottom: 1.25rem; }
.upload-label { display: block; font-size: 0.82rem; color: #aaa; margin-bottom: 8px; font-weight: 500; }
.upload-dropzone {
  display: block; border: 2px dashed rgba(255,255,255,0.15);
  border-radius: 12px; cursor: pointer; transition: border-color 0.2s;
  overflow: hidden; min-height: 140px;
  display: flex; align-items: center; justify-content: center;
}
.upload-dropzone:hover { border-color: #b11db9; }
.upload-dropzone.has-file { border-style: solid; border-color: #b11db9; }
.upload-placeholder {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  color: #555; padding: 2rem;
}
.upload-placeholder i { font-size: 2.5rem; }
.upload-placeholder p { font-size: 0.85rem; }
.preview-img { width: 100%; max-height: 200px; object-fit: cover; display: block; }
.audio-zone { min-height: 100px; }
.audio-ready {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 1rem; color: #b11db9; width: 100%;
}
.audio-ready i { font-size: 2rem; }
.audio-ready p { font-size: 0.85rem; }
.preview-audio { width: 100%; margin-top: 8px; }
.files-note {
  display: flex; align-items: center; gap: 6px;
  color: #555; font-size: 0.8rem; margin-top: 0.5rem;
}

/* Prices */
.prices-intro { color: #888; font-size: 0.875rem; margin-bottom: 1.25rem; line-height: 1.5; }
.prices-grid { display: flex; flex-direction: column; gap: 1rem; }
.price-card-edit {
  background: #1a1a1d; border: 1px solid #333;
  border-radius: 12px; padding: 1rem 1.25rem;
  display: flex; justify-content: space-between; align-items: center; gap: 1rem;
}
.price-card-edit.standard { border-left: 3px solid #888; }
.price-card-edit.premium  { border-left: 3px solid #b11db9; }
.price-card-edit.exclusive { border-left: 3px solid #ffd700; }
.price-card-header h4 { color: #fff; font-size: 0.95rem; margin-bottom: 3px; }
.price-card-header p { color: #666; font-size: 0.78rem; }
.price-input-wrap {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px; padding: 6px 12px; flex-shrink: 0;
}
.price-input-wrap span { color: #888; font-size: 0.9rem; }
.price-input-wrap.gold span { color: #ffd700; }
.price-input-wrap input {
  background: transparent; border: none; color: #fff;
  font-size: 1rem; font-weight: 600; width: 70px;
  outline: none; text-align: right;
}
.song-note {
  display: flex; align-items: center; gap: 10px;
  background: rgba(177,29,185,0.1); border: 1px solid rgba(177,29,185,0.2);
  border-radius: 10px; padding: 1rem 1.25rem;
  color: #ccc; font-size: 0.875rem; line-height: 1.5;
}
.song-note i { color: #b11db9; font-size: 1.2rem; flex-shrink: 0; }

/* Footer */
.modal-footer {
  display: flex; align-items: center;
  padding: 1rem 1.75rem; border-top: 1px solid #222; gap: 1rem;
}
.spacer { flex: 1; }
.btn-back {
  display: flex; align-items: center; gap: 6px;
  background: transparent; border: 1px solid #444; color: #aaa;
  padding: 10px 18px; border-radius: 20px; cursor: pointer;
  font-size: 0.875rem; transition: all 0.2s;
}
.btn-back:hover { border-color: #fff; color: #fff; }
.btn-next {
  display: flex; align-items: center; gap: 6px;
  background: rgba(177,29,185,0.2); border: 1px solid #b11db9;
  color: #b11db9; padding: 10px 20px; border-radius: 20px;
  cursor: pointer; font-size: 0.875rem; font-weight: 600; transition: all 0.2s;
}
.btn-next:hover { background: #b11db9; color: #fff; }
.btn-publish {
  display: flex; align-items: center; gap: 8px;
  background: #b11db9; border: none; color: #fff;
  padding: 10px 24px; border-radius: 20px;
  cursor: pointer; font-size: 0.875rem; font-weight: 700; transition: all 0.2s;
}
.btn-publish:hover:not(:disabled) { background: #9a18a3; transform: translateY(-2px); }
.btn-publish:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 600px) {
  .modal-box { border-radius: 16px; }
  .step-content { padding: 1rem; }
  .modal-header, .modal-footer { padding: 1rem; }
  .form-row.three-col { flex-direction: column; }
  .price-card-edit { flex-direction: column; align-items: flex-start; }
}
</style>
