<template>
  <div class="disclaimer-page">
    <h1 class="text-[28px] font-bold mb-6 tracking-tight">声明</h1>

    <div class="glass p-8 space-y-6">
      <section>
        <h2 class="text-lg font-semibold mb-2">内容声明</h2>
        <p class="text-[15px] leading-relaxed text-[var(--text-soft)]">
          本博客所有文章内容均为博主个人观点与学习记录，仅供交流与参考之用。
          文中涉及的技术结论、操作步骤及观点不代表任何组织或第三方的立场，
          亦不构成任何形式的专业建议。
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-2">版权声明</h2>
        <p class="text-[15px] leading-relaxed text-[var(--text-soft)]">
          除特别注明外，本博客原创内容（包括但不限于文字、图片、代码）的著作权归博主所有。
          未经书面许可，不得以任何方式转载、复制或用于商业用途。
          转载请注明出处并保留本声明。
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-2">免责声明</h2>
        <p class="text-[15px] leading-relaxed text-[var(--text-soft)]">
          博主已尽力确保内容的准确性与时效性，但对因使用本站内容导致的任何直接或间接损失
          不承担责任。部分内容可能随技术发展而过时，请以最新资料为准。
          本站可能包含指向第三方网站的链接，博主无法控制其内容与安全性，
          访问风险由您自行承担。
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-2">隐私声明</h2>
        <p class="text-[15px] leading-relaxed text-[var(--text-soft)]">
          本博客不主动收集您的个人身份信息。访问日志等数据仅用于站点维护与统计分析，
          不会对外出售或非法提供给第三方。如您对本声明有任何疑问，
          可通过博主公开的联络方式沟通。
        </p>
      </section>

      <p class="text-[13px] text-[var(--text-faint)] pt-2 border-t border-[var(--glass-border-soft)]">
        最后更新：2026 年 8 月
      </p>
    </div>
  </div>
</template>

<style scoped>
.disclaimer-page :deep(.glass) {
  border-radius: 16px;
}
.disclaimer-page section {
  margin-bottom: 0;
}
</style>
