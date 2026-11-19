<script setup lang="ts">
import { useMathHtml } from '@/composables/useMathHtml'

const props = defineProps<{ value: string }>()

const formula = useMathHtml(() => props.value, false)
</script>

<template>
  <p v-if="formula.renderMode === 'fallback'" class="ds-markdown-paragraph">
    {{ formula.html }}
  </p>
  <span v-else class="katex-display ds-markdown-math">
    <span class="katex" v-html="formula.html" />
  </span>
</template>
