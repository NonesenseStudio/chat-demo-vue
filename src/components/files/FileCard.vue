<script setup lang="ts">
import { computed } from 'vue'
import { useTranslate } from '@/i18n'
import { formatSize, getExtension } from '@/services/attachments'
import { IconCloseFill14, IconRefreshOutline16 } from '@/components/base/icons'
import FileIcon from './FileIcon.vue'

const props = withDefaults(
  defineProps<{
    name: string
    size: number
    status?: 'uploading' | 'done' | 'error'
    error?: string
    onRetry?: () => void
    onRemove?: () => void
    onOpen?: () => void
  }>(),
  { status: 'done', error: undefined, onRetry: undefined, onRemove: undefined, onOpen: undefined }
)

const t = useTranslate()

/**
 * 文档文件卡片：图标 + 文件名 + 「扩展名 大小」或状态文案。
 * 输入框内失败时描边和说明标红；可重试时显示刷新图标，不可重试时常显红色删除按钮。
 * 消息里的不可重试文件保留普通边框和状态说明。
 */
const ext = computed(() => getExtension(props.name))
const onClick = computed(() =>
  props.status === 'error' ? props.onRetry : props.status === 'done' ? props.onOpen : undefined
)
const description = computed(() => {
  if (props.status === 'uploading') {
    return t('uploadFileStatusUploading')
  }
  if (props.status === 'error') {
    // 不可重试（过大、格式不支持）时保留文件图标并显示原因
    return props.error ?? t('uploadFileStatusFailed')
  }
  return [ext.value, formatSize(props.size)].filter(Boolean).join(' ')
})
const title = computed(() =>
  props.status === 'error'
    ? props.onRetry
      ? t('uploadRetry', { message: description.value })
      : description.value
    : props.name
)
</script>

<template>
  <div
    :class="[
      'card',
      {
        editable: !!onRemove,
        failed: status === 'error' && (onRemove || onRetry),
        clickable: !!onClick,
      },
    ]"
    :title="title"
    @click="onClick?.()"
  >
    <div :class="['icon', { retry: status === 'error' && !!onRetry }]">
      <span v-if="status === 'uploading'" class="spinner" />
      <IconRefreshOutline16 v-else-if="status === 'error' && !!onRetry" />
      <FileIcon v-else :ext="ext" />
    </div>
    <div class="content">
      <div class="caption">{{ name }}</div>
      <div class="subCaption">{{ description }}</div>
    </div>
    <button
      v-if="onRemove"
      type="button"
      :class="['remove', { invalidRemove: status === 'error' && !onRetry }]"
      :aria-label="t('delete')"
      @click.stop="onRemove()"
    >
      <IconCloseFill14 />
    </button>
  </div>
</template>

<style scoped>
.card {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  box-sizing: border-box;
  width: 240px;
  min-height: 64px;
  padding: 0 12px 0 14px;
  border-radius: 16px;
  border: 1px solid var(--dsw-alias-border-l2);
  background-color: var(--dsw-specific-input-major);
  cursor: default;
  transition: background-color 0.2s ease-in-out;
}

.card:hover .remove {
  opacity: 1;
}

.clickable {
  cursor: pointer;
}

.clickable:hover {
  background-color: var(--dsw-alias-interactive-bg-hover);
}

.editable {
  padding-right: 24px;
}

.failed {
  border-color: var(--dsw-alias-state-error-primary);
}

.failed .subCaption {
  color: var(--dsw-alias-state-error-primary);
}

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  margin-right: 10px;
  color: var(--dsw-alias-label-tertiary);
}

.retry :deep(svg) {
  width: 18px;
  height: 18px;
  color: var(--dsw-alias-label-secondary);
}

.spinner {
  width: 16px;
  height: 16px;
  box-sizing: border-box;
  border-radius: 50%;
  border: 2px solid var(--dsw-alias-border-l2);
  border-top-color: var(--dsw-alias-label-tertiary);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.content {
  flex: 1;
  min-width: 0;
  padding: 10px 0;
  user-select: none;
}

.caption {
  overflow: hidden;
  font-size: 14px;
  line-height: 22px;
  font-weight: 400;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--dsw-alias-label-primary);
}

.subCaption {
  overflow: hidden;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--dsw-alias-label-tertiary);
}

.remove {
  position: absolute;
  top: 4px;
  right: 4px;
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
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.invalidRemove {
  opacity: 1;
  color: var(--dsw-alias-label-primary-foreground);
  background-color: var(--dsw-alias-state-error-primary);
}
</style>
