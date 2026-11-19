<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { watchAfterRender } from '@/composables/watchAfterRender'
import { useIsMobile } from '@/composables/useViewport'
import { useChatStore } from '@/stores/chat'
import {
  buildMessageVersions,
  getVisibleMessages,
  type MessageVersions,
} from '@/services/chat/branches'
import type { Message, Session } from '@/services/chat/types'
import { closeSearchPanel } from '@/stores/searchPanel'
import AssistantMessage from './AssistantMessage.vue'
import { provideScrollToBottom } from './useScrollToBottom'
import UserMessage from './UserMessage.vue'

/**
 * 会话共用可重试的附件上传失败入口，覆盖当前提问与历史消息中的附件。
 * 点击后按失败的回答重新补传附件并请求。
 */
const getUploadRetryId = (messages: Message[], streaming: boolean) => {
  const last = messages.at(-1)
  return !streaming &&
    last?.role === 'assistant' &&
    last.status === 'error' &&
    last.error?.kind === 'upload' &&
    last.error.retryable
    ? last.id
    : null
}

/** 距底部小于该值时视为在底部，流式内容增长时跟随 */
const STICKY_THRESHOLD = 40
const EMPTY_VERSIONS: MessageVersions = { ids: [], index: -1 }

const props = defineProps<{
  session: Session
  streaming: boolean
}>()

const chat = useChatStore()
const isMobile = useIsMobile()

const scrollRef = ref<HTMLDivElement | null>(null)
const contentRef = ref<HTMLDivElement | null>(null)
const sticky = ref(true)
const scrollTop = ref(0)
const restoreScroll = shallowRef<{ messageId: string; top: number } | null>(null)
const messages = computed(() => getVisibleMessages(props.session))
const previousVersions = shallowRef(buildMessageVersions(props.session, new Map()))
const versions = computed(() => buildMessageVersions(props.session, previousVersions.value))
const lastMessageId = computed(() => messages.value.at(-1)?.id)

/** 桌面端滚动 .container，移动端滚动 .scroll；经函数 ref 按布局指向实际滚动的元素 */
const setScrollEl = (el: unknown) => {
  scrollRef.value = (el as HTMLDivElement | null) ?? null
}

const scrollToBottom = () => {
  const el = scrollRef.value
  if (el && sticky.value) {
    el.scrollTop = el.scrollHeight
    scrollTop.value = el.scrollTop
  }
}
watchAfterRender(
  () => {
    const content = contentRef.value
    const scroll = scrollRef.value
    if (!content || !scroll) {
      return
    }
    const observer = new ResizeObserver(scrollToBottom)
    observer.observe(content)
    observer.observe(scroll)
    return () => observer.disconnect()
  },
  () => [isMobile.value, scrollToBottom]
)
watchAfterRender(
  () => {
    const anchor = restoreScroll.value
    const scroll = scrollRef.value
    if (anchor && scroll) {
      const switcher = scroll.querySelector<HTMLElement>(
        `[data-message-version="${CSS.escape(anchor.messageId)}"]`
      )
      if (switcher) {
        scroll.scrollTop += switcher.getBoundingClientRect().top - anchor.top
      }
      restoreScroll.value = null
      return
    }
    sticky.value = true
    scrollToBottom()
  },
  () => [props.session.id, lastMessageId.value, scrollToBottom]
)
watchAfterRender(closeSearchPanel, () => [props.session.id, lastMessageId.value])

const selectVersion = (messageId: string, anchorTop: number) => {
  if (props.streaming) {
    return
  }
  restoreScroll.value = { messageId, top: anchorTop }
  sticky.value = false
  closeSearchPanel()
  chat.selectMessageVersion(props.session.id, messageId)
}

watchAfterRender(
  () => {
    const el = scrollRef.value
    if (!el) {
      return
    }
    if (sticky.value) {
      scrollToBottom()
    } else {
      el.scrollTop = scrollTop.value
    }
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < STICKY_THRESHOLD
      // 仅在用户向上滚动时停止跟随底部，布局或内容增高时保持跟随状态。
      if (nearBottom) {
        sticky.value = true
      } else if (el.scrollTop < scrollTop.value) {
        sticky.value = false
      }
      scrollTop.value = el.scrollTop
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  },
  () => [isMobile.value, scrollToBottom]
)
const lastIndex = computed(() => messages.value.length - 1)
const uploadRetryId = computed(() => getUploadRetryId(messages.value, props.streaming))
provideScrollToBottom(scrollToBottom)
</script>

<template>
  <div class="container" :ref="isMobile ? undefined : setScrollEl">
    <div class="scroll" :ref="isMobile ? setScrollEl : undefined">
      <div ref="contentRef" class="column">
        <template v-for="(message, index) in messages" :key="message.id">
          <UserMessage
            v-if="message.role === 'user'"
            :session-id="session.id"
            :message="message"
            :retry-upload-id="uploadRetryId"
            :is-first="index === 0"
            :is-last="index === lastIndex || index === lastIndex - 1"
            :busy="streaming"
            :versions="versions.get(message.id) ?? EMPTY_VERSIONS"
            :on-select-version="selectVersion"
          />
          <AssistantMessage
            v-else
            :session-id="session.id"
            :message="message"
            :is-last="index === lastIndex"
            :streaming="streaming && index === lastIndex"
            :busy="streaming"
            :versions="versions.get(message.id) ?? EMPTY_VERSIONS"
            :on-select-version="selectVersion"
          />
        </template>
      </div>
    </div>
    <slot name="footer" />
  </div>
</template>

<style scoped>
.container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  scrollbar-gutter: stable both-edges;
  scrollbar-color: var(--scroll-color) transparent;
}

.scroll {
  display: contents;
}

@media not all and (min-width: 768px) {
  .container {
    overflow: hidden;
    scrollbar-gutter: auto;
  }

  .scroll {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    scrollbar-color: var(--scroll-color) transparent;
  }
}

.column {
  width: calc(var(--message-list-max-width) - 2 * var(--message-list-padding-horizontal));
  max-width: calc(100% - 40px);
  margin: 0 auto;
  padding-bottom: 24px;
}
</style>
