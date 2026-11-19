<script setup lang="ts">
import styles from './Settings.module.css'
import { ref } from 'vue'
import { useTranslate } from '@/i18n'
import { IconUploadOutline14 } from '@/components/base/icons'
import Button from '@/components/base/Button.vue'
import SettingCell from './SettingCell.vue'
import type { HistoryImport } from './useSettingsForms'

const props = defineProps<{
  historyImport: HistoryImport
  disabled: boolean
}>()

const t = useTranslate()
const inputRef = ref<HTMLInputElement | null>(null)

/** 导入 = 覆盖：用选中文件替换本地全部会话与附件。 */
const onFileChange = (event: Event) => {
  const input = event.currentTarget as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) {
    props.historyImport.select(file)
  }
}
</script>

<template>
  <SettingCell
    :label="t('historyImport')"
    :description="t('historyImportDescription')"
    :status="historyImport.status"
  >
    <Button
      variant="outlined"
      size="m"
      :class="[styles.cellButton, styles.uploadButton]"
      :disabled="disabled"
      @click="inputRef?.click()"
    >
      <IconUploadOutline14 />
      {{ t('upload') }}
    </Button>
    <input
      ref="inputRef"
      type="file"
      accept=".zip,application/zip,application/x-zip-compressed"
      hidden
      @change="onFileChange"
    />
  </SettingCell>
</template>
