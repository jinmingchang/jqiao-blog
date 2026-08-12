<template>
  <div class="max-w-[760px] mx-auto px-4 py-10">
    <div class="mb-8 flex items-end justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-[28px] font-bold tracking-tight mb-2">朋友管理</h1>
      </div>
      <div class="flex gap-2">
        <el-button v-if="selectedRows.length" type="danger" plain :loading="batchLoading" @click="batchDelete">
          批量删除 ({{ selectedRows.length }})
        </el-button>
        <el-button type="primary" @click="openAdd">+ 添加博主</el-button>
      </div>
    </div>

    <div v-if="loading" class="text-[#999] py-10 text-center">加载中…</div>

    <div v-else-if="friends.length === 0" class="text-[#999] py-10 text-center">
      还没有添加任何博主
    </div>

    <el-table
      v-else
      :data="friends"
      stripe
      border
      style="width: 100%"
      row-key="id"
      v-loading="loading"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="48" />
      <el-table-column label="名称" min-width="140">
        <template #default="{ row }">
          <span class="friend-name text-[16px] font-medium">{{ row.name || '未命名博主' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="博客链接" min-width="200">
        <template #default="{ row }">
          <a
            v-if="row.blogUrl"
            :href="row.blogUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="friend-link text-[13px] break-all"
          >{{ row.blogUrl }}</a>
          <span v-else class="friend-muted text-[12px]">—</span>
        </template>
      </el-table-column>
      <el-table-column label="RSS" min-width="180">
        <template #default="{ row }">
          <span v-if="row.feedUrl" class="friend-muted text-[12px] break-all">{{ row.feedUrl }}</span>
          <span v-else class="friend-muted text-[12px]">—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <div class="flex gap-2">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" plain @click="handleDelete(row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="showDialog" :title="editingId ? '编辑博主' : '添加博主'" width="460px" align-center>
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="博主名称" @keyup.enter="handleSave" />
        </el-form-item>
        <el-form-item label="博客链接">
          <el-input v-model="form.blogUrl" placeholder="https://..." @keyup.enter="handleSave" />
        </el-form-item>
        <el-form-item label="RSS(选填)">
          <el-input v-model="form.feedUrl" placeholder="https://.../feed.xml" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { loadFriends, addFriend, updateFriend, deleteFriend, batchDeleteFriends } from '../utils/storage'

const friends = ref([])
const loading = ref(true)
const saving = ref(false)
const showDialog = ref(false)
const editingId = ref(null)
const form = ref({ name: '', blogUrl: '', feedUrl: '' })

// 批量选择
const selectedRows = ref([])
const batchLoading = ref(false)

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

function resetForm() {
  form.value = { name: '', blogUrl: '', feedUrl: '' }
}

function openAdd() {
  editingId.value = null
  resetForm()
  showDialog.value = true
}

function openEdit(row) {
  editingId.value = row.id
  form.value = {
    name: row.name || '',
    blogUrl: row.blogUrl || '',
    feedUrl: row.feedUrl || '',
  }
  showDialog.value = true
}

async function handleSave() {
  const name = form.value.name.trim()
  if (!name) {
    ElMessage.warning('请填写博主名称')
    return
  }
  saving.value = true
  try {
    const payload = {
      name,
      blogUrl: form.value.blogUrl.trim(),
      feedUrl: form.value.feedUrl.trim(),
    }
    if (editingId.value) {
      await updateFriend(editingId.value, payload)
      ElMessage.success('已更新')
    } else {
      await addFriend(payload)
      ElMessage.success('已添加')
    }
    showDialog.value = false
    refresh()
  } catch (e) {
    console.error(e)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
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

// 表格多选变化
function handleSelectionChange(rows) {
  selectedRows.value = rows
}

// 批量删除
async function batchDelete() {
  if (!selectedRows.value.length) return
  const ids = selectedRows.value.map((r) => r.id)
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${ids.length} 位博主吗？此操作不可恢复。`,
      '批量删除',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return // 用户取消
  }
  batchLoading.value = true
  try {
    await batchDeleteFriends(ids)
    ElMessage.success(`已删除 ${ids.length} 位博主`)
    refresh()
  } catch (e) {
    console.error(e)
    ElMessage.error('批量删除失败')
  } finally {
    batchLoading.value = false
  }
}
</script>

<style scoped>
/* 亮色默认值 */
.friend-name {
  color: #1a1a1a;
}
.friend-link {
  color: #4a90d9;
}
.friend-link:hover {
  color: #2c6fb0;
}
.friend-muted {
  color: #bbb;
}

/* 暗黑模式：VitePress 风格，保证清晰可读 */
[data-theme='dark'] .friend-name {
  color: rgba(255, 255, 255, 0.87);
}
[data-theme='dark'] .friend-link {
  color: #5c9eea;
}
[data-theme='dark'] .friend-link:hover {
  color: #42b983;
}
[data-theme='dark'] .friend-muted {
  color: rgba(235, 235, 235, 0.4);
}
</style>
