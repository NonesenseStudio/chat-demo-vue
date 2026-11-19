<script setup lang="ts">
import styles from './Settings.module.css'
import { useTranslate } from '@/i18n'
import Button from '@/components/base/Button.vue'
import Modal from '@/components/base/Modal.vue'
import type { HistoryImport } from './useSettingsForms'

defineProps<{
  historyImport: HistoryImport
}>()

const t = useTranslate()
</script>

<template>
  <!-- 覆盖导入的二次确认，叠在设置弹窗上 -->
  <Modal
    :title="t('historyImportConfirmTitle')"
    :dialog-class="styles.importConfirm"
    @close="historyImport.cancel()"
  >
    <template #footer>
      <Button variant="outlined" size="m" autofocus @click="historyImport.cancel()">
        {{ t('cancel') }}
      </Button>
      <Button variant="dangerOutlined" size="m" @click="() => void historyImport.confirm()">
        {{ t('historyImportConfirm') }}
      </Button>
    </template>
    <div :class="styles.importConfirmText">{{ t('historyImportConfirmDescription') }}</div>
  </Modal>
</template>
