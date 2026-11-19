<script setup lang="ts">
import { computed, ref } from 'vue'
import { watchAfterRender } from '@/composables/watchAfterRender'
import { useTranslate } from '@/i18n'
import { useUploadsStore, type UploadTask } from '@/stores/uploads'
import { loadFile } from '@/services/chat/db'
import type { FileAttachment } from '@/services/chat/types'
import { IconPhotoErrorFill20, IconRefreshOutline16 } from '@/components/base/icons'
import Tooltip from '@/components/base/Tooltip.vue'
import FileCard from '@/components/files/FileCard.vue'

const props = withDefaults(
  defineProps<{
    file: FileAttachment
    /** 本条消息补传失败且可重试时提供 */
    onRetry?: (() => void) | null
  }>(),
  { onRetry: null }
)

const t = useTranslate()

/** 原件从 IndexedDB 读出并生成本地地址；undefined 表示加载中，null 表示原件缺失。 */
const fileUrl = ref<{ id: string; url: string | null } | null>(null)
watchAfterRender(
  () => {
    let objectUrl: string | null = null
    let cancelled = false
    loadFile(props.file.id).then((blob) => {
      if (!cancelled) {
        objectUrl = blob ? URL.createObjectURL(blob) : null
        fileUrl.value = { id: props.file.id, url: objectUrl }
      }
    })
    return () => {
      cancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  },
  () => [props.file.id]
)
const url = computed(() => (fileUrl.value?.id === props.file.id ? fileUrl.value.url : undefined))

/** 历史或失效附件的补传状态：只在还没有 serverId 时显示 */
const upload = computed<UploadTask | null>(() => {
  if (props.file.serverId) {
    return null
  }
  const task = useUploadsStore().tasks[props.file.id]
  return task?.status === 'uploading' || task?.status === 'error' ? task : null
})
const uploading = computed(() => upload.value?.status === 'uploading')
const failed = computed(() => upload.value?.status === 'error')
const retryable = computed(
  () => failed.value && upload.value?.status === 'error' && upload.value.retryable
)
const errorText = computed(() =>
  failed.value
    ? upload.value?.status === 'error'
      ? t(upload.value.error.key, upload.value.error.params)
      : ''
    : undefined
)
const retry = computed(() => (retryable.value ? props.onRetry : null))
const failedUrl = ref<string | null>(null)
const retryLabel = computed(() =>
  t('uploadRetry', {
    message: errorText.value ?? t('uploadFileStatusFailed'),
  })
)

const openOriginal = () => window.open(url.value ?? undefined, '_blank', 'noreferrer')

/**
 * 消息里的附件：
 * - 图片：纯图片显示 120×120 缩略图，与文件混排时为 64×64；上传中显示 loading 蒙层，
 *   上传失败显示品牌色描边 + 中心重试图标（可重试）或 photo-error 图标（不可重试）。
 * - 文件：显示文件卡片。
 */
</script>

<template>
  <template v-if="file.isImage && url !== null">
    <!-- 上传中：本地原件已在 IndexedDB，先垫在蒙层下显示，避免只有一块灰色占位 -->
    <div v-if="uploading" :class="['image', 'imageThumb']" :title="file.name">
      <span v-if="failedUrl === url" class="failedIcon" role="img" :aria-label="file.name">
        <IconPhotoErrorFill20 />
      </span>
      <img
        v-else
        :src="url"
        :alt="file.name"
        @error="failedUrl = url ?? null"
      />
      <div class="overlay">
        <span class="spinner" />
      </div>
    </div>

    <!-- 上传失败不可重试：保留缩略图，底部渐变显示原因；「上传失败」只显示状态 -->
    <div
      v-else-if="failed && !retry"
      :class="['image', 'imageThumb']"
      :title="errorText"
      :aria-label="errorText"
    >
      <span v-if="failedUrl === url || !url" class="failedIcon">
        <IconPhotoErrorFill20 />
      </span>
      <img
        v-else
        :src="url"
        :alt="file.name"
        @error="failedUrl = url ?? null"
      />
      <span v-if="errorText && errorText !== t('uploadFileStatusFailed')" class="reason">
        {{ errorText }}
      </span>
    </div>

    <!-- 上传失败可重试：缩略图 + 红色描边 + 蒙层重试图标，原因在底部 -->
    <Tooltip v-else-if="failed && retry" :content="retryLabel">
      <button
        type="button"
        :class="['image', 'imageThumb', 'retryImage']"
        :aria-label="retryLabel"
        @click="retry?.()"
      >
        <span v-if="failedUrl === url" class="failedIcon" role="img" :aria-label="file.name">
          <IconPhotoErrorFill20 />
        </span>
        <img
          v-else
          :src="url"
          :alt="file.name"
          @error="failedUrl = url ?? null"
        />
        <div :class="['overlay', 'retryOverlay']">
          <IconRefreshOutline16 />
        </div>
        <span v-if="errorText && errorText !== t('uploadFileStatusFailed')" class="reason">
          {{ errorText }}
        </span>
      </button>
    </Tooltip>

    <!-- 正常态：链接到原件 -->
    <a
      v-else-if="url"
      :class="['image', 'imageThumb']"
      :href="url"
      target="_blank"
      rel="noreferrer"
      :title="file.name"
    >
      <img :src="url" :alt="file.name" @error="failedUrl = url ?? null" />
    </a>
    <!-- 原件还没加载出来（极短暂） -->
    <div v-else class="image" />
  </template>
  <FileCard
    v-else
    :name="file.name"
    :size="file.size"
    :status="uploading ? 'uploading' : failed ? 'error' : 'done'"
    :error="errorText"
    :on-retry="retry ?? undefined"
    :on-open="url && !upload ? openOriginal : undefined"
  />
</template>

<style scoped>
.image {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
  width: var(--message-file-image-size, 120px);
  height: var(--message-file-image-size, 120px);
  padding: 0;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid var(--dsw-alias-border-l2);
  background-color: var(--dsw-alias-markdown-placeholder);
  font: inherit;
  text-decoration: none;
}

.image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  flex-shrink: 0;
}

.imageThumb {
  position: relative;
  container-type: inline-size;
}

button.image {
  cursor: pointer;
}

.failedIcon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--dsw-alias-label-secondary);
}

.retryImage {
  border-color: var(--dsw-alias-state-error-primary);
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dsw-static-neutral-bluish-00);
  background-color: rgba(0, 0, 0, 0.3);
}

.overlay svg {
  width: 20px;
  height: 20px;
}

.retryOverlay {
  background-color: rgba(0, 0, 0, 0.4);
  transition: background-color var(--ds-transition-duration) var(--ds-ease-in-out);
}

.retryOverlay:hover {
  background-color: rgba(0, 0, 0, 0.5);
}

/* 失败原因：底部 60px 渐变上的白字，超出两行省略 */
.reason {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  box-sizing: border-box;
  min-height: min(60px, 100%);
  padding: 0 4px 8px;
  font-size: 11px;
  line-height: 14px;
  font-weight: 500;
  text-align: center;
  word-break: break-word;
  color: var(--dsw-static-neutral-bluish-00);
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.65));
  pointer-events: none;
}

/* 比缩略图最小尺寸还窄时放不下文案，只保留状态 */
@container (max-width: 63px) {
  .reason {
    display: none;
  }
}

.spinner {
  width: 20px;
  height: 20px;
  box-sizing: border-box;
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
</style>
