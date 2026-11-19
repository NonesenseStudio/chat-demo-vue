import { defineStore } from 'pinia'
import type { LinkedMessage } from '@/i18n'

/** 轻提示：同一时间只显示一条，新的替换旧的，到时自动消失；文案在渲染时按当前语言翻译 */
type ToastState = { id: number; message: LinkedMessage | string | null }

const DURATION = 3000
/** 带链接时多留一些时间，方便点击 */
const LINK_DURATION = 5000
let timer = 0

export const useToastStore = defineStore('toast', {
  state: (): ToastState => ({ id: 0, message: null }),
  actions: {
    show(message: LinkedMessage | string) {
      window.clearTimeout(timer)
      this.id += 1
      this.message = message
      const duration = typeof message !== 'string' && message.link ? LINK_DURATION : DURATION
      timer = window.setTimeout(() => {
        this.message = null
      }, duration)
    },
  },
})

export const showToast = (message: LinkedMessage | string) => useToastStore().show(message)
