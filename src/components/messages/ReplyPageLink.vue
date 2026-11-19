<script setup lang="ts">
import { IconRightUpOutline14 } from '@/components/base/icons'
import Tooltip from '@/components/base/Tooltip.vue'
import type { PageItem } from '@/services/chat/view'

defineProps<{
  page: PageItem
  failedTip?: string
}>()
</script>

<template>
  <span :class="page.status === 'failed' ? 'pageFailed' : 'pageDone'" class="page">
    <Tooltip v-if="page.status === 'failed'" :content="failedTip">
      <span class="pageText">{{ page.title }}</span>
    </Tooltip>
    <a v-else class="pageText" :href="page.url" target="_blank" rel="noreferrer">
      {{ page.title }}
    </a>
    <span class="pageIcon">
      <IconRightUpOutline14 />
    </span>
  </span>
</template>

<style scoped>
.page {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  margin-right: 6px;
  white-space: nowrap;
}

.pageText {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font: var(--dsw-font-xs-13);
  text-decoration-line: underline;
  text-decoration-style: dotted;
  text-decoration-color: var(--dsw-alias-label-caption);
  text-underline-offset: 4px;
  transition: color 0.2s;
}

.pageIcon {
  position: relative;
  bottom: 1px;
  display: flex;
}

.pageDone .pageText {
  color: var(--dsw-alias-label-secondary);
}

.pageDone .pageText:hover {
  color: var(--dsw-alias-label-primary);
  text-decoration-color: var(--dsw-alias-label-tertiary);
}

.pageFailed .pageText,
.pageFailed .pageIcon {
  cursor: not-allowed;
  color: var(--dsw-alias-label-caption);
}
</style>
