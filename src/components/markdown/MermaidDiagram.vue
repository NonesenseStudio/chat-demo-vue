<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { watchAfterRender } from '@/composables/watchAfterRender'
import { useTranslate } from '@/i18n'
import { useTheme } from '@/composables/useTheme'
import { renderMermaid } from '@/services/markdown/mermaid'

const props = defineProps<{ code: string; loading: boolean }>()

const t = useTranslate()
const theme = useTheme()
const dark = computed(() => theme.value === 'dark')

/** 流式绘制最新内容、保留上次有效图；回答结束后才显示渲染错误。 */
const result = ref({ svg: '', failedCode: null as string | null })
const latestCode = ref(props.code)
watchEffect(() => {
  latestCode.value = props.code
})
const finalCode = computed(() => (props.loading ? null : props.code))
watchAfterRender(
  () => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let previousCode: string | undefined
    let displayedCode: string | undefined

    const draw = async (input: string) => {
      if (input === displayedCode || cancelled) {
        return
      }
      const svg = await renderMermaid(input, dark.value, () => cancelled)
      if (svg && !cancelled) {
        displayedCode = input
        result.value = { svg, failedCode: null }
      }
    }

    const renderLatest = async () => {
      const input = latestCode.value
      if (input !== previousCode) {
        previousCode = input
        try {
          await draw(input)
        } catch {
          if (!cancelled) {
            if (props.loading) {
              // 流式片段的末行可能包含未完成的节点，仅绘制前面的完整行。
              const text = input.trimEnd()
              const lineEnd = Math.max(text.lastIndexOf('\n'), text.lastIndexOf('\r'))
              const prefix = text.slice(0, Math.max(0, lineEnd))
              // 已显示的内容覆盖当前前缀时保持图形。
              if (prefix && !displayedCode?.startsWith(prefix)) {
                try {
                  await draw(prefix)
                } catch {
                  // 前缀也可能尚未构成完整语法，保留已有图。
                }
              }
            } else {
              result.value = { svg: '', failedCode: input }
            }
          }
        }
      }
      // 当前帧结束后绘制最新片段，连续输入合并为一次绘制。
      if (!cancelled && props.loading) {
        timer = setTimeout(renderLatest, 100)
      }
    }

    void renderLatest()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  },
  () => [dark.value, props.loading, finalCode.value]
)
</script>

<template>
  <div v-if="!code.trim() || !result.svg" class="md-mermaid-status" role="status">
    {{
      !loading && !code.trim()
        ? t('mermaidEmpty')
        : !loading && result.failedCode === code
          ? t('mermaidRenderFail')
          : t('mermaidLoading')
    }}
  </div>
  <div v-else class="md-mermaid-diagram" v-html="result.svg" />
</template>
