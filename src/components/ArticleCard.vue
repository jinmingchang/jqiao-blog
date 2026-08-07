<script setup>
defineProps({
  article: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="card">
    <div class="text-[13px] text-[var(--text-faint)] mb-1.5 font-mono">{{ article.date }}</div>
    <h2 class="text-lg font-semibold text-[var(--text)] mb-2 leading-snug group-hover:text-[var(--accent)]">
      {{ article.title }}
    </h2>
    <p class="text-sm text-[var(--text-soft)] leading-relaxed line-clamp-3">
      {{ article.excerpt }}
    </p>
    <div class="flex flex-wrap gap-1.5 mt-3">
      <span v-for="tag in article.tags" :key="tag" class="tag-badge">
        {{ tag }}
      </span>
    </div>
  </div>
</template>
