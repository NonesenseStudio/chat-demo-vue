<script setup lang="ts">
import { computed, ref } from 'vue'
import { watchAfterRender } from '@/composables/watchAfterRender'
import { useTranslate } from '@/i18n'
import { useIsMobile } from '@/composables/useViewport'
import { IconEditOutline16 } from '@/components/base/icons'
import { useChatStore } from '@/stores/chat'
import { stopReadAloud } from '@/stores/readAloud'
import type { UserMessage as UserMessageType } from '@/services/chat/types'
import Button from '@/components/base/Button.vue'
import IconButton from '@/components/base/IconButton.vue'
import { ensureApiKey } from '@/stores/settingsDialog'
import BranchSwitcher from './BranchSwitcher.vue'
import type { SelectMessageVersion } from './BranchSwitcher.vue'
import MessageFile from './MessageFile.vue'
import CopyButton from './CopyButton.vue'
import type { MessageVersions } from '@/services/chat/branches'

const props = withDefaults(
  defineProps<{
    sessionId: string
    message: UserMessageType
    /** 回答因补传附件失败可重试时为该回答 id */
    retryUploadId?: string | null
    isFirst: boolean
    isLast: boolean
    busy: boolean
    versions: MessageVersions
    onSelectVersion: SelectMessageVersion
  }>(),
  { retryUploadId: null }
)

const t = useTranslate()
const chat = useChatStore()
const isMobile = useIsMobile()

const editing = ref(false)
const draft = ref(props.message.content)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
watchAfterRender(
  () => textareaRef.value?.focus(),
  () => [editing.value]
)

const canSend = computed(
  () => !props.busy && (draft.value.trim() !== '' || props.message.files.length > 0)
)
watchAfterRender(
  () => {
    const textarea = textareaRef.value
    if (editing.value && textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 202)}px`
    }
  },
  () => [editing.value, draft.value]
)

const sendEdit = () => {
  if (
    canSend.value &&
    ensureApiKey() &&
    chat.editMessage(props.sessionId, props.message.id, draft.value.trim())
  ) {
    stopReadAloud()
    editing.value = false
  }
}

const onEditKeydown = (event: KeyboardEvent) => {
  if (event.isComposing) {
    return
  }
  if (event.key === 'Escape') {
    editing.value = false
  } else if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !isMobile.value) {
    event.preventDefault()
    sendEdit()
  }
}

const startEditing = () => {
  draft.value = props.message.content
  editing.value = true
}
</script>

<template>
  <div :class="['container', { isFirst }]">
    <div
      v-if="message.files.length > 0"
      :class="['files', { filesWithDocuments: message.files.some((file) => !file.isImage) }]"
    >
      <MessageFile
        v-for="file in message.files"
        :key="file.id"
        :file="file"
        :on-retry="
          retryUploadId
            ? () => {
                if (retryUploadId) {
                  chat.retryUpload(sessionId, retryUploadId)
                }
              }
            : null
        "
      />
    </div>
    <div v-if="editing" class="editor">
      <textarea
        ref="textareaRef"
        class="textarea"
        :aria-label="t('editMessage')"
        autofocus
        rows="1"
        :value="draft"
        :disabled="busy"
        @input="draft = ($event.currentTarget as HTMLTextAreaElement).value"
        @keydown="onEditKeydown"
      />
      <div class="editorActions">
        <Button size="s" variant="outlined" @click="editing = false">
          {{ t('cancel') }}
        </Button>
        <Button size="s" :disabled="!canSend" @click="sendEdit">
          {{ t('send') }}
        </Button>
      </div>
    </div>
    <template v-else>
      <div v-if="message.content" class="bubble">{{ message.content }}</div>
      <div class="bottom">
        <div :class="['actions', { alwaysShow: isLast }]">
          <CopyButton v-if="message.content" :text="message.content" />
          <IconButton
            :tooltip="t('editMessage')"
            tooltip-placement="bottom"
            :disabled="busy"
            @click="startEditing"
          >
            <IconEditOutline16 />
          </IconButton>
        </div>
        <BranchSwitcher
          :versions="versions"
          :disabled="busy"
          @select="(messageId, anchorTop) => onSelectVersion(messageId, anchorTop)"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding-bottom: 16px;
}

.container.isFirst {
  padding-top: 34px;
}

.container:hover .actions {
  opacity: 1;
}

.files {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 10px;
  max-width: 100%;
  margin-bottom: 8px;
}

.filesWithDocuments {
  --message-file-image-size: 64px;
}

.bubble {
  max-width: calc(100% - 88px);
  box-sizing: border-box;
  padding: 10px 16px;
  border-radius: 22px;
  font-size: 16px;
  line-height: 24px;
  color: var(--dsw-alias-label-primary);
  background-color: var(--dsw-specific-bubble);
  white-space: pre-wrap;
  word-break: break-word;
}

@media not all and (min-width: 440px) {
  .bubble {
    max-width: calc(100% - 68px);
  }
}

.bottom {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 28px;
  margin-top: 6px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0;
  transition: opacity var(--ds-transition-duration) var(--ds-ease-in-out);
}

.actions:focus-within {
  opacity: 1;
}

.alwaysShow {
  opacity: 1;
}

.editor {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--dsw-alias-brand-primary);
  border-radius: 22px;
  background-color: var(--dsw-alias-bg-base);
  overflow: hidden;
}

.textarea {
  display: block;
  width: 100%;
  box-sizing: border-box;
  min-height: 44px;
  max-height: 202px;
  padding: 10px 16px;
  border: none;
  outline: none;
  resize: none;
  font: inherit;
  font-size: 16px;
  line-height: 24px;
  color: var(--dsw-alias-label-primary);
  background: transparent;
}

.editorActions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin: 6px 10px 10px;
}
</style>
