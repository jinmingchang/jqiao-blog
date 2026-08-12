<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { loadArticles, deleteArticle, setArticleHidden, setAdminPassword, loadCategories, addCategory, updateCategory, deleteCategory } from '../utils/storage'
import { verifyPassword } from '../utils/auth'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const articles = ref([])
const loading = ref(true)
// 列表筛选：'all' 全部 / 'visible' 仅显示 / 'hidden' 已隐藏
const statusFilter = ref('all')
// 批量选择
const selectedRows = ref([])
const batchLoading = ref(false)

// 密码管理
const showPwdDialog = ref(false)
const oldPwd = ref('')
const newPwd = ref('')
const confirmPwd = ref('')
const pwdError = ref('')

async function refreshData() {
  loading.value = true
  try {
    // 后台默认加载全部文章（含隐藏）
    articles.value = await loadArticles({ includeHidden: true })
  } catch (e) {
    console.error('加载文章列表失败:', e)
    ElMessage.error('加载文章列表失败')
  } finally {
    loading.value = false
  }
}
onMounted(() => refreshData())

// 按筛选条件展示
const visibleArticles = ref([])
function applyFilter() {
  if (statusFilter.value === 'visible') {
    visibleArticles.value = articles.value.filter((a) => !a.hidden)
  } else if (statusFilter.value === 'hidden') {
    visibleArticles.value = articles.value.filter((a) => a.hidden)
  } else {
    visibleArticles.value = articles.value
  }
}
watch(articles, applyFilter)
watch(statusFilter, applyFilter)

async function toggleHidden(row) {
  try {
    await setArticleHidden(row.id, !row.hidden)
    row.hidden = !row.hidden
    ElMessage.success(row.hidden ? '文章已隐藏' : '文章已公开')
  } catch (e) {
    const msg = e?.message || e?.error_description || '操作失败'
    ElMessage.error(`操作失败：${msg}`)
    console.error('切换隐藏状态失败:', e)
  }
}

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
    await deleteArticle(id)
    refreshData()
    ElMessage.success('文章已删除')
  } catch {
    // 取消操作
  }
}

// 表格多选变化
function handleSelectionChange(rows) {
  selectedRows.value = rows
}

// 批量设置隐藏状态
async function batchSetHidden(hidden) {
  if (!selectedRows.value.length) return
  const ids = selectedRows.value.map((r) => r.id)
  try {
    await ElMessageBox.confirm(
      `确定要${hidden ? '隐藏' : '公开'}选中的 ${ids.length} 篇文章吗？`,
      '批量操作',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return // 用户取消
  }
  batchLoading.value = true
  let ok = 0
  let fail = 0
  for (const id of ids) {
    try {
      await setArticleHidden(id, hidden)
      ok++
    } catch {
      fail++
    }
  }
  batchLoading.value = false
  refreshData()
  if (fail === 0) {
    ElMessage.success(`已${hidden ? '隐藏' : '公开'} ${ok} 篇文章`)
  } else {
    ElMessage.warning(`成功 ${ok} 篇，失败 ${fail} 篇`)
  }
}

// 批量删除
async function batchDelete() {
  if (!selectedRows.value.length) return
  const ids = selectedRows.value.map((r) => r.id)
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${ids.length} 篇文章吗？此操作不可恢复。`,
      '批量删除',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return // 用户取消
  }
  batchLoading.value = true
  let ok = 0
  let fail = 0
  for (const id of ids) {
    try {
      await deleteArticle(id)
      ok++
    } catch {
      fail++
    }
  }
  batchLoading.value = false
  refreshData()
  if (fail === 0) {
    ElMessage.success(`已删除 ${ok} 篇文章`)
  } else {
    ElMessage.warning(`成功删除 ${ok} 篇，失败 ${fail} 篇`)
  }
}

// ============================================
// 分类字典管理
// ============================================
const catDialog = ref(false)
const catList = ref([])
const catNewName = ref('')

async function openCatDialog() {
  catNewName.value = ''
  await refreshCats()
  catDialog.value = true
}

async function refreshCats() {
  try {
    catList.value = await loadCategories()
  } catch (e) {
    ElMessage.error('加载分类失败')
  }
}

async function addCat() {
  const name = catNewName.value.trim()
  if (!name) return
  if (catList.value.some((c) => c.name === name)) {
    ElMessage.warning('分类已存在')
    return
  }
  try {
    await addCategory(name, catList.value.length)
    catNewName.value = ''
    await refreshCats()
    ElMessage.success('已添加分类')
  } catch (e) {
    ElMessage.error('添加失败')
  }
}

async function renameCat(row) {
  try {
    const { value } = await ElMessageBox.prompt('修改分类名称', '编辑分类', {
      inputValue: row.name,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
    const name = value.trim()
    if (!name || name === row.name) return
    await updateCategory(row.id, name, row.sort)
    await refreshCats()
    ElMessage.success('已修改')
  } catch {
    // 取消
  }
}

async function removeCat(row) {
  try {
    await ElMessageBox.confirm(`确定删除分类「${row.name}」？该分类下的文章不会被删除，仅变为未分类。`, '删除分类', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteCategory(row.id)
    await refreshCats()
    ElMessage.success('已删除分类')
  } catch {
    // 取消
  }
}

function openPwdDialog() {
  oldPwd.value = ''
  newPwd.value = ''
  confirmPwd.value = ''
  pwdError.value = ''
  showPwdDialog.value = true
}

async function handleChangePwd() {
  pwdError.value = ''
  if (!oldPwd.value) {
    pwdError.value = '请输入当前密码'
    return
  }
  let oldOk = false
  try {
    oldOk = await verifyPassword(oldPwd.value)
  } catch (e) {
    console.error('校验密码失败:', e)
    pwdError.value = `校验失败：${e?.message || '请检查数据库配置'}`
    return
  }
  if (!oldOk) {
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
  try {
    await setAdminPassword(newPwd.value)
  } catch (e) {
    pwdError.value = '保存失败，请检查数据库配置'
    return
  }
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
        <el-button @click="openCatDialog">分类管理</el-button>
        <el-button @click="router.push('/admin/friends')">朋友管理</el-button>
        <el-button type="primary" @click="goToNew">+ 写新文章</el-button>
      </div>
    </div>

    <!-- 状态筛选 + 批量操作 -->
    <div class="flex items-center justify-between gap-3 mb-4 flex-wrap">
      <div class="flex items-center gap-3 flex-wrap">
        <span class="admin-filter-label text-[13px]">状态：</span>
        <el-radio-group v-model="statusFilter" size="small">
          <el-radio-button value="all">全部 ({{ articles.length }})</el-radio-button>
          <el-radio-button value="visible">已公开 ({{ articles.filter((a) => !a.hidden).length }})</el-radio-button>
          <el-radio-button value="hidden">已隐藏 ({{ articles.filter((a) => a.hidden).length }})</el-radio-button>
        </el-radio-group>
      </div>
      <div class="flex items-center gap-2" v-if="selectedRows.length">
        <span class="admin-filter-label text-[13px]">已选 {{ selectedRows.length }} 篇</span>
        <el-button size="small" :loading="batchLoading" @click="batchSetHidden(true)">批量隐藏</el-button>
        <el-button size="small" :loading="batchLoading" @click="batchSetHidden(false)">批量公开</el-button>
        <el-button size="small" type="danger" plain :loading="batchLoading" @click="batchDelete">批量删除</el-button>
      </div>
    </div>

    <!-- 文章表格 -->
    <el-table
      v-if="visibleArticles.length"
      :data="visibleArticles"
      stripe
      border
      style="width: 100%"
      row-class-name="admin-table-row"
      v-loading="loading"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="48" />
      <el-table-column prop="title" label="标题" min-width="200">
        <template #default="{ row }">
          <div class="flex items-center gap-2">
            <router-link :to="`/article/${row.id}`" class="admin-title-link font-medium no-underline">
              {{ row.title }}
            </router-link>
            <span v-if="row.hidden" class="admin-hidden-tag">已隐藏</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="category" label="分类" width="120">
        <template #default="{ row }">
          <span class="admin-cat-tag">{{ row.category }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="date" label="日期" width="130">
        <template #default="{ row }">
          <span class="admin-date font-mono text-[13px]">{{ row.date }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <div class="flex gap-2">
            <el-button size="small" @click="goToEdit(row.id)">编辑</el-button>
            <el-button size="small" @click="toggleHidden(row)">
              {{ row.hidden ? '公开' : '隐藏' }}
            </el-button>
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

    <!-- 分类管理弹窗 -->
    <el-dialog v-model="catDialog" title="分类管理" width="420px" align-center>
      <div class="flex flex-col gap-3">
        <div class="flex gap-2">
          <el-input
            v-model="catNewName"
            placeholder="新增分类名称"
            maxlength="20"
            @keyup.enter="addCat"
          />
          <el-button type="primary" @click="addCat">添加</el-button>
        </div>
        <div class="flex flex-col gap-2 max-h-[320px] overflow-auto">
          <div
            v-for="cat in catList"
            :key="cat.id"
            class="admin-cat-item flex items-center justify-between px-3 py-2 rounded-md"
          >
            <span class="admin-cat-name text-[14px]">{{ cat.name }}</span>
            <div class="flex gap-2">
              <el-button size="small" text @click="renameCat(cat)">重命名</el-button>
              <el-button size="small" text type="danger" @click="removeCat(cat)">删除</el-button>
            </div>
          </div>
          <p v-if="!catList.length" class="admin-cat-empty text-center text-[13px] py-4 m-0">
            暂无分类，添加一个吧
          </p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.admin-cat-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  background: rgba(255,255,255,0.6);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.6);
  color: #4a90de;
  font-size: 12px;
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.8);
}
.admin-hidden-tag {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 10px;
  background: rgba(153,153,153,0.15);
  color: #999;
  font-size: 11px;
  border: 1px solid rgba(153,153,153,0.3);
  flex-shrink: 0;
}

/* 亮色模式：标题/日期默认颜色 */
.admin-title-link {
  color: #2c2c2c;
}
.admin-title-link:hover {
  color: #4a90d9;
}
.admin-date {
  color: #999;
}

/* 暗黑模式：标签改为 VitePress 风格扁平色 */
[data-theme='dark'] .admin-cat-tag {
  background: transparent;
  border: 1px solid rgba(66, 185, 131, 0.55);
  color: #42b983;
  box-shadow: none;
  border-radius: 4px;
}

[data-theme='dark'] .admin-hidden-tag {
  background: transparent;
  border: 1px solid rgba(82, 82, 89, 0.5);
  color: rgba(235, 235, 235, 0.5);
  border-radius: 4px;
}

[data-theme='dark'] .admin-title-link {
  color: rgba(255, 255, 255, 0.87);
}

[data-theme='dark'] .admin-title-link:hover {
  color: #42b983;
}

[data-theme='dark'] .admin-date {
  color: rgba(235, 235, 235, 0.6);
}

/* 状态筛选标签 */
.admin-filter-label {
  color: #999;
}
[data-theme='dark'] .admin-filter-label {
  color: rgba(235, 235, 235, 0.6);
}

/* 分类弹窗列表项 */
.admin-cat-item {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.8);
}
.admin-cat-name {
  color: #2c2c2c;
}
.admin-cat-empty {
  color: #999;
}
[data-theme='dark'] .admin-cat-item {
  background: rgba(22, 22, 24, 0.7);
  border: 1px solid rgba(82, 82, 89, 0.5);
  box-shadow: none;
}
[data-theme='dark'] .admin-cat-name {
  color: rgba(255, 255, 255, 0.87);
}
[data-theme='dark'] .admin-cat-empty {
  color: rgba(235, 235, 235, 0.45);
}

/* 暗黑模式：el-radio-group 状态筛选器 */
[data-theme='dark'] .el-radio-button__inner {
  background: #252529;
  border-color: rgba(82, 82, 89, 0.5);
  color: rgba(235, 235, 235, 0.7);
}
[data-theme='dark'] .el-radio-button__original-radio:checked + .el-radio-button__inner {
  background: #42b983;
  border-color: #42b983;
  color: #1a1a1a;
  box-shadow: -1px 0 0 0 #42b983;
}
[data-theme='dark'] .el-radio-button:first-child .el-radio-button__inner {
  border-left-color: rgba(82, 82, 89, 0.5);
}
</style>
