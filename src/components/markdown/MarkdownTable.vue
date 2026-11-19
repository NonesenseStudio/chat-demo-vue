<script setup lang="ts">
import { computed } from 'vue'
import type { Table as TableNode } from 'mdast'
import MarkdownInline from './MarkdownInline.vue'

const props = defineProps<{
  node: TableNode
}>()

const columnCount = computed(() => props.node.children[0]?.children.length)
</script>

<template>
  <div class="markdown-table-wrapper">
    <table>
      <thead v-if="node.children[0]">
        <tr>
          <th v-for="(cell, cellIndex) in node.children[0].children" :key="cellIndex">
            <MarkdownInline :nodes="cell.children" />
          </th>
        </tr>
      </thead>
      <tbody v-if="node.children[1]">
        <tr v-for="(row, rowIndex) in node.children.slice(1)" :key="rowIndex">
          <td v-for="(cell, cellIndex) in row.children" :key="cellIndex">
            <MarkdownInline :nodes="cell.children" />
          </td>
          <!-- 补齐到列数 -->
          <td
            v-for="idx in Math.max(0, (columnCount ?? 0) - row.children.length)"
            :key="`ptd_${idx}`"
          />
        </tr>
      </tbody>
    </table>
  </div>
</template>
