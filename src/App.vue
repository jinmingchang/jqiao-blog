<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import { authState, login } from './utils/auth.js'

const router = useRouter()

// 密码输入
const password = ref('')
const loginError = ref('')
const loginLoading = ref(false)

// 监听弹窗关闭时清空输入
watch(() => authState.showLogin, (v) => {
  if (!v) {
    password.value = ''
    loginError.value = ''
  }
})

async function handleLogin() {
  loginError.value = ''
  if (!password.value.trim()) {
    loginError.value = '请输入密码'
    return
  }
  loginLoading.value = true
  // 模拟异步以展示加载状态
  await new Promise(r => setTimeout(r, 300))
  const ok = login(password.value.trim())
  loginLoading.value = false
  if (ok) {
    // 登录成功，跳转到待访问的管理页面
    router.push(authState.pendingPath || '/admin')
    authState.pendingPath = null
  } else {
    loginError.value = '密码错误，请重试'
    password.value = ''
  }
}

function handleClose() {
  authState.showLogin = false
  authState.pendingPath = null
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#fdfdfd] text-[#2c2c2c] leading-relaxed antialiased">
    <AppHeader />
    <main class="flex-1 max-w-[720px] mx-auto px-5 py-10 pb-20 w-full">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <AppFooter />

    <!-- 管理后台登录弹窗 -->
    <el-dialog
      v-model="authState.showLogin"
      title="管理后台登录"
      width="380px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      align-center
      @close="handleClose"
    >
      <div class="flex flex-col gap-4 py-2">
        <p class="text-[14px] text-[#6b6b6b] m-0">请输入管理密码以继续访问</p>
        <el-input
          v-model="password"
          type="password"
          placeholder="请输入管理密码"
          show-password
          size="large"
          @keyup.enter="handleLogin"
        />
        <p v-if="loginError" class="text-[13px] text-[#e74c3c] m-0">{{ loginError }}</p>
      </div>
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loginLoading" @click="handleLogin">确认登录</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style>
:root {
  --el-color-primary: #4a90d9;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
