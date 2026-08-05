<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { findArticle } from '../utils/storage'

const props = defineProps({ id: { type: [String, Number], required: true } })
const router = useRouter()

const article = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const found = await findArticle(props.id)
    article.value = found ? found.article : null
  } catch (e) {
    console.error('加载文章失败:', e)
    article.value = null
  } finally {
    loading.value = false
  }
})
const a = 
`范围在这片档次 的人被误诊
委屈要掷地有声 钓高级的爱人
新套路越深 分第一杯羹
我们互相做伪证 等面生的贵人
你摆什么阵 允妖狐附了身
他染色太深 快盖住剧毒花纹

我们都疮痍满身 再捏造缘分
然后扮成 无辜的路人
要粉饰半生 残存体温
献祭给假圣人‌‌‌

我们曾一样虔诚 有庇护的神
放过旧人 积攒着新恨
若一觉醒来 传言里的媚人
没离开新手村

等你爬到顶层 就可以换一个人‌‌‌

我们都疮痍满身 再捏造缘分
然后扮成 无辜的路人
要粉饰半生 残存体温
献祭给假圣人

我们曾一样天真 敬畏着鬼神
偿过素人 吞咽着腥荤
怕一觉醒来 被感染的媚人
还不肯松捆绳‌‌‌

养晦端坐 满身欲火
让我们扬帆启程 配献媚歌声
让漫天星辰 照下三滥人
我曾断臂求生 是最痛的人
却从来不吭声
感谢那芸芸众生 拼凑成巨人
翻案再审 一座旧城
让利己的爱人 无处藏身
让利用爱的人 四处挽尊‌‌‌
`

function goBack() {
  router.push('/')
}
</script>

<template>
  <div v-if="article" class="article-detail">
    <!-- 返回链接 -->
    <a
      href="#/"
      class="inline-flex items-center gap-1 text-sm text-[#6b6b6b] no-underline mb-6 transition-colors duration-200 hover:text-[#4a90d9]"
      @click.prevent="goBack"
    >← 返回文章列表</a>

    <!-- 标题 -->
    <h1 class="text-[28px] font-bold leading-snug mb-3 tracking-tight">{{ article.title }}</h1>

    <!-- 元信息 -->
    <div class="flex flex-wrap items-center gap-3 mb-8 text-sm text-[#999]">
      <span class="font-mono">{{ article.date }}</span>
      <span class="w-0.75 h-0.75 rounded-full bg-[#eaeaea]"></span>
      <span>{{ article.category }}</span>
    </div>

    <!-- 正文 -->
    <div class="article-body text-base leading-relaxed text-[#2c2c2c]" v-html="article.content"></div>

    <!-- 底部标签 -->
    <div class="mt-12 pt-6 border-t border-[#eaeaea]">
      <div class="flex flex-wrap gap-1.5">
        <span v-for="tag in article.tags" :key="tag" class="tag-badge">{{ tag }}</span>
      </div>
    </div>
  </div>

  <!-- 加载中 -->
  <div v-else-if="loading" class="text-center py-15 text-[#999]">
    <p class="text-[15px]">加载中...</p>
  </div>
  <!-- 文章未找到 -->
  <div v-else class="text-center py-15 text-[#999]">
    <p class="text-[15px]">文章未找到</p>
  </div>
</template>

<style scoped>
.article-body :deep(h2) { font-size: 22px; font-weight: 600; margin: 36px 0 14px; }
.article-body :deep(h3) { font-size: 18px; font-weight: 600; margin: 28px 0 10px; }
.article-body :deep(p) { margin-bottom: 16px; }
.article-body :deep(ul),
.article-body :deep(ol) { margin-bottom: 16px; padding-left: 24px; }
.article-body :deep(li) { margin-bottom: 6px; }
.article-body :deep(blockquote) {
  border-left: 3px solid #4a90d9;
  padding: 12px 20px;
  margin: 20px 0;
  background: #f0f4f8;
  border-radius: 0 8px 8px 0;
  color: #6b6b6b;
}
.article-body :deep(code) {
  background: #f0f4f8;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}
.article-body :deep(pre) {
  background: #1e1e2e;
  color: #cdd6f4;
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 16px;
  line-height: 1.6;
}
.article-body :deep(pre code) { background: none; padding: 0; color: inherit; }
.article-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 16px 0;
  display: block;
}
.article-body :deep(a) { color: #4a90d9; text-decoration: underline; }
</style>
