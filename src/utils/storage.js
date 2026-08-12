import { initSupabase } from './supabase'

// ============================================
// Supabase 文章数据存储
// 表名：articles
// 字段：title, date, category, tags(text[]), excerpt, content, audio_url, hidden(boolean)
// 说明：hidden 为 true 的文章仅后台可见，前台列表/详情不展示。
//       如数据库尚无 hidden 列，请执行：
//       ALTER TABLE articles ADD COLUMN hidden boolean NOT NULL DEFAULT false;
// ============================================

function getSB() {
  const sb = initSupabase()
  if (!sb) throw new Error('Supabase 未配置，请先填写 src/config/supabase.js')
  return sb
}

/** 将数据库行转为文章数据结构 */
function mapArticle(row) {
  // 确保每篇文章都带有 music 标签（客户端兜底，无需改数据库）
  let tags = Array.isArray(row.tags) ? [...row.tags] : []
  if (!tags.map((t) => String(t).toLowerCase()).includes('music')) {
    tags.push('music')
  }
  return {
    id: row.id,
    title: row.title || '',
    date: row.date || '',
    category: row.category || '未分类',
    tags,
    excerpt: row.excerpt || '',
    content: row.content || '',
    audioUrl: row.audio_url || '',
    hidden: !!row.hidden,
    createdAt: row.created_at,
  }
}

/**
 * 获取文章（按创建时间倒序）
 * @param {object} opts
 * @param {boolean} [opts.includeHidden] - 为 true 时一并返回隐藏文章（后台用）；前台默认只返回可见文章
 */
export async function loadArticles(opts = {}) {
  const sb = getSB()
  let query = sb.from('articles').select('*')
  if (!opts.includeHidden) {
    // 隐藏文章仅后台可见
    query = query.eq('hidden', false)
  }
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapArticle)
}

/** 根据 ID 查找单篇文章 */
export async function findArticle(id) {
  const sb = getSB()
  const { data, error } = await sb
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return { article: mapArticle(data) }
}

/** 新增文章 */
export async function addArticle(data) {
  const sb = getSB()
  const { data: row, error } = await sb
    .from('articles')
    .insert({
      title: data.title,
      date: data.date,
      category: data.category,
      tags: data.tags || [],
      excerpt: data.excerpt || '',
      content: data.content || '',
      audio_url: data.audioUrl || '',
      hidden: !!data.hidden,
    })
    .select()
    .single()
  if (error) throw error
  return mapArticle(row)
}

/** 更新文章 */
export async function updateArticle(id, data) {
  const sb = getSB()
  const { data: row, error } = await sb
    .from('articles')
    .update({
      title: data.title,
      date: data.date,
      category: data.category,
      tags: data.tags || [],
      excerpt: data.excerpt || '',
      content: data.content || '',
      audio_url: data.audioUrl || '',
      hidden: !!data.hidden,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapArticle(row)
}

/** 仅切换文章的隐藏状态 */
export async function setArticleHidden(id, hidden) {
  const sb = getSB()
  const { data: row, error } = await sb
    .from('articles')
    .update({ hidden: !!hidden })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapArticle(row)
}

/** 删除文章 */
export async function deleteArticle(id) {
  const sb = getSB()
  const { error } = await sb.from('articles').delete().eq('id', id)
  if (error) throw error
}

// ============================================
// 分类字典（独立维护，便于统一增删改）
// 表名：categories
// 字段：id(bigint, pk), name(text), sort(int)
// ============================================

/** 读取分类字典（按 sort 升序，再按 name） */
export async function loadCategories() {
  const sb = getSB()
  const { data, error } = await sb
    .from('categories')
    .select('*')
    .order('sort', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw error
  return (data || []).map((r) => ({ id: r.id, name: r.name, sort: r.sort ?? 0 }))
}

/** 前台/编辑器取分类名称数组 */
export async function getCategories() {
  const list = await loadCategories()
  return list.map((c) => c.name)
}

/** 新增分类 */
export async function addCategory(name, sort = 0) {
  const sb = getSB()
  const { data, error } = await sb
    .from('categories')
    .insert({ name: name.trim(), sort })
    .select()
    .single()
  if (error) throw error
  return data
}

/** 重命名分类 */
export async function updateCategory(id, name, sort) {
  const sb = getSB()
  const patch = { name: name.trim() }
  if (typeof sort === 'number') patch.sort = sort
  const { data, error } = await sb
    .from('categories')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/** 删除分类 */
export async function deleteCategory(id) {
  const sb = getSB()
  const { error } = await sb.from('categories').delete().eq('id', id)
  if (error) throw error
}

/** 返回今天的日期字符串 YYYY-MM-DD */
export function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

// ============================================
// 朋友（博主）数据
// 表名：friends
// 字段：name, feed_url, blog_url
// ============================================

function mapFriend(row) {
  return {
    id: row.id,
    name: row.name || '',
    feedUrl: row.feed_url || '',
    blogUrl: row.blog_url || '',
    createdAt: row.created_at,
  }
}

/** 获取所有朋友（按创建时间倒序） */
export async function loadFriends() {
  const sb = getSB()
  const { data, error } = await sb
    .from('friends')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapFriend)
}

/** 新增朋友 */
export async function addFriend(payload) {
  const sb = getSB()
  const { data: row, error } = await sb
    .from('friends')
    .insert({
      name: payload.name,
      feed_url: payload.feedUrl || '',
      blog_url: payload.blogUrl || '',
    })
    .select()
    .single()
  if (error) throw error
  return mapFriend(row)
}

/** 更新朋友 */
export async function updateFriend(id, payload) {
  const sb = getSB()
  const { data: row, error } = await sb
    .from('friends')
    .update({
      name: payload.name,
      feed_url: payload.feedUrl || '',
      blog_url: payload.blogUrl || '',
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapFriend(row)
}

/** 批量删除朋友 */
export async function batchDeleteFriends(ids) {
  const sb = getSB()
  const { error } = await sb.from('friends').delete().in('id', ids)
  if (error) throw error
}

/** 删除朋友 */
export async function deleteFriend(id) {
  const sb = getSB()
  const { error } = await sb.from('friends').delete().eq('id', id)
  if (error) throw error
}

// ============================================
// 管理密码（存于数据库，不再放浏览器本地）
// 表名：admin_settings
// 字段：key(text, pk), value(text)
// 说明：password 以 SHA-256(hex) 哈希存储，库中无明文。
//       前端 JS 对所有人公开，因此【绝不】在代码里写默认密码——
//       密码必须且仅能通过 SQL 预置到数据库（见下方建表+预置脚本）。
// 前端需要对该表有 select（登录校验哈希）与 update（改密码）权限。
// ============================================

const PWD_KEY = 'admin_password'
// 注意：不要在此处硬编码任何默认密码！前端 JS 对所有人公开，
// 硬编码默认密码等于给项目开后门。密码必须且仅能通过 SQL 预置到数据库。

/** 纯 JavaScript SHA-256（不依赖 crypto.subtle，兼容 HTTP 环境） */
export function sha256(text) {
  function rightRotate(value, amount) {
    return ((value >>> amount) | (value << (32 - amount))) >>> 0
  }
  const utf8 = new TextEncoder().encode(text)
  const msgLen = utf8.length * 8
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]
  let H0 = 0x6a09e667, H1 = 0xbb67ae85, H2 = 0x3c6ef372, H3 = 0xa54ff53a
  let H4 = 0x510e527f, H5 = 0x9b05688c, H6 = 0x1f83d9ab, H7 = 0x5be0cd19
  const words = []
  for (let i = 0; i < utf8.length; i++) words[i >>> 2] |= (utf8[i] & 0xff) << (24 - (i % 4) * 8)
  words[utf8.length >>> 2] |= 0x80 << (24 - (utf8.length % 4) * 8)
  words[(((utf8.length + 64) >>> 9) << 4) + 15] = msgLen
  for (let i = 0; i < words.length; i += 16) {
    const w = new Array(64)
    for (let t = 0; t < 16; t++) w[t] = words[i + t] || 0
    for (let t = 16; t < 64; t++) {
      const s0 = rightRotate(w[t - 15], 7) ^ rightRotate(w[t - 15], 18) ^ (w[t - 15] >>> 3)
      const s1 = rightRotate(w[t - 2], 17) ^ rightRotate(w[t - 2], 19) ^ (w[t - 2] >>> 10)
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0
    }
    let a = H0, b = H1, c = H2, d = H3, e = H4, f = H5, g = H6, h = H7
    for (let t = 0; t < 64; t++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 = (h + S1 + ch + K[t] + w[t]) >>> 0
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (S0 + maj) >>> 0
      h = g; g = f; f = e; e = (d + temp1) >>> 0
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0
    }
    H0 = (H0 + a) >>> 0; H1 = (H1 + b) >>> 0; H2 = (H2 + c) >>> 0; H3 = (H3 + d) >>> 0
    H4 = (H4 + e) >>> 0; H5 = (H5 + f) >>> 0; H6 = (H6 + g) >>> 0; H7 = (H7 + h) >>> 0
  }
  return [H0, H1, H2, H3, H4, H5, H6, H7]
    .map((h) => h.toString(16).padStart(8, '0'))
    .join('')
}

/**
 * 读取库中密码哈希。
 * 若数据库尚无 admin_password 记录，则抛出异常，要求管理员先通过 SQL 预置密码，
 * 绝不在前端写入任何默认密码（前端代码公开，默认密码等于后门）。
 */
export async function getAdminPasswordHash() {
  const sb = getSB()
  const { data, error } = await sb
    .from('admin_settings')
    .select('value')
    .eq('key', PWD_KEY)
    .maybeSingle()
  if (error) throw error
  if (!data) {
    throw new Error('数据库尚未配置管理密码，请先在 Supabase 执行 SQL 预置')
  }
  return data.value
}

/** 校验明文密码是否正确（库无密码时直接返回 false） */
export async function verifyAdminPassword(plain) {
  let stored
  try {
    stored = await getAdminPasswordHash()
  } catch {
    // 未配置密码
    return false
  }
  return sha256(plain) === stored
}

/** 更新管理密码（写入哈希） */
export async function setAdminPassword(plain) {
  const sb = getSB()
  const hash = sha256(plain)
  const { error } = await sb
    .from('admin_settings')
    .upsert({ key: PWD_KEY, value: hash })
  if (error) throw error
}
