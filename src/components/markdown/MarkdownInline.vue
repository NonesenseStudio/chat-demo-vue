<script setup lang="ts">
import type { PhrasingContent } from 'mdast'
import CitationLink from '@/components/search/CitationLink.vue'
import ImageAsLink from './ImageAsLink.vue'
import Link from './Link.vue'
import InlineMath from './InlineMath.vue'

defineProps<{
  nodes: PhrasingContent[]
}>()

/** 按 \n 拆行插 <br>：源文每个换行（含软换行）都渲染为视觉换行 */
const lines = (value: string) => value.split(/\r?\n/)
</script>

<template>
  <template v-for="(node, index) in nodes" :key="index">
    <InlineMath v-if="node.type === 'inlineMath'" :value="node.value" />
    <br v-else-if="node.type === 'break'" />
    <em v-else-if="node.type === 'emphasis'">
      <MarkdownInline :nodes="node.children" />
    </em>
    <ImageAsLink v-else-if="node.type === 'image'" :node="node" />
    <br v-else-if="node.type === 'html' && /^<br\s*\/?>$/i.test(node.value)" />
    <span v-else-if="node.type === 'html'" class="ds-markdown-html">{{ node.value }}</span>
    <code v-else-if="node.type === 'inlineCode'">{{ node.value }}</code>
    <Link v-else-if="node.type === 'link'" :node="node">
      <MarkdownInline :nodes="node.children" />
    </Link>
    <strong v-else-if="node.type === 'strong'">
      <MarkdownInline :nodes="node.children" />
    </strong>
    <template v-else-if="node.type === 'text'">
      <template v-for="(line, lineIndex) in lines(node.value)" :key="lineIndex">
        <span>{{ line }}</span>
        <br v-if="lineIndex < lines(node.value).length - 1" />
      </template>
    </template>
    <CitationLink v-else-if="node.type === 'citation'" :source="node.source" />
    <!-- 删除线、脚注、引用式链接已在解析时换成文本 -->
  </template>
</template>
