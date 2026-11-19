<script setup lang="ts">
import type { BlockContent, DefinitionContent, Root } from 'mdast'
import { watchAfterRender } from '@/composables/watchAfterRender'
import MarkdownBlock from './MarkdownBlock.vue'

const props = withDefaults(
  defineProps<{
    ast: Root
    loading?: boolean
  }>(),
  { loading: false }
)

/**
 * DOM 更新后触发 update 事件，用于滚动消息列表
 */
const emit = defineEmits<{ update: [] }>()

watchAfterRender(
  () => {
    emit('update')
  },
  () => [props.ast.children]
)
</script>

<template>
  <!-- 解析器在根节点下产出块级内容。 -->
  <div class="ds-markdown">
    <MarkdownBlock
      :nodes="ast.children as Array<BlockContent | DefinitionContent>"
      :loading="loading"
    />
  </div>
</template>
