<script setup lang="ts">
import { computed, ref } from 'vue'
import { watchAfterRender } from '@/composables/watchAfterRender'
import { useTranslate } from '@/i18n'
import { IconPanelLeftOutline16, IconSettingsOutline16, NewChatIcon } from '@/components/base/icons'
import { useSettingsStore } from '@/stores/settings'
import { groupSessions } from '@/services/chat/sessionGroups'
import { useChatStore } from '@/stores/chat'
import type { SessionSummary } from '@/services/chat/types'
import Button from '@/components/base/Button.vue'
import IconButton from '@/components/base/IconButton.vue'
import Modal from '@/components/base/Modal.vue'
import { showToast } from '@/stores/toast'
import { openSettings } from '@/stores/settingsDialog'
import { useMobileSiderStore } from '@/stores/mobileSider'
import SessionItem from './SessionItem.vue'

withDefaults(
  defineProps<{
    /** 移动端放在抽屉里，收起按钮关闭抽屉 */
    mobile?: boolean
  }>(),
  { mobile: false }
)

const t = useTranslate()
const chat = useChatStore()
const settings = useSettingsStore()
const mobileSider = useMobileSiderStore()

const activeId = computed(() => chat.activeId)
const now = ref(Date.now())
const groups = computed(() => groupSessions(chat.sessions, now.value, t))

const deleting = ref<SessionSummary | null>(null)
const deletePending = ref(false)

watchAfterRender(() => {
  let timer: ReturnType<typeof setTimeout>
  const refresh = () => {
    clearTimeout(timer)
    const time = Date.now()
    now.value = time
    const midnight = new Date(time).setHours(24, 0, 0, 0)
    timer = setTimeout(refresh, midnight - time)
  }
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      refresh()
    }
  }
  refresh()
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('focus', refresh)
  return () => {
    clearTimeout(timer)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('focus', refresh)
  }
})

const collapse = (mobile: boolean) => {
  if (mobile) {
    mobileSider.closeDrawer()
  } else {
    settings.setSiderCollapsed(true)
  }
}

const startNewChat = () => {
  chat.newChat()
  mobileSider.closeDrawer()
}

const confirmDelete = async () => {
  deletePending.value = true
  try {
    if (deleting.value && (await chat.removeSession(deleting.value.id))) {
      deleting.value = null
    } else {
      showToast({ key: 'sessionDeleteFailed', type: 'error' })
    }
  } finally {
    deletePending.value = false
  }
}
</script>

<template>
  <!-- 展开的侧边栏：名称与收起按钮、开启新对话、按时间分组的会话列表、底部设置 -->
  <div :class="['sider', { mobile }]">
    <div class="top">
      <div class="appName">{{ t('appName') }}</div>
      <IconButton
        size="m"
        :tooltip="t('collapseSiderbarButton')"
        tooltip-placement="bottom"
        @click="collapse(mobile)"
      >
        <IconPanelLeftOutline16 />
      </IconButton>
    </div>
    <button type="button" class="newChat" @click="startNewChat">
      <span class="newChatIcon">
        <NewChatIcon />
      </span>
      {{ t('newChat') }}
    </button>
    <div class="listWrap">
      <div class="list">
        <div v-for="group in groups" :key="group.key" class="section">
          <div class="sectionHeader">{{ group.label }}</div>
          <SessionItem
            v-for="session in group.sessions"
            :key="session.id"
            :session="session"
            :active="session.id === activeId"
            @delete="deleting = session"
          />
        </div>
      </div>
    </div>
    <div class="bottom">
      <button type="button" class="settings" @click="openSettings('general')">
        <span class="settingsIcon">
          <IconSettingsOutline16 />
        </span>
        <span class="settingsLabel">{{ t('settings') }}</span>
      </button>
    </div>
    <Modal
      v-if="deleting"
      :title="t('deleteSessionModalContentTitle')"
      @close="() => (!deletePending ? (deleting = null) : null)"
    >
      <template #footer>
        <Button variant="outlined" :disabled="deletePending" @click="deleting = null">
          {{ t('cancel') }}
        </Button>
        <Button variant="danger" :disabled="deletePending" @click="confirmDelete">
          {{ t('delete') }}
        </Button>
      </template>
      {{ t('deleteSessionWithFilesDescription') }}
    </Modal>
  </div>
</template>

<style scoped>
.sider {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  box-sizing: border-box;
  width: 261px;
  height: 100%;
  padding: 6px 12px 0;
  border-right: 1px solid var(--dsw-alias-border-l1);
  background-color: var(--dsw-specific-sidebar-fill);
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  box-sizing: border-box;
  height: 48px;
  margin-bottom: 16px;
  padding: 15px 0 10px 4px;
  flex-shrink: 0;
}

.appName {
  min-width: 0;
  padding-left: 4px;
  overflow: hidden;
  font-size: 20px;
  line-height: 22px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--dsw-alias-brand-primary);
}

.newChat {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
  width: 100%;
  height: 40px;
  padding: 0 16px;
  border-radius: 100px;
  border: 1px solid rgba(103, 158, 254, 0);
  background: var(--dsw-alias-button-elevated-fill);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  box-shadow:
    0 -2px 2px rgba(72, 104, 178, 0.04),
    0 2px 2px rgba(106, 111, 117, 0.09),
    0 1px 2px rgba(72, 104, 178, 0.08);
  transition: box-shadow 0.3s ease;
}

.newChat:hover {
  box-shadow:
    0 4px 4px 0 rgba(72, 104, 178, 0.04),
    0 -3px 4px 0 rgba(72, 104, 178, 0.04),
    0 6px 6px 0 rgba(106, 111, 117, 0.1);
}

[data-ds-dark-theme] .newChat {
  border: none;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.1),
    0 2px 4px rgba(106, 111, 117, 0.08);
}

.newChatIcon {
  display: flex;
  margin-right: 6px;
}

.listWrap {
  position: relative;
  flex: 1;
  min-height: 0;
  margin-top: 24px;
}

.list {
  height: 100%;
  margin: 0 -2px;
  padding: 0 2px;
  overflow-y: auto;
  scrollbar-color: var(--scroll-color) transparent;
}

.section {
  position: relative;
  margin-top: 16px;
  padding-top: 4px;
}

.section:first-child {
  margin-top: 0;
}

.sectionHeader {
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 2px 10px;
  font-size: 12px;
  line-height: 18px;
  font-weight: 500;
  color: var(--dsw-alias-label-tertiary);
  background-color: var(--dsw-specific-sidebar-fill);
  user-select: none;
}

.bottom {
  display: flex;
  flex-shrink: 0;
  height: 64px;
}

.settings {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  margin-block: auto;
  padding: 6px 2px 6px 6px;
  border: none;
  border-radius: 12px;
  background: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
  user-select: none;
  outline: none;
}

.settings:hover {
  background-color: var(--dsw-specific-sidebar-nav-item-hover);
}

.settings:focus-visible {
  box-shadow: inset 0 0 0 2px var(--dsw-alias-button-primary-fill);
}

.settingsIcon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  color: var(--dsw-alias-label-primary);
}

.settingsLabel {
  min-width: 0;
  margin-left: 4px;
  overflow: hidden;
  font-size: 14px;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--dsw-alias-label-primary);
}

.mobile {
  width: 300px;
  max-width: calc(100vw - 48px);
}

.mobile .listWrap {
  margin-top: 16px;
}

.mobile .sectionHeader {
  padding: 4px 10px 3px;
  font-size: 14px;
  line-height: 22px;
}

.mobile .bottom {
  height: auto;
  padding: 12px 0;
}

.mobile .settings {
  padding: 9px 10px;
}

.mobile .settingsIcon {
  width: auto;
  height: auto;
}

.mobile .settingsIcon svg {
  width: 20px;
  height: 20px;
}

.mobile .settingsLabel {
  margin-left: 10px;
  font-size: 16px;
  line-height: 22px;
}
</style>
