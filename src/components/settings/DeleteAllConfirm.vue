<script setup lang="ts">
import styles from './Settings.module.css'
import { useTranslate } from '@/i18n'
import Button from '@/components/base/Button.vue'
import Modal from '@/components/base/Modal.vue'
import type { HistoryDelete } from './useSettingsForms'

defineProps<{
  historyDelete: HistoryDelete
}>()

const t = useTranslate()
</script>

<template>
  <!-- 删除确认保留在设置之上；失败可重试，成功只关闭确认弹窗。 -->
  <Modal
    :title="t('deleteAllSessionsModalTitle')"
    :dialog-class="styles.deleteConfirm"
    @close="historyDelete.cancel()"
  >
    <template #footer>
      <div :class="styles.deleteActions" :aria-busy="historyDelete.busy">
        <Button
          variant="outlined"
          autofocus
          :disabled="historyDelete.busy"
          @click="historyDelete.cancel()"
        >
          {{ t('cancel') }}
        </Button>
        <Button
          variant="danger"
          :disabled="historyDelete.busy"
          @click="() => void historyDelete.confirm()"
        >
          {{ t(historyDelete.busy ? 'historyDeleting' : 'deleteAllSessions') }}
        </Button>
      </div>
    </template>
    {{ t('deleteAllSessionsModalDescription') }}
  </Modal>
</template>
