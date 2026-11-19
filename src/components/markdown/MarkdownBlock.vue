<script setup lang="ts">
import type { BlockContent, DefinitionContent, List as ListNode } from 'mdast'
import CodeBlock from './CodeBlock.vue'
import MarkdownTable from './MarkdownTable.vue'
import MarkdownInline from './MarkdownInline.vue'
import MathBlock from './MathBlock.vue'

defineProps<{
  nodes: Array<BlockContent | DefinitionContent>
  loading: boolean
}>()

/** GFM 列表：ordered 时用 ol 并带 start */
const listTag = (node: ListNode) => (node.ordered ? 'ol' : 'ul')
const listStart = (node: ListNode) => (node.ordered ? node.start || undefined : undefined)
</script>

<template>
  <template v-for="(node, index) in nodes" :key="index">
    <MathBlock v-if="node.type === 'math'" :value="node.value" />
    <hr v-else-if="node.type === 'thematicBreak'" />
    <blockquote v-else-if="node.type === 'blockquote'">
      <MarkdownBlock :nodes="node.children" :loading="loading" />
    </blockquote>
    <br v-else-if="node.type === 'html' && /^<br\s*\/?>$/i.test(node.value)" />
    <span v-else-if="node.type === 'html'" class="ds-markdown-html">{{ node.value }}</span>
    <component
      :is="`h${node.depth}`"
      v-else-if="node.type === 'heading' && node.children.length > 0"
    >
      <MarkdownInline :nodes="node.children" />
    </component>
    <p v-else-if="node.type === 'paragraph'" class="ds-markdown-paragraph">
      <MarkdownInline :nodes="node.children" />
    </p>
    <CodeBlock
      v-else-if="node.type === 'code'"
      :code="node.value"
      :infostring="node.lang || 'text'"
      :loading="loading"
    />
    <MarkdownTable v-else-if="node.type === 'table'" :node="node" />
    <component :is="listTag(node)" v-else-if="node.type === 'list'" :start="listStart(node)">
      <template v-for="(child, childIndex) in node.children" :key="childIndex">
        <li :class="{ 'ds-markdown-task-list-item': typeof child.checked === 'boolean' }">
          <!-- □ U+25A1 / ☑ U+2611 -->
          <span v-if="typeof child.checked === 'boolean'" class="ds-markdown-task-checkbox">{{
            child.checked ? '☑  ' : '□  '
          }}</span>
          <MarkdownBlock :nodes="child.children" :loading="loading" />
        </li>
      </template>
    </component>
    <!-- 脚注与定义已在解析时换成段落 -->
  </template>
</template>
