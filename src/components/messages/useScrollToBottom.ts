import { inject, provide, type InjectionKey } from 'vue'

/** 渲染更新后请求滚到底部；用户上滑离开底部时由列表忽略 */
const scrollToBottomKey: InjectionKey<() => void> = Symbol('scrollToBottom')

export const provideScrollToBottom = (scrollToBottom: () => void) =>
  provide(scrollToBottomKey, scrollToBottom)

export const useScrollToBottom = () => inject(scrollToBottomKey, () => {})
