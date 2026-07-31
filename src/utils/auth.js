import { reactive } from 'vue'

const AUTH_KEY = 'blog_auth'
const PASSWORD_KEY = 'blog_admin_password'
const DEFAULT_PASSWORD = 'admin123'

// 认证状态 (响应式)
export const authState = reactive({
  isAuthed: sessionStorage.getItem(AUTH_KEY) === 'true',
  showLogin: false,
  pendingPath: null,
})

// 获取/设置密码
export function getStoredPassword() {
  return localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD
}

export function setStoredPassword(newPwd) {
  localStorage.setItem(PASSWORD_KEY, newPwd)
}

// 验证密码
export function verifyPassword(input) {
  return input === getStoredPassword()
}

// 登录
export function login(password) {
  if (verifyPassword(password)) {
    sessionStorage.setItem(AUTH_KEY, 'true')
    authState.isAuthed = true
    authState.showLogin = false
    return true
  }
  return false
}

// 登出
export function logout() {
  sessionStorage.removeItem(AUTH_KEY)
  authState.isAuthed = false
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
