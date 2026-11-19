<script lang="ts">
export type SelectOption<T extends string> = { value: T; label: string; lang?: string }
</script>

<script setup lang="ts" generic="T extends string">
import { computed, ref } from 'vue'
import { anchoredStyles, useAnchoredPosition, useDismiss } from './anchored'
import { IconCheckOutline16, IconChevronDownOutline14 } from './icons'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    value: T
    options: SelectOption<T>[]
    placeholder?: string
    ariaLabel?: string
    disabled?: boolean
  }>(),
  { placeholder: undefined, ariaLabel: undefined, disabled: false }
)

const emit = defineEmits<{ change: [value: T] }>()

/**
 * 胶囊形选择器：触发器高 36px、圆角 18px、浅灰底，下拉菜单选中项右侧打勾；
 * 点外部或 Esc 关闭。value 不匹配任何选项时触发器显示 placeholder。
 */
const open = ref(false)
const setOpen = (next: boolean) => {
  open.value = next
}
const current = computed(() => props.options.find((option) => option.value === props.value))
const { anchorRef, floatingRef, position } = useAnchoredPosition<HTMLButtonElement, HTMLDivElement>(
  () => open.value,
  () => ({ align: 'end', maxHeight: 320, minSpace: 160 })
)
useDismiss(
  () => open.value,
  [anchorRef, floatingRef],
  () => setOpen(false),
  { captureEscape: true }
)
const choose = (option: SelectOption<T>) => {
  setOpen(false)
  emit('change', option.value)
}
</script>

<template>
  <button
    ref="anchorRef"
    type="button"
    :class="['trigger', { open }]"
    :aria-label="ariaLabel"
    aria-haspopup="listbox"
    :aria-expanded="open"
    :disabled="disabled"
    v-bind="$attrs"
    @click="setOpen(!open)"
  >
    <span v-if="current" :lang="current.lang">{{ current.label }}</span>
    <span v-else class="placeholder">{{ placeholder }}</span>
    <span class="arrow">
      <IconChevronDownOutline14 />
    </span>
  </button>
  <Teleport v-if="open && !disabled" to="body">
    <div
      ref="floatingRef"
      class="menu"
      :style="anchoredStyles(position)"
      role="listbox"
      :aria-label="ariaLabel"
    >
      <div
        v-for="option in options"
        :key="option.value"
        role="option"
        :lang="option.lang"
        :aria-selected="option.value === value"
        class="option"
        @click="choose(option)"
      >
        <span>{{ option.label }}</span>
        <IconCheckOutline16 v-if="option.value === value" />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  box-sizing: border-box;
  min-width: 90px;
  max-width: 100%;
  height: 36px;
  padding: 0 42px 0 14px;
  border: none;
  border-radius: 18px;
  background: var(--dsw-specific-selector);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 14px;
  line-height: 22px;
  white-space: nowrap;
  cursor: pointer;
  outline: none;
  transition:
    background-color var(--ds-transition-duration) var(--ds-ease-in-out),
    color var(--ds-transition-duration) var(--ds-ease-in-out);
}

.trigger:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover-accent);
}

.trigger:focus-visible {
  box-shadow: inset 0 0 0 2px var(--dsw-alias-brand-primary);
}

.trigger:disabled {
  color: var(--dsw-alias-label-caption);
  cursor: default;
}

.trigger > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
}

.open {
  color: var(--dsw-alias-label-tertiary);
}

.placeholder {
  color: var(--dsw-alias-label-tertiary);
}

.arrow {
  position: absolute;
  top: 50%;
  right: 14px;
  display: flex;
  color: var(--dsw-alias-label-secondary);
  transform: translateY(-50%);
  pointer-events: none;
}

.menu {
  position: fixed;
  z-index: 1050;
  box-sizing: border-box;
  min-width: 124px;
  max-width: 280px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid var(--dsw-alias-border-inverted);
  background: var(--dsw-specific-menu);
  box-shadow:
    0 0 1px 0 rgba(0, 0, 0, 0.2),
    0 0 4px 0 rgba(0, 0, 0, 0.02),
    0 12px 32px 0 rgba(0, 0, 0, 0.08);
}

.option {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 40px;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 22px;
  color: var(--dsw-alias-label-primary);
  white-space: normal;
  cursor: pointer;
  user-select: none;
  transition: background-color var(--ds-transition-duration) var(--ds-ease-in-out);
}

.option:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}
</style>
