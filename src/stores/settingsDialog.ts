import { defineStore } from 'pinia'
import { useSettingsStore } from './settings'

/** 设置弹窗的分组：通用设置 / 数据管理 */
export type SettingsSection = 'general' | 'data'

/** 设置弹窗：侧边栏底部、没有 API Key 时的操作与 401 提示都可以打开；section 为打开时选中的分组 */
export const useSettingsDialogStore = defineStore('settingsDialog', {
  state: () => ({
    open: false,
    section: 'general' as SettingsSection,
  }),
  actions: {
    openDialog(section: SettingsSection) {
      this.open = true
      this.section = section
    },
    closeDialog() {
      this.open = false
    },
  },
})

export const openSettings = (section: SettingsSection) =>
  useSettingsDialogStore().openDialog(section)

export const closeSettings = () => useSettingsDialogStore().closeDialog()

/** 没有 API Key 时打开设置并选中 API Key 所在的「数据管理」，返回是否已有 Key */
export const ensureApiKey = () => {
  if (useSettingsStore().apiKey) {
    return true
  }
  openSettings('data')
  return false
}
