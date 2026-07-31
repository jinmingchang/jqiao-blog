<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { loadArticles, getCategories } from '../utils/storage'
import ArticleCard from '../components/ArticleCard.vue'

const router = useRouter()

const articles = ref([])
const categories = ref([])
const loading = ref(true)
const activeCategory = ref('')
const currentPage = ref(1)
const pageSize = 5

// 初始化数据
async function refreshData() {
  try {
    const data = await loadArticles()
    articles.value = data
    const cats = await getCategories()
    categories.value = cats
  } catch (e) {
    console.error('加载文章失败:', e)
  } finally {
    loading.value = false
  }
}
onMounted(() => refreshData())

const filteredArticles = computed(() => {
  if (!activeCategory.value) return articles.value
  return articles.value.filter((a) => a.category === activeCategory.value)
})

const pagedArticles = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredArticles.value.slice(start, start + pageSize)
})

const totalItems = computed(() => filteredArticles.value.length)

function selectCategory(cat) {
  activeCategory.value = cat
  currentPage.value = 1
}

function goToDetail(id) {
  router.push(`/article/${id}`)
}

function handlePageChange(page) {
  currentPage.value = page
  window.scrollTo(0, 0)
}
</script>

<template>
  <div>
    <!-- 列表头部 -->
    <div class="mb-8">
      <h1 class="text-[28px] font-bold tracking-tight mb-2">文章</h1>
      <p class="text-[#6b6b6b] text-[15px]">共 {{ articles.length }} 篇文章</p>
    </div>

    <!-- 分类筛选 -->
    <div class="flex flex-wrap gap-2 mb-8">
      <span
        class="category-tag"
        :class="{ active: !activeCategory }"
        @click="selectCategory('')"
      >全部</span>
      <span
        v-for="cat in categories"
        :key="cat"
        class="category-tag"
        :class="{ active: activeCategory === cat }"
        @click="selectCategory(cat)"
      >{{ cat }}</span>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="text-center py-15 text-[#999]">
      <p class="text-[15px]">加载中...</p>
    </div>
    <!-- 文章列表 -->
    <div v-else-if="pagedArticles.length" class="flex flex-col gap-4">
      <ArticleCard
        v-for="article in pagedArticles"
        :key="article.id"
        :article="article"
        @click="goToDetail(article.id)"
      />
    </div>
    <div v-else class="text-center py-15 text-[#999]">
      <div class="text-5xl mb-3">📭</div>
      <p class="text-[15px]">该分类下暂无文章</p>
    </div>

    <!-- 分页 -->
    <div v-if="totalItems > pageSize" class="flex justify-center mt-8">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalItems"
        layout="prev, pager, next"
        background
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.category-tag {
  display: inline-block;
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid #eaeaea;
  background: #fff;
  color: #6b6b6b;
  transition: all 0.2s;
  user-select: none;
}
.category-tag:hover {
  border-color: #4a90d9;
  color: #4a90d9;
}
.category-tag.active {
  background: #4a90d9;
  color: #fff;
  border-color: #4a90d9;
}
</style>
