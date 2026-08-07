<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { findArticle, addArticle, updateArticle, todayStr } from '../utils/storage'
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
})

const loading = ref(false)

onMounted(async () => {
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
  if (!form.category.trim()) {
    ElMessage.warning('请输入分类')
    return
  }

  const data = {
    title: form.title.trim(),
    date: form.date || todayStr(),
    category: form.category.trim() || '未分类',
    tags: form.tags.trim()
      ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [],
    excerpt: form.excerpt.trim(),
    content: form.content || '',
    audioUrl: form.audioUrl.trim(),
  }

  try {
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
      class="inline-flex items-center gap-1 text-sm text-[#6b6b6b] no-underline mb-6 transition-colors duration-200 hover:text-[#4a90d9]"
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
          <el-input v-model="form.category" placeholder="如：前端开发" maxlength="20" />
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
        <p class="text-[12px] text-[#999] mt-1 mb-0">
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
    <div class="glass-sm p-5 mt-4 text-sm text-[#6b6b6b]">
      <h3 class="font-semibold mb-2 text-[#2c2c2c] text-[15px]">写作提示</h3>
      <p>使用上方工具栏编辑文章，支持加粗、斜体、标题、列表、引用、代码块、链接、图片等格式。点击图片选中后按 Delete 可删除，也支持直接粘贴截图。</p>
    </div>
  </div>
</template>
