<script setup>
import { ref, onMounted } from 'vue'
import { loadFriends } from '../utils/storage'
import { fetchAllLatest } from '../utils/feed'
import { ElMessage } from 'element-plus'

const loading = ref(true)
const moments = ref([])

async function load() {
  loading.value = true
  try {
    const friends = await loadFriends()
    if (!friends.length) {
      moments.value = []
      return
    }
    moments.value = await fetchAllLatest(friends)
  } catch (e) {
    console.error(e)
    ElMessage.error('加载朋友圈失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)

function formatDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('zh-CN')
  } catch {
    return d
  }
}
</script>

<template>
  <div class="max-w-[760px] mx-auto px-5 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-[28px] font-bold tracking-tight">朋友圈</h1>
      <el-button text @click="load" :loading="loading">刷新</el-button>
    </div>

    <div v-if="loading" class="text-center py-15 text-[#999]">加载中...</div>

    <div v-else-if="!moments.length" class="text-center py-15 text-[#999]">
      <div class="text-5xl mb-3">🌐</div>
      <p class="text-[15px]">还没有关注任何博主，去管理后台添加吧</p>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div
        v-for="m in moments"
        :key="m.id"
        class="rounded-xl border border-[#eaeaea] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      >
        <!-- 博主信息 -->
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-full bg-[#4a90d9] text-white flex items-center justify-center font-bold">
            {{ m.name.charAt(0) }}
          </div>
          <div class="flex-1 min-w-0">
            <a
              :href="m.blogUrl"
              target="_blank"
              rel="noopener"
              class="font-semibold text-[#2c2c2c] no-underline hover:text-[#4a90d9] truncate block"
            >{{ m.name }}</a>
            <span class="text-[12px] text-[#999]">最新动态</span>
          </div>
        </div>

        <!-- 最新一条博客 -->
        <template v-if="m.latest">
          <a
            :href="m.latest.link"
            target="_blank"
            rel="noopener"
            class="block no-underline"
          >
            <h3 class="text-[16px] font-medium text-[#2c2c2c] mb-1 hover:text-[#4a90d9]">
              {{ m.latest.title }}
            </h3>
            <p class="text-[13px] text-[#777] leading-relaxed line-clamp-3">
              {{ m.latest.excerpt || '（无摘要）' }}
            </p>
            <span v-if="m.latest.pubDate" class="text-[12px] text-[#aaa] mt-2 inline-block">
              {{ formatDate(m.latest.pubDate) }}
            </span>
          </a>
        </template>
        <p v-else class="text-[13px] text-[#bbb]">
          {{ m.error || '暂无内容' }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
