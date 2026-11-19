import { computed } from 'vue'

import type { AssistantMessage } from '@/services/chat/types'
import { buildReplyView, type Source } from '@/services/chat/view'

const sameSource = (a: Source, b: Source) =>
  a.url === b.url &&
  a.title === b.title &&
  a.siteName === b.siteName &&
  a.publishedAt === b.publishedAt &&
  a.snippet === b.snippet &&
  a.siteIcon === b.siteIcon &&
  a.index === b.index

/**
 * 将助手消息转换为界面渲染所需的回复视图数据：步骤时间线、正文、引用来源和搜索结果。
 * 来源内容未变时复用 sources 数组，避免流式文本更新绕过 Markdown 的解析节流。
 */
export const useReplyView = (message: () => AssistantMessage, streaming: () => boolean) => {
  const view = computed(() => buildReplyView(message(), streaming()))
  let sources = view.value.sources
  return computed(() => {
    const next = view.value
    if (
      sources.length !== next.sources.length ||
      !sources.every((source, index) => sameSource(source, next.sources[index]))
    ) {
      sources = next.sources
    }
    return { ...next, sources }
  })
}
