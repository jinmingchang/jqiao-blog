<script setup>
import { ref, onMounted } from 'vue'
import { loadFriends, addFriend, deleteFriend } from '../utils/storage'
import { ElMessage, ElMessageBox } from 'element-plus'

const friends = ref([])
const loading = ref(true)
const showDialog = ref(false)
const form = ref({ name: '', feedUrl: '', blogUrl: '' })

async function refresh() {
  loading.value = true
  try {
    friends.value = await loadFriends()
  } catch (e) {
    console.error(e)
    ElMessage.error('加载朋友列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(refresh)

function openDialog() {
  form.value = { name: '', feedUrl: '', blogUrl: '' }
  showDialog.value = true
}

async function handleAdd() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入博主名称')
    return
  }
  try {
    await addFriend({
      name: form.value.name.trim(),
      feedUrl: form.value.feedUrl.trim(),
      blogUrl: form.value.blogUrl.trim(),
    })
    showDialog.value = false
    ElMessage.success('已添加')
    refresh()
  } catch (e) {
    ElMessage.error('添加失败')
  }
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定取消关注该博主？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteFriend(id)
    ElMessage.success('已删除')
    refresh()
  } catch {
    // 取消
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <h1 class="text-[28px] font-bold tracking-tight">我的朋友</h1>
      <el-button type="primary" @click="openDialog">+ 添加博主</el-button>
    </div>

    <el-table
      v-if="friends.length"
      :data="friends"
      stripe
      border
      style="width: 100%"
      v-loading="loading"
    >
      <el-table-column prop="name" label="博主名称" min-width="140">
        <template #default="{ row }">
          <a
            v-if="row.blogUrl"
            :href="row.blogUrl"
            target="_blank"
            rel="noopener"
            class="font-medium text-[#2c2c2c] no-underline hover:text-[#4a90d9]"
          >{{ row.name }}</a>
          <span v-else>{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="feedUrl" label="RSS 地址" min-width="220" show-overflow-tooltip />
      <el-table-column prop="blogUrl" label="博客地址" min-width="200" show-overflow-tooltip />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="danger" plain @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-else class="text-center py-15 text-[#999]">
      <div class="text-5xl mb-3">👥</div>
      <p class="text-[15px]">还没有关注任何博主</p>
    </div>

    <el-dialog v-model="showDialog" title="添加博主" width="420px" align-center>
      <div class="flex flex-col gap-4">
        <div>
          <label class="text-[13px] text-[#666] mb-1 block">博主名称 *</label>
          <el-input v-model="form.name" placeholder="如：张三的博客" />
        </div>
        <div>
          <label class="text-[13px] text-[#666] mb-1 block">RSS / Feed 地址 *</label>
          <el-input v-model="form.feedUrl" placeholder="https://xxx.github.io/feed.xml" />
        </div>
        <div>
          <label class="text-[13px] text-[#666] mb-1 block">博客主页地址</label>
          <el-input v-model="form.blogUrl" placeholder="https://xxx.github.io/" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>
