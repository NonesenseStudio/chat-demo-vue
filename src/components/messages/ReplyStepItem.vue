<script setup lang="ts">
import { computed } from 'vue'
import { useTranslate } from '@/i18n'
import {
  IconBrowseOutline16,
  IconBrowseWarningOutline16,
  IconCloseFill14,
  IconCheckedOutline14,
  IconLinkOutline16,
} from '@/components/base/icons'
import type { AssistantMessage } from '@/services/chat/types'
import type { Source, Step } from '@/services/chat/view'
import { useSearchPanelStore } from '@/stores/searchPanel'
import Tooltip from '@/components/base/Tooltip.vue'
import Markdown from '@/components/markdown/Markdown.vue'
import ReplyContentItem from './ReplyContentItem.vue'
import ReplySearchRow from './ReplySearchRow.vue'
import ReplyPageLink from './ReplyPageLink.vue'

const props = defineProps<{
  step: Step
  message: AssistantMessage
  sources: Source[]
  streaming: boolean
  isLast: boolean
}>()

const t = useTranslate()
const panel = useSearchPanelStore()

/** 思考中的回答：圆点是否跳动 */
const lastThinkingBlock = computed(() =>
  props.step.type === 'thinking' ? props.step.blocks.at(-1) : undefined
)
const thinkingActive = computed(
  () =>
    props.step.type === 'thinking' &&
    props.streaming &&
    lastThinkingBlock.value?.startedAt !== undefined &&
    lastThinkingBlock.value.endedAt === undefined
)

const allPagesFailed = computed(() =>
  props.step.type === 'open' ? props.step.pages.every((page) => page.status === 'failed') : false
)
const allPatternsFailed = computed(() =>
  props.step.type === 'find' ? props.step.patterns.every((item) => item.status === 'failed') : false
)
const toolIcon = computed(() =>
  (props.step.type === 'open' && allPagesFailed.value) ||
  (props.step.type === 'find' && allPatternsFailed.value)
    ? IconBrowseWarningOutline16
    : IconBrowseOutline16
)

const openCount = computed(() => (props.step.type === 'open' ? props.step.pages.length : 0))
const openIntro = computed(() =>
  props.step.type === 'open'
    ? t(openCount.value === 1 ? 'toolOpenOneIntro' : 'toolOpensIntro', { count: openCount.value })
    : ''
)
const openEntry = computed(() =>
  props.step.type === 'open' ? `open-${props.step.pages[0]?.id}` : ''
)
const openViewAll = () => {
  if (props.step.type !== 'open') {
    return
  }
  panel.toggle(
    openEntry.value,
    props.sources.filter((source) =>
      props.step.type === 'open' ? props.step.pages.some((page) => page.url === source.url) : false
    )
  )
}
</script>

<template>
  <!-- 思考中的回答：左侧圆点 + 竖线，小号 markdown -->
  <ReplyContentItem v-if="step.type === 'thinking'" :is-last="isLast" :active="thinkingActive">
    <Markdown
      :content="step.blocks.map((block) => block.thinking).join('')"
      :loading="thinkingActive"
      :cache-key="`${message.id}-${step.key}`"
      disable-link
    />
  </ReplyContentItem>

  <ReplyContentItem v-else-if="step.type === 'text'" :is-last="isLast" :active="false">
    <Markdown
      :content="step.markdown"
      :loading="streaming && isLast"
      :cache-key="`${message.id}-${step.key}`"
      :disable-link="false"
      :sources="sources"
    />
  </ReplyContentItem>

  <ReplySearchRow
    v-else-if="step.type === 'search'"
    :step="step"
    :message="message"
    :streaming="streaming"
    :is-last="isLast"
  />

  <!-- 边想边搜打开的网页：「浏览 N 个页面」+ 最多 5 个页面 -->
  <div v-else-if="step.type === 'open'" :class="['tool', { withLine: !isLast }]">
    <span :class="['rowIcon', 'toolIcon']">
      <component :is="toolIcon" />
    </span>
    <div class="toolBody">
      <template v-if="allPagesFailed">
        {{ t('toolOpenFail') }}
      </template>
      <template v-else>
        <span class="intro">{{ openIntro }}</span>
        <ReplyPageLink
          v-for="page in step.pages.slice(0, 5)"
          :key="page.id"
          :page="page"
          :failed-tip="t('toolOpenFailTooltip')"
        />
        <span v-if="openCount > 5" class="chip" @click="openViewAll">
          {{ t('toolOpenViewAll') }}
        </span>
      </template>
    </div>
  </div>

  <!-- 边想边搜的页内查找：「查找关键词」+ 关键词标签 -->
  <div v-else-if="step.type === 'find'" :class="['tool', { withLine: !isLast }]">
    <span :class="['rowIcon', 'toolIcon']">
      <component :is="toolIcon" />
    </span>
    <div class="toolBody">
      <template v-if="allPatternsFailed">
        {{ t('toolFindFail') }}
      </template>
      <template v-else>
        <span class="intro">{{ t('toolFindIntro') }}</span>
        <Tooltip
          v-for="item in step.patterns"
          :key="item.id"
          :content="item.status === 'failed' ? t('toolFindFailTooltip') : undefined"
        >
          <span :class="['chip', { chipFailed: item.status === 'failed' }]">
            <span v-if="item.status !== 'wip'" class="chipIcon">
              <IconCloseFill14 v-if="item.status === 'failed'" />
              <IconCheckedOutline14 v-else />
            </span>
            <span class="chipText">{{ item.pattern }}</span>
          </span>
        </Tooltip>
      </template>
    </div>
  </div>

  <!-- 阅读用户消息中的链接：视图只保留仍在读取的链接。 -->
  <div v-else-if="step.type === 'read_link'" :class="['tool', { withLine: !isLast }]">
    <span :class="['rowIcon', 'toolIcon']">
      <IconLinkOutline16 />
    </span>
    <div class="toolBody">
      <span class="intro shimmer">{{ t('readingLink') }}</span>
      <ReplyPageLink v-for="link in step.links" :key="link.id" :page="link" />
    </div>
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

.tool {
  position: relative;
  display: flex;
  max-width: 100%;
  padding: 5px 0;
  color: var(--dsw-alias-label-secondary);
  font: var(--dsw-font-markdown-small);
}

.toolIcon {
  margin-top: 4px;
}

.toolBody {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  row-gap: 6px;
  width: calc(100% - 30px);
  overflow: hidden;
}

.intro {
  display: inline-block;
  margin-right: 6px;
  font-variant: tabular-nums;
}

.shimmer {
  color: transparent;
  background: linear-gradient(
      90deg,
      var(--dsw-alias-label-secondary) 0%,
      var(--dsw-alias-label-secondary) 40%,
      var(--dsw-alias-label-caption) 50%,
      var(--dsw-alias-label-secondary) 60%,
      var(--dsw-alias-label-secondary) 100%
    )
    0 0 / 300% 100%;
  background-clip: text;
  animation: shimmer 2s ease-out infinite;
}

@keyframes shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: 0 0;
  }
}

.chip {
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  min-width: 0;
  max-width: 540px;
  height: 20px;
  margin-right: 4px;
  padding: 0 5px;
  border-radius: 6px;
  font: var(--dsw-font-xs-13);
  line-height: 20px;
  color: var(--dsw-alias-label-secondary);
  background: var(--dsw-alias-markdown-tag);
  cursor: pointer;
}

.chipFailed {
  color: var(--dsw-alias-label-caption);
  cursor: not-allowed;
}

.chipIcon {
  display: flex;
  margin-right: 2px;
}

.chipIcon svg {
  width: 12px;
  height: 12px;
}

.chipText {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
