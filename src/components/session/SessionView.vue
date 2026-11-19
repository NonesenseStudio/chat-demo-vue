<script setup lang="ts">
import { computed } from 'vue'
import { useIsMobile } from '@/composables/useViewport'
import { useTranslate } from '@/i18n'
import type { Session } from '@/services/chat/types'
import ChatInput from '@/components/chatInput/ChatInput.vue'
import MessageList from '@/components/messages/MessageList.vue'
import MobileHeader from './MobileHeader.vue'

const props = defineProps<{
  session: Session
  streaming: boolean
  siderCollapsed: boolean
}>()

const t = useTranslate()
const isMobile = useIsMobile()
const title = computed(() => props.session.title || t('untitledChat'))

/** 会话页：标题栏（移动端为顶栏）+ 消息列表，输入框吸底 */
</script>

<template>
  <div class="view">
    <MobileHeader v-if="isMobile" :title="title" />
    <div v-else class="header">
      <div :class="['title', { withCollapsedSider: siderCollapsed }]">
        {{ title }}
      </div>
    </div>
    <MessageList :session="session" :streaming="streaming">
      <template #footer>
        <div class="inputContainer">
          <ChatInput :session-id="session.id" />
          <div class="caveat">{{ t('contentCaveat') }}</div>
        </div>
      </template>
    </MessageList>
  </div>
</template>

<style scoped>
.view {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: 60px;
  padding: 12px 18px 0;
  box-sizing: border-box;
  background: var(--dsw-alias-bg-base);
}

.title {
  max-width: 480px;
  padding: 8px 12px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font: var(--dsw-font-s-strong-14);
  color: var(--dsw-alias-label-primary);
}

.withCollapsedSider {
  margin-left: 113px;
}

.inputContainer {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  width: calc(var(--message-list-max-width) - 64px);
  max-width: calc(100% - 32px);
  margin: auto auto 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    transparent 30%,
    var(--dsw-alias-bg-base) 30%,
    var(--dsw-alias-bg-base) 100%
  );
}

.caveat {
  width: 100%;
  padding: 6px 0;
  font-size: 11px;
  line-height: 16px;
  text-align: center;
  color: var(--dsw-alias-label-tertiary);
  user-select: none;
}

@media not all and (min-width: 768px) {
  .inputContainer {
    position: relative;
    bottom: auto;
    flex-shrink: 0;
    margin: 0 auto;
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
