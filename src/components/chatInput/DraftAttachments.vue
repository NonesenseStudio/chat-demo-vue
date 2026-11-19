<script setup lang="ts">
import type { DraftAttachment } from '@/stores/drafts'
import DraftAttachmentItem from './DraftAttachmentItem.vue'

defineProps<{
  items: DraftAttachment[]
  onRetry: (id: string) => void
  onRemove: (id: string) => void
}>()

/** 列表只随草稿附件变化更新；每张卡片独立订阅自己的上传状态。 */
</script>

<template>
  <div v-if="items.length > 0" class="attachments">
    <DraftAttachmentItem
      v-for="item in items"
      :key="item.id"
      :item="item"
      @retry="onRetry(item.id)"
      @remove="onRemove(item.id)"
    />
  </div>
</template>

<style scoped>
.attachments {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 12px 12px 0;
  overflow-x: auto;
  cursor: default;
}

@media not all and (min-width: 768px) {
  .attachments {
    flex-shrink: 0;
  }
}
</style>
