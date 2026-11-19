<script setup lang="ts">
import { IconPanelLeftOutline16, NewChatIcon } from '@/components/base/icons'
import { useTranslate } from '@/i18n'
import { useSettingsStore } from '@/stores/settings'
import { useChatStore } from '@/stores/chat'
import IconButton from '@/components/base/IconButton.vue'

const t = useTranslate()
const settings = useSettingsStore()
const chat = useChatStore()
</script>

<template>
  <!-- 收起后左上角的按钮组 -->
  <div class="collapsed">
    <div class="collapsedGroup">
      <IconButton
        size="m"
        tone="primary"
        :tooltip="t('expandSiderbarButton')"
        @click="settings.setSiderCollapsed(false)"
      >
        <IconPanelLeftOutline16 />
      </IconButton>
      <IconButton size="m" tone="primary" :tooltip="t('newChat')" @click="chat.newChat()">
        <NewChatIcon />
      </IconButton>
    </div>
  </div>
</template>

<style scoped>
.collapsed {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 12px 0 0 16px;
}

.collapsedGroup {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 40px;
  padding: 0 2px;
  box-sizing: border-box;
  border-radius: 100px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}
</style>
