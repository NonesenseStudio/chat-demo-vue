<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTranslate } from '@/i18n'
import { IconDownloadOutline16 } from '@/components/base/icons'
import { useChatStore } from '@/stores/chat'
import { exportHistory } from '@/services/chat/backup'
import Button from '@/components/base/Button.vue'
import SettingCell from './SettingCell.vue'
import { errorStatus, type Status } from './settingStatus'

const props = withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: false })

const t = useTranslate()
const chat = useChatStore()
const empty = computed(() => chat.sessions.length === 0)
const busy = ref(false)
const status = ref<Status>(null)

/** 将全部会话及图片导出为 ZIP 文件并下载 */
const onExport = async () => {
  busy.value = true
  status.value = null
  try {
    const { name, blob } = await exportHistory()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  } catch (error) {
    status.value = errorStatus('historyExportFailed', error)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <SettingCell
    :label="t('exportAllLabel')"
    :description="t('historyExportDescription')"
    :status="status"
  >
    <Button
      variant="outlined"
      size="m"
      class="cellButton"
      :disabled="props.disabled || busy || empty"
      @click="() => void onExport()"
    >
      <IconDownloadOutline16 />
      {{ t('exportAllDownload') }}
    </Button>
  </SettingCell>
</template>
