import { ref, computed } from 'vue'
import { beatsService } from '@/services/beats'

/**
 * Composable para gestionar beats de forma reactiva.
 *
 * Uso básico (todos los beats):
 *   const { beats, loading, error, fetchBeats } = useBeats()
 *   onMounted(fetchBeats)
 *
 * Beats de un artista:
 *   const { beats, fetchBySeller } = useBeats()
 *   onMounted(() => fetchBySeller(sellerId))
 *
 * Con filtros:
 *   fetchBeats({ type: 'Beat', genre: 'Drill' })
 */
export function useBeats() {
  const beats    = ref([])
  const popular  = ref([])
  const loading  = ref(false)
  const error    = ref(null)

  // ── Helpers ────────────────────────────────────────────────
  /**
   * Formatea el número de likes para mostrarlo compacto (2300 → "2.3k")
   */
  function formatLikes(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M'
    if (n >= 1_000)     return (n / 1_000).toFixed(1).replace('.0', '') + 'k'
    return String(n)
  }

  /**
   * Normaliza un beat de la BD al formato que esperan los componentes.
   * Hace de "traductor" entre la BD y la UI, así si cambia la BD
   * solo hay que tocar aquí.
   */
  function normalizeBeat(raw) {
    return {
      id:              raw.id,
      title:           raw.title,
      description:     raw.description ?? '',
      genre:           raw.genre ?? '',
      type:            raw.type ?? 'Beat',
      likes:           formatLikes(raw.likes ?? 0),
      plays:           raw.plays ?? 0,
      coverUrl:        raw.cover_url ?? '/assets/kairoportada1.jpg',
      audioSrc:        raw.audio_preview_url ?? null,
      bpm:             raw.bpm ?? '—',
      key:             raw.key ?? '—',
      scale:           raw.scale ?? '—',
      date:            raw.release_date ?? '—',
      sellerName:      raw.seller_name ?? 'Unknown Artist',
      sellerId:        raw.seller_id,
      tags:            raw.tags ?? [],
      priceStandard:   raw.price_standard  ?? 29.99,
      pricePremium:    raw.price_premium   ?? 79.99,
      priceExclusive:  raw.price_exclusive ?? 199.99,
    }
  }

  // ── Acciones ───────────────────────────────────────────────

  /**
   * Cargar todos los beats publicados (con filtros opcionales).
   */
  async function fetchBeats(filters = {}) {
    loading.value = true
    error.value   = null
    try {
      const { data, error: err } = await beatsService.getBeats(filters)
      if (err) throw err
      beats.value = (data ?? []).map(normalizeBeat)
    } catch (e) {
      error.value = e.message
      console.error('[useBeats] fetchBeats error:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Cargar los beats más populares.
   */
  async function fetchPopular(limit = 8) {
    loading.value = true
    error.value   = null
    try {
      const { data, error: err } = await beatsService.getPopular(limit)
      if (err) throw err
      popular.value = (data ?? []).map(normalizeBeat)
    } catch (e) {
      error.value = e.message
      console.error('[useBeats] fetchPopular error:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Cargar los beats de un vendedor concreto.
   */
  async function fetchBySeller(sellerId) {
    loading.value = true
    error.value   = null
    try {
      const { data, error: err } = await beatsService.getBeatsBySeller(sellerId)
      if (err) throw err
      beats.value = (data ?? []).map(normalizeBeat)
    } catch (e) {
      error.value = e.message
      console.error('[useBeats] fetchBySeller error:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Buscar beats por texto.
   */
  async function searchBeats(query) {
    if (!query?.trim()) return fetchBeats()
    loading.value = true
    error.value   = null
    try {
      const { data, error: err } = await beatsService.searchBeats(query)
      if (err) throw err
      beats.value = (data ?? []).map(normalizeBeat)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // ── Computeds ──────────────────────────────────────────────
  const isEmpty    = computed(() => !loading.value && beats.value.length === 0)
  const beatCount  = computed(() => beats.value.length)

  return {
    // State
    beats,
    popular,
    loading,
    error,
    // Computed
    isEmpty,
    beatCount,
    // Actions
    fetchBeats,
    fetchPopular,
    fetchBySeller,
    searchBeats,
  }
}
