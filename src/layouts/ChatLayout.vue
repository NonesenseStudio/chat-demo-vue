<script setup lang="ts">
import { computed } from 'vue'
import { watchAfterRender } from '@/composables/watchAfterRender'
import { useTranslate } from '@/i18n'
import { useSettingsStore } from '@/stores/settings'
import { useIsMobile, useMobileViewport, usePreventPageScroll } from '@/composables/useViewport'
import { useChatStore, retrySaveSessions, selectSession, initChat } from '@/stores/chat'
import SearchPanel from '@/components/search/SearchPanel.vue'
import { closeSearchPanel } from '@/stores/searchPanel'
import SessionView from '@/components/session/SessionView.vue'
import MobileHeader from '@/components/session/MobileHeader.vue'
import Welcome from '@/components/session/Welcome.vue'
import SettingsDialog from '@/components/settings/SettingsDialog.vue'
import Button from '@/components/base/Button.vue'
import { stopReadAloud } from '@/stores/readAloud'
import CollapsedSider from '@/components/sider/CollapsedSider.vue'
import { closeMobileSider } from '@/stores/mobileSider'
import MobileSider from '@/components/sider/MobileSider.vue'
import Sider from '@/components/sider/Sider.vue'

const t = useTranslate()
const settings = useSettingsStore()
const chat = useChatStore()
const isMobile = useIsMobile()

const siderCollapsed = computed(() => settings.siderCollapsed && !isMobile.value)
const session = computed(() =>
  chat.activeId !== null && Object.hasOwn(chat.sessionCache, chat.activeId)
    ? chat.sessionCache[chat.activeId]
    : undefined
)
const sessionLoadError = computed(() =>
  chat.activeId === null ? false : chat.sessionLoadErrors[chat.activeId] === true
)
const frameRef = useMobileViewport(() => isMobile.value)
const streaming = computed(() =>
  chat.activeId === null ? false : Object.hasOwn(chat.streaming, chat.activeId)
)
usePreventPageScroll(() => isMobile.value)
watchAfterRender(closeSearchPanel, () => [chat.activeId])
watchAfterRender(stopReadAloud, () => [chat.activeId])
watchAfterRender(closeMobileSider, () => [chat.activeId, isMobile.value])

const retryInit = () => {
  if (!chat.ready) {
    void initChat()
  } else if (chat.activeId !== null) {
    selectSession(chat.activeId)
  }
}

const setFrame = (el: unknown) => {
  frameRef.value = (el as HTMLDivElement | null) ?? null
}
</script>

<template>
  <div :ref="setFrame" class="frame">
    <template v-if="isMobile">
      <MobileSider />
    </template>
    <template v-else-if="!siderCollapsed">
      <Sider />
    </template>
    <main class="main">
      <div
        v-if="Object.values(chat.sessionSaveErrors).some(Boolean)"
        class="saveError"
        role="alert"
      >
        <span>{{ t('sessionSaveFailed') }}</span>
        <Button
          variant="outlined"
          size="s"
          :disabled="chat.importingHistory"
          @click="retrySaveSessions"
        >
          {{ t('retry') }}
        </Button>
      </div>
      <div class="content">
        <CollapsedSider v-if="siderCollapsed" />
        <div v-if="!chat.ready || (chat.activeId !== null && !session)" class="loadingView">
          <MobileHeader v-if="isMobile" />
          <div class="loadingState" role="status" aria-live="polite">
            <span>
              {{
                (!chat.ready ? chat.initError : sessionLoadError)
                  ? t(!chat.ready ? 'sessionListLoadFailed' : 'sessionLoadFailed')
                  : t('sessionLoading')
              }}
            </span>
            <Button
              v-if="!chat.ready ? chat.initError : sessionLoadError"
              variant="outlined"
              size="m"
              @click="retryInit"
            >
              {{ t('retry') }}
            </Button>
          </div>
        </div>
        <SessionView
          v-else-if="session"
          :session="session"
          :streaming="streaming"
          :sider-collapsed="siderCollapsed"
        />
        <Welcome v-else />
      </div>
    </main>
    <SearchPanel />
  </div>
  <SettingsDialog />
</template>

<style scoped>
.frame {
  position: absolute;
  inset: 0;
  display: flex;
  overflow: hidden;
  background-color: var(--dsw-alias-bg-base);
}

.main {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.content {
  position: relative;
  flex: 1;
  min-height: 0;
}

.saveError {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  color: var(--dsw-alias-label-primary);
  background-color: var(--dsw-alias-bg-base);
  font-size: 14px;
}

.loadingView {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}

.loadingState {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  color: var(--dsw-alias-label-secondary);
  font-size: 14px;
  text-align: center;
}

@media not all and (min-width: 768px) {
  .frame {
    position: fixed;
    top: var(--app-viewport-top, 0px);
    bottom: auto;
    height: var(--app-viewport-height, 100dvh);
  }
}
</style>
