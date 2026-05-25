<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { graphicService } from '@/services/graphic'
import CollaboratorsInput from '@/components/CollaboratorsInput.vue'

const emit = defineEmits(['close', 'published'])
const authStore = useAuthStore()
const loading = ref(false)
const error = ref(null)
const coverPreview = ref(null)
const coverFile = ref(null)

const form = reactive({
  title: '',
  description: '',
  style: '',
  tags: '',
  price: 49.99,
  collaborators: { platform: [], external: [] },
})

const styles = ['Dark / Minimal', 'R&B / Smooth', 'Branding / Logo', 'Social Media', 'Trap / Urban', 'Pop / Colorful', 'Otro']

function onCoverChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) { error.value = 'La imagen no puede superar 10MB'; return }
  coverFile.value = file
  coverPreview.value = URL.createObjectURL(file)
}

async function publish() {
  if (!form.title.trim()) { error.value = 'El título es obligatorio'; return }
  if (!coverFile.value) { error.value = 'La imagen es obligatoria'; return }
  loading.value = true
  error.value = null
  try {
    const designData = {
      seller_id: authStore.user.id,
      seller_name: authStore.userDisplayName,
      title: form.title.trim(),
      description: form.description.trim(),
      style: form.style,
      tags: form.tags ? form.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [],
      collaborators: form.collaborators,
      price: parseFloat(form.price),
      is_published: true
    }

    const { data, error: err } = await graphicService.createDesign(designData)
    if (err) throw err

    if (coverFile.value) {
      const { url } = await graphicService.uploadCover(coverFile.value, data.id)
      if (url) {
        await import('@/services/supabase').then(({ supabase }) =>
          supabase.from('graphic_design').update({ cover_url: url }).eq('id', data.id)
        )
      }
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
      <h2><i class="ri-brush-fill"></i> Nuevo diseño</h2>
      <button @click="emit('close')">&times;</button>
    </div>

    <p v-if="error" class="error-msg"><i class="ri-error-warning-fill"></i> {{ error }}</p>

    <div class="form-body">
      <!-- Imagen (obligatoria) -->
      <label class="upload-label">Imagen del diseño *</label>
      <label class="cover-dropzone" :class="{ 'has-file': coverPreview }">
        <img v-if="coverPreview" :src="coverPreview" class="cover-preview" />
        <div v-else class="cover-placeholder">
          <i class="ri-image-add-fill"></i>
          <p>Haz clic para subir imagen (JPG/PNG · Max 10MB)</p>
        </div>
        <input type="file" accept="image/*" @change="onCoverChange" hidden />
      </label>

      <div class="form-group">
        <label>Título *</label>
        <input v-model="form.title" type="text" placeholder="Nombre del diseño" />
      </div>
      <div class="form-group">
        <label>Estilo</label>
        <select v-model="form.style">
          <option value="">Seleccionar...</option>
          <option v-for="s in styles" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>Descripción</label>
        <textarea v-model="form.description" rows="3" placeholder="Describe tu trabajo..."></textarea>
      </div>
      <div class="form-group">
        <label>Tags <span class="hint">(separados por coma)</span></label>
        <input v-model="form.tags" type="text" placeholder="dark, minimal, cover" />
      </div>
      <div class="form-group">
        <label>Precio base ($)</label>
        <input v-model="form.price" type="number" min="0" step="0.01" />
      </div>

      <CollaboratorsInput v-model="form.collaborators" />
    </div>

    <div class="form-footer">
      <button class="btn-cancel" @click="emit('close')">Cancelar</button>
      <button class="btn-publish" @click="publish" :disabled="loading">
        <i class="ri-rocket-fill"></i> {{ loading ? 'Publicando...' : 'Publicar diseño' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.form-box { background: #121212; border: 1px solid #333; border-radius: 20px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; }
.form-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #222; }
.form-header h2 { color: var(--text); font-size: 1.2rem; display: flex; align-items: center; gap: 8px; }
.form-header h2 i { color: #b11db9; }
.form-header button { background: none; border: none; color: var(--text-muted); font-size: 1.5rem; cursor: pointer; }
.error-msg { margin: 0.75rem 1.5rem; padding: 8px 12px; background: rgba(255,60,60,0.1); border: 1px solid rgba(255,60,60,0.3); border-radius: 8px; color: #ff6b6b; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; }
.form-body { padding: 1.25rem 1.5rem; flex: 1; }
.upload-label { display: block; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 8px; }
.cover-dropzone { display: block; border: 2px dashed rgba(255,255,255,0.15); border-radius: 12px; cursor: pointer; overflow: hidden; margin-bottom: 1rem; min-height: 180px; display: flex; align-items: center; justify-content: center; transition: border-color 0.2s; }
.cover-dropzone:hover { border-color: #b11db9; }
.cover-dropzone.has-file { border-style: solid; border-color: #b11db9; }
.cover-preview { width: 100%; max-height: 220px; object-fit: cover; display: block; }
.cover-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-muted); padding: 2rem; text-align: center; }
.cover-placeholder i { font-size: 2.5rem; }
.cover-placeholder p { font-size: 0.82rem; }
.form-group { margin-bottom: 0.875rem; }
.form-group label { display: block; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 5px; }
.hint { color: var(--text-muted); font-size: 0.75rem; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.65rem 0.85rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 0.9rem; outline: none; box-sizing: border-box; resize: vertical; transition: border-color 0.2s; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #b11db9; }
.form-group select option { background: #1a1a1d; }
.form-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 1rem 1.5rem; border-top: 1px solid #222; }
.btn-cancel { background: transparent; border: 1px solid #444; color: var(--text-muted); padding: 8px 18px; border-radius: 20px; cursor: pointer; font-size: 0.875rem; }
.btn-cancel:hover { border-color: var(--text); color: var(--text); }
.btn-publish { display: flex; align-items: center; gap: 6px; background: #b11db9; color: var(--text); border: none; padding: 8px 20px; border-radius: 20px; font-size: 0.875rem; font-weight: 700; cursor: pointer; transition: background 0.2s; }
.btn-publish:hover:not(:disabled) { background: #9a18a3; }
.btn-publish:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
