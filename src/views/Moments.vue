<template>
  <div class="max-w-[720px] mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-[28px] font-bold tracking-tight mb-2">朋友圈</h1>
      <p class="text-[var(--text-soft)] text-[15px]">我关注的其他博主，点击即可跳转访问</p>
    </div>

    <div v-if="loading" class="text-[var(--text-faint)] py-10 text-center">加载中…</div>

    <div v-else-if="friends.length === 0" class="text-[var(--text-faint)] py-10 text-center">
      还没有添加博主，去后台「朋友管理」添加吧
    </div>

    <ul v-else class="space-y-3">
      <li
        v-for="f in friends"
        :key="f.id"
        class="friend-item group rounded-xl px-5 py-4 flex items-center justify-between transition hover:border-[var(--accent)] hover:shadow-sm"
        style="border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow), var(--glass-highlight);"
      >
        <div class="min-w-0">
          <a
            :href="f.blogUrl || '#'"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[17px] font-medium text-[var(--text)] no-underline break-all group-hover:text-[var(--accent)]"
          >
            {{ f.name || '未命名博主' }}
          </a>
          <p v-if="f.blogUrl" class="text-[13px] text-[var(--text-faint)] mt-1 break-all">{{ f.blogUrl }}</p>
        </div>
        <span class="text-[var(--text-faint)] text-[18px] ml-4 shrink-0 group-hover:text-[var(--accent)]">↗</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { loadFriends } from '../utils/storage'

const friends = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    friends.value = await loadFriends()
  } catch (e) {
    console.error('加载朋友列表失败:', e)
  } finally {
    loading.value = false
  }
})
</script>
