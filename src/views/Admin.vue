<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loadArticles, deleteArticle } from '../utils/storage'
import { getStoredPassword, setStoredPassword } from '../utils/auth'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const articles = ref([])

// 密码管理
const showPwdDialog = ref(false)
const oldPwd = ref('')
const newPwd = ref('')
const confirmPwd = ref('')
const pwdError = ref('')

function refreshData() {
  articles.value = loadArticles().sort((a, b) => b.id - a.id)
}
refreshData()

function goToNew() {
  router.push('/admin/new')
}

function goToEdit(id) {
  router.push(`/admin/edit/${id}`)
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？此操作不可恢复。', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    deleteArticle(id)
    refreshData()
    ElMessage.success('文章已删除')
  } catch {
    // 取消操作
  }
}

function openPwdDialog() {
  oldPwd.value = ''
  newPwd.value = ''
  confirmPwd.value = ''
  pwdError.value = ''
  showPwdDialog.value = true
}

function handleChangePwd() {
  pwdError.value = ''
  if (!oldPwd.value) {
    pwdError.value = '请输入当前密码'
    return
  }
  if (oldPwd.value !== getStoredPassword()) {
    pwdError.value = '当前密码错误'
    return
  }
  if (!newPwd.value || newPwd.value.length < 4) {
    pwdError.value = '新密码至少 4 位'
    return
  }
  if (newPwd.value !== confirmPwd.value) {
    pwdError.value = '两次输入的新密码不一致'
    return
  }
  setStoredPassword(newPwd.value)
  showPwdDialog.value = false
  ElMessage.success('管理密码已修改')
}
</script>

<template>
  <div>
    <!-- 管理头部 -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <h1 class="text-[28px] font-bold tracking-tight">文章管理</h1>
      <div class="flex gap-2">
        <el-button @click="openPwdDialog">修改密码</el-button>
        <el-button type="primary" @click="goToNew">+ 写新文章</el-button>
      </div>
    </div>

    <!-- 文章表格 -->
    <el-table
      v-if="articles.length"
      :data="articles"
      stripe
      border
      style="width: 100%"
      row-class-name="admin-table-row"
    >
      <el-table-column prop="title" label="标题" min-width="200">
        <template #default="{ row }">
          <router-link :to="`/article/${row.id}`" class="font-medium text-[#2c2c2c] no-underline hover:text-[#4a90d9]">
            {{ row.title }}
          </router-link>
        </template>
      </el-table-column>
      <el-table-column prop="category" label="分类" width="120">
        <template #default="{ row }">
          <span class="admin-cat-tag">{{ row.category }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="date" label="日期" width="130">
        <template #default="{ row }">
          <span class="font-mono text-[13px] text-[#999]">{{ row.date }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <div class="flex gap-2">
            <el-button size="small" @click="goToEdit(row.id)">编辑</el-button>
            <el-button size="small" type="danger" plain @click="handleDelete(row.id)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空状态 -->
    <div v-else class="text-center py-15 text-[#999]">
      <div class="text-5xl mb-3">📝</div>
      <p class="text-[15px]">还没有文章，点击上方按钮写一篇吧</p>
    </div>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="showPwdDialog" title="修改管理密码" width="380px" align-center>
      <div class="flex flex-col gap-4">
        <el-input v-model="oldPwd" type="password" placeholder="当前密码" show-password />
        <el-input v-model="newPwd" type="password" placeholder="新密码 (至少4位)" show-password />
        <el-input v-model="confirmPwd" type="password" placeholder="确认新密码" show-password @keyup.enter="handleChangePwd" />
        <p v-if="pwdError" class="text-[13px] text-[#e74c3c] m-0">{{ pwdError }}</p>
      </div>
      <template #footer>
        <el-button @click="showPwdDialog = false">取消</el-button>
        <el-button type="primary" @click="handleChangePwd">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.admin-cat-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  background: #f0f4f8;
  color: #5a7a9a;
  font-size: 12px;
}
</style>
