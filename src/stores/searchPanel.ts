import { defineStore } from 'pinia'
import type { Source } from '@/services/chat/view'

/** 右侧「搜索结果」面板：同一入口再次点击收起，换入口时替换内容 */
type SearchPanelState = {
  /** 打开面板的入口，用于判断再次点击是否收起 */
  entry: string | null
  sources: Source[]
}

export const useSearchPanelStore = defineStore('searchPanel', {
  state: (): SearchPanelState => ({ entry: null, sources: [] }),
  actions: {
    toggle(entry: string, sources: Source[]) {
      if (this.entry === entry) {
        this.entry = null
        this.sources = []
      } else {
        this.entry = entry
        this.sources = sources
      }
    },
    close() {
      this.entry = null
      this.sources = []
    },
  },
})

export const toggleSearchPanel = (entry: string, sources: Source[]) =>
  useSearchPanelStore().toggle(entry, sources)

export const closeSearchPanel = () => useSearchPanelStore().close()
