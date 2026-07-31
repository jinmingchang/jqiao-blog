// ===== 文章数据管理 (localStorage) =====

const STORAGE_KEY = 'blog_articles'
const NEXT_ID_KEY = 'blog_next_id'

// 默认种子数据
const SEED_ARTICLES = [
  {
    id: 1,
    title: '如何写出更清晰的前端代码',
    date: '2026-07-28',
    category: '前端开发',
    tags: ['JavaScript', '代码规范', 'Clean Code'],
    excerpt: '写代码不只是让机器能运行，更是让人能看懂。本文分享一些让前端代码更清晰可维护的实践心得。',
    content:
      '<p>在日常开发中，我们常常会为了快速上线而写一些"能用就行"的代码。但随着时间的推移，这些代码会变成技术债务，让后续的维护变得异常艰难。</p><h2>一、命名是一门艺术</h2><p>好的变量名和函数名应该能"自解释"。当你看到 <code>getUserById</code> 时，你不需要注释就能知道它在做什么。相比之下，<code>fn1</code> 或 <code>process</code> 这样的命名只会让人困惑。</p><p>一个简单的原则：<strong>变量名是名词，函数名是动词</strong>。比如 <code>userList</code> 和 <code>fetchUserList</code>。</p><h2>二、函数应该小而专注</h2><p>一个函数只做一件事，这是最重要的原则之一。如果一个函数超过 30 行，就要考虑是否可以拆分成更小的函数。</p><blockquote>任何一个傻瓜都能写出计算机可以理解的代码，唯有能写出人类容易理解的代码，才是优秀的程序员。—— Martin Fowler</blockquote><h2>三、善用组合而非继承</h2><p>在组件化开发中，组合模式往往比继承更灵活。React 的 Hooks、Vue 的 Composables 都是组合思想的体现。</p><h2>四、保持一致的代码风格</h2><p>在团队协作中，统一的代码风格至关重要。推荐使用 ESLint + Prettier 来自动化代码格式化和检查。</p><h2>总结</h2><p>写清晰代码的核心在于：<strong>为未来的自己和同事着想</strong>。</p>',
  },
  {
    id: 2,
    title: 'Git 工作流的实践与思考',
    date: '2026-07-22',
    category: '工程实践',
    tags: ['Git', 'DevOps', '团队协作'],
    excerpt: '一个好的 Git 工作流能让团队协作事半功倍。本文总结了我们在项目中使用的 Git 分支策略与提交规范。',
    content:
      '<p>Git 是现代软件开发不可或缺的工具。但如果没有一个好的工作流，Git 也可能成为混乱的来源。以下是我在实践中总结的一些经验。</p><h2>分支策略</h2><p>我们采用简化版的 Git Flow：</p><ul><li><strong>main</strong>：生产环境代码</li><li><strong>develop</strong>：开发主线</li><li><strong>feature/*</strong>：功能分支</li><li><strong>hotfix/*</strong>：紧急修复分支</li></ul><h2>提交信息规范</h2><p>我们遵循 Conventional Commits 规范：<code>feat:</code> 新功能、<code>fix:</code> 修复、<code>docs:</code> 文档、<code>refactor:</code> 重构。</p><h2>Code Review 文化</h2><p>每个 PR 至少需要一个人 Review 后才能合并。Review 时关注：代码逻辑是否正确、是否有潜在的性能问题、命名是否清晰。</p><blockquote>Code Review 不是为了找茬，而是为了让代码变得更好。</blockquote>',
  },
  {
    id: 3,
    title: 'CSS Grid 布局完全指南',
    date: '2026-07-15',
    category: '前端开发',
    tags: ['CSS', '布局', 'Grid'],
    excerpt: 'CSS Grid 是现代 Web 布局的利器。本文从基础到进阶，带你全面掌握 Grid 布局的使用方法。',
    content:
      '<p>CSS Grid Layout 是 CSS 中最强大的布局系统。它是一个二维系统，可以同时处理列和行。</p><h2>基础概念</h2><p>Grid 容器通过 <code>display: grid</code> 声明。容器内的直接子元素自动成为 Grid 项。</p><h2>fr 单位</h2><p><code>fr</code> 是 Grid 独有的弹性单位，代表"可用空间的一份"。它会自动计算并分配剩余空间，比百分比更加灵活。</p><h2>实战：圣杯布局</h2><p>使用 Grid 实现经典的圣杯布局只需几行代码，配合 <code>grid-template-areas</code> 即可轻松完成。</p><h2>总结</h2><p>Grid 布局功能强大，建议与 Flexbox 配合使用：Grid 用于页面整体布局，Flexbox 用于组件内部的一维排列。</p>',
  },
  {
    id: 4,
    title: 'TypeScript 类型体操入门',
    date: '2026-07-08',
    category: '前端开发',
    tags: ['TypeScript', '类型系统', '进阶'],
    excerpt: 'TypeScript 的类型系统远比想象的强大。本文带你探索一些实用的高级类型技巧，让你的代码更安全。',
    content:
      '<p>TypeScript 不仅仅是"给 JavaScript 加类型"，它的类型系统是图灵完备的。掌握一些高级类型技巧，可以让你的代码更加健壮。</p><h2>泛型约束</h2><p>泛型让函数和类可以处理多种类型，而约束确保了类型安全。</p><h2>条件类型</h2><p>条件类型可以根据条件选择不同的类型，让类型定义更加灵活。</p><h2>工具类型实战</h2><p>TypeScript 内置了大量工具类型：<code>Partial&lt;T&gt;</code>、<code>Required&lt;T&gt;</code>、<code>Pick&lt;T, K&gt;</code>、<code>Omit&lt;T, K&gt;</code>、<code>Record&lt;K, T&gt;</code>。</p><blockquote>类型体操不是炫技，而是让类型系统为你工作，在编译时就发现潜在问题。</blockquote>',
  },
  {
    id: 5,
    title: '构建高性能 Node.js 应用',
    date: '2026-06-30',
    category: '后端开发',
    tags: ['Node.js', '性能优化', '架构'],
    excerpt: '随着业务增长，Node.js 应用的性能优化变得越来越重要。本文分享几个实用的性能优化策略。',
    content:
      '<p>Node.js 的单线程事件循环模型非常高效，但如果使用不当也很容易成为瓶颈。以下是一些实用的优化技巧。</p><h2>避免阻塞事件循环</h2><p>CPU 密集型任务会阻塞事件循环：将计算密集任务交给 Worker Threads、使用 <code>setImmediate()</code> 拆分大任务、使用 Redis 等缓存。</p><h2>数据库查询优化</h2><p>慢查询是大多数应用的主要瓶颈：确保查询使用了正确的索引、使用连接池、避免 N+1 查询、合理使用批量操作。</p><h2>使用 Cluster 模块</h2><p>充分利用多核 CPU，通过 Cluster 模块实现多进程负载均衡。</p>',
  },
  {
    id: 6,
    title: '我的 2026 年中阅读清单',
    date: '2026-07-01',
    category: '随笔',
    tags: ['阅读', '书单', '成长'],
    excerpt: '上半年读了几本好书，有些关于技术，有些关于思维。分享给大家，也当作自己的一个记录。',
    content:
      '<p>阅读是我生活中很重要的一部分。今年上半年读了不少好书，挑几本印象最深的分享给大家。</p><h2>《程序员修炼之道》</h2><p>这本书虽然已经出版多年，但每次重读都有新的收获。它讲的不是具体的技术，而是编程的哲学和方法论。</p><h2>《深入理解计算机系统》</h2><p>经典中的经典。如果你想真正理解计算机是如何工作的，这本书是必读的。</p><h2>《思考，快与慢》</h2><p>这不是技术书，但它让我更好地理解了人类的决策过程。</p><blockquote>读书不是为了记住所有内容，而是让那些好的思想慢慢地改变你的思维方式。</blockquote><h2>阅读习惯分享</h2><ul><li>每天固定留出 30 分钟阅读时间</li><li>技术书和人文书交叉阅读</li><li>读完写几句简短的笔记</li></ul>',
  },
]

// 初始化
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ARTICLES))
    localStorage.setItem(NEXT_ID_KEY, '7')
  }
}

// 获取所有文章
export function loadArticles() {
  initStorage()
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : []
}

// 保存文章列表
function saveArticles(articles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles))
}

// 获取下一个 ID
function getNextId() {
  const id = parseInt(localStorage.getItem(NEXT_ID_KEY) || '7', 10)
  localStorage.setItem(NEXT_ID_KEY, String(id + 1))
  return id
}

// 查找文章
export function findArticle(id) {
  const articles = loadArticles()
  for (const [i, article] of articles.entries()) {
    if (article.id === id) return { article, index: i }
  }
  return null
}

// 新增文章
export function addArticle(data) {
  const articles = loadArticles()
  const article = {
    id: getNextId(),
    title: data.title || '',
    date: data.date || todayStr(),
    category: data.category || '未分类',
    tags: data.tags || [],
    excerpt: data.excerpt || '',
    content: data.content || '',
  }
  articles.push(article)
  saveArticles(articles)
  return article
}

// 更新文章
export function updateArticle(id, data) {
  const articles = loadArticles()
  for (let i = 0; i < articles.length; i++) {
    if (articles[i].id === id) {
      articles[i].title = data.title ?? articles[i].title
      articles[i].date = data.date ?? articles[i].date
      articles[i].category = data.category ?? articles[i].category
      articles[i].tags = data.tags ?? articles[i].tags
      articles[i].excerpt = data.excerpt ?? articles[i].excerpt
      articles[i].content = data.content ?? articles[i].content
      saveArticles(articles)
      return true
    }
  }
  return false
}

// 删除文章
export function deleteArticle(id) {
  const articles = loadArticles()
  const filtered = articles.filter((a) => a.id !== id)
  if (filtered.length === articles.length) return false
  saveArticles(filtered)
  return true
}

// 获取所有分类
export function getCategories() {
  const articles = loadArticles()
  const seen = new Set()
  const categories = []
  articles.forEach((a) => {
    if (!seen.has(a.category)) {
      seen.add(a.category)
      categories.push(a.category)
    }
  })
  return categories
}

// 获取今天日期字符串
export function todayStr() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
