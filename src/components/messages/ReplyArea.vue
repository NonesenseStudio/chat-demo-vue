<script setup lang="ts">
import { computed, ref } from 'vue'
import { watchAfterRender } from '@/composables/watchAfterRender'

import {
  IconChevronDownOutline14,
  IconChevronRightOutline14,
  IconThinkOutline16,
} from '@/components/base/icons'
import type { AssistantMessage } from '@/services/chat/types'
import { getAreaTitle, type ReplyView } from '@/services/chat/view'
import type { Step } from '@/services/chat/view'
import ReplyStepItem from './ReplyStepItem.vue'

/** 进行中时每秒刷新，用于思考用时与搜索词轮播 */
const useTicker = (active: () => boolean, interval: number, next = (tick: number) => tick + 1) => {
  const tick = ref(0)
  watchAfterRender(
    () => {
      if (!active()) {
        return
      }
      const timer = setInterval(() => {
        tick.value = next(tick.value)
      }, interval)
      return () => clearInterval(timer)
    },
    () => [active(), interval]
  )
  return tick
}

const props = defineProps<{
  message: AssistantMessage
  view: ReplyView
  streaming: boolean
  hasResponse: boolean
}>()

/**
 * 思考与工具步骤的时间线：
 * 开启深度思考时带可折叠的标题（正在思考 / 正在搜索 / 正在浏览网页 / 已思考（用时 N 秒））；
 * 未开启时只有工具步骤（如普通搜索的「已阅读 N 个网页」）。
 */
const open = ref(true)
const titleActive = computed(() => props.streaming && !props.hasResponse)
const clock = useTicker(() => titleActive.value, 1000, Date.now)
const thinking = computed(
  () => props.message.thinking ?? props.view.steps.some((step) => step.type === 'thinking')
)
const title = computed(() =>
  thinking.value
    ? getAreaTitle(
        props.view,
        props.streaming,
        Math.max(clock.value, Date.now()),
        props.hasResponse
      )
    : null
)
const stopped = computed(() => !props.streaming && !props.hasResponse)

const stepKey = (step: Step, index: number) =>
  step.type === 'thinking' || step.type === 'text' || step.type === 'search'
    ? step.key
    : `${step.type}-${index}`
</script>

<template>
  <div
    v-if="view.steps.length > 0 || (message.thinking && streaming)"
    class="area"
  >
    <div v-if="title" class="title" @click="open = !open">
      <span :class="['titleIcon', { stoppedIcon: stopped }]">
        <IconThinkOutline16 />
      </span>
      <span :class="['titleText', { shimmer: titleActive }]">
        {{ title }}
      </span>
      <IconChevronDownOutline14 v-if="open" />
      <IconChevronRightOutline14 v-else />
    </div>
    <div v-if="open || !title">
      <ReplyStepItem
        v-for="(step, index) in view.steps"
        :key="stepKey(step, index)"
        :step="step"
        :message="message"
        :sources="view.sources"
        :streaming="streaming"
        :is-last="index === view.steps.length - 1"
      />
    </div>
  </div>
</template>

<!-- 思考内容里 markdown 的排版覆盖：作用于子组件渲染的内容，保持全局作用域 -->
<style src="@/assets/styles/thinking-markdown.css"></style>

<style scoped>
.area {
  margin-bottom: 10px;
}

.title {
  display: flex;
  align-items: center;
  height: 34px;
  margin-bottom: 2px;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;
}

.title:hover {
  color: var(--dsw-alias-label-primary);
}

.titleIcon {
  display: flex;
  margin-right: 6px;
  color: var(--dsw-alias-brand-primary);
}

.stoppedIcon {
  color: var(--dsw-alias-label-tertiary);
}

.titleText {
  margin-right: 6px;
  font: var(--dsw-font-markdown-base);
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
</style>
