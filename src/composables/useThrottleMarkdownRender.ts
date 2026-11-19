import { computed, ref } from 'vue'
import { watchAfterRender } from './watchAfterRender'

/** 两次更新的最长间隔 */
const MAX_WAIT = 2000
/** 上次渲染耗时的倍数，过了这段时间才允许下次更新 */
const TIME_CONSUMING_RATE = 2

/**
 * 流式过程中按渲染耗时节流 Markdown 内容的更新：
 * 更新输出时记录开始时间，提交后按耗时 × TIME_CONSUMING_RATE（不超过 MAX_WAIT）
 * 算出下次允许更新的时间点；新内容在到期时更新，连续输入合并为最新内容。
 * 关闭节流时直接返回最新内容。
 */
export const useThrottleMarkdownRender = (content: () => string, enable: () => boolean) => {
  const start = ref(performance.now())
  const updatableAt = ref(0)
  const output = ref(content())
  watchAfterRender(
    () => {
      const now = performance.now()
      updatableAt.value = now + Math.min(MAX_WAIT, (now - start.value) * TIME_CONSUMING_RATE)
    },
    () => [output.value]
  )
  watchAfterRender(
    () => {
      if (!enable()) {
        return
      }
      const update = () => {
        start.value = performance.now()
        output.value = content()
      }
      const delay = updatableAt.value - performance.now()
      if (delay <= 0) {
        update()
        return
      }
      const timer = setTimeout(update, delay)
      return () => clearTimeout(timer)
    },
    () => [content(), enable()]
  )
  return computed(() => (enable() ? output.value : content()))
}
