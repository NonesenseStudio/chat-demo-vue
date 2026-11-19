<script setup lang="ts">
import type { Source } from '@/services/chat/view'
import HoverCard from './HoverCard.vue'
import SourceCard from './SourceCard.vue'

defineProps<{
  source: Source
}>()

/**
 * 正文里 [citation:N] 的数字角标：悬停预览来源，点击新标签打开。
 * 角标使用带 link 角色的 span，可嵌入链接文字。样式由 .ds-markdown-cite 提供。
 */
const open = (event: MouseEvent, url: string) => {
  event.preventDefault()
  event.stopPropagation()
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <HoverCard>
    <template #trigger="{ setAnchorRef, domProps }">
      <span
        :ref="setAnchorRef"
        class="ds-markdown-cite"
        role="link"
        v-on="domProps"
        @click="open($event, source.url)"
      >
        {{ source.index }}
      </span>
    </template>
    <SourceCard :source="source" />
  </HoverCard>
</template>
