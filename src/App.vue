<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import Toast from '@/components/base/Toast.vue'
import { showToast } from '@/stores/toast'
import { ensureApiKey } from '@/stores/settingsDialog'
import { onUploadNotice } from '@/stores/uploads'
import { bindChatPersistence, initChat } from '@/stores/chat'
import { useSettingsStore } from '@/stores/settings'
import ChatLayout from '@/layouts/ChatLayout.vue'

let cleanup: (() => void)[] = []

onMounted(() => {
  const settings = useSettingsStore()
  const syncLanguage = () => {
    document.documentElement.lang = settings.locale
  }
  syncLanguage()
  cleanup = [
    settings.$subscribe(syncLanguage),
    onUploadNotice(showToast),
    bindChatPersistence(),
  ]
  void initChat()
  ensureApiKey()
})

onBeforeUnmount(() => {
  for (const dispose of cleanup) {
    dispose()
  }
})
</script>

<template>
  <ChatLayout />
  <Toast />
</template>
