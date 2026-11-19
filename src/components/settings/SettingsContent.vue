<script setup lang="ts">
import styles from './Settings.module.css'
import { computed, ref } from 'vue'
import { IconDataOutline16, IconSettingsOutline16 } from '@/components/base/icons'
import { useIsMobile } from '@/composables/useViewport'
import { useTranslate, type TranslationKey } from '@/i18n'
import { useChatStore } from '@/stores/chat'
import {
  closeSettings,
  useSettingsDialogStore,
  type SettingsSection,
} from '@/stores/settingsDialog'
import Button from '@/components/base/Button.vue'
import Modal from '@/components/base/Modal.vue'
import ApiKeyConfirm from './ApiKeyConfirm.vue'
import ApiKeyField from './ApiKeyField.vue'
import DeleteAllConfirm from './DeleteAllConfirm.vue'
import ImportConfirm from './ImportConfirm.vue'
import ImportHistory from './ImportHistory.vue'
import ExportHistory from './ExportHistory.vue'
import SettingCell from './SettingCell.vue'
import { useApiKeyEditor } from './useApiKeyForm'
import { useHistoryDelete, useHistoryImport } from './useSettingsForms'
import ThemeSetting from './ThemeSetting.vue'
import LocaleSetting from './LocaleSetting.vue'
import TtsVoiceSetting from './TtsVoiceSetting.vue'
import LocationSetting from './LocationSetting.vue'

// 设置弹窗的分组：通用设置 / 数据管理
const sections: { value: SettingsSection; label: TranslationKey }[] = [
  { value: 'general', label: 'settingDialogAsideGeneralOptionLabel' },
  { value: 'data', label: 'settingDialogAsideDataOptionLabel' },
]

const sectionIcons = {
  general: IconSettingsOutline16,
  data: IconDataOutline16,
} as const

const t = useTranslate()
const isMobile = useIsMobile()
const dialogStore = useSettingsDialogStore()
const section = ref<SettingsSection>(dialogStore.section)
const apiKeyEditor = useApiKeyEditor()
const historyImport = useHistoryImport()
const historyDelete = useHistoryDelete()
const chat = useChatStore()
const historyBusy = computed(
  () => historyImport.busy || historyDelete.busy || chat.importingHistory
)
</script>

<template>
  <Modal
    :title="t('settings')"
    closable
    :dialog-class="styles.dialog"
    :main-class="styles.dialogMain"
    @close="() => (!historyDelete.busy ? closeSettings() : null)"
  >
    <div role="tablist" :class="styles.navigation">
      <button
        v-for="item in sections"
        :key="item.value"
        type="button"
        role="tab"
        :aria-selected="section === item.value"
        :class="[styles.navItem, { [styles.navItemActive]: section === item.value }]"
        @click="section = item.value"
      >
        <component :is="sectionIcons[item.value]" />
        {{ t(item.label) }}
      </button>
    </div>
    <div role="tabpanel" :class="styles.content">
      <template v-if="section === 'general'">
        <ThemeSetting />
        <LocaleSetting />
        <TtsVoiceSetting />
        <LocationSetting />
      </template>
      <template v-else>
        <ApiKeyField :editor="apiKeyEditor" />
        <ImportHistory :history-import="historyImport" :disabled="historyBusy" />
        <ExportHistory :disabled="historyBusy" />
        <SettingCell :label="t('deleteAllSessions')" :status="null">
          <Button
            variant="dangerOutlined"
            size="m"
            :class="styles.cellButton"
            :disabled="historyBusy"
            @click="historyDelete.open()"
          >
            {{ t('delete') }}
          </Button>
        </SettingCell>
        <ApiKeyConfirm v-if="isMobile" :editor="apiKeyEditor" />
      </template>
    </div>
  </Modal>
  <ImportConfirm v-if="historyImport.file" :history-import="historyImport" />
  <DeleteAllConfirm v-if="historyDelete.opened" :history-delete="historyDelete" />
</template>
