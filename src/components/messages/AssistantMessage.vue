<script setup lang="ts">
import { computed } from 'vue'
import { useTranslate } from '@/i18n'
import { IconRefreshOutline16, IconWarningOutline16 } from '@/components/base/icons'
import { describeReply } from '@/services/chat/describe'
import { canContinueReply } from '@/services/chat/reply'
import { useChatStore } from '@/stores/chat'
import { stopReadAloud } from '@/stores/readAloud'
import type { AssistantMessage as AssistantMessageType } from '@/services/chat/types'
import { openSettings } from '@/stores/settingsDialog'
import IconButton from '@/components/base/IconButton.vue'
import Button from '@/components/base/Button.vue'
import Markdown from '@/components/markdown/Markdown.vue'
import SiteThumbnails from '@/components/search/SiteThumbnails.vue'
import { useSearchPanelStore } from '@/stores/searchPanel'
import ReadAloudButton from './ReadAloudButton.vue'
import CopyButton from './CopyButton.vue'
import ReplyArea from './ReplyArea.vue'
import { useReplyView } from './useReplyView'
import BranchSwitcher from './BranchSwitcher.vue'
import type { SelectMessageVersion } from './BranchSwitcher.vue'
import type { MessageVersions } from '@/services/chat/branches'

const TOP_UP_URL = 'https://platform.deepseek.com/top_up'

const props = defineProps<{
  sessionId: string
  message: AssistantMessageType
  isLast: boolean
  streaming: boolean
  busy: boolean
  versions: MessageVersions
  onSelectVersion: SelectMessageVersion
}>()

const t = useTranslate()
const chat = useChatStore()
const panel = useSearchPanelStore()

const view = useReplyView(
  () => props.message,
  () => props.streaming
)
const panelEntry = computed(() => panel.entry)
const notice = computed(() => (props.streaming ? null : describeReply(props.message)))
const refused = computed(() => props.message.stopReason === 'refusal')
const answer = computed(() => (refused.value ? null : view.value.answer))
const responseText = computed(() =>
  [answer.value?.text, notice.value?.presentation === 'response' ? notice.value.text : null]
    .filter(Boolean)
    .join('\n\n')
)
const copyText = computed(() => responseText.value || notice.value?.text)
const waiting = computed(
  () =>
    props.streaming &&
    view.value.steps.length === 0 &&
    !view.value.answer &&
    !props.message.thinking
)
const summaryEntry = computed(() => `${props.message.id}-summary`)
</script>

<template>
  <div class="message">
    <ReplyArea
      v-if="!refused"
      :message="message"
      :view="view"
      :streaming="streaming"
      :has-response="!!responseText"
    />
    <Markdown
      v-if="answer"
      class="ds-assistant-message-main-content"
      :content="answer.markdown"
      :loading="streaming"
      :cache-key="message.id"
      :disable-link="false"
      :sources="view.sources"
    />
    <div v-if="waiting" class="waiting">
      <span v-for="index in 3" :key="index" class="waitingDot" />
    </div>
    <Markdown
      v-if="notice?.presentation === 'response'"
      class="ds-assistant-message-main-content"
      :content="notice.text"
      :loading="false"
      :cache-key="`${message.id}-template`"
      :disable-link="false"
    />
    <div v-else-if="notice" class="notice">
      <IconWarningOutline16 />
      <span>
        {{ notice.text }}
        <button
          v-if="notice.action === 'apiKey'"
          type="button"
          class="noticeAction"
          @click="openSettings('data')"
        >
          {{ t('changeApiKey') }}
        </button>
        <a
          v-if="notice.action === 'topUp'"
          class="noticeAction"
          :href="TOP_UP_URL"
          target="_blank"
          rel="noreferrer"
        >
          {{ t('topUp') }}
        </a>
      </span>
    </div>
    <div
      v-if="!streaming && !refused && view.searchResults.length > 0"
      :class="['summary', { summaryActive: panelEntry === summaryEntry }]"
      @click="panel.toggle(summaryEntry, view.searchResults)"
    >
      <SiteThumbnails :sources="view.searchResults" />
      <span>
        {{
          t(view.searchResults.length === 1 ? 'messageSearchSummary' : 'messageSearchSummaries', {
            count: view.searchResults.length,
          })
        }}
      </span>
    </div>
    <div v-if="!streaming" class="bottom">
      <BranchSwitcher
        :versions="versions"
        :disabled="busy"
        @select="(messageId, anchorTop) => onSelectVersion(messageId, anchorTop)"
      />
      <div :class="['actions', { alwaysShow: isLast }]">
        <CopyButton v-if="copyText" :text="copyText" />
        <ReadAloudButton
          v-if="responseText && !refused"
          :message-id="message.id"
          :text="responseText"
        />
        <IconButton
          :tooltip="t('regenerate')"
          tooltip-placement="bottom"
          :disabled="busy || refused"
          @click="
            () => {
              stopReadAloud()
              chat.regenerateReply(sessionId, message.id)
            }
          "
        >
          <IconRefreshOutline16 />
        </IconButton>
      </div>
      <Button
        v-if="isLast && canContinueReply(message)"
        variant="outlined"
        size="s"
        class="continueButton"
        :disabled="busy"
        @click="
          () => {
            stopReadAloud()
            chat.continueReply(sessionId, message.id)
          }
        "
      >
        {{ t('continueGenerating') }}
      </Button>
    </div>
  </div>
</template>

<style scoped>
.message {
  position: relative;
}

.message:hover .actions,
.message:focus-within .actions {
  opacity: 1;
}

.message :deep(.ds-assistant-message-main-content) {
  padding-bottom: 6px;
}

.waiting {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 34px;
}

.waitingDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--dsw-alias-label-dimmed);
  animation: fading 0.9s linear infinite;
}

.waitingDot:nth-child(2) {
  animation-delay: 0.1s;
}

.waitingDot:nth-child(3) {
  animation-delay: 0.2s;
}

@keyframes fading {
  0%,
  100% {
    opacity: 0.3;
  }

  33%,
  66% {
    opacity: 1;
  }
}

.notice {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 8px;
  font-size: 14px;
  line-height: 22px;
  color: var(--dsw-alias-state-error-primary);
}

.notice > svg {
  flex-shrink: 0;
  margin-top: 4px;
}

.notice > span {
  min-width: 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.noticeAction {
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: var(--dsw-alias-brand-text);
  text-decoration: none;
  cursor: pointer;
}

.noticeAction:hover {
  text-decoration: underline;
}

.bottom {
  position: relative;
  left: -6px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 12px;
  padding-bottom: 10px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0;
  transition: opacity var(--ds-transition-duration) var(--ds-ease-in-out);
}

.alwaysShow {
  opacity: 1;
}

.continueButton {
  margin-left: auto;
}

.summary {
  display: flex;
  align-items: center;
  width: fit-content;
  margin-top: 16px;
  padding: 4px 10px 4px 4px;
  border-radius: 100px;
  border: 1px solid var(--dsw-alias-border-l2);
  background-color: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font: var(--dsw-font-markdown-small);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.3s;
}

.summary > span:first-child {
  margin-left: 0;
}

.summary > span:last-child {
  margin-left: 6px;
}

.summary:hover,
.summary.summaryActive {
  background-color: var(--dsw-alias-interactive-bg-hover);
  --search-row-site-logo-color: var(--dsw-alias-interactive-bg-hover);
}
</style>
