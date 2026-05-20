import { ref } from 'vue'

const theme = ref(localStorage.getItem('letmc-theme') || 'dark')

function applyTheme(t) {
  theme.value = t
  localStorage.setItem('letmc-theme', t)
  document.body.classList.remove('light-theme', 'dark-theme')
  document.body.classList.add(t === 'light' ? 'light-theme' : 'dark-theme')
}

function toggleTheme() {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}

// Apply on init
applyTheme(theme.value)

export function useTheme() {
  return { theme, applyTheme, toggleTheme }
}
