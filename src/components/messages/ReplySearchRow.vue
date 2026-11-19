<script setup lang="ts">
import { computed, ref } from 'vue'
import { watchAfterRender } from '@/composables/watchAfterRender'
import { useTranslate } from '@/i18n'
import { IconSearchOutline16, IconSearchWarningOutline16 } from '@/components/base/icons'
import type { AssistantMessage } from '@/services/chat/types'
import { isDeepSearchKind, isImageSearchKind, type SearchStep } from '@/services/chat/view'
import { useSearchPanelStore } from '@/stores/searchPanel'
import SiteThumbnails from '@/components/search/SiteThumbnails.vue'

const props = defineProps<{
  step: SearchStep
  message: AssistantMessage
  streaming: boolean
  isLast: boolean
}>()

const t = useTranslate()
const panel = useSearchPanelStore()

/** 搜索：普通搜索为「已阅读 N 个网页」，边想边搜为「搜索到 N 个网页」，点击打开搜索结果 */

/** 进行中时每 2 秒轮播搜索词 */
const wip = computed(() => props.step.status === 'wip')
const tick = ref(0)
watchAfterRender(
  () => {
    if (!wip.value || props.step.queries.length <= 1) {
      return
    }
    const timer = setInterval(() => {
      tick.value = tick.value + 1
    }, 2000)
    return () => clearInterval(timer)
  },
  () => [wip.value && props.step.queries.length > 1]
)

const count = computed(() => props.step.results.length)
const clickable = computed(() => !wip.value && count.value > 0)
const panelEntry = computed(() => `${props.message.id}-search-${props.step.key}`)
const failed = computed(() => props.step.status === 'failed')
const interrupted = computed(
  () => failed.value && !props.streaming && props.message.status === 'stopped'
)
const currentQuery = computed(() => props.step.queries[tick.value % props.step.queries.length])
</script>

<template>
  <div
    :class="['row', { withLine: !isLast, clickable, active: panel.entry === panelEntry }]"
    @click="clickable ? panel.toggle(panelEntry, step.results) : undefined"
  >
    <span class="rowIcon">
      <IconSearchWarningOutline16 v-if="failed" />
      <IconSearchOutline16 v-else />
    </span>
    <template v-if="wip">
      <template v-if="step.queries.length > 0">
        <span class="prefix">{{ t('toolSearchIntro') }}</span>
        <span :key="tick" class="query">
          {{ currentQuery }}
        </span>
      </template>
      <span v-else>
        {{ t(isImageSearchKind(step.kind) ? 'imageSearching' : 'messageSearching') }}
      </span>
    </template>
    <span v-else-if="interrupted">{{ t('searchStopped') }}</span>
    <span v-else-if="failed">{{ t('toolSearchFail') }}</span>
    <span v-else-if="count === 0">
      {{ t(isDeepSearchKind(step.kind) ? 'toolSearchNoResult' : 'messageSearchNoResult') }}
    </span>
    <template v-else>
      <span class="summary">
        {{
          t(
            isDeepSearchKind(step.kind)
              ? count === 1
                ? 'toolSearch1Result'
                : 'toolSearchResults'
              : count === 1
                ? 'messageSearchResult'
                : 'messageSearchResults',
            { count }
          )
        }}
      </span>
      <SiteThumbnails :sources="step.results" />
    </template>
  </div>
</template>

<style scoped>
.withLine::after {
  content: '';
  position: absolute;
  left: 7.5px;
  top: 31px;
  width: 1px;
  height: calc(100% - 24px);
  background-color: var(--dsw-alias-label-dimmed);
}

.rowIcon {
  display: flex;
  flex-shrink: 0;
  margin-right: 6px;
  padding: 1px;
}

.rowIcon svg {
  width: 14px;
  height: 14px;
}

.row {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 100%;
  height: 34px;
  color: var(--dsw-alias-label-secondary);
  font: var(--dsw-font-markdown-small);
}

.row.clickable {
  width: fit-content;
  cursor: pointer;
}

.row.clickable::before,
.row.active::before {
  content: '';
  position: absolute;
  z-index: -1;
  left: -10px;
  width: calc(100% + 20px);
  height: calc(100% - 6px);
  border-radius: 100px;
  opacity: 0;
  transition:
    opacity 0.2s,
    background-color 0.2s;
}

.row.clickable::before {
  background-color: var(--dsw-alias-interactive-bg-hover);
}

.row.clickable:hover::before {
  opacity: 1;
}

.row.active::before {
  background-color: var(--dsw-alias-interactive-bg-active);
  opacity: 1;
}

.row.clickable:hover,
.row.active {
  --search-row-site-logo-color: var(--dsw-alias-interactive-bg-hover);
}

.prefix,
.summary {
  flex-shrink: 0;
  font-variant: tabular-nums;
}

.query {
  margin-left: 6px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
}
</style>
