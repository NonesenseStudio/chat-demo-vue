<script setup lang="ts">
import { computed } from 'vue'
import { useTranslate } from '@/i18n'
import { useUploadsStore, type UploadTask } from '@/stores/uploads'
import type { DraftAttachment } from '@/stores/drafts'
import { IconCloseFill14, IconRefreshOutline16 } from '@/components/base/icons'
import Tooltip from '@/components/base/Tooltip.vue'
import FileCard from '@/components/files/FileCard.vue'

const UPLOADING: UploadTask = { status: 'uploading' }

const props = defineProps<{
  item: DraftAttachment
}>()

const emit = defineEmits<{
  retry: []
  remove: []
}>()

const t = useTranslate()
const uploads = useUploadsStore()

/** 输入框里的文件：图片显示缩略图，其余显示文件卡片 */
const task = computed(() => uploads.tasks[props.item.id] ?? UPLOADING)
const status = computed(() => task.value.status)
const error = computed(() =>
  task.value.status === 'error' ? t(task.value.error.key, task.value.error.params) : undefined
)
const retryable = computed(() => task.value.status === 'error' && task.value.retryable)
const failed = computed(() => status.value === 'error')
const retryLabel = computed(() =>
  t('uploadRetry', { message: error.value ?? t('uploadFileStatusFailed') })
)
const showReason = computed(
  () => failed.value && error.value !== undefined && error.value !== t('uploadFileStatusFailed')
)
</script>

<template>
  <div
    v-if="item.previewUrl"
    :class="['attachment', { attachmentFailed: failed }]"
    :title="error ?? item.file.name"
  >
    <img :src="item.previewUrl" :alt="item.file.name" />
    <div v-if="status === 'uploading'" class="uploading" />
    <Tooltip v-if="failed && retryable" :content="retryLabel">
      <button
        type="button"
        class="failed"
        :aria-label="retryLabel"
        @click="emit('retry')"
      >
        <IconRefreshOutline16 />
        <span v-if="showReason" class="failedReason">{{ error }}</span>
      </button>
    </Tooltip>
    <div v-if="failed && !retryable" class="failed failedStatic" :aria-label="error">
      <span v-if="showReason" class="failedReason">{{ error }}</span>
    </div>
    <button
      type="button"
      :class="['remove', { invalidRemove: failed && !retryable }]"
      :aria-label="t('delete')"
      @click="emit('remove')"
    >
      <IconCloseFill14 />
    </button>
  </div>
  <FileCard
    v-else
    :name="item.file.name"
    :size="item.file.size"
    :status="status"
    :error="error"
    :on-retry="retryable ? () => emit('retry') : undefined"
    :on-remove="() => emit('remove')"
  />
</template>

<style scoped>
.attachment {
  position: relative;
  flex-shrink: 0;
  box-sizing: border-box;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  border: 1px solid var(--dsw-alias-border-l2);
  overflow: hidden;
  background-color: var(--dsw-alias-bg-skeleton);
}

.attachment img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.attachment:hover .remove {
  opacity: 1;
}

.uploading {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.3);
}

.uploading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  margin: -10px 0 0 -10px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 上传失败：红色描边 + 暗色蒙层，可重试时中间为重试图标，原因写在图标下方 */
.attachmentFailed {
  border-color: var(--dsw-alias-state-error-primary);
}

.failed {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: none;
  padding: 0 3px;
  cursor: pointer;
  color: var(--dsw-static-neutral-bluish-00);
  background-color: rgba(0, 0, 0, 0.48);
}

.failed svg {
  width: 18px;
  height: 18px;
}

/* 不可重试：蒙层更浅，原因贴底 */
.failedStatic {
  justify-content: flex-end;
  padding-bottom: 7px;
  cursor: default;
  background-color: rgba(0, 0, 0, 0.24);
}

.failedReason {
  display: -webkit-box;
  overflow: hidden;
  max-width: 100%;
  margin-top: 2px;
  font-size: 11px;
  line-height: 14px;
  font-weight: 500;
  text-align: center;
  word-break: break-word;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.remove {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 50%;
  color: var(--dsw-alias-label-primary-inverted);
  background-color: var(--dsw-alias-button-contrast-fill);
  filter: drop-shadow(0 0 0.5px rgba(0, 0, 0, 0.2));
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--ds-transition-duration) var(--ds-ease-in-out);
}

/* 不可重试时删除按钮常显，提示需要先删除 */
.invalidRemove {
  opacity: 1;
  color: var(--dsw-alias-label-primary-foreground);
  background-color: var(--dsw-alias-state-error-primary);
}
</style>
