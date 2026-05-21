<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const showRegister = ref(false)
const form = ref({ email: '', password: '' })
const errorMessage = ref('')
const loading = ref(false)
const showTransition = ref(false)
const showPassword = ref(false)

function toggleMode() {
  showRegister.value = !showRegister.value
  errorMessage.value = ''
  form.value = { email: '', password: '' }
}

async function handleSubmit() {
  loading.value = true
  errorMessage.value = ''
  try {
    if (showRegister.value) {
      await authStore.register(form.value.email, form.value.password)
      alert('Registro exitoso. Por favor verifica tu correo electrónico.')
      toggleMode()
    } else {
      await authStore.login(form.value.email, form.value.password)
      showTransition.value = true
    }
  } catch (err) {
    errorMessage.value = err.message || 'Error de conexión'
  } finally {
    loading.value = false
  }
}

function enterProfile() {
  showTransition.value = false
}
</script>

<template>
  <div>
    <!-- Login / Register Form -->
    <div class="auth-container">
      <div class="auth-box">
        <h2 class="auth-title">{{ showRegister ? 'Crear Cuenta' : 'Bienvenido' }}</h2>

        <form @submit.prevent="handleSubmit" class="auth-form">
          <div class="input-group">
            <label>Correo electrónico</label>
            <input type="email" v-model="form.email" required placeholder="tu@email.com" />
          </div>
          <div class="input-group">
            <label>Contraseña</label>
            <div class="password-wrapper">
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="form.password"
                required
                placeholder="Tu contraseña"
              />
              <i
                :class="showPassword ? 'ri-eye-line' : 'ri-eye-off-line'"
                @click="showPassword = !showPassword"
                :title="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              ></i>
            </div>
            <p v-if="showRegister" class="password-hint">
              Mínimo 8 caracteres, 1 Mayúscula, 1 Número, 1 Símbolo
            </p>
          </div>

          <button type="submit" class="auth-btn" :disabled="loading">
            {{ loading ? 'Cargando...' : (showRegister ? 'Registrarse' : 'Entrar') }}
          </button>
        </form>

        <p class="error-msg" v-if="errorMessage">{{ errorMessage }}</p>

        <div class="toggle-auth">
          <p>
            {{ showRegister ? '¿Ya tienes cuenta?' : '¿Nuevo en LetMC?' }}
            <span @click="toggleMode">{{ showRegister ? 'Inicia Sesión' : 'Regístrate' }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Transition modal after login -->
    <div v-if="showTransition" class="modal-overlay transition-modal">
      <div class="transition-modal-content">
        <div class="transition-icon"><i class="ri-user-follow-fill"></i></div>
        <h2 class="transition-title">¡Bienvenido!</h2>
        <p class="transition-message">
          Has iniciado sesión como <strong>{{ authStore.userDisplayName }}</strong>
        </p>
        <p class="transition-submessage">Preparando tu espacio de trabajo...</p>
        <div class="transition-progress"><div class="progress-bar"></div></div>
        <button @click="enterProfile" class="transition-btn">Entrar al Perfil</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  padding: 2rem;
  min-height: calc(100vh - 80px);
  display: flex;
  justify-content: center;
  align-items: center;
}
.auth-box {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
}
.auth-title { margin-bottom: 1.5rem; font-family: 'Impact', sans-serif; letter-spacing: 1px; font-size: 2rem; color: var(--text); }
.input-group { margin-bottom: 1rem; }
.input-group label { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-muted); }
.input-group input {
  width: 100%; padding: 0.75rem;
  background: rgba(0,0,0,0.3); border: 1px solid var(--border);
  border-radius: 8px; color: var(--text); font-size: 1rem; box-sizing: border-box;
}
.input-group input:focus { outline: none; border-color: #b11db9; }
.password-hint { font-size: 0.75rem; color: var(--text-muted); margin-top: 5px; }

/* Ojo para ver/ocultar contraseña */
.password-wrapper { position: relative; }
.password-wrapper input { padding-right: 2.75rem; }
.password-wrapper i {
  position: absolute;
  right: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: var(--text-muted, #aaa);
  font-size: 1.15rem;
  transition: color 0.2s;
  user-select: none;
}
.password-wrapper i:hover { color: #b11db9; }
.auth-btn {
  width: 100%; padding: 0.75rem 1.5rem;
  background: #b11db9; color: white; border: none;
  border-radius: 8px; font-size: 1rem; font-weight: bold;
  cursor: pointer; margin-top: 0.5rem; transition: background 0.2s, transform 0.2s;
}
.auth-btn:hover:not(:disabled) { background: #9a18a3; transform: translateY(-2px); }
.auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.toggle-auth { margin-top: 1rem; font-size: 0.9rem; }
.toggle-auth span { color: #b11db9; cursor: pointer; font-weight: bold; margin-left: 5px; }
.error-msg { color: #ff4d4d; margin-top: 1rem; font-size: 0.9rem; }

/* Transition Modal */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);
  z-index: 2000; display: flex; justify-content: center; align-items: center; padding: 20px;
}
.transition-modal-content {
  background: linear-gradient(145deg, #1a1a1d 0%, #0b0b0f 100%);
  padding: 50px 60px; border-radius: 20px; text-align: center;
  border: 1px solid #b11db9; box-shadow: 0 0 60px rgba(177,29,185,0.3);
  max-width: 450px; width: 100%; animation: modalPopIn 0.4s ease;
}
@keyframes modalPopIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.transition-icon { font-size: 4rem; color: #b11db9; margin-bottom: 20px; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
.transition-title { font-family: 'Impact', sans-serif; color: var(--text); font-size: 2rem; margin-bottom: 15px; }
.transition-message { color: var(--text-soft); font-size: 1.1rem; margin-bottom: 10px; }
.transition-message strong { color: #b11db9; }
.transition-submessage { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 25px; }
.transition-progress { width: 100%; height: 4px; background: #333; border-radius: 2px; margin-bottom: 30px; overflow: hidden; }
.progress-bar { height: 100%; width: 30%; background: linear-gradient(90deg, #b11db9, #ff6b6b); border-radius: 2px; animation: loading 1.5s ease-in-out infinite; }
@keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }
.transition-btn {
  background: linear-gradient(135deg, #b11db9, #8b1589);
  color: white; border: none; padding: 15px 40px;
  border-radius: 30px; font-size: 1.1rem; font-weight: bold;
  cursor: pointer; transition: all 0.3s; text-transform: uppercase;
}
.transition-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(177,29,185,0.4); }

@media (max-width: 768px) {
  .transition-modal-content { padding: 40px 25px; }
  .transition-title { font-size: 1.5rem; }
}
</style>
