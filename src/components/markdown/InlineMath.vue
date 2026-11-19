<script setup lang="ts">
import { useMathHtml } from '@/composables/useMathHtml'

const props = defineProps<{ value: string }>()

const formula = useMathHtml(() => props.value, true)
</script>

<template>
  <!-- 渲染失败时保留原文 -->
  <template v-if="formula.renderMode === 'fallback'">{{ formula.html }}</template>
  <span v-else class="katex" v-html="formula.html" />
</template>
