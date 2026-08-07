<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { findArticle } from '../utils/storage'

const props = defineProps({ id: { type: [String, Number], required: true } })
const router = useRouter()

const article = ref(null)
const loading = ref(true)
const bodyRef = ref(null)
const lyricLines = ref([])
const coverUrl = ref('')
const activeIndex = ref(0)
const showPlayer = ref(false)
let scrollTimer = null
let lastInteract = 0
let dragging = false
let lastDragY = 0

function togglePlayer() {
  showPlayer.value = !showPlayer.value
}

onMounted(async () => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
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

onUnmounted(() => {
  stopAutoScroll()
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})

watch(() => article.value, async () => {
  await nextTick()      // 等 v-html 用原始 content 渲染
  extractCover()        // 从 content 剥离封面图（修改数据）
  await nextTick()      // 等关键：等 v-html 用“去封面”后的 content 重渲染
  collectLines()        // 此刻 DOM 才是最终歌词内容
  startAutoScroll()
})

/* 从正文提取第一张图片作为封面，并把它从歌词正文里剥离，
   这样封面图固定显示在标题下方、不被歌词滚动顶飞 */
function extractCover() {
  coverUrl.value = ''
  if (!article.value || !article.value.content) return
  const match = article.value.content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)
  if (match) {
    coverUrl.value = match[1]
    // 移除该图片标签，避免它进入歌词舞台被滚动
    article.value.content = article.value.content.replace(match[0], '')
  }
}

function collectLines() {
  if (!bodyRef.value) return
  // 把每行 div 收集成歌词行，过滤空行与含图片的 div
  lyricLines.value = Array.from(bodyRef.value.querySelectorAll('div')).filter(
    d => d.textContent.trim().length > 0 && !d.querySelector('img')
  )
  lyricLines.value.forEach((el, i) => {
    el.classList.add('lyric-line')
    el.dataset.index = i
  })
  activeIndex.value = 0
  updateActiveLine()
}

function updateActiveLine() {
  lyricLines.value.forEach((el, i) => {
    el.classList.toggle('active-line', i === activeIndex.value)
  })
}

function scrollToActive() {
  const el = lyricLines.value[activeIndex.value]
  if (!el || !bodyRef.value) return
  const container = bodyRef.value
  const target = el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2
  container.scrollTo({ top: target, behavior: 'smooth' })
}

function startAutoScroll() {
  stopAutoScroll()
  if (!lyricLines.value.length) return
  updateActiveLine()
  scrollToActive()
  scrollTimer = setInterval(tick, 2200)
}

function tick() {
  // 用户最近手动滚动过则跳过，等待冷却结束再继续自动播放
  if (Date.now() - lastInteract < 3000) return
  activeIndex.value = (activeIndex.value + 1) % lyricLines.value.length
  updateActiveLine()
  scrollToActive()
}

function stopAutoScroll() {
  clearInterval(scrollTimer)
}

/* 根据当前滚动位置，高亮离中心最近的歌词行 */
function updateActiveByScroll() {
  const container = bodyRef.value
  if (!container) return
  const center = container.scrollTop + container.clientHeight / 2
  let best = 0
  let bestDist = Infinity
  lyricLines.value.forEach((el, i) => {
    const lineCenter = el.offsetTop + el.offsetHeight / 2
    const dist = Math.abs(lineCenter - center)
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  })
  if (best !== activeIndex.value) {
    activeIndex.value = best
    updateActiveLine()
  }
}

/* 滚轮手势：手动滚动歌词 */
function onWheel(e) {
  e.preventDefault()
  lastInteract = Date.now()
  const container = bodyRef.value
  container.scrollTop += e.deltaY
  updateActiveByScroll()
}

/* 点击/拖拽分离：记录按下位置，移动超过阈值才算拖拽 */
let downX = 0
let downY = 0
let moved = false

/* 鼠标拖拽手势：按住上下拖动滚动歌词 */
function onMouseDown(e) {
  dragging = true
  moved = false
  downX = e.clientX
  downY = e.clientY
  lastDragY = e.clientY
  lastInteract = Date.now()
}
function onMouseMove(e) {
  if (!dragging) return
  const dy = e.clientY - lastDragY
  if (!moved && Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 6) {
    moved = true
  }
  lastDragY = e.clientY
  bodyRef.value.scrollTop -= dy
  lastInteract = Date.now()
  updateActiveByScroll()
}
function onMouseUp() {
  dragging = false
}
function onMouseLeave() {
  // 离开容器仅取消拖拽，不触发点击
  dragging = false
}
/* 单击歌词行：高亮被点中的行，并让自动轮播从该行继续 */
function onBodyClick(e) {
  // 若刚拖拽过则忽略（避免拖拽结束误触点击）
  if (moved) return
  const container = bodyRef.value
  if (!container) return
  let index = -1
  const lineEl = e.target.closest ? e.target.closest('.lyric-line') : null
  if (lineEl && lineEl.dataset.index != null) {
    index = Number(lineEl.dataset.index)
  } else {
    // 兜底：点击未精确命中某行时，按点击坐标就近选中最近的歌词行
    // 解决“有封面图时第一行/空行区域点不中”的问题
    const rect = container.getBoundingClientRect()
    const y = e.clientY - rect.top + container.scrollTop
    let best = 0
    let bestDist = Infinity
    lyricLines.value.forEach((el, i) => {
      const dist = Math.abs(el.offsetTop + el.offsetHeight / 2 - y)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    index = best
  }
  if (index < 0) return
  activeIndex.value = index
  updateActiveLine()
  scrollToActive()
  lastInteract = Date.now() // 点击后短暂冷却，之后从该行继续自动滚动
}

/* 触摸手势：上下滑动滚动歌词 */
function onTouchStart(e) {
  moved = false
  downX = e.touches[0].clientX
  downY = e.touches[0].clientY
  lastDragY = e.touches[0].clientY
  lastInteract = Date.now()
}
function onTouchMove(e) {
  const y = e.touches[0].clientY
  const dy = y - lastDragY
  if (!moved && Math.abs(e.touches[0].clientX - downX) + Math.abs(downY - y) > 6) {
    moved = true
  }
  lastDragY = y
  bodyRef.value.scrollTop -= dy
  lastInteract = Date.now()
  updateActiveByScroll()
}
function onTouchEnd(e) {
  if (moved) return
  const t = e.changedTouches && e.changedTouches[0]
  if (!t) return
  const lineEl = t.target.closest ? t.target.closest('.lyric-line') : null
  if (!lineEl || lineEl.dataset.index == null) return
  const index = Number(lineEl.dataset.index)
  activeIndex.value = index
  updateActiveLine()
  scrollToActive()
  lastInteract = Date.now()
}

function goBack() {
  router.push('/')
}

/** 是否为音乐类文章：标签里含 music（含大小写），决定右侧播放按钮是否显示 */
const isMusic = computed(() => {
  if (!article.value || !Array.isArray(article.value.tags)) return false
  return article.value.tags.some((t) => String(t).toLowerCase() === 'music')
})

/** 纯音频播放地址：把音源链接的 autoplay 参数置为 1，点击后自动出声 */
const playSrc = computed(() => {
  if (!article.value || !article.value.audioUrl) return ''
  return article.value.audioUrl.replace(/autoplay=\d/, 'autoplay=1')
})
</script>

<template>
  <div class="article-page">
  <!-- 右侧空白处的播放按钮 + 第三方嵌入播放器。
       用 Teleport 传送到 body，避免被外层 <transition> 的 transform 影响 fixed 定位。
       兜底：只要带 music 标签就显示按钮；未填音源链接时点开提示去编辑页补充 -->
  <Teleport to="body">
    <div v-if="article && isMusic" class="player-dock">
      <button
        class="play-fab"
        :class="{ active: showPlayer }"
        :title="showPlayer ? '停止播放' : '播放音乐'"
        @click="togglePlayer"
      >
        <svg v-if="!showPlayer" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
        </svg>
      </button>
      <!-- 纯音频播放：iframe 视觉隐藏（屏幕外、不可见），仅出声不显示画面。
           无音源时给出轻量提示 -->
      <iframe
        v-if="showPlayer && playSrc"
        class="audio-only"
        :src="playSrc"
        allow="autoplay; encrypted-media"
      ></iframe>
      <div v-else-if="showPlayer && !playSrc" class="audio-tip">
        还没有音源链接，请在编辑页填写「音源嵌入链接」
      </div>
    </div>
  </Teleport>

  <div v-if="article" class="article-detail glass">
    <!-- 雨滴玻璃层（落在窗上的雨，流动感） -->
    <div class="rain-glass" aria-hidden="true">
      <span class="drop d1"></span>
      <span class="drop d2"></span>
      <span class="drop d3"></span>
      <span class="drop d4"></span>
      <span class="drop d5"></span>
      <span class="drop d6"></span>
      <span class="drop d7"></span>
      <span class="drop d8"></span>
    </div>

    <!-- 返回链接 -->
    <a
      href="#/"
      class="inline-flex items-center gap-1 text-sm text-[var(--text-soft)] no-underline mb-6 transition-colors duration-200 hover:text-[var(--accent)]"
      @click.prevent="goBack"
    >← 返回文章列表</a>

    <!-- 标题 -->
    <h1 class="text-[28px] font-bold leading-snug mb-3 tracking-tight">{{ article.title }}</h1>

    <!-- 元信息 -->
    <div class="flex flex-wrap items-center gap-3 mb-8 text-sm text-[var(--text-faint)]">
      <span class="font-mono">{{ article.date }}</span>
      <span class="w-0.75 h-0.75 rounded-full bg-[var(--glass-border)]"></span>
      <span>{{ article.category }}</span>
      <span class="w-0.75 h-0.75 rounded-full bg-[var(--glass-border)]"></span>
      <span v-for="tag in article.tags" :key="tag" class="tag-badge">{{ tag }}</span>
    </div>

    <!-- 封面图：固定显示在标题下方，不随歌词滚动 -->
    <div v-if="coverUrl" class="article-cover mb-[48px]">
      <img :src="coverUrl" alt="封面" class="w-full rounded-[14px] object-cover" />
    </div>

    <!-- 正文（歌词舞台） -->
    <div
      ref="bodyRef"
      class="article-body text-base leading-relaxed text-[var(--text)]"
      v-html="article.content"
      @wheel.prevent="onWheel"
      @mousedown="onMouseDown"
      @mouseleave="onMouseLeave"
      @click="onBodyClick"
      @touchstart.passive="onTouchStart"
      @touchmove.prevent="onTouchMove"
      @touchend.passive="onTouchEnd"
    >    </div>
  </div>

  <!-- 加载中 -->
  <div v-else-if="loading" class="text-center py-15 text-[#999]">
    <p class="text-[15px]">加载中...</p>
  </div>
  </div>
</template>

<style scoped>
/* 雨滴玻璃：模糊水膜 + 清晰可见的凝结水珠 + 缓慢滑落 + 水痕 */
.article-detail {
  position: relative;
  overflow: hidden;
}
.article-detail > * {
  position: relative;
  z-index: 1;
}

.rain-glass {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  pointer-events: none;
  overflow: hidden;
  -webkit-backdrop-filter: blur(1.4px);
  backdrop-filter: blur(1.4px);
  /* 细密凝结水珠：白高光 + 暗边，浅底上也能看清 */
  background-image:
    radial-gradient(circle at 30% 30%, rgba(255,255,255,.9) 0 1px, rgba(120,120,130,.18) 1.4px, transparent 2.2px),
    radial-gradient(circle at 70% 60%, rgba(255,255,255,.85) 0 .8px, rgba(120,120,130,.15) 1.2px, transparent 2px),
    radial-gradient(circle at 50% 20%, rgba(255,255,255,.9) 0 1.2px, rgba(120,120,130,.2) 1.6px, transparent 2.4px),
    radial-gradient(circle at 20% 80%, rgba(255,255,255,.85) 0 1px, rgba(120,120,130,.16) 1.4px, transparent 2.2px),
    radial-gradient(circle at 85% 45%, rgba(255,255,255,.9) 0 1px, rgba(120,120,130,.18) 1.4px, transparent 2.2px),
    radial-gradient(circle at 40% 95%, rgba(255,255,255,.8) 0 .8px, rgba(120,120,130,.14) 1.2px, transparent 2px);
  background-size: 80px 80px;
  animation: rainDrift 18s linear infinite;
}
@keyframes rainDrift {
  from { background-position: 0 0; }
  to   { background-position: 28px 50px; }
}

/* 滑落的大水珠（玻璃珠质感：白高光、暗描边、拖尾水痕） */
.drop {
  position: absolute;
  top: -10%;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  background:
    radial-gradient(circle at 35% 28%,
      rgba(255,255,255,.98) 0%,
      rgba(255,255,255,.55) 38%,
      rgba(150,160,175,.25) 70%,
      rgba(120,130,150,.12) 100%);
  box-shadow:
    inset -1.5px -2px 3px rgba(80,90,110,.28),
    inset 1.5px 2px 2px rgba(255,255,255,.9),
    0 2px 6px rgba(60,70,90,.18);
  opacity: 0;
  transform-origin: center top;
  animation: dropFall linear infinite;
}
/* 水痕拖尾 */
.drop::after {
  content: '';
  position: absolute;
  left: 50%;
  top: -1px;
  width: 1.5px;
  height: 0;
  transform: translateX(-50%);
  border-radius: 2px;
  background: linear-gradient(to top, rgba(150,160,180,.28), transparent);
  animation: trailGrow linear infinite;
  animation-duration: inherit;
  animation-delay: inherit;
}
@keyframes trailGrow {
  0%, 8%   { height: 0; opacity: 0; }
  40%      { height: 22px; opacity: .7; }
  88%      { height: 22px; opacity: .7; }
  100%     { height: 0; opacity: 0; }
}

.drop.d1 { left: 10%; width: 10px; height: 12px; animation-duration: 7s;   animation-delay: 0s; }
.drop.d2 { left: 27%; width: 6px;  height: 8px;  animation-duration: 9.5s; animation-delay: 2.2s; }
.drop.d3 { left: 43%; width: 13px; height: 16px; animation-duration: 6.4s; animation-delay: 1s; }
.drop.d4 { left: 60%; width: 8px;  height: 10px; animation-duration: 10s;  animation-delay: 3.6s; }
.drop.d5 { left: 76%; width: 5px;  height: 7px;  animation-duration: 8s;   animation-delay: 0.6s; }
.drop.d6 { left: 89%; width: 11px; height: 14px; animation-duration: 11s;  animation-delay: 4.4s; }
.drop.d7 { left: 34%; width: 7px;  height: 9px;  animation-duration: 8.6s; animation-delay: 5s; }
.drop.d8 { left: 68%; width: 9px;  height: 11px; animation-duration: 12s;  animation-delay: 1.8s; }

@keyframes dropFall {
  0%   { top: -8%;  opacity: 0;   transform: scale(.7); }
  8%   { opacity: .85; }
  40%  { transform: scale(1) translateX(2px); }
  70%  { transform: scale(1.12) translateX(-2px); }
  88%  { opacity: .85; }
  100% { top: 100%; opacity: 0;   transform: scale(1.2); }
}

/* 封面图：固定（不随歌词滚动），带玻璃卡片质感 */
.article-cover {
  position: relative;
  z-index: 1;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(60, 70, 90, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.5);
}
.article-cover img {
  display: block;
  max-height: 360px;
}

/* ===== 右侧播放按钮 + 第三方嵌入播放器 ===== */
.player-dock {
  position: fixed;
  top: 50%;
  right: clamp(12px, 4vw, 48px);
  transform: translateY(-50%);
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}
.play-fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.55);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  color: #e06b9c;
  box-shadow: 0 8px 26px rgba(224, 107, 156, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.play-fab:hover {
  transform: scale(1.06);
}
.play-fab.active {
  color: #fff;
  background: rgba(224, 107, 156, 0.92);
  box-shadow: 0 8px 26px rgba(224, 107, 156, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.5);
}
/* 纯音频：iframe 留在视口内（右下角极小、几乎不可见），但不挡交互、不出画面。
   关键：必须留在视口内，浏览器才认为媒体"可见"从而允许 click 手势触发的 autoplay */
.audio-only {
  position: fixed;
  right: 0;
  bottom: 0;
  width: 2px;
  height: 2px;
  border: 0;
  opacity: 0.01;
  pointer-events: none;
  z-index: -1;
}
/* 未填音源时的轻提示 */
.audio-tip {
  max-width: 240px;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  box-shadow: 0 10px 30px rgba(60, 70, 90, 0.18);
  font-size: 13px;
  color: #9a8a90;
  text-align: center;
}

@media (max-width: 768px) {
  .player-dock {
    top: auto;
    bottom: 16px;
    right: 16px;
    transform: none;
    flex-direction: column;
  }
}


/* ===== 歌词舞台 ===== */
.article-body {
  position: relative;
  height: 55vh;
  max-height: 520px;
  overflow: hidden;
  text-align: center;
  padding: 0 12px;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  /* 上下渐隐遮罩 */
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 18%,
    black 82%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 18%,
    black 82%,
    transparent 100%
  );
}
.article-body:active {
  cursor: grabbing;
}

/* 歌词行：默认淡出、缩小，粉色主题（浅玫瑰，不刺眼） */
.article-body :deep(.lyric-line) {
  margin: 0;
  padding: 16px 8px;
  font-size: 17px;
  line-height: 1.9;
  color: var(--lyric-line);
  opacity: 0.4;
  transform: scale(0.92);
  filter: blur(0.6px);
  transition: all 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  white-space: pre-wrap;
  will-change: transform, opacity, filter;
}

/* 当前激活行：高亮、居中、放大更明显、清晰 */
.article-body :deep(.lyric-line.active-line) {
  opacity: 1;
  transform: scale(1.22);
  filter: blur(0);
  color: var(--lyric-line-active);
  font-weight: 700;
  text-shadow: 0 2px 20px rgba(224, 107, 156, 0.28);
}

/* 普通富文本元素兜底（如果文章里有非歌词内容） */
.article-body :deep(h2) { font-size: 22px; font-weight: 600; margin: 36px 0 14px; }
.article-body :deep(h3) { font-size: 18px; font-weight: 600; margin: 28px 0 10px; }
.article-body :deep(p) { margin-bottom: 16px; }
.article-body :deep(ul),
.article-body :deep(ol) { margin-bottom: 16px; padding-left: 24px; }
.article-body :deep(li) { margin-bottom: 6px; }
.article-body :deep(blockquote) {
  border-left: 3px solid var(--accent);
  padding: 12px 20px;
  margin: 20px 0;
  background: var(--glass-bg-strong);
  border-radius: 0 8px 8px 0;
  color: var(--text-soft);
}
.article-body :deep(code) {
  background: var(--glass-bg-strong);
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
.article-body :deep(a) { color: var(--accent); text-decoration: underline; }

/* 详情页粉色主题：元信息 */
.article-detail .article-meta { color: var(--text-faint); }
</style>
