<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { findArticle, addArticle, updateArticle, todayStr, loadCategories, addCategory } from '../utils/storage'
import { ElMessage } from 'element-plus'
import RichTextEditor from '../components/RichTextEditor.vue'

const props = defineProps({ id: { type: [String, Number], default: null } })
const router = useRouter()

const isEdit = computed(() => !!props.id)

const form = reactive({
  id: null,
  title: '',
  date: todayStr(),
  category: '',
  tags: '',
  excerpt: '',
  content: '',
  audioUrl: '',
  hidden: false,
})

const loading = ref(false)
// 分类字典
const categories = ref([])

onMounted(async () => {
  // 加载分类字典
  try {
    categories.value = await loadCategories()
  } catch (e) {
    console.error('加载分类失败:', e)
  }
  if (props.id) {
    loading.value = true
    try {
      const found = await findArticle(props.id)
      if (found) {
        const a = found.article
        form.id = a.id
        form.title = a.title
        form.date = a.date
        form.category = a.category
        form.tags = a.tags.join(', ')
        form.excerpt = a.excerpt
        form.content = a.content
        form.audioUrl = a.audioUrl || ''
        form.hidden = !!a.hidden
      }
    } catch (e) {
      ElMessage.error('加载文章失败')
    } finally {
      loading.value = false
    }
  }
})

async function handleSubmit() {
  if (!form.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }
  if (!form.category) {
    ElMessage.warning('请选择分类')
    return
  }

  const data = {
    title: form.title.trim(),
    date: form.date || todayStr(),
    category: form.category,
    tags: form.tags.trim()
      ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [],
    excerpt: form.excerpt.trim(),
    content: form.content || '',
    audioUrl: form.audioUrl.trim(),
    hidden: form.hidden,
  }

  try {
    // 若分类尚未在字典中，先写入字典（保持字典统一）
    if (!categories.value.some((c) => c.name === data.category)) {
      await addCategory(data.category)
      categories.value = await loadCategories()
    }
    if (isEdit.value) {
      await updateArticle(props.id, data)
      ElMessage.success('文章已更新')
    } else {
      await addArticle(data)
      ElMessage.success('文章已发布')
    }
    router.push('/admin')
  } catch (e) {
    ElMessage.error('保存失败，请重试')
  }
}

function handleCancel() {
  router.push('/admin')
}
</script>

<template>
  <div class="max-w-[800px]">
    <!-- 返回链接 -->
    <a
      href="#/admin"
      class="editor-back-link inline-flex items-center gap-1 text-sm no-underline mb-6 transition-colors duration-200"
      @click.prevent="handleCancel"
    >← 返回管理</a>

    <!-- 标题 -->
    <h1 class="text-[28px] font-bold mb-7 tracking-tight">
      {{ isEdit ? '编辑文章' : '写新文章' }}
    </h1>

    <!-- 表单 -->
    <el-form label-position="top" @submit.prevent="handleSubmit">
      <el-form-item label="标题" required>
        <el-input v-model="form.title" placeholder="输入文章标题" maxlength="100" show-word-limit />
      </el-form-item>

      <div class="flex gap-4 lt-sm:flex-col">
        <el-form-item label="日期" class="flex-1">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="分类" required class="flex-1">
          <el-select
            v-model="form.category"
            placeholder="请选择分类"
            filterable
            allow-create
            default-first-option
            style="width: 100%"
          >
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.name"
            />
          </el-select>
        </el-form-item>
      </div>

      <el-form-item label="标签（逗号分隔）">
        <el-input v-model="form.tags" placeholder="如：JavaScript, Vue" maxlength="100" />
      </el-form-item>

      <el-form-item label="音源嵌入链接（第三方，如 Bilibili/YouTube）">
        <el-input
          v-model="form.audioUrl"
          placeholder="可嵌入的播放器链接，如 https://player.bilibili.com/player.html?bvid=BV1xx... 或 https://www.youtube.com/embed/xxxx"
          maxlength="500"
        />
        <p class="editor-hint text-[12px] mt-1 mb-0">
          留空则不显示播放按钮。建议使用平台提供的「嵌入/iframe」链接，普通视频页链接可能无法直接播放。
        </p>
      </el-form-item>

      <el-form-item label="摘要">
        <el-input
          v-model="form.excerpt"
          type="textarea"
          :rows="3"
          placeholder="简要描述文章内容"
          maxlength="300"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="可见性">
        <el-switch
          v-model="form.hidden"
          active-text="隐藏"
          inactive-text="公开"
          inline-prompt
        />
        <p class="editor-hint text-[12px] mt-1 mb-0">
          开启后文章不会出现在前台列表中，仅后台可见，可用于草稿或暂存。
        </p>
      </el-form-item>

      <el-form-item label="正文">
        <RichTextEditor v-model="form.content" />
      </el-form-item>

      <el-form-item>
        <div class="flex gap-3">
          <el-button type="primary" @click="handleSubmit">
            {{ isEdit ? '保存修改' : '发布文章' }}
          </el-button>
          <el-button v-if="isEdit" @click="handleCancel">取消</el-button>
        </div>
      </el-form-item>
    </el-form>

    <!-- 写作提示 -->
    <div class="editor-tips glass-sm p-5 mt-4 text-sm">
      <h3 class="font-semibold mb-2 text-[15px]">写作提示</h3>
      <p>使用上方工具栏编辑文章，支持加粗、斜体、标题、列表、引用、代码块、链接、图片等格式。点击图片选中后按 Delete 可删除，也支持直接粘贴截图。</p>
    </div>
  </div>
</template>

<style scoped>
/* 亮色模式 */
.editor-back-link {
  color: #6b6b6b;
}
.editor-back-link:hover {
  color: #4a90d9;
}

.editor-hint {
  color: #999;
}

.editor-tips {
  color: #6b6b6b;
}
.editor-tips h3 {
  color: #2c2c2c;
}

/* 暗黑模式：VitePress 风格 */
[data-theme='dark'] .editor-back-link {
  color: rgba(235, 235, 235, 0.6);
}
[data-theme='dark'] .editor-back-link:hover {
  color: #42b983;
}

[data-theme='dark'] .editor-hint {
  color: rgba(235, 235, 235, 0.45);
}

[data-theme='dark'] .editor-tips {
  color: rgba(235, 235, 235, 0.6);
  background: rgba(22, 22, 24, 0.7);
  border-color: rgba(82, 82, 89, 0.5);
}
[data-theme='dark'] .editor-tips h3 {
  color: rgba(255, 255, 255, 0.87);
}
</style>
