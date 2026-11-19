import { reactive, ref } from 'vue'
import { clearHistory, importHistory } from '@/services/chat/backup'
import { showToast } from '@/stores/toast'
import type { Status } from './settingStatus'

/** 选文件后先提示覆盖；确认后才检查文件并执行导入，任何错误都提示导入失败。 */
export const useHistoryImport = () => {
  const file = ref<File | null>(null)
  const busy = ref(false)
  const status = ref<Status>(null)
  const importing = ref(false)
  const confirm = async () => {
    const archive = file.value
    if (!archive || importing.value) {
      return
    }
    importing.value = true
    file.value = null
    busy.value = true
    status.value = null
    try {
      const count = await importHistory(archive)
      status.value = {
        key: count === 1 ? 'historyImportedOne' : 'historyImported',
        params: { count },
      }
    } catch {
      status.value = { key: 'historyImportFailed', error: true }
    } finally {
      importing.value = false
      busy.value = false
    }
  }
  return reactive({
    file,
    busy,
    status,
    select: (selected: File) => {
      file.value = selected
    },
    cancel: () => {
      file.value = null
    },
    confirm,
  })
}

export type HistoryImport = ReturnType<typeof useHistoryImport>

/** 删除确认保留在设置之上；失败可重试，成功只关闭确认弹窗。 */
export const useHistoryDelete = () => {
  const opened = ref(false)
  const busy = ref(false)
  const deleting = ref(false)
  const confirm = async () => {
    if (deleting.value) {
      return
    }
    deleting.value = true
    busy.value = true
    try {
      await clearHistory()
      opened.value = false
      showToast({ key: 'historyDeleted' })
    } catch {
      showToast({ key: 'historyDeleteFailed', type: 'error' })
    } finally {
      deleting.value = false
      busy.value = false
    }
  }
  return reactive({
    opened,
    busy,
    open: () => {
      opened.value = true
    },
    cancel: () => {
      if (!deleting.value) {
        opened.value = false
      }
    },
    confirm,
  })
}

export type HistoryDelete = ReturnType<typeof useHistoryDelete>
