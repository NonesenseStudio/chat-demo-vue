<script setup lang="ts">
import { computed } from 'vue'
import type { Link as LinkNode } from 'mdast'

const props = defineProps<{ node: LinkNode }>()

const sanitizeUrl = (url: string) => {
  // 如果URL没有协议，添加默认的https协议
  if (url && !url.match(/^[a-zA-Z]+:\/\//) && !url.startsWith('mailto:')) {
    url = `https://${url}`
  }

  try {
    const parsedUrl = new URL(url)
    if (['http:', 'https:', 'mailto:'].includes(parsedUrl.protocol)) {
      return parsedUrl.toString()
    }
    return undefined
  } catch {
    return undefined
  }
}

const href = computed(() => sanitizeUrl(props.node.url))
const plain = computed(
  () => props.node.url.startsWith('#') || props.node.url.startsWith('mailto:')
)
</script>

<template>
  <!-- 锚点与邮件链接不跳新窗口，只渲染文字 -->
  <template v-if="plain">
    <slot />
  </template>
  <a v-else :href="href" :title="node.title || undefined" target="_blank" rel="noreferrer">
    <slot />
  </a>
</template>
