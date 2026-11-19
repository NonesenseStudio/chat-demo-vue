<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsDialogStore } from '@/stores/settingsDialog'
import SettingsContent from './SettingsContent.vue'

/**
 * 设置弹窗：分「通用设置」（主题、语言、朗读音色、位置）与「数据管理」（API Key、导入、导出、删除）。
 * 桌面端为居中弹窗、左侧导航；移动端为底部弹层、导航横排在内容上方
 */
const dialog = useSettingsDialogStore()
const open = computed(() => dialog.open)
</script>

<template>
  <SettingsContent v-if="open" />
</template>
