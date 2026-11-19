import { defineStore } from 'pinia'

/** 移动端侧边栏抽屉：顶栏菜单按钮打开，点遮罩、切换会话或开启新对话后关闭 */
export const useMobileSiderStore = defineStore('mobileSider', {
  state: () => ({ open: false }),
  actions: {
    openDrawer() {
      this.open = true
    },
    closeDrawer() {
      this.open = false
    },
  },
})

export const openMobileSider = () => useMobileSiderStore().openDrawer()

export const closeMobileSider = () => useMobileSiderStore().closeDrawer()
