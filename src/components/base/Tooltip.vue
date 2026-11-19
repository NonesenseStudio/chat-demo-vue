<script lang="ts">
export type TooltipPlacement = 'top' | 'bottom'
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { watchAfterRender } from '@/composables/watchAfterRender'
import { useIsMobile } from '@/composables/useViewport'
import { anchoredStyles, useAnchoredPosition, useDelayedOpen } from './anchored'

const props = withDefaults(
  defineProps<{
    content?: string
    placement?: TooltipPlacement
  }>(),
  { content: undefined, placement: undefined }
)

const ENTER_DELAY = 100

const isMobile = useIsMobile()
const { open, setOpen, schedule, cancel } = useDelayedOpen()
const { anchorRef, floatingRef, position } = useAnchoredPosition<HTMLSpanElement, HTMLDivElement>(
  () => open.value,
  () => ({
    side: props.placement ?? 'top',
    align: 'center',
    measureFirstChild: true,
    measureKey: props.content,
  })
)
watchAfterRender(
  () => () => cancel(),
  () => [cancel]
)
watchAfterRender(
  () => {
    if (!open.value) {
      return
    }
    const onScroll = () => setOpen(false)
    window.addEventListener('scroll', onScroll, true)
    return () => window.removeEventListener('scroll', onScroll, true)
  },
  () => [open.value]
)
const visible = computed(() => open.value && !isMobile.value && Boolean(props.content))

const setAnchor = (el: unknown) => {
  anchorRef.value = (el as HTMLSpanElement | null) ?? null
}
const setFloating = (el: unknown) => {
  floatingRef.value = (el as HTMLDivElement | null) ?? null
}
</script>

<template>
  <span
    :ref="setAnchor"
    class="trigger"
    @mouseenter="schedule(true, ENTER_DELAY)"
    @mouseleave="schedule(false, 0)"
  >
    <slot />
  </span>
  <Teleport v-if="visible" to="body">
    <div :ref="setFloating" role="tooltip" class="tooltip" :style="anchoredStyles(position)">
      {{ content }}
    </div>
  </Teleport>
</template>

<style scoped>
.trigger {
  display: contents;
}

.tooltip {
  position: fixed;
  z-index: 2000;
  box-sizing: border-box;
  max-width: calc(100vw - 28px);
  padding: 4px 8px;
  border-radius: 10px;
  background-color: var(--dsw-alias-tooltip-bg);
  color: var(--dsw-static-neutral-bluish-00);
  font-size: 12px;
  line-height: 1.5;
  pointer-events: none;
}

[data-ds-dark-theme] .tooltip {
  color: var(--dsw-alias-label-primary);
  box-shadow:
    0 6px 16px 0 rgba(0, 0, 0, 0.08),
    0 3px 6px -4px rgba(0, 0, 0, 0.12),
    0 9px 28px 8px rgba(0, 0, 0, 0.05);
}
</style>
