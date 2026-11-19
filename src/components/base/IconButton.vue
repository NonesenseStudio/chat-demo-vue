<script setup lang="ts">
import Tooltip from './Tooltip.vue'
import type { TooltipPlacement } from './Tooltip.vue'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    size?: 'xs' | 'm' | 'xl'
    tone?: 'tertiary' | 'primary'
    /** 同时作为无障碍名称；没有 tooltip 的按钮通过 aria-label 提供名称 */
    tooltip?: string
    tooltipPlacement?: TooltipPlacement
  }>(),
  { size: 'xs', tone: 'tertiary', tooltip: undefined, tooltipPlacement: undefined }
)
</script>

<template>
  <Tooltip v-if="tooltip" :content="tooltip" :placement="tooltipPlacement">
    <button type="button" :class="['button', size, tone]" :aria-label="tooltip" v-bind="$attrs">
      <slot />
    </button>
  </Tooltip>
  <button v-else type="button" :class="['button', size, tone]" v-bind="$attrs">
    <slot />
  </button>
</template>

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  border: none;
  border-radius: 50%;
  background-color: transparent;
  cursor: pointer;
  font-size: 16px;
  transition: background-color var(--ds-transition-duration) var(--ds-ease-in-out);
  outline: none;
}

.button:active:not(:disabled) {
  background-color: var(--dsw-alias-interactive-bg-hover);
}

@media (hover: hover) {
  .button:hover:not(:disabled) {
    background-color: var(--dsw-alias-interactive-bg-hover);
  }
}

.button:focus-visible {
  box-shadow: 0 0 0 2px var(--dsw-alias-button-primary-fill);
}

.button:disabled {
  cursor: not-allowed;
  color: var(--dsw-alias-label-caption);
}

.xs {
  width: var(--ds-control-height-xs);
  height: var(--ds-control-height-xs);
}

.m {
  width: 34px;
  height: 34px;
}

.xl {
  width: var(--ds-control-height-xl);
  height: var(--ds-control-height-xl);
}

.tertiary {
  color: var(--dsw-alias-label-tertiary);
}

.primary {
  color: var(--dsw-alias-label-primary);
}
</style>
