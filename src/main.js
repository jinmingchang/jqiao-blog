import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import '@unocss/reset/tailwind-compat.css'
import 'virtual:uno.css'
import './../css/style.css'
import App from './App.vue'
import router from './router'
import { initSupabase } from './utils/supabase'

// 初始化 Supabase（如果已配置）
initSupabase()

const app = createApp(App)
app.use(ElementPlus, { locale: zhCn })
app.use(router)
app.mount('#app')
