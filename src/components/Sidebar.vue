<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Cada item tiene `requiresAuth`. Si es true, solo se muestra cuando hay sesión.
const allNavItems = [
  { to: '/',               icon: 'ri-home-smile-2-fill',  label: 'Home',      requiresAuth: false },
  { to: '/sound',          icon: 'ri-music-2-fill',       label: 'Sounds',    requiresAuth: false },
  { to: '/lyrics',         icon: 'ri-folder-music-fill',  label: 'Lyrics',    requiresAuth: false },
  { to: '/musicians',      icon: 'ri-disc-fill',          label: 'Musicians', requiresAuth: false },
  { to: '/graphic-design', icon: 'ri-brush-fill',         label: 'Graphic',   requiresAuth: false },
  { to: '/film-makers',    icon: 'ri-clapperboard-fill',  label: 'Film',      requiresAuth: false },
  { to: '/chat',           icon: 'ri-chat-3-fill',        label: 'Messages',  requiresAuth: true  },
  { to: '/configuration',  icon: 'ri-settings-3-fill',    label: 'Config',    requiresAuth: true  },
]

const allMobileItems = [
  { to: '/',               icon: 'ri-home-smile-2-fill', label: 'Home',    requiresAuth: false },
  { to: '/sound',          icon: 'ri-music-2-fill',      label: 'Sounds',  requiresAuth: false },
  { to: '/musicians',      icon: 'ri-disc-fill',         label: 'Artists', requiresAuth: false },
  { to: '/graphic-design', icon: 'ri-brush-fill',        label: 'Graphic', requiresAuth: false },
  { to: '/chat',           icon: 'ri-chat-3-fill',       label: 'Chat',    requiresAuth: true  },
]

// Filtra los items según la sesión actual
const navItems = computed(() =>
  allNavItems.filter(i => !i.requiresAuth || authStore.isAuthenticated)
)
const mobileItems = computed(() =>
  allMobileItems.filter(i => !i.requiresAuth || authStore.isAuthenticated)
)
</script>

<template>
  <!-- ── Desktop sidebar ─────────────────────────── -->
  <aside class="sidebar">
    <!-- Logo -->
    <div class="sidebar-logo">
      <img src="/assets/letmc.png" alt="LetMC" class="logo-full" />
      <img src="/assets/letmc.png" alt="LetMC" class="logo-mini" />
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        active-class="active"
        class="nav-item"
      >
        <span class="nav-icon"><i :class="item.icon"></i></span>
        <span class="nav-label">{{ item.label }}</span>
      </router-link>
    </nav>

    <!-- Perfil de usuario — al fondo, con foto real -->
    <router-link
      v-if="authStore.isAuthenticated"
      to="/profile"
      active-class="active"
      class="nav-item profile-bottom"
    >
      <span class="nav-icon">
        <img
          v-if="authStore.avatarUrl"
          :src="authStore.avatarUrl"
          class="sidebar-avatar"
          :alt="authStore.userDisplayName"
        />
        <span v-else class="sidebar-avatar-placeholder">
          {{ authStore.userDisplayName.charAt(0).toUpperCase() }}
        </span>
      </span>
      <span class="nav-label">{{ authStore.userDisplayName }}</span>
    </router-link>
  </aside>

  <!-- ── Mobile bottom nav ───────────────────────── -->
  <nav class="mobile-nav">
    <router-link
      v-for="item in mobileItems"
      :key="item.to"
      :to="item.to"
      active-class="active"
      class="mobile-nav-item"
    >
      <i :class="item.icon"></i>
      <span>{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
/* ── Desktop sidebar ─────────────────────────────── */
.sidebar {
  position: fixed;
  top: 0; left: 0;
  width: 72px;
  height: 100vh;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  z-index: 1600;
  overflow: hidden;
  transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar:hover {
  width: 220px;
}

/* Logo */
.sidebar-logo {
  height: 72px;
  display: flex;
  align-items: center;
  padding: 0 18px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
  overflow: hidden;
}
.logo-full {
  width: 110px;
  object-fit: contain;
  opacity: 0;
  position: absolute;
  left: 18px;
  transition: opacity 0.2s ease;
  pointer-events: none;
}
.logo-mini {
  width: 36px;
  height: 36px;
  object-fit: contain;
  border-radius: 8px;
  flex-shrink: 0;
  transition: opacity 0.2s ease;
}
.sidebar:hover .logo-mini { opacity: 0; }
.sidebar:hover .logo-full { opacity: 1; }

/* Nav */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 0;
}
.sidebar-nav::-webkit-scrollbar { width: 0; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  height: 48px;
  color: var(--text-muted);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  position: relative;
  border-radius: 0;
}
.nav-item:hover {
  background: var(--accent-light);
  color: var(--text);
}
.nav-item.active {
  background: var(--accent-light);
  color: var(--accent);
  border-right: 3px solid var(--accent);
}

.nav-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.nav-icon i {
  font-size: 20px;
  margin: 0;
  color: inherit;
}

.nav-label {
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0;
  transition: opacity 0.15s ease;
  overflow: hidden;
}
.sidebar:hover .nav-label { opacity: 1; }

/* Perfil al fondo */
.profile-bottom {
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  height: 60px;
}
.sidebar-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #b11db9;
  display: block;
}
.sidebar-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #b11db9, #7b2cbf);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

/* Nombre del perfil al expandir sidebar */
.sidebar:hover .profile-bottom .nav-label { opacity: 1; }

/* Light theme sidebar */
:global(body.light-theme) .sidebar {
  background: var(--bg-sidebar);
  border-color: rgba(255,255,255,0.08);
}
/* Los overrides de light-theme están en src/assets/main.css */

/* ── Mobile bottom nav ─────────────────────────────── */
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 60px;
  background: var(--bg-sidebar);
  border-top: 1px solid var(--border);
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}
.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 3px;
  color: rgba(255,255,255,0.5);
  text-decoration: none;
  font-size: 0.6rem;
  font-weight: 500;
  transition: color 0.2s;
  height: 100%;
  letter-spacing: 0.3px;
}
.mobile-nav-item i {
  font-size: 1.25rem;
  margin: 0;
  color: inherit;
}
.mobile-nav-item.active {
  color: #b11db9;
}
.mobile-nav-item span { color: inherit; }

@media (max-width: 768px) {
  .sidebar { display: none; }
  .mobile-nav { display: flex; }
}
</style>
