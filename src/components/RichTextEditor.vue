<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { initSupabase } from '../utils/supabase'

const props = defineProps({
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const editorRef = ref(null)
const headingSelect = ref('<p>')
const imageInputRef = ref(null)
const imageUploading = ref(false)

function syncToModel() {
  if (editorRef.value) {
    emit('update:modelValue', editorRef.value.innerHTML)
  }
}

function execCmd(cmd, arg = null) {
  if (cmd === 'createLink') {
    const url = prompt('请输入链接地址：', 'https://')
    if (url) document.execCommand(cmd, false, url)
    editorRef.value?.focus()
    syncToModel()
    return
  }
  document.execCommand(cmd, false, arg)
  editorRef.value?.focus()
  syncToModel()
}

function onHeadingChange() {
  document.execCommand('formatBlock', false, headingSelect.value)
  editorRef.value?.focus()
  syncToModel()
}

// 触发图片文件选择
function triggerImageUpload() {
  imageInputRef.value?.click()
}

// 上传图片到 Supabase Storage，返回公开 URL
async function uploadImage(file) {
  const sb = initSupabase()
  if (!sb) {
    // 未配置 Supabase，回退到 base64
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (ev) => resolve(ev.target.result)
      reader.readAsDataURL(file)
    })
  }
  const ext = file.name.split('.').pop() || 'png'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await sb.storage
    .from('blog-images')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data: urlData } = sb.storage.from('blog-images').getPublicUrl(path)
  return urlData.publicUrl
}

// 处理图片选择 - 上传到 Supabase
async function handleImageSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return

  // 校验类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.warning('仅支持 JPG、PNG、GIF、WebP、SVG 格式')
    return
  }

  // 限制大小 5MB
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 5MB')
    return
  }

  imageUploading.value = true
  try {
    const url = await uploadImage(file)
    editorRef.value?.focus()
    document.execCommand('insertImage', false, url)
    syncToModel()
    ElMessage.success('图片上传成功')
  } catch (err) {
    console.error('图片上传失败:', err)
    ElMessage.error('图片上传失败')
  } finally {
    imageUploading.value = false
  }

  // 重置 input 以便重复选择同一文件
  e.target.value = ''
}

// 粘贴图片处理 - 上传到 Supabase
async function onPaste(e) {
  const items = e.clipboardData?.items
  const imageItem = items && Array.from(items).find(item => item.type.startsWith('image/'))

  if (imageItem) {
    e.preventDefault()
    const file = imageItem.getAsFile()
    if (file.size > 5 * 1024 * 1024) {
      ElMessage.warning('图片大小不能超过 5MB')
      return
    }

    imageUploading.value = true
    try {
      const url = await uploadImage(file)
      editorRef.value?.focus()
      document.execCommand('insertImage', false, url)
      syncToModel()
      ElMessage.success('图片粘贴上传成功')
    } catch (err) {
      console.error('图片粘贴上传失败:', err)
      ElMessage.error('图片上传失败')
    } finally {
      imageUploading.value = false
    }
  } else {
    e.preventDefault()
    const text = (e.clipboardData || window.clipboardData).getData('text/plain')
    document.execCommand('insertText', false, text)
    syncToModel()
  }
}

// 点击编辑器中的图片选中，支持删除
function onEditorClick(e) {
  if (e.target.tagName === 'IMG') {
    // 移除其他图片的选中态
    editorRef.value?.querySelectorAll('img.selected').forEach(img => img.classList.remove('selected'))
    e.target.classList.add('selected')
  } else {
    editorRef.value?.querySelectorAll('img.selected').forEach(img => img.classList.remove('selected'))
  }
}

// 键盘删除选中图片
function onEditorKeydown(e) {
  if ((e.key === 'Delete' || e.key === 'Backspace')) {
    const selected = editorRef.value?.querySelector('img.selected')
    if (selected) {
      e.preventDefault()
      selected.remove()
      syncToModel()
    }
  }
}

function isActive(cmd) {
  try {
    return document.queryCommandState(cmd)
  } catch {
    return false
  }
}

onMounted(() => {
  if (editorRef.value && props.modelValue) {
    editorRef.value.innerHTML = props.modelValue
  }
})

watch(
  () => props.modelValue,
  (val) => {
    if (editorRef.value && editorRef.value.innerHTML !== val) {
      editorRef.value.innerHTML = val
    }
  }
)
</script>

<template>
  <div class="glass rounded-lg overflow-hidden">
    <!-- 工具栏 -->
    <div class="editor-toolbar flex flex-wrap gap-0.5 px-2 py-1.5 border-b select-none">
      <select
        v-model="headingSelect"
        class="editor-heading-select h-8 px-1.5 text-[13px] rounded cursor-pointer outline-none"
        @mousedown.stop
        @change="onHeadingChange"
      >
        <option value="<p>">正文</option>
        <option value="<h2>">H2</option>
        <option value="<h3>">H3</option>
      </select>
      <span class="editor-divider w-px my-1 mx-1"></span>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: isActive('bold') }"
        title="加粗"
        @mousedown.prevent
        @click="execCmd('bold')"
      ><b>B</b></button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: isActive('italic') }"
        title="斜体"
        @mousedown.prevent
        @click="execCmd('italic')"
      ><i>I</i></button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: isActive('underline') }"
        title="下划线"
        @mousedown.prevent
        @click="execCmd('underline')"
      ><u>U</u></button>
      <span class="editor-divider w-px my-1 mx-1"></span>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: isActive('insertUnorderedList') }"
        title="无序列表"
        @mousedown.prevent
        @click="execCmd('insertUnorderedList')"
      >•≡</button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: isActive('insertOrderedList') }"
        title="有序列表"
        @mousedown.prevent
        @click="execCmd('insertOrderedList')"
      >1.</button>
      <span class="editor-divider w-px my-1 mx-1"></span>
      <button
        type="button"
        class="toolbar-btn"
        title="引用"
        @mousedown.prevent
        @click="execCmd('formatBlock', '<blockquote>')"
      >「」</button>
      <button
        type="button"
        class="toolbar-btn"
        title="代码块"
        @mousedown.prevent
        @click="execCmd('formatBlock', '<pre>')"
      >&lt;/&gt;</button>
      <span class="editor-divider w-px my-1 mx-1"></span>
      <button
        type="button"
        class="toolbar-btn"
        title="链接"
        @mousedown.prevent
        @click="execCmd('createLink')"
      >🔗</button>
      <button
        type="button"
        class="toolbar-btn"
        title="插入图片"
        :disabled="imageUploading"
        @mousedown.prevent
        @click="triggerImageUpload"
      >{{ imageUploading ? '⏳' : '🖼' }}</button>
      <span class="editor-divider w-px my-1 mx-1"></span>
      <button
        type="button"
        class="toolbar-btn"
        title="清除格式"
        @mousedown.prevent
        @click="execCmd('removeFormat')"
      >✕</button>

      <!-- 隐藏的图片上传 input -->
      <input
        ref="imageInputRef"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        class="hidden"
        @change="handleImageSelect"
      />
    </div>

    <!-- 编辑区域 -->
    <div
      ref="editorRef"
      class="editor-body"
      contenteditable="true"
      @input="syncToModel"
      @keyup="syncToModel"
      @mouseup="syncToModel"
      @click="onEditorClick"
      @keydown="onEditorKeydown"
      @paste="onPaste"
    ></div>
  </div>
</template>

<style scoped>
.editor-toolbar {
  background: rgba(255,255,255,0.4);
  border-color: rgba(255,255,255,0.6);
}
.editor-heading-select {
  color: #6b6b6b;
  background: transparent;
  border: 1px solid transparent;
}
.editor-heading-select:hover {
  border-color: #eaeaea;
}
.editor-heading-select:focus {
  border-color: #4a90d9;
}
.editor-divider {
  background: #eaeaea;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #6b6b6b;
  transition: all 0.15s;
  font-family: inherit;
}
.toolbar-btn:hover {
  background: #e8ecf0;
  color: #2c2c2c;
}
.toolbar-btn.active {
  background: #4a90d9;
  color: #fff;
}

.editor-body {
  min-height: 360px;
  max-height: 600px;
  overflow-y: auto;
  padding: 16px 20px;
  font-size: 15px;
  line-height: 1.8;
  color: #2c2c2c;
  outline: none;
  background: #fff;
}
.editor-body:empty::before {
  content: '开始写作...';
  color: #bbb;
  pointer-events: none;
}
.editor-body :deep(h2) { font-size: 22px; font-weight: 700; margin: 20px 0 10px; }
.editor-body :deep(h3) { font-size: 18px; font-weight: 600; margin: 16px 0 8px; }
.editor-body :deep(p) { margin-bottom: 12px; }
.editor-body :deep(blockquote) {
  border-left: 3px solid #4a90d9;
  padding: 8px 16px;
  margin: 12px 0;
  color: #6b6b6b;
  background: #f0f4f8;
}
.editor-body :deep(pre) {
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: 6px;
  padding: 16px;
  font-size: 14px;
  overflow-x: auto;
  margin: 12px 0;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  white-space: pre-wrap;
  word-break: break-all;
}
.editor-body :deep(ul),
.editor-body :deep(ol) { padding-left: 24px; margin: 8px 0 12px; }
.editor-body :deep(li) { margin-bottom: 4px; }
.editor-body :deep(a) { color: #4a90d9; text-decoration: underline; }
.editor-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  cursor: pointer;
  outline: 2px solid transparent;
  outline-offset: 2px;
  transition: outline-color 0.15s;
  display: block;
  margin: 12px 0;
}
.editor-body :deep(img:hover) {
  outline-color: #4a90d9;
  outline-width: 2px;
}
.editor-body :deep(img.selected) {
  outline-color: #4a90d9;
  outline-width: 3px;
}

/* 暗黑模式：编辑器改为 VitePress 深色风格 */
[data-theme='dark'] .editor-toolbar {
  background: #161618;
  border-color: rgba(82, 82, 89, 0.5);
}

[data-theme='dark'] .editor-heading-select {
  color: rgba(235, 235, 235, 0.6);
  background: #252529;
  border-color: rgba(82, 82, 89, 0.5);
}

[data-theme='dark'] .editor-heading-select:hover,
[data-theme='dark'] .editor-heading-select:focus {
  border-color: #42b983;
}

[data-theme='dark'] .editor-divider {
  background: rgba(82, 82, 89, 0.5);
}

[data-theme='dark'] .toolbar-btn {
  color: rgba(235, 235, 235, 0.6);
}

[data-theme='dark'] .toolbar-btn:hover {
  background: rgba(82, 82, 89, 0.4);
  color: rgba(255, 255, 255, 0.87);
}

[data-theme='dark'] .toolbar-btn.active {
  background: #42b983;
  color: #1a1a1a;
}

[data-theme='dark'] .editor-body {
  background: #1b1b1f;
  color: rgba(255, 255, 255, 0.87);
}

[data-theme='dark'] .editor-body:empty::before {
  color: rgba(235, 235, 235, 0.38);
}

[data-theme='dark'] .editor-body :deep(h2),
[data-theme='dark'] .editor-body :deep(h3) {
  color: rgba(255, 255, 255, 0.87);
}

[data-theme='dark'] .editor-body :deep(blockquote) {
  color: rgba(235, 235, 235, 0.6);
  background: rgba(82, 82, 89, 0.16);
  border-left-color: #42b983;
}

[data-theme='dark'] .editor-body :deep(a) {
  color: #5c9eea;
}

[data-theme='dark'] .editor-body :deep(img:hover),
[data-theme='dark'] .editor-body :deep(img.selected) {
  outline-color: #42b983;
}
</style>
