<script setup lang="ts">
import { IconMenuOutline20, IconNewChatOutline20 } from '@/components/base/icons'
import { useTranslate } from '@/i18n'
import { useChatStore } from '@/stores/chat'
import IconButton from '@/components/base/IconButton.vue'
import { openMobileSider } from '@/stores/mobileSider'

withDefaults(defineProps<{ title?: string }>(), { title: undefined })

const t = useTranslate()
const chat = useChatStore()
</script>

<template>
  <!-- 移动端顶栏：左侧菜单打开侧边栏；会话页再显示标题与开启新对话 -->
  <div class="header">
    <IconButton
      size="xl"
      tone="primary"
      :aria-label="t('expandSiderbarButton')"
      @click="openMobileSider"
    >
      <IconMenuOutline20 />
    </IconButton>
    <template v-if="title !== undefined">
      <div class="title">{{ title }}</div>
      <IconButton size="xl" tone="primary" :aria-label="t('newChat')" @click="chat.newChat()">
        <IconNewChatOutline20 />
      </IconButton>
    </template>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  box-sizing: border-box;
  height: 60px;
  padding: 12px 10px 4px;
}

.title {
  flex: 1;
  min-width: 0;
  margin: 0 12px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font: var(--dsw-font-s-strong-14);
  color: var(--dsw-alias-label-primary);
}
</style>
