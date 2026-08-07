<template>
  <div class="max-w-[760px] mx-auto px-4 py-10">
    <div class="mb-8 flex items-end justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-[28px] font-bold tracking-tight mb-2">朋友管理</h1>
        <p class="text-[#6b6b6b] text-[15px]">维护你关注的其他博主，将在朋友圈页展示</p>
      </div>
      <el-button type="primary" @click="openAdd">+ 添加博主</el-button>
    </div>

    <div v-if="loading" class="text-[#999] py-10 text-center">加载中…</div>

    <div v-else-if="friends.length === 0" class="text-[#999] py-10 text-center">
      还没有添加任何博主
    </div>

    <ul v-else class="space-y-3">
      <li
        v-for="f in friends"
        :key="f.id"
        class="friend-item rounded-xl px-5 py-4 flex items-center justify-between"
        style="border: 1px solid rgba(255,255,255,0.7); box-shadow: 0 8px 32px rgba(31,38,135,0.1), inset 0 1px 1px rgba(255,255,255,0.85);"
      >
        <div class="min-w-0">
          <div class="text-[17px] font-medium text-[#1a1a1a]">{{ f.name || '未命名博主' }}</div>
          <a
            v-if="f.blogUrl"
            :href="f.blogUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[13px] text-[#4a90d9] break-all"
          >{{ f.blogUrl }}</a>
          <div v-if="f.feedUrl" class="text-[12px] text-[#bbb] break-all mt-0.5">{{ f.feedUrl }}</div>
        </div>
        <el-button type="danger" link @click="handleDelete(f)">删除</el-button>
      </li>
    </ul>

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="showDialog" :title="editingId ? '编辑博主' : '添加博主'" width="460px">
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="博主名称" />
        </el-form-item>
        <el-form-item label="博客链接">
          <el-input v-model="form.blogUrl" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="RSS(选填)">
          <el-input v-model="form.feedUrl" placeholder="https://.../feed.xml" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { loadFriends, addFriend, deleteFriend } from '../utils/storage'

const friends = ref([])
const loading = ref(true)
const showDialog = ref(false)
const editingId = ref(null)
const form = ref({ name: '', blogUrl: '', feedUrl: '' })

async function refresh() {
  loading.value = true
  try {
    friends.value = await loadFriends()
  } catch (e) {
    console.error('加载朋友失败:', e)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}
onMounted(refresh)

function openAdd() {
  editingId.value = null
  form.value = { name: '', blogUrl: '', feedUrl: '' }
  showDialog.value = true
}

async function handleSave() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请填写博主名称')
    return
  }
  try {
    await addFriend({
      name: form.value.name.trim(),
      blogUrl: form.value.blogUrl.trim(),
      feedUrl: form.value.feedUrl.trim(),
    })
    showDialog.value = false
    ElMessage.success('已添加')
    refresh()
  } catch (e) {
    console.error(e)
    ElMessage.error('保存失败')
  }
}

async function handleDelete(f) {
  try {
    await ElMessageBox.confirm(`确定删除「${f.name}」？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteFriend(f.id)
    ElMessage.success('已删除')
    refresh()
  } catch {
    // 取消
  }
}
</script>
