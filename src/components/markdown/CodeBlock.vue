<script setup lang="ts">
import { computed, ref } from 'vue'
import { watchAfterRender } from '@/composables/watchAfterRender'
import { useTranslate } from '@/i18n'
import Prism from 'prismjs'
import {
  getHighlightLang,
  isHighlightLoaded,
  loadHighlight,
} from '@/services/markdown/highlight'
import { IconCheckOutline16, IconCopyOutline16 } from '@/components/base/icons'
import { showToast } from '@/stores/toast'
import { copyText } from '@/utils/clipboard'
import MermaidDiagram from './MermaidDiagram.vue'

const props = withDefaults(
  defineProps<{
    code: string
    infostring: string
    loading?: boolean
  }>(),
  { loading: false }
)

const t = useTranslate()

/** 代码块：语言包按需加载，不支持或尚未加载的语言按纯文本显示 */
const isMermaid = computed(() => props.infostring.toLowerCase() === 'mermaid')
const showDiagram = ref(true)
const loadedLanguage = ref<string | null>(null)
const lang = computed(() => getHighlightLang(props.infostring))
const loaded = computed(() => {
  const language = lang.value
  return language !== null && (loadedLanguage.value === language || isHighlightLoaded(language))
})
watchAfterRender(
  () => {
    if (lang.value === null || loaded.value) {
      return
    }
    let unmounted = false
    const language = lang.value
    loadHighlight(language).then(() => {
      if (!unmounted) {
        loadedLanguage.value = language
      }
    })
    return () => {
      unmounted = true
    }
  },
  () => [lang.value]
)
const renderedHtml = computed(() => {
  const name = lang.value !== null && loaded.value ? lang.value : 'plaintext'
  return Prism.highlight(props.code, Prism.languages[name], name)
})

const copied = ref(false)
const copy = async () => {
  if (!(await copyText(props.code))) {
    showToast({ key: 'copyFailed' })
    return
  }
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1500)
}
</script>

<template>
  <div class="md-code-block">
    <div class="md-code-block-banner">
      <!-- 代码块标题栏：左侧语言名，右侧复制 -->
      <div class="container">
        <div v-if="isMermaid" class="md-code-block-switch" :aria-label="t('mermaidSwitchLabel')">
          <button
            type="button"
            class="button"
            :aria-pressed="showDiagram"
            @click="!showDiagram && (showDiagram = true)"
          >
            {{ t('mermaidDiagram') }}
          </button>
          <button
            type="button"
            class="button"
            :aria-pressed="!showDiagram"
            @click="showDiagram && (showDiagram = false)"
          >
            {{ t('mermaidCode') }}
          </button>
        </div>
        <span v-else class="name">{{ infostring }}</span>
        <button type="button" class="button" @click="copy">
          <IconCheckOutline16 v-if="copied" />
          <IconCopyOutline16 v-else />
          <span>{{ t(copied ? 'copied' : 'copy') }}</span>
        </button>
      </div>
    </div>
    <MermaidDiagram v-if="isMermaid && showDiagram" :code="code" :loading="loading" />
    <pre v-else v-html="renderedHtml" />
  </div>
</template>

<style scoped>
.container {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  padding: 6px;
}

.name {
  margin-left: 8px;
  color: var(--dsw-alias-label-primary);
  font-family: var(--ds-font-family-code);
  font-size: 12px;
  line-height: 18px;
}

.button {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 28px;
  padding: 0 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
  user-select: none;
}

.button:active {
  background-color: var(--dsw-alias-interactive-bg-hover);
}

@media (hover: hover) {
  .button:hover {
    background-color: var(--dsw-alias-interactive-bg-hover);
  }
}

.button :deep(svg) {
  width: 14px;
  height: 14px;
}
</style>
