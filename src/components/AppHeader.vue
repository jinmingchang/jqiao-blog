<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authState, logout } from '../utils/auth.js'

const props = defineProps({
  theme: { type: String, default: 'light' },
})
const emit = defineEmits(['toggle-theme'])

const router = useRouter()
const route = useRoute()

const baseNavItems = [
  { path: '/', label: '文章', segment: '' },
  { path: '/moments', label: '朋友圈', segment: 'moments' },
  { path: '/about', label: '关于我', segment: 'about' },
]

const adminItem = { path: '/admin', label: '管理', segment: 'admin' }

const navItems = computed(() => {
  return authState.isAuthed ? [...baseNavItems, adminItem] : baseNavItems
})

const activeSegment = computed(() => {
  if (route.path.startsWith('/admin')) return 'admin'
  if (route.path.startsWith('/moments')) return 'moments'
  if (route.path === '/about') return 'about'
  return ''
})

function navigate(path) {
  router.push(path)
}

function handleLogout() {
  logout()
  if (route.path.startsWith('/admin')) {
    router.push('/')
  }
}
</script>

<template>
  <header
    class="sticky top-0 z-100 glass"
    style="border-radius: 0; border-left: none; border-right: none; border-top: none;"
  >
    <div class="max-w-[720px] mx-auto px-5 h-14 flex items-center justify-between">
        <a
          href="#/"
          class="text-xl font-bold text-[var(--text)] tracking-tight no-underline hover:text-[var(--accent)] transition-colors duration-200"
          @click.prevent="navigate('/')"
        >
          JQiao's Blog
        </a>
        <nav class="flex gap-6 items-center">
          <a
            v-for="item in navItems"
            :key="item.path"
            :href="'#' + item.path"
            class="relative text-[15px] text-[var(--text-soft)] no-underline transition-colors duration-200 hover:text-[var(--text)]"
            :class="{ '!text-[var(--text)] active-nav': activeSegment === item.segment }"
            @click.prevent="navigate(item.path)"
          >
            {{ item.label }}
          </a>
          <span
            v-if="authState.isAuthed"
            class="text-[13px] text-[var(--text-faint)] cursor-pointer hover:text-[#e74c3c] transition-colors duration-200 select-none"
            @click="handleLogout"
          >退出</span>
          <!-- 主题切换 -->
          <button
            class="theme-toggle"
            :title="theme === 'dark' ? '切换到明亮模式' : '切换到暗黑模式'"
            @click="emit('toggle-theme')"
          >
            <svg v-if="theme === 'dark'" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
            <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </button>
        </nav>
    </div>
  </header>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 50%;
  border: 1px solid var(--glass-border-soft);
  background: var(--glass-bg-strong);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  color: var(--text-soft);
  cursor: pointer;
  transition: all 0.25s ease;
}
.theme-toggle:hover {
  color: var(--accent);
  border-color: var(--accent);
  transform: translateY(-1px);
}
.active-nav::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
}
</style>
