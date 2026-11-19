<script setup lang="ts">
import { watchAfterRender } from '@/composables/watchAfterRender'
import { anchoredStyles, useAnchoredPosition, useDelayedOpen } from '@/components/base/anchored'

const ENTER_DELAY = 300
const LEAVE_DELAY = 100
const GAP = 6

/** 悬停 300ms 后在触发元素下方显示卡片（放不下则上方），鼠标可移入卡片 */
const { open, schedule, cancel } = useDelayedOpen()
const { anchorRef, floatingRef, position } = useAnchoredPosition<HTMLSpanElement, HTMLDivElement>(
  () => open.value,
  () => ({ align: 'center', offset: GAP })
)
watchAfterRender(
  () => () => cancel(),
  () => [cancel]
)

const domProps = {
  onMouseenter: () => schedule(true, ENTER_DELAY),
  onMouseleave: () => schedule(false, LEAVE_DELAY),
}

/** 经插槽作用域交给触发元素的函数 ref */
const setAnchorRef = (el: unknown) => {
  anchorRef.value = (el as HTMLSpanElement | null) ?? null
}
const setFloatingRef = (el: unknown) => {
  floatingRef.value = (el as HTMLDivElement | null) ?? null
}
</script>

<template>
  <!-- 触发元素由插槽提供：ref 与鼠标事件经插槽作用域传递 -->
  <slot name="trigger" :set-anchor-ref="setAnchorRef" :dom-props="domProps" />
  <Teleport v-if="open" to="body">
    <div
      :ref="setFloatingRef"
      class="card"
      :style="anchoredStyles(position)"
      @mouseenter="cancel"
      @mouseleave="schedule(false, LEAVE_DELAY)"
    >
      <slot />
    </div>
  </Teleport>
</template>

<style scoped>
.card {
  position: fixed;
  z-index: 950;
  box-sizing: border-box;
  max-width: 355px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--dsw-alias-border-inverted);
  background: var(--dsw-specific-menu);
  box-shadow: var(--dsw-shadow-lv3);
}
</style>
