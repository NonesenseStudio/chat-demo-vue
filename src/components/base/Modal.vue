<script setup lang="ts">
import { useId } from 'vue'
import { watchAfterRender } from '@/composables/watchAfterRender'
import { useTranslate } from '@/i18n'
import { IconCloseOutline16 } from './icons'
import IconButton from './IconButton.vue'

const props = withDefaults(
  defineProps<{
    title: string
    /** 标题栏右侧显示关闭按钮 */
    closable?: boolean
    /** 弹窗卡片的 class */
    dialogClass?: string
    /** 内容区的 class */
    mainClass?: string
  }>(),
  { closable: false, dialogClass: undefined, mainClass: undefined }
)

const emit = defineEmits<{ close: [] }>()

/** 当前打开的弹窗，后打开的在末尾；叠放时 Esc 只关闭最上层 */
const openModals: object[] = []

const t = useTranslate()
const titleId = useId()
watchAfterRender(() => {
  const token = {}
  openModals.push(token)
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && openModals.at(-1) === token) {
      emit('close')
    }
  }
  document.addEventListener('keydown', onKeydown)
  return () => {
    openModals.splice(openModals.indexOf(token), 1)
    document.removeEventListener('keydown', onKeydown)
  }
})
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @mousedown="($event.target === $event.currentTarget) && $emit('close')">
      <div
        :class="['content', dialogClass]"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <div class="header">
          <div :id="titleId" class="title">
            {{ title }}
          </div>
          <IconButton
            v-if="closable"
            class="close"
            tone="primary"
            :aria-label="t('close')"
            @click="$emit('close')"
          >
            <IconCloseOutline16 />
          </IconButton>
        </div>
        <div v-if="$slots.default" :class="['main', mainClass]">
          <slot />
        </div>
        <div v-if="$slots.footer" class="footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  --overlay-opacity: 0.36;
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, var(--overlay-opacity));
  backdrop-filter: blur(2px);
}

[data-ds-dark-theme] .overlay {
  --overlay-opacity: 0.6;
}

.content {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 380px;
  max-width: calc(100vw - 32px);
  padding: 22px 24px;
  border-radius: 24px;
  font-size: 14px;
  line-height: 22px;
  color: var(--dsw-alias-label-primary);
  background-color: var(--dsw-alias-bg-layer-2);
  box-shadow:
    inset 0 0 0 1px var(--dsw-alias-border-inverted),
    0 0 1px 0 rgba(0, 0, 0, 0.2),
    0 0 4px 0 rgba(0, 0, 0, 0.02),
    0 12px 32px 0 rgba(0, 0, 0, 0.08);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: var(--modal-header-gap, 12px);
}

.title {
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
}

.close {
  margin-right: -10px;
}

.close :deep(svg) {
  width: 14px;
  height: 14px;
}

.main {
  color: var(--dsw-alias-label-secondary);
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
</style>
