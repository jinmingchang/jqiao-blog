import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  base: '/jqiao-blog/',
  plugins: [vue(), UnoCSS()],
})
