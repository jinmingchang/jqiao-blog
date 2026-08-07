<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authState, logout } from '../utils/auth.js'

const router = useRouter()
const route = useRoute()

const baseNavItems = [
  { path: '/', label: '文章', segment: '' },
  { path: '/about', label: '关于我', segment: 'about' },
]

const adminItem = { path: '/admin', label: '管理', segment: 'admin' }

const navItems = computed(() => {
  return authState.isAuthed ? [...baseNavItems, adminItem] : baseNavItems
})

const activeSegment = computed(() => {
  if (route.path.startsWith('/admin')) return 'admin'
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
    class="sticky top-0 z-100 bg-[#fdfdfd]/85 backdrop-blur-md border-b border-[#eaeaea]"
  >
    <div class="max-w-[720px] mx-auto px-5 h-14 flex items-center justify-between">
      <a
        href="#/"
        class="text-xl font-bold text-[#2c2c2c] tracking-tight no-underline hover:text-[#4a90d9] transition-colors duration-200"
        @click.prevent="navigate('/')"
      >
        My Blog
      </a>
      <nav class="flex gap-6 items-center">
        <a
          v-for="item in navItems"
          :key="item.path"
          :href="'#' + item.path"
          class="relative text-[15px] text-[#6b6b6b] no-underline transition-colors duration-200 hover:text-[#2c2c2c]"
          :class="{ '!text-[#2c2c2c] active-nav': activeSegment === item.segment }"
          @click.prevent="navigate(item.path)"
        >
          {{ item.label }}
        </a>
        <span
          v-if="authState.isAuthed"
          class="text-[13px] text-[#999] cursor-pointer hover:text-[#e74c3c] transition-colors duration-200 select-none"
          @click="handleLogout"
        >退出</span>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.active-nav::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #4a90d9;
}
</style>
