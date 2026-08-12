import { h } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { authState, requireLogin, verifySession } from '../utils/auth.js'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import Admin from '../views/Admin.vue'
import ArticleDetail from '../views/ArticleDetail.vue'
import ArticleEditor from '../views/ArticleEditor.vue'
import Moments from '../views/Moments.vue'
import Friends from '../views/Friends.vue'
import Disclaimer from '../views/Disclaimer.vue'

const NotFound = {
  render() {
    return h(
      'div',
      { class: 'text-center py-15 text-[#999]' },
      [
        h('div', { class: 'text-5xl mb-3' }, '🔍'),
        h('p', { class: 'text-[15px]' }, '页面未找到'),
      ]
    )
  },
}

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/about', name: 'About', component: About },
  { path: '/admin', name: 'Admin', component: Admin, meta: { requiresAuth: true } },
  { path: '/admin/new', name: 'ArticleNew', component: ArticleEditor, meta: { requiresAuth: true } },
  { path: '/admin/edit/:id', name: 'ArticleEdit', component: ArticleEditor, props: true, meta: { requiresAuth: true } },
  { path: '/article/:id', name: 'ArticleDetail', component: ArticleDetail, props: true },
  { path: '/moments', name: 'Moments', component: Moments },
  { path: '/admin/friends', name: 'Friends', component: Friends, meta: { requiresAuth: true } },
  { path: '/disclaimer', name: 'Disclaimer', component: Disclaimer },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// 路由守卫 - 拦截管理页面
// eslint-disable-next-line no-unused-vars
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    if (authState.isAuthed) {
      // 进入管理页前实时复核数据库，防止手动伪造 session 标记
      const ok = await verifySession()
      if (ok) {
        next()
      } else {
        requireLogin(to.fullPath)
        next({ name: 'Home' })
      }
    } else {
      // 触发登录弹窗，暂存目标路径
      requireLogin(to.fullPath)
      // 跳回首页
      next({ name: 'Home' })
    }
  } else {
    next()
  }
})

export default router
