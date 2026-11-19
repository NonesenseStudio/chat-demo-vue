<script setup lang="ts">
import { ref, type Component } from 'vue'
import { anchoredStyles, useAnchoredPosition, useDismiss } from './anchored'

export type MenuOption = {
  key: string
  label: string
  icon: Component
  danger?: boolean
  onSelect: () => void
}

defineProps<{
  options: MenuOption[]
}>()

/** 点击触发，向下展开；点外部或 Esc 关闭 */
const open = ref(false)
const close = () => {
  open.value = false
}
const toggle = () => {
  open.value = !open.value
}
const { anchorRef, floatingRef, position } = useAnchoredPosition<HTMLSpanElement, HTMLDivElement>(
  () => open.value,
  () => ({ align: 'start', alignOffset: -5, offset: 4 })
)
useDismiss(() => open.value, [anchorRef, floatingRef], close)
</script>

<template>
  <span ref="anchorRef" class="anchor">
    <slot :open="open" :toggle="toggle" />
  </span>
  <Teleport v-if="open" to="body">
    <div ref="floatingRef" class="menu" :style="anchoredStyles(position)" role="menu">
      <div
        v-for="option in options"
        :key="option.key"
        role="menuitem"
        :class="['option', { danger: option.danger }]"
        @click="
          () => {
            open = false
            option.onSelect()
          }
        "
      >
        <span class="icon"><component :is="option.icon" /></span>
        {{ option.label }}
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.anchor {
  display: inline-flex;
}

.menu {
  position: fixed;
  z-index: 900;
  box-sizing: border-box;
  min-width: 124px;
  padding: 4px;
  border-radius: 12px;
  background-color: var(--dsw-specific-menu);
  box-shadow:
    0 0 1px rgba(0, 0, 0, 0.2),
    0 0 4px rgba(0, 0, 0, 0.02),
    0 12px 32px rgba(0, 0, 0, 0.08);
}

.option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 24px;
  color: var(--dsw-alias-label-primary);
  cursor: pointer;
  user-select: none;
}

.option:hover {
  background-color: var(--dsw-alias-interactive-bg-hover);
}

.icon {
  display: flex;
  font-size: 16px;
}

.danger {
  color: var(--dsw-alias-state-error-primary);
}

.danger:hover {
  background-color: var(--dsw-alias-interactive-bg-hover-danger);
}
</style>
