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
    <div class="text-[13px] text-[#999] mb-1.5 font-mono">{{ article.date }}</div>
    <h2 class="text-lg font-semibold text-[#2c2c2c] mb-2 leading-snug group-hover:text-[#4a90d9]">
      {{ article.title }}
    </h2>
    <p class="text-sm text-[#6b6b6b] leading-relaxed line-clamp-3">
      {{ article.excerpt }}
    </p>
    <div class="flex flex-wrap gap-1.5 mt-3">
      <span v-for="tag in article.tags" :key="tag" class="tag-badge">
        {{ tag }}
      </span>
    </div>
  </div>
</template>
