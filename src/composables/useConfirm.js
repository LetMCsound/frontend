import { ref } from 'vue'

/**
 * Composable para mostrar diálogos de confirmación bonitos (en vez del confirm() nativo).
 *
 * Uso:
 *   import { confirmDialog } from '@/composables/useConfirm'
 *
 *   const ok = await confirmDialog({
 *     title: 'Eliminar comentario',
 *     message: '¿Seguro que quieres eliminarlo?',
 *     confirmText: 'Eliminar',
 *     danger: true
 *   })
 *   if (ok) { ...borrar... }
 *
 * Requiere que <ConfirmDialog /> esté montado una sola vez en App.vue.
 */

const state = ref({
  open: false,
  title: '',
  message: '',
  confirmText: 'Aceptar',
  cancelText: 'Cancelar',
  danger: false,
  resolve: null
})

export function useConfirmState() {
  return state
}

export function confirmDialog(options = {}) {
  return new Promise((resolve) => {
    state.value = {
      open: true,
      title: options.title || 'Confirmar',
      message: options.message || '¿Estás seguro?',
      confirmText: options.confirmText || 'Aceptar',
      cancelText: options.cancelText || 'Cancelar',
      danger: options.danger ?? false,
      resolve
    }
  })
}

export function closeConfirm(result) {
  if (state.value.resolve) state.value.resolve(result)
  state.value.open = false
  state.value.resolve = null
}
