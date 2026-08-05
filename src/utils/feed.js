import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

// 公共 CORS 代理，用于绕过浏览器跨域限制
const CORS_PROXY = 'https://api.allorigins.win/raw?url='

function toArray(v) {
  if (v == null) return []
  return Array.isArray(v) ? v : [v]
}

/** 从 RSS/Atom feed 文本中解析出最新一篇文章 */
function parseLatestItem(xmlText) {
  const feed = parser.parse(xmlText)
  // RSS 2.0
  if (feed.rss && feed.rss.channel) {
    const items = toArray(feed.rss.channel.item)
    if (items.length) return normalizeRss(items[0])
  }
  // Atom
  if (feed.feed) {
    const entries = toArray(feed.feed.entry)
    if (entries.length) return normalizeAtom(entries[0])
  }
  return null
}

function stripHtml(html) {
  if (!html) return ''
  return String(html)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeRss(item) {
  const title = item.title || '(无标题)'
  const link =
    (item.link && (item.link['@_href'] || item.link)) ||
    (item.guid && item.guid['#text']) ||
    ''
  const pubDate = item.pubDate || item['dc:date'] || ''
  const rawContent =
    item['content:encoded'] || item.description || item.summary || ''
  const excerpt = stripHtml(rawContent).slice(0, 120)
  return { title, link: typeof link === 'string' ? link : '', pubDate, excerpt }
}

function normalizeAtom(entry) {
  const title = entry.title || '(无标题)'
  let link = ''
  const links = toArray(entry.link)
  if (links.length) {
    link = links[0]['@_href'] || links[0]
  }
  const updated = entry.updated || entry.published || ''
  const rawContent = entry.content || entry.summary || ''
  const excerpt = stripHtml(rawContent).slice(0, 120)
  return { title, link: typeof link === 'string' ? link : '', pubDate: updated, excerpt }
}

/**
 * 抓取某个朋友的 feed，返回最新一条博客
 * @param {{name:string, feedUrl:string, blogUrl:string}} friend
 */
export async function fetchLatestPost(friend) {
  if (!friend.feedUrl) return { ...friend, latest: null, error: '未配置 RSS 地址' }
  try {
    const target = CORS_PROXY + encodeURIComponent(friend.feedUrl)
    const res = await fetch(target)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const text = await res.text()
    const latest = parseLatestItem(text)
    return { ...friend, latest, error: null }
  } catch (e) {
    return { ...friend, latest: null, error: '抓取失败' }
  }
}

/** 并发抓取所有朋友的最新博客（限制并发，避免被代理限流） */
export async function fetchAllLatest(friends) {
  return Promise.all(friends.map((f) => fetchLatestPost(f)))
}
