<template>
  <div class="about-page">
    <h1 class="text-[28px] font-bold mb-6 tracking-tight">关于我</h1>

    <div class="glass p-8">
      <!-- 头像 -->
      <div class="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-5"
        style="background: rgba(74,144,217,0.14); backdrop-filter: blur(8px); box-shadow: inset 0 1px 1px rgba(255,255,255,0.8);">
        👨‍💻
      </div>

      <!-- 基本信息 -->
      <h2 class="text-2xl font-bold mb-2">张三</h2>
      <p class="text-[#6b6b6b] text-[15px] leading-relaxed mb-6">
        一名热爱技术的前端开发者，目前专注于 Web 开发和用户体验优化。喜欢探索新技术，享受用代码创造价值的乐趣。工作之余喜欢读书、摄影和徒步。
      </p>

      <!-- 技术栈 -->
      <div class="mt-6">
        <h3 class="text-lg font-semibold mb-2.5">技术栈</h3>
        <ul class="list-none p-0 text-sm text-[#6b6b6b] leading-relaxed">
          <li class="mb-1 before:content-['—_'] before:text-[#999]">前端：Vue / React / TypeScript / Tailwind CSS</li>
          <li class="mb-1 before:content-['—_'] before:text-[#999]">后端：Node.js / Express / MongoDB</li>
          <li class="mb-1 before:content-['—_'] before:text-[#999]">工具：Git / Docker / VS Code / Figma</li>
        </ul>
      </div>

      <!-- 联系我 -->
      <div class="mt-6">
        <h3 class="text-lg font-semibold mb-2.5">联系我</h3>
        <p class="text-sm text-[#6b6b6b] leading-relaxed mb-4">欢迎通过以下方式联系：</p>
      </div>

      <!-- 链接 -->
      <div class="flex gap-4 mt-6">
        <a
          href="https://github.com"
          target="_blank"
          class="pill-link text-sm px-4 py-1.5 rounded-full text-[#6b6b6b] no-underline transition-all duration-200"
        >GitHub</a>
        <a
          href="mailto:hello@example.com"
          class="pill-link text-sm px-4 py-1.5 rounded-full text-[#6b6b6b] no-underline transition-all duration-200"
        >Email</a>
        <a
          href="#"
          target="_blank"
          class="pill-link text-sm px-4 py-1.5 rounded-full text-[#6b6b6b] no-underline transition-all duration-200"
        >Twitter</a>
      </div>
    </div>
  </div>
</template>
