import { initSupabase } from './supabase'

// ============================================
// Supabase 文章数据存储
// 表名：articles
// 字段：title, date, category, tags(text[]), excerpt, content
// ============================================

function getSB() {
  const sb = initSupabase()
  if (!sb) throw new Error('Supabase 未配置，请先填写 src/config/supabase.js')
  return sb
}

/** 将数据库行转为文章数据结构 */
function mapArticle(row) {
  return {
    id: row.id,
    title: row.title || '',
    date: row.date || '',
    category: row.category || '未分类',
    tags: row.tags || [],
    excerpt: row.excerpt || '',
    content: row.content || '',
    createdAt: row.created_at,
  }
}

/** 获取所有文章（按创建时间倒序） */
export async function loadArticles() {
  const sb = getSB()
  const { data, error } = await sb
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false })
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
    })
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

/** 获取所有分类 */
export async function getCategories() {
  const articles = await loadArticles()
  return [...new Set(articles.map((a) => a.category))]
}

/** 返回今天的日期字符串 YYYY-MM-DD */
export function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
