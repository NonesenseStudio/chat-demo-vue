<script setup lang="ts">
import { computed, ref } from 'vue'
import { watchAfterRender } from '@/composables/watchAfterRender'
import {
  IconGlobeLanguageOutline14,
  IconPaperclipOutline16,
  IconSendOutline16,
  IconStopFill16,
  IconThinkOutline14,
} from '@/components/base/icons'
import { useSettingsStore } from '@/stores/settings'
import { useIsMobile } from '@/composables/useViewport'
import { useChatStore } from '@/stores/chat'
import { EMPTY_DRAFT, useDraftsStore } from '@/stores/drafts'
import { stopReadAloud } from '@/stores/readAloud'
import IconButton from '@/components/base/IconButton.vue'
import Tooltip from '@/components/base/Tooltip.vue'
import { ensureApiKey } from '@/stores/settingsDialog'
import DragMask from './DragMask.vue'
import { useFileDrop } from './useFileDrop'
import { showToast } from '@/stores/toast'
import { ACCEPT } from '@/services/attachments'
import { useUploadsStore } from '@/stores/uploads'
import DraftAttachments from './DraftAttachments.vue'
import { useVoiceInput } from './useVoiceInput'
import VoiceButton from './VoiceButton.vue'
import Spectrum from './Spectrum.vue'
import { useTranslate } from '@/i18n'

const props = defineProps<{
  sessionId: string | null
}>()

const t = useTranslate()
const settings = useSettingsStore()
const chat = useChatStore()
const drafts = useDraftsStore()
const uploads = useUploadsStore()
const isMobile = useIsMobile()

const draft = computed(() => drafts.drafts.get(props.sessionId) ?? EMPTY_DRAFT)
const setText = (value: string) => drafts.setText(props.sessionId, value)
const draftReady = computed(() => drafts.prepareMessage(draft.value, uploads.tasks) !== null)
const streaming = computed(
  () => props.sessionId !== null && Object.hasOwn(chat.streaming, props.sessionId)
)
const fileInputRef = ref<HTMLInputElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const togglesRef = ref<HTMLDivElement | null>(null)

// 移动端保留手动聚焦，以免提前弹出键盘。
watchAfterRender(() => {
  if (!isMobile.value) {
    textareaRef.value?.focus()
  }
})
watchAfterRender(
  () => {
    const toggles = togglesRef.value
    if (!toggles) {
      return
    }

    const updateLabels = () => {
      toggles.classList.remove('collapsedToggles')
      toggles.classList.toggle('collapsedToggles', toggles.scrollWidth > toggles.clientWidth)
    }

    updateLabels()
    const observer = new ResizeObserver(updateLabels)
    observer.observe(toggles)
    return () => observer.disconnect()
  },
  () => [t]
)

const acceptFiles = (files: File[]) => {
  if (files.length === 0 || chat.importingHistory || !ensureApiKey()) {
    return
  }
  const error = drafts.addFiles(props.sessionId, files, settings.apiKey ?? '')
  if (error) {
    showToast(error)
  }
}
const retryFile = (id: string) => {
  if (!chat.importingHistory && ensureApiKey()) {
    drafts.retryAttachment(props.sessionId, id, settings.apiKey ?? '')
  }
}
const removeFile = (id: string) => {
  if (!chat.importingHistory) {
    drafts.removeAttachment(props.sessionId, id)
  }
}
const dragging = useFileDrop(acceptFiles)
const voice = useVoiceInput((transcript) => {
  const textarea = textareaRef.value
  const current = drafts.getDraft(props.sessionId).text
  const start = textarea?.selectionStart ?? current.length
  const end = textarea?.selectionEnd ?? current.length
  setText(current.slice(0, start) + transcript + current.slice(end))
  requestAnimationFrame(() => {
    textarea?.focus({ preventScroll: true })
    textarea?.setSelectionRange(start + transcript.length, start + transcript.length)
  })
})
const cancelVoice = computed(() => voice.cancel)
watchAfterRender(
  () =>
    chat.$subscribe((_, state) => {
      if (state.importingHistory) {
        cancelVoice.value()
      }
    }),
  () => [cancelVoice.value]
)
const recording = computed(() => voice.status === 'recording')
const canSend = computed(
  () => !chat.importingHistory && !streaming.value && voice.status === 'idle' && draftReady.value
)
const send = () => {
  if (
    chat.importingHistory ||
    voice.status !== 'idle' ||
    !drafts.prepareMessage(drafts.getDraft(props.sessionId), uploads.tasks)
  ) {
    return
  }
  // 文本与上传完成态由提交动作读取最新快照，不使用上一次渲染的草稿。
  if (!ensureApiKey() || !chat.sendMessage(props.sessionId)) {
    return
  }
  stopReadAloud()
  if (isMobile.value) {
    textareaRef.value?.blur()
  } else {
    textareaRef.value?.focus()
  }
}
const onTextareaMousedown = (event: MouseEvent) => {
  // 首次点击时手动聚焦，避免 Safari 把整个页面滚到输入框位置。
  if (isMobile.value && event.button === 0 && document.activeElement !== event.currentTarget) {
    event.preventDefault()
    ;(event.currentTarget as HTMLTextAreaElement).focus({ preventScroll: true })
  }
}
const onPaste = (event: ClipboardEvent) => {
  const files = Array.from(event.clipboardData?.files ?? [])
  if (files.length > 0) {
    event.preventDefault()
    acceptFiles(files)
  }
}
</script>

<template>
  <div
    :class="['wrapper', props.sessionId === null ? 'home' : 'session']"
    @click="
      ($event) => {
        if ($event.target === $event.currentTarget) {
          textareaRef?.focus({ preventScroll: true })
        }
      }
    "
  >
    <DraftAttachments :items="draft.attachments" :on-retry="retryFile" :on-remove="removeFile" />
    <div class="textareaWrapper">
      <!-- 移动端不自动聚焦，避免一打开就弹出键盘 -->
      <textarea
        ref="textareaRef"
        :class="['textarea', recording && isMobile && 'textareaHidden']"
        :placeholder="t('chatInputPlaceholderChat')"
        rows="2"
        :autofocus="!isMobile"
        :disabled="chat.importingHistory"
        :value="draft.text"
        @input="setText(($event.currentTarget as HTMLTextAreaElement).value)"
        @mousedown="onTextareaMousedown"
        @keydown="
          ($event) => {
            if ($event.key === 'Enter' && !$event.shiftKey && !$event.isComposing) {
              $event.preventDefault()
              send()
            }
          }
        "
        @paste="onPaste"
      />
      <Spectrum v-if="recording && isMobile" :get-analyser="voice.getAnalyser" />
      <div class="mirror" aria-hidden="true">
        {{ `${draft.text}\n` }}
      </div>
    </div>
    <div class="functionRow">
      <!-- 深度思考 / 智能搜索开关，tooltip 在按钮上方 -->
      <div ref="togglesRef" class="toggles">
        <Tooltip :content="t('deactivatedThinkTooltip')">
          <button
            type="button"
            :class="['toggle', { selected: settings.thinking }]"
            :aria-label="t('thinkingSwitch')"
            :aria-pressed="settings.thinking"
            @click="settings.setThinking(!settings.thinking)"
          >
            <IconThinkOutline14 />
            <span class="toggleLabel">{{ t('thinkingSwitch') }}</span>
          </button>
        </Tooltip>
        <Tooltip :content="t('deactivatedSearchTooltip')">
          <button
            type="button"
            :class="['toggle', { selected: settings.search }]"
            :aria-label="t('search')"
            :aria-pressed="settings.search"
            @click="settings.setSearch(!settings.search)"
          >
            <IconGlobeLanguageOutline14 />
            <span class="toggleLabel">{{ t('search') }}</span>
          </button>
        </Tooltip>
      </div>
      <div class="right">
        <VoiceButton
          :status="voice.status"
          :disabled="!voice.available"
          :seconds="voice.seconds"
          @click="
            () => {
              if (voice.status !== 'idle' || (!chat.importingHistory && ensureApiKey())) {
                void voice.toggle()
              }
            }
          "
        />
        <IconButton
          size="m"
          tone="primary"
          :tooltip="t('uploadFile')"
          :disabled="chat.importingHistory"
          @click="ensureApiKey() && fileInputRef?.click()"
        >
          <IconPaperclipOutline16 />
        </IconButton>
        <input
          ref="fileInputRef"
          type="file"
          multiple
          hidden
          :accept="ACCEPT"
          @change="
            ($event) => {
              const input = $event.currentTarget as HTMLInputElement
              acceptFiles(Array.from(input.files ?? []))
              input.value = ''
            }
          "
        />
        <button
          v-if="streaming && props.sessionId"
          type="button"
          class="sendButton"
          :aria-label="t('chatInputStopButtonTooltip')"
          @click="
            () => {
              stopReadAloud()
              if (props.sessionId !== null) {
                chat.stopReply(props.sessionId)
              }
            }
          "
        >
          <IconStopFill16 />
        </button>
        <button
          v-else
          type="button"
          :class="['sendButton', { disabled: !canSend }]"
          :aria-label="t('send')"
          :aria-disabled="!canSend"
          @click="send"
        >
          <IconSendOutline16 />
        </button>
      </div>
    </div>
    <DragMask v-if="dragging" />
  </div>
</template>

<style scoped>
.wrapper {
  --line-height: 24px;
  --input-padding-top: 12px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  cursor: text;
  font-size: 16px;
  line-height: var(--line-height);
  border-radius: 24px;
  border: 1px solid var(--dsw-alias-border-l2-darkmode-thin);
  background: var(--dsw-specific-input-major);
  overflow: hidden;
}

.session {
  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.02),
    0 2px 4px rgba(0, 0, 0, 0.04);
}

.home {
  box-shadow:
    0 4px 12px 0 rgba(0, 0, 0, 0.02),
    0 2px 2px 0 rgba(72, 104, 178, 0.01),
    0 30px 60px 0 rgba(72, 104, 178, 0.03);
}

[data-ds-dark-theme] .home {
  box-shadow: none;
}

.textareaWrapper {
  position: relative;
  width: 100%;
}

.textarea,
.mirror {
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-height: calc(var(--line-height) * 2 + var(--input-padding-top));
  margin: 0;
  padding: var(--input-padding-top) 12px 0 16px;
  border: none;
  font: inherit;
  line-height: inherit;
  font-variant-ligatures: no-contextual;
  word-break: break-word;
  white-space: pre-wrap;
  overflow: auto;
}

.textarea {
  position: absolute;
  height: 100%;
  resize: none;
  outline: none;
  overscroll-behavior: contain;
  background-color: transparent;
  color: var(--dsw-alias-label-primary);
  caret-color: var(--dsw-alias-brand-text);
}

.textarea::placeholder {
  color: var(--dsw-alias-label-caption);
  user-select: none;
}

/* 录音中由频谱接管第一行，隐藏正文但保留高度 */
.textareaHidden {
  visibility: hidden;
}

@media not all and (min-width: 440px) {
  .textarea,
  .mirror {
    min-height: calc(var(--line-height) * 1.25 + var(--input-padding-top));
  }
}

.mirror {
  visibility: hidden;
  pointer-events: none;
  max-height: 336px;
}

@media not all and (min-width: 768px) {
  .wrapper {
    flex-shrink: 0;
    max-height: calc(var(--app-viewport-height, 100dvh) - 120px);
  }

  .textareaWrapper {
    min-height: 0;
  }

  .functionRow {
    flex-shrink: 0;
  }
}

.functionRow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding: 12px;
}

.toggles {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.collapsedToggles .toggleLabel {
  display: none;
}

.toggle {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 34px;
  padding: 0 12px;
  border-radius: 18px;
  border: 1px solid var(--dsw-alias-border-l2);
  background-color: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition-property: border, background;
  transition-duration: 0.2s;
}

.toggle:hover:not(:disabled) {
  background-color: var(--dsw-alias-interactive-bg-hover);
}

.toggle:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toggle.selected {
  background-color: var(--dsw-alias-button-ghost-active-fill);
  color: var(--dsw-alias-brand-text);
  border-color: var(--dsw-alias-button-ghost-active-border);
}

.toggle.selected:hover {
  background-color: var(--dsw-alias-button-ghost-active-hover);
}

.right {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.sendButton {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  margin-left: 6px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--dsw-alias-button-primary-fill);
  color: var(--dsw-static-neutral-bluish-00);
  cursor: pointer;
  transition: background 0.2s ease;
}

.sendButton:not(.disabled):hover {
  background: var(--dsw-alias-button-primary-hover);
}

.sendButton.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
