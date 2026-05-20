<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { lyricsService } from '@/services/lyrics'

const emit = defineEmits(['close', 'published'])
const authStore = useAuthStore()
const loading = ref(false)
const error = ref(null)
const coverPreview = ref(null)
const coverFile = ref(null)
const audioFile = ref(null)
const audioName = ref(null)
const step = ref(1)
const newLink = ref('')

const form = reactive({
  title: '',
  description: '',
  genre: '',
  language: 'es',
  content: '',
  tags: '',
  external_links: [],
  price_standard: 19.99,
  price_premium: 49.99,
  price_exclusive: 149.99,
})

const genres = ['R&B','Trap','Drill','Pop','Funk Carioca','Reggaeton','Hip-Hop','Soul','Jazz','Otro']
const languages = [
  { value: 'es', label: '🇪🇸 Español' },
  { value: 'en', label: '🇬🇧 English' },
  { value: 'pt', label: '🇧🇷 Português' },
  { value: 'fr', label: '🇫🇷 Français' },
]

function onCoverChange(e) {
  const file = e.target.files[0]
  if (!file) return
  coverFile.value = file
  coverPreview.value = URL.createObjectURL(file)
}

function onAudioChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 50 * 1024 * 1024) { error.value = 'El audio no puede superar 50MB'; return }
  audioFile.value = file
  audioName.value = file.name
}

function addLink() {
  if (!newLink.value.trim()) return
  try { new URL(newLink.value) } catch { error.value = 'URL no válida'; return }
  form.external_links.push(newLink.value.trim())
  newLink.value = ''
}

function removeLink(i) {
  form.external_links.splice(i, 1)
}

function getLinkIcon(url) {
  if (url.includes('spotify'))    return 'ri-spotify-fill'
  if (url.includes('soundcloud')) return 'ri-soundcloud-fill'
  if (url.includes('youtube'))    return 'ri-youtube-fill'
  return 'ri-link'
}

function nextStep() {
  error.value = null
  if (step.value === 1 && !form.title.trim()) { error.value = 'El título es obligatorio'; return }
  step.value++
}

async function publish() {
  loading.value = true
  error.value = null
  try {
    const lyricData = {
      seller_id:       authStore.user.id,
      seller_name:     authStore.userDisplayName,
      title:           form.title.trim(),
      description:     form.description.trim(),
      genre:           form.genre,
      language:        form.language,
      content:         form.content.trim() || null,
      tags:            form.tags ? form.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [],
      external_links:  JSON.stringify(form.external_links),
      price_standard:  parseFloat(form.price_standard),
      price_premium:   parseFloat(form.price_premium),
      price_exclusive: parseFloat(form.price_exclusive),
      is_published:    true
    }

    const { data, error: err } = await lyricsService.createLyric(lyricData)
    if (err) throw err

    if (coverFile.value) {
      const { url } = await lyricsService.uploadCover(coverFile.value, data.id)
      if (url) await lyricsService.updateLyric(data.id, { cover_url: url })
    }

    if (audioFile.value) {
      const { url, error: audioErr } = await lyricsService.uploadAudio(audioFile.value, data.id)
      if (audioErr) throw audioErr
      if (url) await lyricsService.updateLyric(data.id, { audio_url: url })
    }

    emit('published')
    emit('close')
  } catch (e) {
    error.value = e.message || 'Error al publicar'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="form-box">
    <div class="form-header">
      <h2><i class="ri-folder-music-fill"></i> Nueva canción / letra</h2>
      <button @click="emit('close')">&times;</button>
    </div>

    <!-- Steps -->
    <div class="steps">
      <div :class="['step', { active: step === 1, done: step > 1 }]"><span>1</span> Info</div>
      <div class="step-line"></div>
      <div :class="['step', { active: step === 2, done: step > 2 }]"><span>2</span> Audio & Letra</div>
      <div class="step-line"></div>
      <div :class="['step', { active: step === 3 }]"><span>3</span> Precio</div>
    </div>

    <p v-if="error" class="error-msg"><i class="ri-error-warning-fill"></i> {{ error }}</p>

    <div class="form-body">

      <!-- Step 1: Info básica -->
      <template v-if="step === 1">
        <label class="upload-label">Portada (opcional)</label>
        <label class="cover-dropzone" :class="{ 'has-file': coverPreview }">
          <img v-if="coverPreview" :src="coverPreview" class="cover-preview" />
          <div v-else class="cover-placeholder">
            <i class="ri-image-add-fill"></i>
            <p>Haz clic para subir portada</p>
          </div>
          <input type="file" accept="image/*" @change="onCoverChange" hidden />
        </label>

        <div class="form-group">
          <label>Título *</label>
          <input v-model="form.title" type="text" placeholder="Nombre de la canción" />
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
            <label>Idioma</label>
            <select v-model="form.language">
              <option v-for="l in languages" :key="l.value" :value="l.value">{{ l.label }}</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Descripción</label>
          <textarea v-model="form.description" rows="3" placeholder="Cuéntanos sobre esta canción..."></textarea>
        </div>
        <div class="form-group">
          <label>Tags <span class="hint">(separados por coma)</span></label>
          <input v-model="form.tags" type="text" placeholder="rnb, love, emotional" />
        </div>
      </template>

      <!-- Step 2: Audio, letra y links -->
      <template v-if="step === 2">
        <!-- Audio -->
        <div class="upload-section">
          <label class="upload-label">Audio preview <span class="hint">MP3/WAV · Max 50MB</span></label>
          <label class="audio-dropzone" :class="{ 'has-file': audioFile }">
            <div v-if="audioFile" class="audio-ready">
              <i class="ri-music-2-fill"></i>
              <span>{{ audioName }}</span>
            </div>
            <div v-else class="cover-placeholder">
              <i class="ri-music-add-fill"></i>
              <p>Haz clic para subir audio</p>
            </div>
            <input type="file" accept="audio/mp3,audio/wav,audio/ogg,audio/*" @change="onAudioChange" hidden />
          </label>
        </div>

        <!-- Links externos -->
        <div class="links-section">
          <label class="upload-label">Links externos <span class="hint">Spotify, SoundCloud, YouTube...</span></label>
          <div class="link-input-row">
            <input v-model="newLink" type="url" placeholder="https://open.spotify.com/..." @keyup.enter="addLink" />
            <button class="add-link-btn" @click="addLink">
              <i class="ri-add-fill"></i>
            </button>
          </div>
          <div class="links-list" v-if="form.external_links.length">
            <div v-for="(link, i) in form.external_links" :key="i" class="link-item">
              <i :class="getLinkIcon(link)"></i>
              <span>{{ link.slice(0, 40) }}...</span>
              <button @click="removeLink(i)"><i class="ri-close-fill"></i></button>
            </div>
          </div>
        </div>

        <!-- Letra -->
        <div class="form-group">
          <label>Letra <span class="hint">(opcional — puedes poner solo un fragmento)</span></label>
          <textarea
            v-model="form.content"
            rows="8"
            placeholder="Escribe la letra aquí...&#10;&#10;[Verso 1]&#10;...&#10;&#10;[Coro]&#10;..."
            class="lyric-textarea"
          ></textarea>
        </div>
      </template>

      <!-- Step 3: Precios -->
      <template v-if="step === 3">
        <p class="price-intro">Define cuánto cobras por licenciar esta canción/letra.</p>
        <div class="price-cards">
          <div class="price-card">
            <div class="price-card-header">
              <h4>Standard</h4>
              <p>Uso no exclusivo</p>
            </div>
            <div class="price-input">
              <span>$</span>
              <input v-model="form.price_standard" type="number" min="0" step="0.01" />
            </div>
          </div>
          <div class="price-card premium">
            <div class="price-card-header">
              <h4>Premium</h4>
              <p>Distribución ampliada</p>
            </div>
            <div class="price-input">
              <span>$</span>
              <input v-model="form.price_premium" type="number" min="0" step="0.01" />
            </div>
          </div>
          <div class="price-card exclusive">
            <div class="price-card-header">
              <h4>Exclusiva</h4>
              <p>Derechos completos</p>
            </div>
            <div class="price-input gold">
              <span>$</span>
              <input v-model="form.price_exclusive" type="number" min="0" step="0.01" />
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="form-footer">
      <button v-if="step > 1" class="btn-back" @click="step--">
        <i class="ri-arrow-left-line"></i> Atrás
      </button>
      <div style="flex:1"></div>
      <button v-if="step < 3" class="btn-next" @click="nextStep">
        Siguiente <i class="ri-arrow-right-line"></i>
      </button>
      <button v-if="step === 3" class="btn-publish" @click="publish" :disabled="loading">
        <i class="ri-rocket-fill"></i> {{ loading ? 'Publicando...' : 'Publicar' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.form-box { background: var(--bg-surface, #121212); border: 1px solid var(--border-strong, #333); border-radius: 20px; width: 100%; max-width: 580px; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; }
.form-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border, #222); flex-shrink: 0; }
.form-header h2 { color: var(--text, #fff); font-size: 1.1rem; display: flex; align-items: center; gap: 8px; }
.form-header h2 i { color: #b11db9; }
.form-header button { background: none; border: none; color: var(--text-muted, #aaa); font-size: 1.5rem; cursor: pointer; }

.steps { display: flex; align-items: center; padding: 0.875rem 1.5rem; gap: 0; flex-shrink: 0; }
.step { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--text-muted, #555); white-space: nowrap; }
.step span { width: 22px; height: 22px; border-radius: 50%; background: rgba(255,255,255,0.1); color: var(--text-muted, #555); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; }
.step.active { color: var(--text, #fff); }
.step.active span { background: #b11db9; color: var(--text); }
.step.done span { background: #2ecc71; color: var(--text); }
.step-line { flex: 1; height: 1px; background: rgba(255,255,255,0.1); margin: 0 6px; }

.error-msg { margin: 0 1.5rem; padding: 8px 12px; background: rgba(255,60,60,0.1); border: 1px solid rgba(255,60,60,0.3); border-radius: 8px; color: #ff6b6b; font-size: 0.82rem; display: flex; align-items: center; gap: 6px; }
.form-body { padding: 1rem 1.5rem; flex: 1; }

.upload-label { display: block; font-size: 0.82rem; color: var(--text-muted, #aaa); margin-bottom: 8px; font-weight: 500; }
.hint { color: var(--text-muted, #555); font-size: 0.72rem; font-weight: 400; margin-left: 4px; }

.cover-dropzone { display: flex; align-items: center; justify-content: center; border: 2px dashed rgba(255,255,255,0.15); border-radius: 12px; cursor: pointer; overflow: hidden; margin-bottom: 1rem; min-height: 100px; transition: border-color 0.2s; }
.cover-dropzone:hover { border-color: #b11db9; }
.cover-dropzone.has-file { border-style: solid; border-color: #b11db9; }
.cover-preview { width: 100%; max-height: 130px; object-fit: cover; display: block; }
.cover-placeholder { display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--text-muted, #555); padding: 1.5rem; text-align: center; }
.cover-placeholder i { font-size: 1.8rem; }
.cover-placeholder p { font-size: 0.78rem; }

.audio-dropzone { display: flex; align-items: center; justify-content: center; border: 2px dashed rgba(255,255,255,0.15); border-radius: 12px; cursor: pointer; overflow: hidden; margin-bottom: 1rem; min-height: 72px; transition: border-color 0.2s; }
.audio-dropzone:hover { border-color: #b11db9; }
.audio-dropzone.has-file { border-style: solid; border-color: #2ecc71; }
.audio-ready { display: flex; align-items: center; gap: 10px; color: #2ecc71; padding: 1rem; }
.audio-ready i { font-size: 1.5rem; }
.audio-ready span { font-size: 0.82rem; }

.links-section { margin-bottom: 1rem; }
.link-input-row { display: flex; gap: 8px; margin-bottom: 8px; }
.link-input-row input { flex: 1; }
.add-link-btn { width: 38px; height: 38px; border-radius: 10px; background: #b11db9; border: none; color: var(--text); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
.links-list { display: flex; flex-direction: column; gap: 5px; }
.link-item { display: flex; align-items: center; gap: 8px; background: var(--bg-card); border-radius: 8px; padding: 6px 10px; font-size: 0.78rem; color: var(--text-soft, #ccc); }
.link-item i { color: #b11db9; }
.link-item span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.link-item button { background: none; border: none; color: var(--text-muted, #888); cursor: pointer; font-size: 0.9rem; display: flex; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.form-group { margin-bottom: 0.875rem; }
.form-group label { display: block; font-size: 0.82rem; color: var(--text-muted, #aaa); margin-bottom: 5px; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.65rem 0.85rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; color: var(--text, #fff); font-size: 0.875rem; outline: none; box-sizing: border-box; resize: vertical; transition: border-color 0.2s; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #b11db9; }
.form-group select option { background: #1a1a1d; }
.lyric-textarea { font-family: 'Poppins', sans-serif; line-height: 1.7; }

.price-intro { color: var(--text-muted, #888); font-size: 0.82rem; margin-bottom: 1rem; }
.price-cards { display: flex; flex-direction: column; gap: 0.75rem; }
.price-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 0.875rem 1rem; display: flex; justify-content: space-between; align-items: center; }
.price-card.premium { border-left: 3px solid #b11db9; }
.price-card.exclusive { border-left: 3px solid #ffd700; }
.price-card-header h4 { color: var(--text, #fff); font-size: 0.875rem; margin-bottom: 2px; }
.price-card-header p { color: var(--text-muted, #666); font-size: 0.72rem; }
.price-input { display: flex; align-items: center; gap: 5px; background: var(--input-bg); border: 1px solid var(--border); border-radius: 8px; padding: 5px 10px; }
.price-input span { color: var(--text-muted, #888); font-size: 0.875rem; }
.price-input.gold span { color: #ffd700; }
.price-input input { background: transparent; border: none; color: var(--text, #fff); font-size: 0.95rem; font-weight: 600; width: 70px; outline: none; text-align: right; }

.form-footer { display: flex; align-items: center; padding: 0.875rem 1.5rem; border-top: 1px solid var(--border, #222); gap: 8px; flex-shrink: 0; }
.btn-back { display: flex; align-items: center; gap: 5px; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: var(--text-muted, #aaa); padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 0.82rem; }
.btn-next { display: flex; align-items: center; gap: 5px; background: rgba(177,29,185,0.15); border: 1px solid #b11db9; color: #b11db9; padding: 8px 18px; border-radius: 20px; cursor: pointer; font-size: 0.82rem; font-weight: 600; }
.btn-next:hover { background: #b11db9; color: var(--text); }
.btn-publish { display: flex; align-items: center; gap: 6px; background: #b11db9; color: var(--text); border: none; padding: 8px 20px; border-radius: 20px; font-size: 0.875rem; font-weight: 700; cursor: pointer; }
.btn-publish:hover:not(:disabled) { background: #9a18a3; }
.btn-publish:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
