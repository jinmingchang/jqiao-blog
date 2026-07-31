import { h } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { authState, requireLogin } from '../utils/auth.js'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import Admin from '../views/Admin.vue'
import ArticleDetail from '../views/ArticleDetail.vue'
import ArticleEditor from '../views/ArticleEditor.vue'

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
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// 路由守卫 - 拦截管理页面
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    if (authState.isAuthed) {
      next()
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
