<script setup lang="ts">
import { computed } from 'vue'
import type { Source } from '@/services/chat/view'
import { toMdAst } from '@/services/markdown/parse'
import { useScrollToBottom } from '@/components/messages/useScrollToBottom'
import MarkdownAstRenderer from './MarkdownAstRenderer.vue'
import { useThrottleMarkdownRender } from '@/composables/useThrottleMarkdownRender'

const props = withDefaults(
  defineProps<{
    content: string
    loading: boolean
    cacheKey: string
    disableLink: boolean
    sources?: Source[]
  }>(),
  { sources: undefined }
)

/**
 * 渲染链路：节流 → 解析 AST → 渲染。
 * 传入 sources 时把正文里的 [citation:N] 渲染为角标。
 */
const scrollToBottom = useScrollToBottom()
const throttledMarkdown = useThrottleMarkdownRender(
  () => props.content,
  () => props.loading
)
const ast = computed(() =>
  throttledMarkdown.value
    ? toMdAst(throttledMarkdown.value, {
        sources: props.sources,
        disableLink: props.disableLink,
      })
    : null
)
</script>

<template>
  <MarkdownAstRenderer
    v-if="ast"
    :key="cacheKey"
    :ast="ast"
    :loading="loading"
    @update="scrollToBottom"
  />
</template>

<style src="@/assets/styles/markdown.css"></style>
<style src="@/assets/styles/highlight.css"></style>
