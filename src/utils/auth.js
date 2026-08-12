import { reactive } from 'vue'
import { verifyAdminPassword } from './storage.js'

const AUTH_KEY = 'blog_auth'
const PWD_KEY = 'blog_auth_pwd' // 仅存于 sessionStorage，用于进入后台时实时复核（刷新仍有效）

// 认证状态 (响应式)
export const authState = reactive({
  isAuthed: sessionStorage.getItem(AUTH_KEY) === 'true',
  showLogin: false,
  pendingPath: null,
})

// 校验密码（异步，访问数据库）
export async function verifyPassword(input) {
  return await verifyAdminPassword(input)
}

// 登录：校验数据库，并把密码暂存本会话用于后续复核
export async function login(password) {
  if (await verifyPassword(password)) {
    sessionStorage.setItem(AUTH_KEY, 'true')
    sessionStorage.setItem(PWD_KEY, password)
    authState.isAuthed = true
    authState.showLogin = false
    return true
  }
  return false
}

// 登出
export function logout() {
  sessionStorage.removeItem(AUTH_KEY)
  sessionStorage.removeItem(PWD_KEY)
  authState.isAuthed = false
}

// 进入管理页时实时复核：拿本会话存的密码再去数据库校验一次。
// 手动改 sessionStorage['blog_auth']=true 而无密码会复核失败，被强制登出。
export async function verifySession() {
  const pwd = sessionStorage.getItem(PWD_KEY)
  if (!pwd) {
    logout()
    return false
  }
  try {
    const ok = await verifyAdminPassword(pwd)
    if (!ok) logout()
    return ok
  } catch {
    logout()
    return false
  }
}

// 触发登录弹窗 (路由守卫调用)
export function requireLogin(toPath) {
  if (!authState.isAuthed) {
    authState.pendingPath = toPath
    authState.showLogin = true
    return false
  }
  return true
}
