import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  base: '/jqiao-blog/',
  plugins: [vue(), UnoCSS()],
  server: {
    host: true, // 监听 0.0.0.0，允许局域网通过本机 IP 访问
    port: 5173,
    strictPort: false,
  },
})
