import { computed, shallowRef, type Ref } from 'vue'
import { ensureKatex, type Katex } from '@/services/markdown/katex'

/** renderToString 外层包裹的标签，组件自己渲染外层，这里切掉 */
const KATEX_WRAPPER = {
  inline: ['<span class="katex">', '</span>'],
  display: ['<span class="katex-display"><span class="katex">', '</span></span>'],
} as const

export type MathHtmlResult = {
  html: string
  renderMode: 'katex' | 'fallback'
}

const noop = () => {}

/** KaTeX 渲染公式；出错时保留上次成功的结果（流式中公式未写完），没有则展示原文 */
export const useMathHtml = (input: () => string, isInline: boolean): Ref<MathHtmlResult> => {
  const previousResult = shallowRef<MathHtmlResult | null>(null)
  const katex = shallowRef<Katex | null>(null)
  const initial = ensureKatex()
  if (initial instanceof Promise) {
    initial.then((value) => {
      katex.value = value
    }, noop)
  } else {
    katex.value = initial
  }
  return computed((): MathHtmlResult => {
    if (!katex.value) {
      return { html: input(), renderMode: 'fallback' }
    }
    try {
      const [prefix, suffix] = KATEX_WRAPPER[isInline ? 'inline' : 'display']
      const html = katex.value
        .renderToString(input(), { throwOnError: true, strict: false, displayMode: !isInline })
        .slice(prefix.length, -suffix.length)
      const result = { html, renderMode: 'katex' } as const
      previousResult.value = result
      return result
    } catch {
      return previousResult.value ?? { html: input(), renderMode: 'fallback' }
    }
  })
}
