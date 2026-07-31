import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  presets: [presetUno()],
  theme: {
    fontFamily: {
      mono: "'SF Mono', 'Fira Code', 'Consolas', monospace",
    },
  },
  shortcuts: {
    'card':
      'bg-white border border-[#eaeaea] rounded-lg p-6 shadow-sm hover:border-[#ccc] hover:shadow-md hover:-translate-y-px transition-all duration-200 cursor-pointer',
    'tag-badge':
      'inline-block px-2.5 py-0.5 rounded-xl text-xs bg-[#f0f4f8] text-[#5a7a9a]',
  },
})
